import { DROPBOX_ENDPOINTS } from "../constants/storageEndpoints";
import {
  loadCloudAuth,
  saveCloudAuth,
  deleteCloudAuth,
} from "../../../core/utils/idbStorage";
import type {
  CloudStorageAdapter,
  DropboxAuthData,
  StorageItem,
} from "../types/storage.types";

const DROPBOX_AUTH_KEY = "dropbox_auth";
const PKCE_VERIFIER_SESSION_KEY = "dropbox_pkce_verifier";

/**
 * Generate cryptographically secure random string for PKCE code_verifier
 */
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return Array.from(array, (dec) => ("0" + dec.toString(16)).slice(-2)).join(
    "",
  );
}

/**
 * Calculate SHA-256 base64url-encoded code_challenge from code_verifier
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export class DropboxAdapter implements CloudStorageAdapter {
  readonly providerId = "dropbox" as const;
  readonly name = "Dropbox";

  private cachedAuth: DropboxAuthData | null = null;

  /**
   * Check if user is currently authenticated with a valid or refreshable token.
   */
  async isAuthenticated(): Promise<boolean> {
    const auth = await this.getValidAuth();
    return auth !== null;
  }

  /**
   * Retrieve cached or persisted auth data, auto-refreshing if expired.
   */
  async getValidAuth(): Promise<DropboxAuthData | null> {
    if (!this.cachedAuth) {
      this.cachedAuth = await loadCloudAuth<DropboxAuthData>(DROPBOX_AUTH_KEY);
    }
    if (!this.cachedAuth) return null;

    // If token expires in less than 5 minutes and we have a refresh token, refresh it
    const now = Date.now();
    if (
      this.cachedAuth.expiresAt - now < 5 * 60 * 1000 &&
      this.cachedAuth.refreshToken
    ) {
      try {
        await this.refreshAccessToken(this.cachedAuth.refreshToken);
      } catch (err) {
        console.warn("Failed to refresh Dropbox token:", err);
      }
    }

    return this.cachedAuth;
  }

  /**
   * Initiate OAuth 2.0 PKCE Authorization flow.
   */
  async startAuthFlow(): Promise<void> {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    sessionStorage.setItem(PKCE_VERIFIER_SESSION_KEY, codeVerifier);

    const redirectUri = encodeURIComponent(
      DROPBOX_ENDPOINTS.DROPBOX_REDIRECT_URI,
    );
    const clientId = encodeURIComponent(DROPBOX_ENDPOINTS.DROPBOX_APP_KEY);
    const challenge = encodeURIComponent(codeChallenge);

    const authUrl =
      `${DROPBOX_ENDPOINTS.OAUTH_AUTHORIZE}?` +
      `client_id=${clientId}` +
      `&response_type=code` +
      `&code_challenge=${challenge}` +
      `&code_challenge_method=S256` +
      `&token_access_type=offline` +
      `&redirect_uri=${redirectUri}`;

    window.location.href = authUrl;
  }

  /**
   * Complete OAuth 2.0 PKCE flow when returning from Dropbox with ?code=...
   */
  async handleAuthCallback(code: string): Promise<boolean> {
    const codeVerifier = sessionStorage.getItem(PKCE_VERIFIER_SESSION_KEY);
    if (!codeVerifier) {
      throw new Error("Missing PKCE code verifier in session storage.");
    }

    const params = new URLSearchParams();
    params.append("code", code);
    params.append("grant_type", "authorization_code");
    params.append("client_id", DROPBOX_ENDPOINTS.DROPBOX_APP_KEY);
    params.append("redirect_uri", DROPBOX_ENDPOINTS.DROPBOX_REDIRECT_URI);
    params.append("code_verifier", codeVerifier);

    const res = await fetch(DROPBOX_ENDPOINTS.OAUTH_TOKEN, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Dropbox token exchange failed: ${errText}`);
    }

    const data = await res.json();
    const authData: DropboxAuthData = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + (data.expires_in || 14400) * 1000,
      accountId: data.account_id,
    };

    sessionStorage.removeItem(PKCE_VERIFIER_SESSION_KEY);
    this.cachedAuth = authData;
    await saveCloudAuth(DROPBOX_AUTH_KEY, authData);
    return true;
  }

  /**
   * Refresh expired access token using refresh_token.
   */
  private async refreshAccessToken(refreshToken: string): Promise<void> {
    const params = new URLSearchParams();
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", refreshToken);
    params.append("client_id", DROPBOX_ENDPOINTS.DROPBOX_APP_KEY);

    const res = await fetch(DROPBOX_ENDPOINTS.OAUTH_TOKEN, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!res.ok) return;

    const data = await res.json();
    if (this.cachedAuth) {
      this.cachedAuth.accessToken = data.access_token;
      this.cachedAuth.expiresAt =
        Date.now() + (data.expires_in || 14400) * 1000;
      await saveCloudAuth(DROPBOX_AUTH_KEY, this.cachedAuth);
    }
  }

  /**
   * Log out and delete stored credentials.
   */
  async disconnect(): Promise<void> {
    this.cachedAuth = null;
    sessionStorage.removeItem(PKCE_VERIFIER_SESSION_KEY);
    await deleteCloudAuth(DROPBOX_AUTH_KEY);
  }

  /**
   * Normalize path for Dropbox App Folder (must start with "/" or be empty).
   */
  private normalizePath(path: string): string {
    const clean = path.trim().replace(/^\/+/, "");
    return clean ? `/${clean}` : "";
  }

  /**
   * Read file content from Dropbox App Folder.
   */
  async readFile(path: string): Promise<string> {
    const auth = await this.getValidAuth();
    if (!auth) throw new Error("Dropbox is not connected.");

    const dbxPath = this.normalizePath(path);
    const res = await fetch(DROPBOX_ENDPOINTS.FILES_DOWNLOAD, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Dropbox-API-Arg": JSON.stringify({ path: dbxPath }),
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to read file from Dropbox: ${errText}`);
    }

    return await res.text();
  }

  /**
   * Write or overwrite file in Dropbox App Folder.
   */
  async writeFile(path: string, content: string): Promise<void> {
    const auth = await this.getValidAuth();
    if (!auth) throw new Error("Dropbox is not connected.");

    const dbxPath = this.normalizePath(path);
    const res = await fetch(DROPBOX_ENDPOINTS.FILES_UPLOAD, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Dropbox-API-Arg": JSON.stringify({
          path: dbxPath,
          mode: "overwrite",
          autorename: false,
          mute: true,
        }),
        "Content-Type": "application/octet-stream",
      },
      body: new Blob([content]),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to write file to Dropbox: ${errText}`);
    }
  }

  /**
   * Delete file from Dropbox App Folder.
   */
  async deleteFile(path: string): Promise<void> {
    const auth = await this.getValidAuth();
    if (!auth) throw new Error("Dropbox is not connected.");

    const dbxPath = this.normalizePath(path);
    const res = await fetch(DROPBOX_ENDPOINTS.FILES_DELETE, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path: dbxPath }),
    });

    if (!res.ok && res.status !== 409) {
      const errText = await res.text();
      throw new Error(`Failed to delete file from Dropbox: ${errText}`);
    }
  }

  /**
   * List files within a folder in Dropbox App Folder.
   */
  async listFiles(folderPath = ""): Promise<StorageItem[]> {
    const auth = await this.getValidAuth();
    if (!auth) throw new Error("Dropbox is not connected.");

    const dbxPath = this.normalizePath(folderPath);
    const res = await fetch(DROPBOX_ENDPOINTS.FILES_LIST_FOLDER, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: dbxPath,
        recursive: false,
        include_media_info: false,
        include_deleted: false,
      }),
    });

    if (!res.ok) {
      // If folder doesn't exist yet, return empty list gracefully
      return [];
    }

    const data = await res.json();
    const entries = (data.entries || []) as Array<{
      ".tag": "file" | "folder";
      name: string;
      path_display: string;
      size?: number;
      server_modified?: string;
    }>;

    return entries.map((e) => ({
      id: e.path_display,
      name: e.name,
      path: e.path_display.replace(/^\/+/, ""),
      type: e[".tag"],
      size: e.size,
      updatedAt: e.server_modified
        ? new Date(e.server_modified).getTime()
        : undefined,
    }));
  }
}

export const dropboxAdapter = new DropboxAdapter();
