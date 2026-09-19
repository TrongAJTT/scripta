/**
 * Types and interfaces for Cloud Storage Adapters and Workspace synchronization.
 */

export type StorageProviderId = "dropbox" | "github";

export interface StorageItem {
  id: string;
  name: string;
  path: string;
  type: "file" | "folder";
  size?: number;
  updatedAt?: number;
}

export interface CloudStorageAdapter {
  readonly providerId: StorageProviderId;
  readonly name: string;

  isAuthenticated(): Promise<boolean>;
  disconnect(): Promise<void>;

  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  listFiles(folderPath?: string): Promise<StorageItem[]>;
}

export const CLOUD_PROVIDER_NAMES: Record<StorageProviderId, string> = {
  dropbox: "Dropbox",
  github: "GitHub",
};

export interface DropboxAuthData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp in ms
  accountId?: string;
}

export interface GitHubAuthData {
  personalAccessToken: string;
  owner: string;
  repo: string;
  branch?: string;
  userLogin?: string;
}

export interface WorkspaceSyncMeta {
  version: 1;
  workspaceId: string;
  workspaceName: string;
  isEncrypted: boolean;
  syncedAt: number;
  provider: StorageProviderId;
}
