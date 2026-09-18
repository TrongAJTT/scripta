import { create } from "zustand";
import type {
  FileTab,
  PreviewMode,
  ThemeMode,
  EditorSettings,
  CursorPosition,
  SupportedLanguage,
  RecentFileEntry,
  DroppedFileItem,
} from "../../core/types/file.types";
import {
  detectLanguageFromFilename,
  detectLineEnding,
  getDefaultExtensionForLanguage,
  replaceFileExtension,
  getPreviewTypeForLanguage,
} from "../../core/utils/fileDetection";
import {
  openLocalFile,
  saveExistingFile,
  saveFileAs,
} from "../file-system/data/fileSystemApi";
import { RecentFilesService } from "../file-system/services/recentFilesService";
import { checkExternalFileChanges } from "../file-system/data/fileWatcher";
import {
  loadSessionTabs,
  saveSessionTabs,
  loadSettings,
  saveSettings,
  saveWorkspace,
} from "../../core/utils/idbStorage";
import { dialog } from "../../shared/dialog/dialogStore";
import type { ConfirmResult } from "../../shared/dialog/dialogStore";
import type { ExternalAlertData } from "../editor/components/ExternalFileAlertModal";
import type { SupportedEncoding } from "../../core/utils/encodingUtils";
import {
  decodeBuffer,
  encodeString,
  detectEncodingFromBuffer,
} from "../../core/utils/encodingUtils";
import {
  WELCOME_MD_CONTENT,
  TERMS_MD_CONTENT,
  POLICY_MD_CONTENT,
} from "../../core/data/defaultDocuments";
import { applyThemeToDOM } from "../settings/services/themeService";

let saveSettingsTimeout: ReturnType<typeof setTimeout> | null = null;
function debouncedSaveSettings(settings: EditorSettings) {
  if (saveSettingsTimeout) clearTimeout(saveSettingsTimeout);
  saveSettingsTimeout = setTimeout(() => {
    saveSettings(settings);
  }, 500);
}

interface EditorState {
  tabs: FileTab[];
  activeTabId: string | null;
  recentTabIds: string[];
  previewMode: PreviewMode;
  isSearching: boolean;
  settings: EditorSettings;
  externalAlert: ExternalAlertData | null;

  // Lifecycle
  initStore: () => Promise<void>;

  // Tab operations
  createTab: (name?: string, content?: string, lang?: string) => void;
  closeTab: (id: string) => void;
  closeOtherTabs: (id: string) => void;
  closeToRightTabs: (id: string) => void;
  closeSavedTabs: () => void;
  closeAllTabs: () => void;
  closeAllTabsWithPrompt: () => Promise<void>;
  togglePinTab: (id: string) => void;
  toggleLockTab: (id: string) => void;
  moveTabToWorkspace: (tabId: string, targetWorkspaceId: string) => Promise<void>;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  setActiveTab: (id: string) => void;
  updateTabContent: (id: string, content: string) => void;
  updateCursorPos: (id: string, pos: CursorPosition) => void;
  updateTabBookmarks: (id: string, bookmarks: number[]) => void;
  setLanguageForActiveTab: (lang: SupportedLanguage) => void;
  convertLineEnding: (tabId: string, target: "CRLF" | "LF") => void;
  setEncodingForActiveTab: (encoding: SupportedEncoding) => void;
  convertEncodingForActiveTab: (encoding: SupportedEncoding) => void;
  insertDateTime: (tabId: string, format?: "short" | "long") => void;

  // File operations
  openFileAction: () => Promise<void>;
  openDroppedFiles: (
    itemsOrFiles: FileList | DataTransferItemList | DroppedFileItem[],
  ) => Promise<void>;
  appendDroppedFilesToActiveTab: (
    itemsOrFiles: FileList | DataTransferItemList | DroppedFileItem[],
    insertCallback?: (text: string) => void,
  ) => Promise<void>;
  saveCurrentTab: () => Promise<void>;
  saveCurrentTabAs: () => Promise<void>;

  // Recent files
  recentFiles: RecentFileEntry[];
  closedFilesStack: RecentFileEntry[];
  reopenClosedFile: () => Promise<void>;
  openRecentFile: (entry: RecentFileEntry) => Promise<void>;
  clearRecentFiles: () => Promise<void>;

  // External Watcher
  checkActiveTabExternalChanges: () => Promise<void>;
  handleExternalKeepContent: (tabId: string) => void;
  handleExternalCloseTab: (tabId: string) => void;
  handleExternalReloadDisk: (
    tabId: string,
    newContent: string,
    diskLastModified: number,
  ) => void;
  handleExternalKeepMyChanges: (tabId: string) => void;
  clearExternalAlert: () => void;

  // Preview & View
  setPreviewMode: (mode: PreviewMode) => void;
  toggleSearch: (show?: boolean) => void;

  // Settings
  setTheme: (theme: ThemeMode) => void;
  setFontSize: (delta: number) => void;
  resetFontSize: () => void;
  setPreviewRatio: (ratio: number) => void;
  updateSettings: (partial: Partial<EditorSettings>) => void;
  toggleToolbar: () => void;
  toggleStatusBar: () => void;
  toggleTabBar: () => void;
  toggleLineWrapping: () => void;
  toggleLineNumbers: () => void;
  toggleWhitespace: () => void;
}

const DEFAULT_SETTINGS: EditorSettings = {
  theme: "dark",
  fontSize: 14,
  tabSize: 2,
  lineWrapping: true,
  minimap: false,
  autoSave: false,
  previewWidthRatio: 0.5,
  tabBarPosition: "top",
  showToolbar: true,
  showStatusBar: true,
  showTabBar: true,
  showLineNumbers: true,
  showWhitespace: false,
  autoCheckUpdates: true,
  checkUpdateInterval: 3,
  mermaidTheme: "auto",
  tabIconTheme: "vibrant",
  jsonTheme: "default",
};

function createInitialTab(name = "welcome.md"): FileTab {
  let initialContent = WELCOME_MD_CONTENT;
  if (name === "terms.md") {
    initialContent = TERMS_MD_CONTENT;
  } else if (name === "policy.md") {
    initialContent = POLICY_MD_CONTENT;
  } else if (name !== "welcome.md") {
    initialContent = "";
  }

  return {
    id: crypto.randomUUID(),
    name,
    content: initialContent,
    savedContent: initialContent,
    language: "markdown",
    isModified: false,
    encoding: "UTF-8",
    lineEnding: "LF",
    previewType: "markdown",
    cursorPos: { line: 1, col: 1, selectedChars: 0 },
  };
}

import { useWorkspaceStore } from "../workspace/store/workspaceStore";

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export function cancelPendingSessionSave() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
}

function debouncedSaveSession(tabs: FileTab[], activeTabId: string | null) {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveSessionTabs(tabs, activeTabId);
    void useWorkspaceStore.getState().saveCurrentWorkspaceState();
  }, 1000);
}

export const useEditorStore = create<EditorState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  recentTabIds: [],
  previewMode: "split",
  isSearching: false,
  settings: DEFAULT_SETTINGS,
  externalAlert: null,
  recentFiles: [],
  closedFilesStack: [],

  initStore: async () => {
    // Restore settings from IndexedDB (or fallback to localStorage)
    try {
      const savedSettings = await loadSettings();
      if (savedSettings) {
        set({ settings: { ...DEFAULT_SETTINGS, ...savedSettings } });
        applyThemeToDOM(savedSettings.theme || "dark");
      } else {
        const storedTheme =
          (localStorage.getItem("theme-mode") as ThemeMode) || "dark";
        set((state) => ({
          settings: { ...state.settings, theme: storedTheme },
        }));
        applyThemeToDOM(storedTheme);
      }
    } catch {
      // Fallback
      applyThemeToDOM("dark");
    }

    // Restore recent files from IndexedDB
    try {
      const recents = await RecentFilesService.init();
      set({ recentFiles: recents });
    } catch (e) {
      console.warn("Failed to load recent files during initStore", e);
    }

    // Restore tabs from IndexedDB
    const saved = await loadSessionTabs();
    if (saved && saved.tabs && saved.tabs.length > 0) {
      const restoredTabs: FileTab[] = saved.tabs.map((t) => ({
        ...t,
        isModified: t.content !== t.savedContent,
      }));
      const restoredActiveId =
        saved.activeTabId &&
        restoredTabs.some((x) => x.id === saved.activeTabId)
          ? saved.activeTabId
          : restoredTabs[0].id;
      set({
        tabs: restoredTabs,
        activeTabId: restoredActiveId,
        recentTabIds: [restoredActiveId],
      });
    } else {
      const defaultTab = createInitialTab("welcome.md");
      set({
        tabs: [defaultTab],
        activeTabId: defaultTab.id,
        recentTabIds: [defaultTab.id],
      });
    }
  },

  createTab: (name, content = "", lang) => {
    const { tabs } = get();
    const tabCount = tabs.length + 1;
    const tabName = name || `new ${tabCount}`;
    const detection = detectLanguageFromFilename(tabName);

    const newTab: FileTab = {
      id: crypto.randomUUID(),
      name: tabName,
      content,
      savedContent: content,
      language: (lang as SupportedLanguage) || detection.language,
      isModified: false,
      encoding: "UTF-8",
      lineEnding: detectLineEnding(content),
      previewType: detection.previewType,
      cursorPos: { line: 1, col: 1, selectedChars: 0 },
    };

    const nextTabs = [...tabs, newTab];
    const nextRecent = [newTab.id, ...(get().recentTabIds || []).filter((id) => id !== newTab.id)];
    set({
      tabs: nextTabs,
      activeTabId: newTab.id,
      recentTabIds: nextRecent,
    });
    debouncedSaveSession(nextTabs, newTab.id);
  },

  closeTab: (id: string) => {
    const { tabs, activeTabId, recentTabIds } = get();
    const targetIdx = tabs.findIndex((t) => t.id === id);
    if (targetIdx === -1) return;

    const closingTab = tabs[targetIdx];
    if (closingTab && closingTab.fileHandle) {
      RecentFilesService.recordClosedFile(closingTab);
      set({ closedFilesStack: RecentFilesService.getClosedFilesStack() });
    }

    const nextTabs = tabs.filter((t) => t.id !== id);
    const nextRecent = (recentTabIds || []).filter((tabId) => tabId !== id);
    let nextActiveId = activeTabId;

    if (activeTabId === id) {
      if (nextRecent.length > 0 && nextTabs.some((t) => t.id === nextRecent[0])) {
        nextActiveId = nextRecent[0];
      } else if (nextTabs.length > 0) {
        const newIdx = Math.min(targetIdx, nextTabs.length - 1);
        nextActiveId = nextTabs[newIdx].id;
      } else {
        // Nếu đóng hết tab thì tự tạo 1 tab mới
        const freshTab = createInitialTab("new 1");
        nextTabs.push(freshTab);
        nextActiveId = freshTab.id;
        nextRecent.push(freshTab.id);
      }
    }

    set({ tabs: nextTabs, activeTabId: nextActiveId, recentTabIds: nextRecent });
    debouncedSaveSession(nextTabs, nextActiveId);
  },

  togglePinTab: (id: string) => {
    const { tabs, activeTabId } = get();
    const updated = tabs.map((t) =>
      t.id === id ? { ...t, isPinned: !t.isPinned } : t
    );
    // Stable sort: Pinned tabs come first
    const pinned = updated.filter((t) => t.isPinned);
    const unpinned = updated.filter((t) => !t.isPinned);
    const nextTabs = [...pinned, ...unpinned];
    set({ tabs: nextTabs });
    debouncedSaveSession(nextTabs, activeTabId);
  },

  toggleLockTab: (id: string) => {
    const { tabs, activeTabId } = get();
    const nextTabs = tabs.map((t) =>
      t.id === id ? { ...t, isLocked: !t.isLocked } : t
    );
    set({ tabs: nextTabs });
    debouncedSaveSession(nextTabs, activeTabId);
  },

  closeOtherTabs: async (id: string) => {
    const { tabs } = get();
    const closingTabs = tabs.filter((t) => t.id !== id && !t.isPinned);
    if (closingTabs.length === 0) return;

    const hasUnsaved = closingTabs.some((t) => t.isModified);
    if (hasUnsaved) {
      const confirmed = await dialog.confirm({
        title: "Unsaved Changes",
        message:
          "Some tabs have unsaved changes.\nAre you sure you want to close other tabs without saving?",
        confirmText: "Close Without Saving",
        cancelText: "Cancel",
        variant: "warning",
      });
      if (!confirmed) return;
    }

    const keep = tabs.filter((t) => t.id === id || t.isPinned);
    const nextRecent = [id, ...keep.filter((t) => t.id !== id).map((t) => t.id)];
    set({ tabs: keep, activeTabId: id, recentTabIds: nextRecent });
    debouncedSaveSession(keep, id);
  },

  closeToRightTabs: async (id: string) => {
    const { tabs, activeTabId } = get();
    const targetIdx = tabs.findIndex((t) => t.id === id);
    if (targetIdx === -1) return;

    const rightTabs = tabs.slice(targetIdx + 1).filter((t) => !t.isPinned);
    if (rightTabs.length === 0) return;

    const hasUnsaved = rightTabs.some((t) => t.isModified);
    if (hasUnsaved) {
      const confirmed = await dialog.confirm({
        title: "Unsaved Changes",
        message:
          "Some tabs to the right have unsaved changes.\nAre you sure you want to close them without saving?",
        confirmText: "Close Without Saving",
        cancelText: "Cancel",
        variant: "warning",
      });
      if (!confirmed) return;
    }

    const rightTabIds = new Set(rightTabs.map((t) => t.id));
    const keep = tabs.filter((t) => !rightTabIds.has(t.id));
    let nextActiveId = activeTabId;
    if (activeTabId && rightTabIds.has(activeTabId)) {
      nextActiveId = id;
    }

    const nextRecent = (get().recentTabIds || []).filter((tid) => !rightTabIds.has(tid));
    set({ tabs: keep, activeTabId: nextActiveId, recentTabIds: nextRecent });
    debouncedSaveSession(keep, nextActiveId);
  },

  closeSavedTabs: () => {
    const { tabs, activeTabId } = get();
    // Only close unmodified and unpinned tabs
    const keep = tabs.filter((t) => t.isModified || t.isPinned);
    if (keep.length === tabs.length) return;

    let nextActiveId = activeTabId;
    if (keep.length === 0) {
      const freshTab = createInitialTab("new 1");
      keep.push(freshTab);
      nextActiveId = freshTab.id;
    } else if (!activeTabId || !keep.some((t) => t.id === activeTabId)) {
      nextActiveId = keep[0].id;
    }

    const keepIds = new Set(keep.map((t) => t.id));
    const nextRecent = (get().recentTabIds || []).filter((tid) => keepIds.has(tid));
    set({ tabs: keep, activeTabId: nextActiveId, recentTabIds: nextRecent });
    debouncedSaveSession(keep, nextActiveId);
  },

  closeAllTabs: () => {
    const freshTab = createInitialTab("new 1");
    set({ tabs: [freshTab], activeTabId: freshTab.id, recentTabIds: [freshTab.id] });
    debouncedSaveSession([freshTab], freshTab.id);
  },

  closeAllTabsWithPrompt: async () => {
    const { tabs } = get();
    const hasUnsaved = tabs.some((t) => t.isModified);

    const result = (await dialog.confirm({
      title: "Close All Tabs",
      message: "Are you sure you want to close all open tabs?",
      confirmText: "Close All",
      cancelText: "Cancel",
      variant: hasUnsaved ? "warning" : "info",
      checkbox: hasUnsaved
        ? {
            label: "Close tabs with unsaved changes as well",
            defaultChecked: true,
          }
        : undefined,
    })) as ConfirmResult | boolean;

    const confirmed = typeof result === "boolean" ? result : result.confirmed;
    if (!confirmed) return;

    const discardUnsaved =
      typeof result === "boolean" ? true : Boolean(result.checked);

    if (discardUnsaved) {
      get().closeAllTabs();
    } else {
      // Keep modified tabs
      const keep = tabs.filter((t) => t.isModified);
      let nextActiveId = keep[0]?.id;
      if (keep.length === 0) {
        const freshTab = createInitialTab("new 1");
        keep.push(freshTab);
        nextActiveId = freshTab.id;
      }
      const keepIds = new Set(keep.map((t) => t.id));
      const nextRecent = (get().recentTabIds || []).filter((tid) => keepIds.has(tid));
      set({ tabs: keep, activeTabId: nextActiveId, recentTabIds: nextRecent });
      debouncedSaveSession(keep, nextActiveId);
    }
  },

  moveTabToWorkspace: async (tabId: string, targetWorkspaceId: string) => {
    const { tabs, activeTabId } = get();
    const tabToMove = tabs.find((t) => t.id === tabId);
    if (!tabToMove) return;

    // 1. Remove tab from current editor
    const remainingTabs = tabs.filter((t) => t.id !== tabId);
    let nextActiveId = activeTabId;
    if (activeTabId === tabId) {
      if (remainingTabs.length > 0) {
        nextActiveId = remainingTabs[0].id;
      } else {
        const freshTab = createInitialTab("new 1");
        remainingTabs.push(freshTab);
        nextActiveId = freshTab.id;
      }
    }
    const nextRecent = (get().recentTabIds || []).filter((id) => id !== tabId);
    set({ tabs: remainingTabs, activeTabId: nextActiveId, recentTabIds: nextRecent });
    debouncedSaveSession(remainingTabs, nextActiveId);

    // 2. Append tab to target workspace in workspaceStore
    const wsStore = useWorkspaceStore.getState();
    const targetWs = wsStore.workspaces.find((w) => w.id === targetWorkspaceId);
    if (targetWs) {
      const updatedTargetWs = {
        ...targetWs,
        updatedAt: Date.now(),
        tabs: [...targetWs.tabs, tabToMove],
      };
      await saveWorkspace(updatedTargetWs);
      useWorkspaceStore.setState({
        workspaces: wsStore.workspaces.map((w) =>
          w.id === targetWorkspaceId ? updatedTargetWs : w
        ),
      });
    }
  },

  setActiveTab: (id: string) => {
    const { tabs, activeTabId, recentTabIds } = get();
    const nextRecent = [id, ...(recentTabIds || []).filter((tabId) => tabId !== id)];
    if (id === activeTabId) {
      set({ recentTabIds: nextRecent });
      return;
    }
    set({ activeTabId: id, recentTabIds: nextRecent });
    debouncedSaveSession(tabs, id);
  },

  updateTabContent: (id: string, content: string) => {
    const { tabs, activeTabId } = get();
    const nextTabs = tabs.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          content,
          isModified: content !== t.savedContent,
          lineEnding: detectLineEnding(content),
        };
      }
      return t;
    });
    set({ tabs: nextTabs });
    debouncedSaveSession(nextTabs, activeTabId);
  },

  updateCursorPos: (id: string, pos: CursorPosition) => {
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, cursorPos: pos } : t)),
    }));
  },

  updateTabBookmarks: (id: string, bookmarks: number[]) => {
    const { tabs, activeTabId } = get();
    const nextTabs = tabs.map((t) => (t.id === id ? { ...t, bookmarks } : t));
    set({ tabs: nextTabs });
    debouncedSaveSession(nextTabs, activeTabId);
  },

  reorderTabs: (fromIdx: number, toIdx: number) => {
    const { tabs, activeTabId } = get();
    if (
      fromIdx < 0 ||
      fromIdx >= tabs.length ||
      toIdx < 0 ||
      toIdx >= tabs.length ||
      fromIdx === toIdx
    ) {
      return;
    }

    const sourceTab = tabs[fromIdx];
    const targetTab = tabs[toIdx];

    // Only allow reordering within the same pin group (pinned <-> pinned, unpinned <-> unpinned)
    if (Boolean(sourceTab.isPinned) !== Boolean(targetTab.isPinned)) {
      return;
    }

    const updated = [...tabs];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    set({ tabs: updated });
    debouncedSaveSession(updated, activeTabId);
  },

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
    // Kiểm tra xem file đã mở chưa (trùng tên và dung lượng)
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

    // 1. Synchronously snapshot items if passed as DataTransferItemList or FileList
    const entries: Array<{
      file: File;
      handlePromise?: Promise<FileSystemFileHandle | null>;
    }> = [];

    if (Array.isArray(itemsOrFiles)) {
      entries.push(...itemsOrFiles);
    } else if (
      typeof DataTransferItemList !== "undefined" &&
      itemsOrFiles instanceof DataTransferItemList
    ) {
      for (let i = 0; i < itemsOrFiles.length; i++) {
        const item = itemsOrFiles[i];
        if (item.kind !== "file") continue;
        const file = item.getAsFile();
        if (!file) continue;

        let handlePromise: Promise<FileSystemFileHandle | null> | undefined;
        if (
          "getAsFileSystemHandle" in item &&
          typeof (item as any).getAsFileSystemHandle === "function"
        ) {
          try {
            handlePromise = (item as any)
              .getAsFileSystemHandle()
              .catch(() => null);
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

    // Snapshot files synchronously
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
      // Direct store update fallback
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
    const { tab, remainingClosed } = await RecentFilesService.reopenLastClosedFile();
    set({ closedFilesStack: remainingClosed });
    if (!tab) return;

    const { tabs } = get();
    // If already open, just switch to it
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

    const recents = await RecentFilesService.addRecentFile(entry.handle, entry.name);
    const nextTabs = [...tabs, tab];
    set({ tabs: nextTabs, activeTabId: tab.id, recentFiles: recents });
    debouncedSaveSession(nextTabs, tab.id);
  },

  clearRecentFiles: async () => {
    await RecentFilesService.clearRecentFiles();
    set({ recentFiles: [], closedFilesStack: [] });
  },

  setLanguageForActiveTab: (lang: SupportedLanguage) => {
    const { tabs, activeTabId } = get();
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (!activeTab) return;

    // Xác định extension mới (nếu lang là other/plaintext thì lấy txt)
    const newExt = getDefaultExtensionForLanguage(lang);
    const updatedName = replaceFileExtension(activeTab.name, newExt);
    const updatedPreviewType = getPreviewTypeForLanguage(lang);

    const nextTabs = tabs.map((t) => {
      if (t.id === activeTab.id) {
        return {
          ...t,
          language: lang,
          name: updatedName,
          previewType: updatedPreviewType,
          isModified: true,
        };
      }
      return t;
    });

    set({ tabs: nextTabs });
    debouncedSaveSession(nextTabs, activeTabId);
  },

  convertLineEnding: (tabId: string, target: "CRLF" | "LF") => {
    const { tabs, activeTabId } = get();
    const nextTabs = tabs.map((t) => {
      if (t.id === tabId) {
        const normalized = t.content.replace(/\r\n|\r|\n/g, "\n");
        const converted =
          target === "CRLF" ? normalized.replace(/\n/g, "\r\n") : normalized;
        return {
          ...t,
          content: converted,
          lineEnding: target,
          isModified: converted !== t.savedContent,
        };
      }
      return t;
    });
    set({ tabs: nextTabs });
    debouncedSaveSession(nextTabs, activeTabId);
  },

  setEncodingForActiveTab: (encoding: SupportedEncoding) => {
    const { tabs, activeTabId } = get();
    const nextTabs = tabs.map((t) => {
      if (t.id === activeTabId) {
        // Interpret raw bytes as new encoding if rawBuffer exists
        let newContent = t.content;
        if (t.rawBuffer) {
          newContent = decodeBuffer(t.rawBuffer, encoding);
        }
        return {
          ...t,
          encoding,
          content: newContent,
          isModified: newContent !== t.savedContent || encoding !== t.encoding,
        };
      }
      return t;
    });
    set({ tabs: nextTabs });
    debouncedSaveSession(nextTabs, activeTabId);
  },

  convertEncodingForActiveTab: (encoding: SupportedEncoding) => {
    const { tabs, activeTabId } = get();
    const nextTabs = tabs.map((t) => {
      if (t.id === activeTabId) {
        // Keep visible text identical, update target encoding for disk save
        const encoded = encodeString(t.content, encoding);
        return {
          ...t,
          encoding,
          rawBuffer: encoded,
          isModified: true, // marked modified to prompt save
        };
      }
      return t;
    });
    set({ tabs: nextTabs });
    debouncedSaveSession(nextTabs, activeTabId);
  },

  insertDateTime: (tabId: string, format: "short" | "long" = "short") => {
    const now = new Date();
    const text =
      format === "short"
        ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
          " " +
          now.toLocaleDateString()
        : now.toLocaleString();
    const { tabs, activeTabId } = get();
    const nextTabs = tabs.map((t) => {
      if (t.id === tabId) {
        let updated: string;
        // If cursor line/col exists, insert at that position
        if (t.cursorPos && t.cursorPos.line > 0) {
          const lines = t.content.split("\n");
          const lineIdx = Math.min(
            Math.max(0, t.cursorPos.line - 1),
            lines.length - 1,
          );
          const lineStr = lines[lineIdx] ?? "";
          const colIdx = Math.min(
            Math.max(0, t.cursorPos.col - 1),
            lineStr.length,
          );
          lines[lineIdx] =
            lineStr.slice(0, colIdx) + text + lineStr.slice(colIdx);
          updated = lines.join("\n");
        } else {
          updated =
            t.content +
            (t.content.endsWith("\n") || t.content === "" ? "" : "\n") +
            text +
            "\n";
        }
        return {
          ...t,
          content: updated,
          isModified: true,
        };
      }
      return t;
    });
    set({ tabs: nextTabs });
    debouncedSaveSession(nextTabs, activeTabId);
  },

  checkActiveTabExternalChanges: async () => {
    const { tabs, activeTabId, externalAlert } = get();
    if (externalAlert) return;

    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (!activeTab || !activeTab.fileHandle) return;

    const event = await checkExternalFileChanges(activeTab);
    if (event.type === "DELETED") {
      set({
        externalAlert: {
          tabId: activeTab.id,
          filename: activeTab.name,
          type: "DELETED",
        },
      });
    } else if (event.type === "MODIFIED_EXTERNALLY") {
      set({
        externalAlert: {
          tabId: activeTab.id,
          filename: activeTab.name,
          type: "MODIFIED_EXTERNALLY",
          newContent: event.newContent,
          diskLastModified: event.diskLastModified,
        },
      });
    }
  },

  handleExternalKeepContent: (tabId: string) => {
    const { tabs, activeTabId } = get();
    const nextTabs = tabs.map((t) => {
      if (t.id === tabId) {
        return {
          ...t,
          fileHandle: undefined,
          isModified: true,
        };
      }
      return t;
    });
    set({ tabs: nextTabs, externalAlert: null });
    debouncedSaveSession(nextTabs, activeTabId);
  },

  handleExternalCloseTab: (tabId: string) => {
    get().closeTab(tabId);
    set({ externalAlert: null });
  },

  handleExternalReloadDisk: (
    tabId: string,
    newContent: string,
    diskLastModified: number,
  ) => {
    const { tabs, activeTabId } = get();
    const nextTabs = tabs.map((t) => {
      if (t.id === tabId) {
        return {
          ...t,
          content: newContent,
          savedContent: newContent,
          fileLastModified: diskLastModified,
          isModified: false,
        };
      }
      return t;
    });
    set({ tabs: nextTabs, externalAlert: null });
    debouncedSaveSession(nextTabs, activeTabId);
  },

  handleExternalKeepMyChanges: (tabId: string) => {
    const { tabs, activeTabId } = get();
    const nextTabs = tabs.map((t) => {
      if (t.id === tabId) {
        return {
          ...t,
          fileLastModified: Date.now(),
        };
      }
      return t;
    });
    set({ tabs: nextTabs, externalAlert: null });
    debouncedSaveSession(nextTabs, activeTabId);
  },

  clearExternalAlert: () => {
    set({ externalAlert: null });
  },

  setPreviewMode: (mode: PreviewMode) => {
    set({ previewMode: mode });
  },

  toggleSearch: (show?: boolean) => {
    set((state) => ({
      isSearching: typeof show === "boolean" ? show : !state.isSearching,
    }));
  },

  setTheme: (theme: ThemeMode) => {
    set((state) => {
      const nextSettings = { ...state.settings, theme };
      debouncedSaveSettings(nextSettings);
      return { settings: nextSettings };
    });
    localStorage.setItem("theme-mode", theme);
    applyThemeToDOM(theme);
  },

  setFontSize: (delta: number) => {
    set((state) => {
      const newSize = Math.max(
        10,
        Math.min(32, state.settings.fontSize + delta),
      );
      const nextSettings = { ...state.settings, fontSize: newSize };
      debouncedSaveSettings(nextSettings);
      return { settings: nextSettings };
    });
  },

  resetFontSize: () => {
    set((state) => {
      const nextSettings = { ...state.settings, fontSize: 14 };
      debouncedSaveSettings(nextSettings);
      return { settings: nextSettings };
    });
  },

  toggleToolbar: () => {
    set((state) => {
      const nextSettings = {
        ...state.settings,
        showToolbar: !state.settings.showToolbar,
      };
      debouncedSaveSettings(nextSettings);
      return { settings: nextSettings };
    });
  },

  toggleStatusBar: () => {
    set((state) => {
      const nextSettings = {
        ...state.settings,
        showStatusBar: !state.settings.showStatusBar,
      };
      debouncedSaveSettings(nextSettings);
      return { settings: nextSettings };
    });
  },

  toggleTabBar: () => {
    set((state) => {
      const nextSettings = {
        ...state.settings,
        showTabBar: !state.settings.showTabBar,
      };
      debouncedSaveSettings(nextSettings);
      return { settings: nextSettings };
    });
  },

  toggleLineWrapping: () => {
    set((state) => {
      const nextSettings = {
        ...state.settings,
        lineWrapping: !state.settings.lineWrapping,
      };
      debouncedSaveSettings(nextSettings);
      return { settings: nextSettings };
    });
  },

  toggleLineNumbers: () => {
    set((state) => {
      const nextSettings = {
        ...state.settings,
        showLineNumbers: !state.settings.showLineNumbers,
      };
      debouncedSaveSettings(nextSettings);
      return { settings: nextSettings };
    });
  },

  toggleWhitespace: () => {
    set((state) => {
      const nextSettings = {
        ...state.settings,
        showWhitespace: !state.settings.showWhitespace,
      };
      debouncedSaveSettings(nextSettings);
      return { settings: nextSettings };
    });
  },

  setPreviewRatio: (ratio: number) => {
    const clamped = Math.max(0.2, Math.min(0.8, ratio));
    set((state) => {
      const nextSettings = { ...state.settings, previewWidthRatio: clamped };
      debouncedSaveSettings(nextSettings);
      return { settings: nextSettings };
    });
  },

  updateSettings: (partial: Partial<EditorSettings>) => {
    set((state) => {
      const nextSettings = { ...state.settings, ...partial };
      debouncedSaveSettings(nextSettings);
      if (partial.theme) {
        localStorage.setItem("theme-mode", partial.theme);
        applyThemeToDOM(partial.theme);
      }
      return { settings: nextSettings };
    });
  },
}));

function readFileAsDataURLHelper(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
