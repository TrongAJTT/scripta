import type { FileTab } from "./file.types";

export interface WorkspaceSession {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  lastSyncedAt?: number;
  lastSyncedProvider?: "dropbox" | "github";
  activeTabId: string | null;
  tabs: FileTab[];
}
