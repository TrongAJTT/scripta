import { create } from "zustand";
import { dropboxAdapter } from "../adapters/dropboxAdapter";
import { githubAdapter } from "../adapters/githubAdapter";
import type {
  CloudStorageAdapter,
  DropboxAuthData,
  GitHubAuthData,
  StorageProviderId,
} from "../types/storage.types";

interface CloudStorageState {
  isDropboxConnected: boolean;
  dropboxAuth: DropboxAuthData | null;
  isGitHubConnected: boolean;
  githubAuth: GitHubAuthData | null;
  isSyncing: boolean;
  lastSyncError: string | null;

  initCloudStatus: () => Promise<void>;
  getAdapter: (provider: StorageProviderId) => CloudStorageAdapter;
  disconnectProvider: (provider: StorageProviderId) => Promise<void>;
}

let isProcessingDropboxCallback = false;

export const useCloudStorageStore = create<CloudStorageState>((set, _get) => ({
  isDropboxConnected: false,
  dropboxAuth: null,
  isGitHubConnected: false,
  githubAuth: null,
  isSyncing: false,
  lastSyncError: null,

  initCloudStatus: async () => {
    // 1. Check if returning from Dropbox OAuth callback
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      if (code && !isProcessingDropboxCallback) {
        isProcessingDropboxCallback = true;
        // Clean URL immediately to prevent duplicate execution
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);

        try {
          await dropboxAdapter.handleAuthCallback(code);
        } catch (err) {
          console.warn("Dropbox OAuth callback error:", err);
          set({ lastSyncError: String(err) });
        } finally {
          isProcessingDropboxCallback = false;
        }
      }
    }

    // 2. Refresh states from persistent storage
    const dropboxAuth = await dropboxAdapter.getValidAuth();
    const githubAuth = await githubAdapter.getValidAuth();

    set({
      isDropboxConnected: dropboxAuth !== null,
      dropboxAuth,
      isGitHubConnected: githubAuth !== null,
      githubAuth,
    });
  },

  getAdapter: (provider: StorageProviderId): CloudStorageAdapter => {
    switch (provider) {
      case "dropbox":
        return dropboxAdapter;
      case "github":
        return githubAdapter;
    }
  },

  disconnectProvider: async (provider: StorageProviderId) => {
    if (provider === "dropbox") {
      await dropboxAdapter.disconnect();
      set({ isDropboxConnected: false, dropboxAuth: null });
    } else if (provider === "github") {
      await githubAdapter.disconnect();
      set({ isGitHubConnected: false, githubAuth: null });
    }
  },
}));
