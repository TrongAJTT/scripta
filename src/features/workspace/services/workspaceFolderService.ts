import { zipSync, strToU8 } from "fflate";
import type { WorkspaceSession } from "../../../core/types/workspace.types";
import type { FileTab, SupportedLanguage } from "../../../core/types/file.types";
import {
  saveFolderHandle,
  loadFolderHandle,
  saveWorkspace,
} from "../../../core/utils/idbStorage";
import { useWorkspaceStore } from "../store/workspaceStore";
import { useEditorStore } from "../../tabs/store";
import { dialog } from "../../../shared/dialog/dialogStore";
import { detectLanguageFromFilename } from "../../../core/utils/fileDetection";

/** Filename for the Scripta workspace metadata inside a linked folder */
export const SCRIPTA_METADATA_FILENAME = ".workspace.scripta";

/** Metadata written to .workspace.scripta — no tab content, only structural info */
export interface WorkspaceFolderManifest {
  scripta: true;
  version: 1;
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  activeTab: string | null;
  tabs: WorkspaceTabManifestEntry[];
}

export interface WorkspaceTabManifestEntry {
  file: string;
  language: SupportedLanguage;
  encoding: string;
  lineEnding: "LF" | "CRLF";
  isPinned?: boolean;
  isLocked?: boolean;
  bookmarks?: number[];
}

export type SaveWorkspaceResult =
  | "saved"
  | "no-folder"
  | "permission-denied"
  | "zip-fallback"
  | "aborted";

/**
 * Resolve a unique filename if there's a collision (two tabs with same name).
 * e.g. "readme.md" → "readme_2.md" → "readme_3.md"
 */
function resolveUniqueName(desiredName: string, usedNames: Set<string>): string {
  if (!usedNames.has(desiredName)) {
    usedNames.add(desiredName);
    return desiredName;
  }
  const dotIdx = desiredName.lastIndexOf(".");
  const base = dotIdx >= 0 ? desiredName.slice(0, dotIdx) : desiredName;
  const ext = dotIdx >= 0 ? desiredName.slice(dotIdx) : "";
  let i = 2;
  while (true) {
    const candidate = `${base}_${i}${ext}`;
    if (!usedNames.has(candidate)) {
      usedNames.add(candidate);
      return candidate;
    }
    i++;
  }
}

/**
 * Build a WorkspaceFolderManifest from a WorkspaceSession and its file name map.
 */
function buildManifest(
  workspace: WorkspaceSession,
  tabFileNames: Map<string, string>, // tabId → resolved filename
): WorkspaceFolderManifest {
  const activeTab = workspace.tabs.find((t) => t.id === workspace.activeTabId);
  const activeTabFileName = activeTab ? (tabFileNames.get(activeTab.id) ?? activeTab.name) : null;

  return {
    scripta: true,
    version: 1,
    id: workspace.id,
    name: workspace.name,
    description: workspace.description,
    createdAt: workspace.createdAt,
    updatedAt: Date.now(),
    activeTab: activeTabFileName,
    tabs: workspace.tabs.map((tab) => ({
      file: tabFileNames.get(tab.id) ?? tab.name,
      language: tab.language,
      encoding: tab.encoding,
      lineEnding: tab.lineEnding,
      isPinned: tab.isPinned,
      isLocked: tab.isLocked,
      bookmarks: tab.bookmarks,
    })),
  };
}

/**
 * Build tab-to-filename mapping with deduplication.
 */
function buildTabFileNames(tabs: FileTab[]): Map<string, string> {
  const usedNames = new Set<string>();
  const map = new Map<string, string>();
  for (const tab of tabs) {
    const resolved = resolveUniqueName(tab.name, usedNames);
    map.set(tab.id, resolved);
  }
  return map;
}

/**
 * Service for managing Workspace ↔ local folder operations.
 * Supports real file-per-tab writing via File System Access API,
 * with fflate ZIP download as fallback for unsupported browsers.
 */
class WorkspaceFolderService {
  /**
   * Checks if the File System Access API (showDirectoryPicker) is available.
   */
  private isFSASupported(): boolean {
    return "showDirectoryPicker" in window;
  }

  /**
   * Request readwrite permission for a stored directory handle.
   * Returns true if granted, false if denied.
   */
  async requestFolderPermission(
    handle: FileSystemDirectoryHandle,
  ): Promise<boolean> {
    try {
      const perm = await (handle as any).requestPermission({ mode: "readwrite" });
      return perm === "granted";
    } catch {
      return false;
    }
  }

  /**
   * Open a local folder as a Workspace.
   * - If folder contains .workspace.scripta → import manifest + read listed files.
   * - Otherwise → read all top-level non-hidden files and create a new workspace.
   */
  async openFolderAsWorkspace(): Promise<void> {
    if (!this.isFSASupported()) {
      await dialog.alert({
        title: "Not Supported",
        message:
          "Opening a local folder as a workspace requires a Chromium-based browser (Chrome, Edge) or Safari 15.2+. Firefox does not support the File System Access API.",
        variant: "info",
      });
      return;
    }

    let dirHandle: FileSystemDirectoryHandle;
    try {
      dirHandle = await (
        window as unknown as {
          showDirectoryPicker: (options?: unknown) => Promise<FileSystemDirectoryHandle>;
        }
      ).showDirectoryPicker({
        mode: "readwrite",
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      throw err;
    }

    // Try to read .workspace.scripta
    let manifest: WorkspaceFolderManifest | null = null;
    try {
      const metaHandle = await dirHandle.getFileHandle(SCRIPTA_METADATA_FILENAME);
      const metaFile = await metaHandle.getFile();
      const raw = await metaFile.text();
      const parsed = JSON.parse(raw) as WorkspaceFolderManifest;
      if (parsed.scripta === true) {
        manifest = parsed;
      }
    } catch {
      // No .workspace.scripta or invalid — will scan folder instead
    }

    const freshTabId = () => crypto.randomUUID();
    let tabs: FileTab[] = [];
    let activeTabId: string | null = null;
    let workspaceId = crypto.randomUUID();
    let workspaceName = dirHandle.name;
    let workspaceDescription: string | undefined;
    let createdAt = Date.now();

    if (manifest) {
      // Import from manifest
      workspaceId = manifest.id as `${string}-${string}-${string}-${string}-${string}`;
      workspaceName = manifest.name;
      workspaceDescription = manifest.description;
      createdAt = manifest.createdAt;

      for (const entry of manifest.tabs) {
        try {
          const fileHandle = await dirHandle.getFileHandle(entry.file);
          const file = await fileHandle.getFile();
          const content = await file.text();
          const tabId = freshTabId();
          tabs.push({
            id: tabId,
            name: entry.file,
            content,
            savedContent: content,
            language: entry.language ?? detectLanguageFromFilename(entry.file).language,
            encoding: (entry.encoding as FileTab["encoding"]) ?? "UTF-8",
            lineEnding: entry.lineEnding ?? "LF",
            isModified: false,
            isPinned: entry.isPinned,
            isLocked: entry.isLocked,
            bookmarks: entry.bookmarks,
            fileHandle,
          });
          if (entry.file === manifest.activeTab) {
            activeTabId = tabId;
          }
        } catch {
          // File listed in manifest but missing on disk — skip silently
        }
      }
      if (tabs.length > 0 && !activeTabId) {
        activeTabId = tabs[0].id;
      }
    } else {
      // Scan top-level files, skip hidden (starts with '.') and directories
      const entries: FileSystemFileHandle[] = [];
      const handleWithEntries = dirHandle as unknown as {
        entries?: () => AsyncIterable<[string, FileSystemHandle]>;
        values?: () => AsyncIterable<FileSystemHandle>;
      };

      if (typeof handleWithEntries.entries === "function") {
        for await (const [name, entry] of handleWithEntries.entries()) {
          if (entry.kind === "file" && !name.startsWith(".")) {
            entries.push(entry as FileSystemFileHandle);
          }
        }
      } else if (typeof handleWithEntries.values === "function") {
        for await (const entry of handleWithEntries.values()) {
          if (entry.kind === "file" && !entry.name.startsWith(".")) {
            entries.push(entry as FileSystemFileHandle);
          }
        }
      }
      // Sort alphabetically
      entries.sort((a, b) => a.name.localeCompare(b.name));

      for (const fileHandle of entries) {
        const file = await fileHandle.getFile();
        const content = await file.text();
        const tabId = freshTabId();
        tabs.push({
          id: tabId,
          name: fileHandle.name,
          content,
          savedContent: content,
          language: detectLanguageFromFilename(fileHandle.name).language,
          encoding: "UTF-8",
          lineEnding: content.includes("\r\n") ? "CRLF" : "LF",
          isModified: false,
          fileHandle,
        });
      }
      if (tabs.length > 0) {
        activeTabId = tabs[0].id;
      } else {
        // Empty folder — create a blank welcome tab
        const blankId = freshTabId();
        tabs = [
          {
            id: blankId,
            name: "welcome.md",
            content: `# ${dirHandle.name}\n\nStart writing or open files here...`,
            savedContent: `# ${dirHandle.name}\n\nStart writing or open files here...`,
            language: "markdown",
            encoding: "UTF-8",
            lineEnding: "LF",
            isModified: false,
          },
        ];
        activeTabId = blankId;
      }
    }

    const workspace: WorkspaceSession = {
      id: workspaceId,
      name: workspaceName,
      description: workspaceDescription,
      createdAt,
      updatedAt: Date.now(),
      activeTabId,
      tabs,
      folderLinkedAt: Date.now(),
      folderName: dirHandle.name,
    };

    // Apply to store and persist
    await useWorkspaceStore.getState().applyWorkspaceSession(workspace, false);
    await saveFolderHandle(workspaceId, dirHandle);

    // Update folderLinkedAt/folderName in IDB after applyWorkspaceSession
    const updatedWs = { ...workspace, folderLinkedAt: Date.now(), folderName: dirHandle.name };
    await saveWorkspace(updatedWs);
    useWorkspaceStore.setState((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === workspaceId ? updatedWs : w,
      ),
    }));
  }

  /**
   * Save all tabs as real files in a chosen folder + write .workspace.scripta.
   * Falls back to ZIP download if File System Access API is unavailable.
   */
  async saveWorkspaceToFolder(workspace: WorkspaceSession): Promise<void> {
    if (!this.isFSASupported()) {
      await this.downloadWorkspaceAsZip(workspace);
      return;
    }

    let dirHandle: FileSystemDirectoryHandle;
    try {
      dirHandle = await (
        window as unknown as {
          showDirectoryPicker: (options?: unknown) => Promise<FileSystemDirectoryHandle>;
        }
      ).showDirectoryPicker({
        mode: "readwrite",
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      throw err;
    }

    await this._writeWorkspaceToDir(workspace, dirHandle);

    // Link folder to workspace
    await saveFolderHandle(workspace.id, dirHandle);
    const updatedWs: WorkspaceSession = {
      ...workspace,
      folderLinkedAt: Date.now(),
      folderName: dirHandle.name,
      updatedAt: Date.now(),
    };
    await saveWorkspace(updatedWs);
    useWorkspaceStore.setState((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === workspace.id ? updatedWs : w,
      ),
    }));
  }

  /**
   * Quick-save to linked folder. Returns result code.
   * - 'saved': Successfully written to disk.
   * - 'no-folder': No folder linked — caller should invoke saveWorkspaceToFolder.
   * - 'permission-denied': User denied readwrite permission.
   * - 'zip-fallback': API not supported, ZIP download triggered.
   * - 'aborted': User cancelled.
   */
  async saveWorkspace(workspaceId: string): Promise<SaveWorkspaceResult> {
    if (!this.isFSASupported()) {
      const ws = useWorkspaceStore
        .getState()
        .workspaces.find((w) => w.id === workspaceId);
      if (!ws) return "aborted";
      await this.downloadWorkspaceAsZip(ws);
      return "zip-fallback";
    }

    // Load handle from IDB
    const handle = await loadFolderHandle(workspaceId);
    if (!handle) return "no-folder";

    // Re-verify permission
    const granted = await this.requestFolderPermission(handle);
    if (!granted) return "permission-denied";

    const ws = useWorkspaceStore
      .getState()
      .workspaces.find((w) => w.id === workspaceId);
    if (!ws) return "aborted";

    // Sync active tabs from editor store before saving
    const editorTabs = useEditorStore.getState().tabs;
    const activeTabId = useEditorStore.getState().activeTabId;
    const fullWs: WorkspaceSession = { ...ws, tabs: editorTabs, activeTabId };

    await this._writeWorkspaceToDir(fullWs, handle);

    const updatedWs: WorkspaceSession = {
      ...fullWs,
      updatedAt: Date.now(),
    };
    await saveWorkspace(updatedWs);
    useWorkspaceStore.setState((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === workspaceId ? updatedWs : w,
      ),
    }));

    return "saved";
  }

  /**
   * Core write routine: write each tab as a file + .workspace.scripta into dirHandle.
   */
  private async _writeWorkspaceToDir(
    workspace: WorkspaceSession,
    dirHandle: FileSystemDirectoryHandle,
  ): Promise<void> {
    const tabFileNames = buildTabFileNames(workspace.tabs);

    // Write each tab's content as a real file
    for (const tab of workspace.tabs) {
      if (tab.imageDataUrl) continue; // Skip image tabs
      const fileName = tabFileNames.get(tab.id) ?? tab.name;
      try {
        const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(tab.content);
        await writable.close();
      } catch (err) {
        console.warn(`Failed to write file "${fileName}" to folder`, err);
      }
    }

    // Write .workspace.scripta metadata
    const manifest = buildManifest(workspace, tabFileNames);
    const metaContent = JSON.stringify(manifest, null, 2);
    try {
      const metaHandle = await dirHandle.getFileHandle(SCRIPTA_METADATA_FILENAME, {
        create: true,
      });
      const writable = await metaHandle.createWritable();
      await writable.write(metaContent);
      await writable.close();
    } catch (err) {
      console.warn("Failed to write .workspace.scripta", err);
    }
  }

  /**
   * Fallback for browsers without File System Access API.
   * Packages all tabs + .workspace.scripta as a ZIP and triggers download.
   */
  async downloadWorkspaceAsZip(workspace: WorkspaceSession): Promise<void> {
    const tabFileNames = buildTabFileNames(workspace.tabs);
    const manifest = buildManifest(workspace, tabFileNames);

    const files: Record<string, Uint8Array> = {};

    for (const tab of workspace.tabs) {
      if (tab.imageDataUrl) continue;
      const fileName = tabFileNames.get(tab.id) ?? tab.name;
      files[fileName] = strToU8(tab.content);
    }
    files[SCRIPTA_METADATA_FILENAME] = strToU8(JSON.stringify(manifest, null, 2));

    const zipped = zipSync(files, { level: 6 });
    const blob = new Blob([zipped], { type: "application/zip" });
    const url = URL.createObjectURL(blob);

    const sanitized = workspace.name.replace(/[^a-zA-Z0-9_\-\s]/g, "").replace(/\s+/g, "_") || "workspace";
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sanitized}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  /**
   * Link an existing workspace to a folder (without writing files immediately).
   * Useful for associating a pre-existing folder that already matches tab names.
   */
  async linkFolderToWorkspace(workspaceId: string): Promise<boolean> {
    if (!this.isFSASupported()) return false;
    let dirHandle: FileSystemDirectoryHandle;
    try {
      dirHandle = await (
        window as unknown as {
          showDirectoryPicker: (options?: unknown) => Promise<FileSystemDirectoryHandle>;
        }
      ).showDirectoryPicker({
        mode: "readwrite",
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return false;
      throw err;
    }

    await saveFolderHandle(workspaceId, dirHandle);

    const updatedWs = useWorkspaceStore
      .getState()
      .workspaces.find((w) => w.id === workspaceId);
    if (updatedWs) {
      const newWs: WorkspaceSession = {
        ...updatedWs,
        folderLinkedAt: Date.now(),
        folderName: dirHandle.name,
        updatedAt: Date.now(),
      };
      await saveWorkspace(newWs);
      useWorkspaceStore.setState((state) => ({
        workspaces: state.workspaces.map((w) => (w.id === workspaceId ? newWs : w)),
      }));
    }
    return true;
  }

  /**
   * Unlink the folder from a workspace.
   */
  async unlinkFolder(workspaceId: string): Promise<void> {
    const { deleteFolderHandle: idbDeleteFolderHandle } = await import(
      "../../../core/utils/idbStorage"
    );
    await idbDeleteFolderHandle(workspaceId);

    const ws = useWorkspaceStore.getState().workspaces.find((w) => w.id === workspaceId);
    if (ws) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { folderLinkedAt, folderName, ...rest } = ws;
      const updatedWs: WorkspaceSession = { ...rest, updatedAt: Date.now() };
      await saveWorkspace(updatedWs);
      useWorkspaceStore.setState((state) => ({
        workspaces: state.workspaces.map((w) => (w.id === workspaceId ? updatedWs : w)),
      }));
    }
  }

  /**
   * Check if the linked folder for a workspace is accessible (has permission).
   * Returns null if no folder linked, false if permission denied, true if ready.
   */
  async checkFolderAccess(workspaceId: string): Promise<boolean | null> {
    const handle = await loadFolderHandle(workspaceId);
    if (!handle) return null;
    try {
      const perm = await (handle as any).queryPermission({ mode: "readwrite" });
      return perm === "granted";
    } catch {
      return false;
    }
  }
}

export const workspaceFolderService = new WorkspaceFolderService();
