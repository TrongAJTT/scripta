import type {
  DroppedFileItem,
  FileTab,
  RecentFileEntry,
} from "../../../core/types/file.types";
import {
  detectLanguageFromFilename,
  detectLineEnding,
} from "../../../core/utils/fileDetection";
import {
  decodeBuffer,
  detectEncodingFromBuffer,
  type SupportedEncoding,
} from "../../../core/utils/encodingUtils";
import {
  openLocalFile,
  saveExistingFile,
  saveFileAs,
} from "../../file-system/data/fileSystemApi";
import { RecentFilesService } from "../../file-system/services/recentFilesService";
import { dialog } from "../../../shared/dialog/dialogStore";
import {
  debouncedSaveSession,
  readFileAsDataURLHelper,
} from "./sessionHelpers";
import type { EditorSliceCreator, FileIoSlice } from "./types";

interface DataTransferItemWithHandle extends DataTransferItem {
  getAsFileSystemHandle?: () => Promise<FileSystemFileHandle | null>;
}

export const createFileIoSlice: EditorSliceCreator<FileIoSlice> = (
  set,
  get,
) => ({
  recentFiles: [],
  closedFilesStack: [],

  openFileAction: async () => {
    const openedTab = await openLocalFile();
    if (!openedTab) return;

    if (openedTab.fileHandle) {
      const recents = await RecentFilesService.addRecentFile(
        openedTab.fileHandle,
        openedTab.name,
      );
      set({ recentFiles: recents });
    }

    const { tabs } = get();
    const existing = tabs.find(
      (t) => t.name === openedTab.name && t.content === openedTab.content,
    );
    if (existing) {
      set({ activeTabId: existing.id });
      return;
    }

    const nextTabs = [...tabs, openedTab];
    set({ tabs: nextTabs, activeTabId: openedTab.id });
    debouncedSaveSession(nextTabs, openedTab.id);
  },

  openDroppedFiles: async (
    itemsOrFiles: FileList | DataTransferItemList | DroppedFileItem[],
  ) => {
    const { tabs, recentTabIds } = get();

    // Synchronously snapshot items if passed as DataTransferItemList or FileList
    const entries: DroppedFileItem[] = [];

    if (Array.isArray(itemsOrFiles)) {
      entries.push(...itemsOrFiles);
    } else if (
      typeof DataTransferItemList !== "undefined" &&
      itemsOrFiles instanceof DataTransferItemList
    ) {
      for (let i = 0; i < itemsOrFiles.length; i++) {
        const item = itemsOrFiles[i] as DataTransferItemWithHandle;
        if (item.kind !== "file") continue;
        const file = item.getAsFile();
        if (!file) continue;

        let handlePromise: Promise<FileSystemFileHandle | null> | undefined;
        if (typeof item.getAsFileSystemHandle === "function") {
          try {
            handlePromise = item.getAsFileSystemHandle().catch(() => null);
          } catch {
            handlePromise = undefined;
          }
        }
        entries.push({ file, handlePromise });
      }
    } else if (itemsOrFiles instanceof FileList) {
      for (let i = 0; i < itemsOrFiles.length; i++) {
        const file = itemsOrFiles[i];
        if (file) {
          entries.push({ file });
        }
      }
    }

    if (entries.length === 0) return;

    const newTabs: FileTab[] = [];

    for (const entry of entries) {
      const { file } = entry;
      let handle: FileSystemFileHandle | undefined;

      if (entry.handlePromise) {
        try {
          const h = await entry.handlePromise;
          if (h && h.kind === "file") {
            handle = h;
          }
        } catch {
          // Fallback to File without handle
        }
      }

      if (handle) {
        try {
          const recents = await RecentFilesService.addRecentFile(
            handle,
            file.name,
          );
          set({ recentFiles: recents });
        } catch (err) {
          console.warn("Failed to record recent file handle", err);
        }
      }

      const isImage =
        file.type.startsWith("image/") && !file.name.endsWith(".svg");
      let content = "";
      let imageDataUrl: string | undefined;
      let rawBuffer: Uint8Array | undefined;
      let detectedEncoding: SupportedEncoding = "UTF-8";

      if (isImage) {
        imageDataUrl = await readFileAsDataURLHelper(file);
        content = `/* Image Viewer: ${file.name} */`;
      } else {
        const arrayBuf = await file.arrayBuffer();
        rawBuffer = new Uint8Array(arrayBuf);
        const det = detectEncodingFromBuffer(rawBuffer);
        detectedEncoding = det.encoding;
        content = decodeBuffer(rawBuffer, detectedEncoding);
      }

      const { language, previewType } = detectLanguageFromFilename(file.name);
      newTabs.push({
        id: crypto.randomUUID(),
        name: file.name,
        content,
        savedContent: content,
        language,
        fileHandle: handle,
        isModified: false,
        encoding: detectedEncoding,
        rawBuffer,
        lineEnding: detectLineEnding(content),
        previewType: isImage ? "image" : previewType,
        imageDataUrl,
        fileLastModified: file.lastModified,
      });
    }

    if (newTabs.length > 0) {
      const nextTabs = [...tabs, ...newTabs];
      const nextActiveId = newTabs[newTabs.length - 1].id;
      const nextRecent = [
        nextActiveId,
        ...(recentTabIds || []).filter((id) => id !== nextActiveId),
      ];
      set({
        tabs: nextTabs,
        activeTabId: nextActiveId,
        recentTabIds: nextRecent,
      });
      debouncedSaveSession(nextTabs, nextActiveId);
    }
  },

  appendDroppedFilesToActiveTab: async (
    itemsOrFiles: FileList | DataTransferItemList | DroppedFileItem[],
    insertCallback?: (text: string) => void,
  ) => {
    const { tabs, activeTabId } = get();
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (!activeTab) return;

    const files: File[] = [];

    if (Array.isArray(itemsOrFiles)) {
      for (const item of itemsOrFiles) {
        if (item.file) files.push(item.file);
      }
    } else if (
      typeof DataTransferItemList !== "undefined" &&
      itemsOrFiles instanceof DataTransferItemList
    ) {
      for (let i = 0; i < itemsOrFiles.length; i++) {
        const item = itemsOrFiles[i];
        if (item.kind !== "file") continue;
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    } else if (itemsOrFiles instanceof FileList) {
      for (let i = 0; i < itemsOrFiles.length; i++) {
        const file = itemsOrFiles[i];
        if (file) files.push(file);
      }
    }

    if (files.length === 0) return;

    const textPieces: string[] = [];

    for (const file of files) {
      const isImage =
        file.type.startsWith("image/") && !file.name.endsWith(".svg");

      if (isImage) {
        textPieces.push(`![${file.name}](${file.name})\n`);
      } else {
        try {
          const arrayBuf = await file.arrayBuffer();
          const rawBuffer = new Uint8Array(arrayBuf);
          const det = detectEncodingFromBuffer(rawBuffer);
          const decoded = decodeBuffer(rawBuffer, det.encoding);
          textPieces.push(decoded);
        } catch {
          const text = await file.text();
          textPieces.push(text);
        }
      }
    }

    if (textPieces.length === 0) return;

    const combinedText = textPieces.join("\n\n");

    if (insertCallback) {
      insertCallback(combinedText);
    } else {
      const updatedContent = activeTab.content
        ? `${activeTab.content}\n\n${combinedText}`
        : combinedText;
      const nextTabs = tabs.map((t) =>
        t.id === activeTab.id
          ? { ...t, content: updatedContent, isModified: true }
          : t,
      );
      set({ tabs: nextTabs });
      debouncedSaveSession(nextTabs, activeTab.id);
    }
  },

  saveCurrentTab: async () => {
    const { flushCurrentTabContent } = get();
    if (flushCurrentTabContent) {
      flushCurrentTabContent();
    }
    const { tabs, activeTabId } = get();
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (!activeTab) return;

    const updated = await saveExistingFile(activeTab);
    if (updated.fileHandle) {
      const recents = await RecentFilesService.addRecentFile(
        updated.fileHandle,
        updated.name,
      );
      set({ recentFiles: recents });
    }
    const nextTabs = tabs.map((t) => (t.id === activeTab.id ? updated : t));
    set({ tabs: nextTabs });
    debouncedSaveSession(nextTabs, activeTabId);
  },

  saveCurrentTabAs: async () => {
    const { flushCurrentTabContent } = get();
    if (flushCurrentTabContent) {
      flushCurrentTabContent();
    }
    const { tabs, activeTabId } = get();
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (!activeTab) return;

    const updated = await saveFileAs(activeTab);
    if (updated.fileHandle) {
      const recents = await RecentFilesService.addRecentFile(
        updated.fileHandle,
        updated.name,
      );
      set({ recentFiles: recents });
    }
    const nextTabs = tabs.map((t) => (t.id === activeTab.id ? updated : t));
    set({ tabs: nextTabs });
    debouncedSaveSession(nextTabs, activeTabId);
  },

  reopenClosedFile: async () => {
    const { tab, remainingClosed } =
      await RecentFilesService.reopenLastClosedFile();
    set({ closedFilesStack: remainingClosed });
    if (!tab) return;

    const { tabs } = get();
    const existing = tabs.find((t) => t.name === tab.name);
    if (existing) {
      set({ activeTabId: existing.id });
      return;
    }

    if (tab.fileHandle) {
      const recents = await RecentFilesService.addRecentFile(
        tab.fileHandle,
        tab.name,
      );
      set({ recentFiles: recents });
    }

    const nextTabs = [...tabs, tab];
    set({ tabs: nextTabs, activeTabId: tab.id });
    debouncedSaveSession(nextTabs, tab.id);
  },

  openRecentFile: async (entry: RecentFileEntry) => {
    const { tabs } = get();
    const existing = tabs.find((t) => t.name === entry.name);
    if (existing) {
      set({ activeTabId: existing.id });
      return;
    }

    const tab = await RecentFilesService.openRecentFile(entry);
    if (!tab) {
      await dialog.alert({
        title: "Cannot Open File",
        message: `Could not access or open "${entry.name}". The file may have been moved or permission was denied.`,
        variant: "warning",
      });
      return;
    }

    const recents = await RecentFilesService.addRecentFile(
      entry.handle,
      entry.name,
    );
    const nextTabs = [...tabs, tab];
    set({ tabs: nextTabs, activeTabId: tab.id, recentFiles: recents });
    debouncedSaveSession(nextTabs, tab.id);
  },

  clearRecentFiles: async () => {
    await RecentFilesService.clearRecentFiles();
    set({ recentFiles: [], closedFilesStack: [] });
  },
});
