import type { WorkspaceSession } from "../../../core/types/workspace.types";
import {
  encryptData,
  decryptData,
  isEncryptedPayload,
  type EncryptedPayload,
} from "../../../core/utils/cryptoUtils";
import type { CloudStorageAdapter, StorageItem } from "../types/storage.types";
import { useWorkspaceStore } from "../../workspace/store/workspaceStore";
import { dialog, type ConfirmResult } from "../../../shared/dialog/dialogStore";
import { formatDateTime } from "../../../core/utils/dateUtils";

export interface SyncedWorkspaceFileInfo {
  name: string; // Clean display name (e.g. "Default 1")
  fileName: string; // Raw file name (e.g. "Default_1__4tabs__a6a1eb1a.enc")
  workspaceId: string;
  tabCount?: number;
  path: string;
  isEncrypted: boolean;
  size?: number;
  updatedAt?: number;
}

const WORKSPACE_FOLDER = "workspaces";

/**
 * Service orchestrating Workspace packaging, encryption, upload, listing, and restoration.
 */
export class WorkspaceSyncService {
  /**
   * Generates standard file name for workspace.
   * Format: "workspaces/{Title}__{tabCount}tabs__{updatedAt}__{workspaceId}.{json|enc}"
   * This embeds tabCount AND updatedAt timestamp directly into the filename so remote listing
   * can display tab count and last modified date instantly on all providers (GitHub, Dropbox, etc.)
   * without needing extra HTTP requests, commits queries, or decrypting file contents!
   */
  private getWorkspaceFilePath(
    workspace: WorkspaceSession,
    isEncrypted: boolean,
    timestamp: number = Date.now(),
  ): string {
    const sanitizedName = workspace.name
      .trim()
      .replace(/[^a-zA-Z0-9_\-\s]/g, "")
      .replace(/\s+/g, "_");
    const ext = isEncrypted ? "enc" : "json";
    const tabCount = workspace.tabs.length;
    return `${WORKSPACE_FOLDER}/${sanitizedName || "workspace"}__${tabCount}tabs__${timestamp}__${workspace.id}.${ext}`;
  }

  /**
   * Parses display title, tabCount, updatedAt, and workspaceId from remote file name.
   */
  private parseFileInfo(fileName: string): {
    displayName: string;
    workspaceId: string;
    tabCount?: number;
    updatedAt?: number;
  } {
    const withoutExt = fileName.replace(/\.(json|enc)$/i, "");

    // Pattern: {Title}__{N}tabs__{Timestamp}__{ID}
    const parts = withoutExt.split("__");
    if (parts.length >= 4) {
      const titlePart = parts.slice(0, parts.length - 3).join("__");
      const tabPart = parts[parts.length - 3];
      const timePart = parts[parts.length - 2];
      const idPart = parts[parts.length - 1];

      const tabMatch = tabPart.match(/^(\d+)tabs$/i);
      const tabCount = tabMatch ? parseInt(tabMatch[1], 10) : undefined;
      const parsedTime = parseInt(timePart, 10);
      const updatedAt =
        !isNaN(parsedTime) && parsedTime > 1000000000000
          ? parsedTime
          : undefined;

      return {
        displayName: titlePart.replace(/_/g, " "),
        workspaceId: idPart,
        tabCount,
        updatedAt,
      };
    }

    // Previous format: {Title}__{N}tabs__{ID}
    if (parts.length === 3) {
      const titlePart = parts[0];
      const tabPart = parts[1];
      const idPart = parts[2];
      const tabMatch = tabPart.match(/^(\d+)tabs$/i);
      const tabCount = tabMatch ? parseInt(tabMatch[1], 10) : undefined;

      return {
        displayName: titlePart.replace(/_/g, " "),
        workspaceId: idPart,
        tabCount,
      };
    }

    if (parts.length === 2) {
      // Legacy format without tabs: {Title}__{ID}
      return {
        displayName: parts[0].replace(/_/g, " "),
        workspaceId: parts[1],
      };
    }

    // Fallback for older format with single underscore before UUID
    const uuidRegex =
      /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i;
    const match = withoutExt.match(uuidRegex);
    if (match) {
      const id = match[1];
      const title = withoutExt.replace(`_${id}`, "").replace(/_/g, " ");
      return { displayName: title || "Workspace", workspaceId: id };
    }
    return { displayName: withoutExt, workspaceId: withoutExt };
  }

  /**
   * Uploads/Syncs a workspace to the selected cloud adapter.
   * Automatically replaces any previous files belonging to this workspaceId.
   */
  async uploadWorkspace(
    adapter: CloudStorageAdapter,
    workspace: WorkspaceSession,
    options: { isEncrypted: boolean; password?: string },
    timestamp: number = Date.now(),
  ): Promise<string> {
    // 1. Sanitize workspace tabs for storage (exclude non-serializable FileSystemHandle)
    const sanitizedTabs = workspace.tabs.map((tab) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { fileHandle, ...rest } = tab;
      return rest;
    });

    const payloadObject: WorkspaceSession = {
      ...workspace,
      tabs: sanitizedTabs,
      updatedAt: timestamp,
    };

    const rawJson = JSON.stringify(payloadObject, null, 2);
    let finalContent = rawJson;

    if (options.isEncrypted) {
      if (!options.password || !options.password.trim()) {
        throw new Error(
          "A Master Password is required to encrypt this workspace.",
        );
      }
      const encryptedPayload = await encryptData(rawJson, options.password);
      finalContent = JSON.stringify(encryptedPayload, null, 2);
    }

    const targetPath = this.getWorkspaceFilePath(
      workspace,
      options.isEncrypted,
      timestamp,
    );

    // 2. Scan and remove any existing remote files with the same workspace.id (e.g. if renamed, timestamp updated, or mode changed)
    try {
      const existingFiles = await adapter.listFiles(WORKSPACE_FOLDER);
      for (const item of existingFiles) {
        if (
          item.type === "file" &&
          item.name.includes(workspace.id) &&
          item.path !== targetPath
        ) {
          await adapter.deleteFile(item.path).catch(() => {});
        }
      }
    } catch {
      // Best-effort cleanup
    }

    // 3. Write new file
    await adapter.writeFile(targetPath, finalContent);
    return targetPath;
  }

  /**
   * Lists all workspace files available in the cloud storage, deduplicated by workspace ID.
   */
  async listRemoteWorkspaces(
    adapter: CloudStorageAdapter,
  ): Promise<SyncedWorkspaceFileInfo[]> {
    const items: StorageItem[] = await adapter.listFiles(WORKSPACE_FOLDER);

    return items
      .filter(
        (item) =>
          item.type === "file" &&
          (item.name.endsWith(".json") || item.name.endsWith(".enc")),
      )
      .map((item) => {
        const {
          displayName,
          workspaceId,
          tabCount,
          updatedAt: filenameTimestamp,
        } = this.parseFileInfo(item.name);
        return {
          name: displayName,
          fileName: item.name,
          workspaceId,
          tabCount,
          path: item.path,
          isEncrypted: item.name.endsWith(".enc"),
          size: item.size,
          updatedAt: filenameTimestamp || item.updatedAt,
        };
      });
  }

  /**
   * Downloads, decrypts (if needed), and restores a workspace into workspaceStore.
   */
  async restoreWorkspace(
    adapter: CloudStorageAdapter,
    filePath: string,
    password?: string,
  ): Promise<WorkspaceSession | null> {
    const rawContent = await adapter.readFile(filePath);

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawContent);
    } catch {
      throw new Error("Invalid or corrupted workspace file format.");
    }

    let workspaceData: WorkspaceSession;

    // If file is encrypted (either .enc file or contains EncryptedPayload structure)
    if (isEncryptedPayload(parsedJson)) {
      if (!password) {
        throw new Error(
          "This workspace is encrypted. Please provide the Master Password.",
        );
      }
      const decryptedString = await decryptData(
        parsedJson as EncryptedPayload,
        password,
      );
      workspaceData = JSON.parse(decryptedString) as WorkspaceSession;
    } else {
      workspaceData = parsedJson as WorkspaceSession;
    }

    if (
      !workspaceData.id ||
      !workspaceData.name ||
      !Array.isArray(workspaceData.tabs)
    ) {
      throw new Error(
        "The file does not contain a valid Scripta Workspace structure.",
      );
    }

    // Check if workspace already exists locally by ID or by identical Name
    const store = useWorkspaceStore.getState();
    const existingWs = store.workspaces.find(
      (w) =>
        w.id === workspaceData.id ||
        w.name.trim().toLowerCase() === workspaceData.name.trim().toLowerCase(),
    );

    if (existingWs) {
      const localUpdated = formatDateTime(existingWs.updatedAt);
      const localLastSynced = existingWs.lastSyncedAt
        ? formatDateTime(existingWs.lastSyncedAt)
        : "Never";
      const remoteUpdated = formatDateTime(workspaceData.updatedAt);
      const remoteTabsCount = workspaceData.tabs.length;
      const localTabsCount = existingWs.tabs.length;

      const compareMessage = [
        `A workspace "${existingWs.name}" already exists locally on this machine.`,
        "",
        "⚖️ Version Comparison:",
        `• Local Version:`,
        `   - Name: ${existingWs.name}`,
        `   - Tabs: ${localTabsCount} ${localTabsCount === 1 ? "tab" : "tabs"}`,
        `   - Last modified: ${localUpdated}`,
        `   - Last synced: ${localLastSynced}`,
        "",
        `• Cloud Version (Restoring):`,
        `   - Name: ${workspaceData.name}`,
        `   - Tabs: ${remoteTabsCount} ${remoteTabsCount === 1 ? "tab" : "tabs"}`,
        `   - Last modified: ${remoteUpdated}`,
        "",
        "Restoring will overwrite your current local version unless you choose to create a new copy.",
      ].join("\n");

      const confirmResult = (await dialog.confirm({
        title: "Workspace Conflict Detected",
        message: compareMessage,
        confirmText: "Restore & Overwrite",
        cancelText: "Cancel",
        variant: "warning",
        checkbox: {
          label: "Restore as a new copy instead of overwriting",
          defaultChecked: false,
        },
      })) as ConfirmResult;

      if (!confirmResult || !confirmResult.confirmed) {
        return null; // User cancelled restore operation
      }

      // If user checked "Restore as a new copy"
      if (confirmResult.checked) {
        return await store.applyWorkspaceSession(workspaceData, true);
      }

      // Overwrite: Ensure we keep existing ID if it matched by name
      const sessionToApply: WorkspaceSession = {
        ...workspaceData,
        id: existingWs.id,
      };
      return await store.applyWorkspaceSession(sessionToApply, false);
    }

    // New workspace (no local conflict)
    return await store.applyWorkspaceSession(workspaceData, false);
  }

  /**
   * Delete a workspace file from cloud storage.
   */
  async deleteRemoteWorkspace(
    adapter: CloudStorageAdapter,
    filePath: string,
  ): Promise<void> {
    await adapter.deleteFile(filePath);
  }
}

export const workspaceSyncService = new WorkspaceSyncService();
