import { GITHUB_ENDPOINTS } from "../constants/storageEndpoints";
import {
  loadCloudAuth,
  saveCloudAuth,
  deleteCloudAuth,
} from "../../../core/utils/idbStorage";
import type {
  CloudStorageAdapter,
  GitHubAuthData,
  StorageItem,
} from "../types/storage.types";

const GITHUB_AUTH_KEY = "github_auth";

export class GitHubAdapter implements CloudStorageAdapter {
  readonly providerId = "github" as const;
  readonly name = "GitHub";

  private cachedAuth: GitHubAuthData | null = null;

  async isAuthenticated(): Promise<boolean> {
    const auth = await this.getValidAuth();
    return auth !== null;
  }

  async getValidAuth(): Promise<GitHubAuthData | null> {
    if (!this.cachedAuth) {
      this.cachedAuth = await loadCloudAuth<GitHubAuthData>(GITHUB_AUTH_KEY);
    }
    return this.cachedAuth;
  }

  /**
   * Save and verify GitHub Personal Access Token and target repository.
   */
  async configure(
    token: string,
    owner: string,
    repo: string,
    branch = "main",
  ): Promise<GitHubAuthData> {
    const cleanToken = token.trim();
    const cleanOwner = owner.trim();
    const cleanRepo = repo.trim();
    const cleanBranch = branch.trim() || "main";

    // 1. Verify token by requesting authenticated user info
    const userRes = await fetch(GITHUB_ENDPOINTS.USER, {
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!userRes.ok) {
      throw new Error(
        "Invalid GitHub Personal Access Token. Please check token permissions.",
      );
    }

    const userData = await userRes.json();
    const userLogin = userData.login as string;

    // 2. Verify target repository exists and is accessible
    const repoRes = await fetch(GITHUB_ENDPOINTS.REPO(cleanOwner, cleanRepo), {
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!repoRes.ok) {
      throw new Error(
        `Cannot access repository "${cleanOwner}/${cleanRepo}". Ensure it exists and token has access.`,
      );
    }

    const authData: GitHubAuthData = {
      personalAccessToken: cleanToken,
      owner: cleanOwner,
      repo: cleanRepo,
      branch: cleanBranch,
      userLogin,
    };

    this.cachedAuth = authData;
    await saveCloudAuth(GITHUB_AUTH_KEY, authData);
    return authData;
  }

  async disconnect(): Promise<void> {
    this.cachedAuth = null;
    await deleteCloudAuth(GITHUB_AUTH_KEY);
  }

  private normalizePath(path: string): string {
    return path.trim().replace(/^\/+/, "");
  }

  /**
   * Read file content from GitHub repository.
   */
  async readFile(path: string): Promise<string> {
    const auth = await this.getValidAuth();
    if (!auth) throw new Error("GitHub is not connected.");

    const cleanPath = this.normalizePath(path);
    const branchQuery = auth.branch
      ? `?ref=${encodeURIComponent(auth.branch)}`
      : "";

    const res = await fetch(
      `${GITHUB_ENDPOINTS.CONTENTS(auth.owner, auth.repo, cleanPath)}${branchQuery}`,
      {
        headers: {
          Authorization: `Bearer ${auth.personalAccessToken}`,
          Accept: "application/vnd.github+json",
        },
      },
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to read file from GitHub: ${err}`);
    }

    const data = await res.json();
    if (typeof data.content === "string") {
      // Decode base64 content with Unicode support
      const binary = atob(data.content.replace(/\s/g, ""));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    }

    throw new Error("Target is a directory, not a file.");
  }

  /**
   * Write or update a file in the GitHub repository.
   */
  async writeFile(path: string, content: string): Promise<void> {
    const auth = await this.getValidAuth();
    if (!auth) throw new Error("GitHub is not connected.");

    const cleanPath = this.normalizePath(path);
    const branch = auth.branch || "main";

    // Obtain SHA by listing parent folder instead of direct file GET (which triggers a red 404 in console if file is new)
    let existingSha: string | undefined;
    try {
      const folder = cleanPath.includes("/")
        ? cleanPath.substring(0, cleanPath.lastIndexOf("/"))
        : "";
      const items = await this.listFiles(folder);
      const matched = items.find((i) => i.path === cleanPath || i.name === cleanPath.split("/").pop());
      if (matched) {
        existingSha = matched.id;
      }
    } catch {
      // Ignore if folder doesn't exist yet
    }

    // Convert UTF-8 content to Base64
    const encoder = new TextEncoder();
    const bytes = encoder.encode(content);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Content = btoa(binary);

    const bodyPayload: Record<string, unknown> = {
      message: `sync: update ${cleanPath} via Scripta`,
      content: base64Content,
      branch,
    };
    if (existingSha) {
      bodyPayload.sha = existingSha;
    }

    const res = await fetch(
      GITHUB_ENDPOINTS.CONTENTS(auth.owner, auth.repo, cleanPath),
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${auth.personalAccessToken}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyPayload),
      },
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to write file to GitHub: ${err}`);
    }
  }

  /**
   * Delete a file from GitHub repository.
   */
  async deleteFile(path: string): Promise<void> {
    const auth = await this.getValidAuth();
    if (!auth) throw new Error("GitHub is not connected.");

    const cleanPath = this.normalizePath(path);
    const branch = auth.branch || "main";

    // Obtain SHA safely without 404 console error
    const folder = cleanPath.includes("/")
      ? cleanPath.substring(0, cleanPath.lastIndexOf("/"))
      : "";
    const items = await this.listFiles(folder);
    const matched = items.find((i) => i.path === cleanPath || i.name === cleanPath.split("/").pop());
    if (!matched) return; // Already deleted or not found
    const sha = matched.id;

    const res = await fetch(
      GITHUB_ENDPOINTS.CONTENTS(auth.owner, auth.repo, cleanPath),
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${auth.personalAccessToken}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `sync: delete ${cleanPath} via Scripta`,
          sha,
          branch,
        }),
      },
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to delete file from GitHub: ${err}`);
    }
  }

  /**
   * List files in a directory of the GitHub repository.
   * Includes timestamp cache-buster to prevent GitHub REST API replication lag.
   */
  async listFiles(folderPath = ""): Promise<StorageItem[]> {
    const auth = await this.getValidAuth();
    if (!auth) throw new Error("GitHub is not connected.");

    const cleanPath = this.normalizePath(folderPath);
    const branch = auth.branch || "main";
    // Bust GitHub REST API response cache with timestamp
    const url = `${GITHUB_ENDPOINTS.CONTENTS(auth.owner, auth.repo, cleanPath)}?ref=${encodeURIComponent(branch)}&_t=${Date.now()}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${auth.personalAccessToken}`,
        Accept: "application/vnd.github+json",
        "If-None-Match": "", // Disable 304 Not Modified caching
      },
      cache: "no-store",
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item) => ({
      id: item.sha,
      name: item.name,
      path: item.path,
      type: item.type === "dir" ? "folder" : "file",
      size: item.size,
    }));
  }
}

export const githubAdapter = new GitHubAdapter();
