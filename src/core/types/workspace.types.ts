import type { FileTab, TabGroup } from "./file.types";

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
  tabGroups?: TabGroup[];
  /** Timestamp when a local folder was linked to this workspace */
  folderLinkedAt?: number;
  /** Display name of the linked folder (handle stored separately in IDB) */
  folderName?: string;
}
