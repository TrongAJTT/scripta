import type { FileTab } from "./file.types";

export interface WorkspaceSession {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  activeTabId: string | null;
  tabs: FileTab[];
}
