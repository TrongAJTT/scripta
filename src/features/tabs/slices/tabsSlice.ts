import type {
  CursorPosition,
  FileTab,
  SupportedLanguage,
} from "../../../core/types/file.types";
import {
  detectLanguageFromFilename,
  detectLineEnding,
  getDefaultExtensionForLanguage,
  replaceFileExtension,
  getPreviewTypeForLanguage,
} from "../../../core/utils/fileDetection";
import {
  decodeBuffer,
  encodeString,
  type SupportedEncoding,
} from "../../../core/utils/encodingUtils";
import { saveWorkspace } from "../../../core/utils/idbStorage";
import { RecentFilesService } from "../../file-system/services/recentFilesService";
import { usePreviewSessionStore } from "../../preview/store/previewSessionStore";
import { useWorkspaceStore } from "../../workspace/store/workspaceStore";
import { dialog, type ConfirmResult } from "../../../shared/dialog/dialogStore";
import { createInitialTab, debouncedSaveSession } from "./sessionHelpers";
import type { EditorSliceCreator, TabsSlice } from "./types";

export const createTabsSlice: EditorSliceCreator<TabsSlice> = (set, get) => ({
  tabs: [],
  activeTabId: null,
  recentTabIds: [],
  activeCursorPos: { line: 1, col: 1, selectedChars: 0 },

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
    const nextRecent = [
      newTab.id,
      ...(get().recentTabIds || []).filter((id) => id !== newTab.id),
    ];
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
      if (
        nextRecent.length > 0 &&
        nextTabs.some((t) => t.id === nextRecent[0])
      ) {
        nextActiveId = nextRecent[0];
      } else if (nextTabs.length > 0) {
        const newIdx = Math.min(targetIdx, nextTabs.length - 1);
        nextActiveId = nextTabs[newIdx].id;
      } else {
        // Auto-create a fresh tab when closing the last tab
        const freshTab = createInitialTab("new 1");
        nextTabs.push(freshTab);
        nextActiveId = freshTab.id;
        nextRecent.push(freshTab.id);
      }
    }

    set((state) => ({
      tabs: nextTabs,
      activeTabId: nextActiveId,
      recentTabIds: nextRecent,
      bypassedPreviewTabIds: state.bypassedPreviewTabIds.filter(
        (tid) => tid !== id,
      ),
    }));
    // Clean up in-memory preview session (sort, page, filter, mergedView) for the closed tab
    usePreviewSessionStore.getState().clearSession(id);
    debouncedSaveSession(nextTabs, nextActiveId);
  },

  renameTab: (id: string, newName: string) => {
    const { tabs, activeTabId } = get();
    const updated = tabs.map((t) =>
      t.id === id ? { ...t, name: newName } : t,
    );
    set({ tabs: updated });
    debouncedSaveSession(updated, activeTabId);
  },

  togglePinTab: (id: string) => {
    const { tabs, activeTabId } = get();
    const updated = tabs.map((t) =>
      t.id === id ? { ...t, isPinned: !t.isPinned } : t,
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
      t.id === id ? { ...t, isLocked: !t.isLocked } : t,
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
    const nextRecent = [
      id,
      ...keep.filter((t) => t.id !== id).map((t) => t.id),
    ];
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

    const nextRecent = (get().recentTabIds || []).filter(
      (tid) => !rightTabIds.has(tid),
    );
    set({ tabs: keep, activeTabId: nextActiveId, recentTabIds: nextRecent });
    debouncedSaveSession(keep, nextActiveId);
  },

  closeSavedTabs: () => {
    const { tabs, activeTabId } = get();
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
    const nextRecent = (get().recentTabIds || []).filter((tid) =>
      keepIds.has(tid),
    );
    set({ tabs: keep, activeTabId: nextActiveId, recentTabIds: nextRecent });
    debouncedSaveSession(keep, nextActiveId);
  },

  closeAllTabs: () => {
    const freshTab = createInitialTab("new 1");
    set({
      tabs: [freshTab],
      activeTabId: freshTab.id,
      recentTabIds: [freshTab.id],
    });
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
      const keep = tabs.filter((t) => t.isModified);
      let nextActiveId = keep[0]?.id;
      if (keep.length === 0) {
        const freshTab = createInitialTab("new 1");
        keep.push(freshTab);
        nextActiveId = freshTab.id;
      }
      const keepIds = new Set(keep.map((t) => t.id));
      const nextRecent = (get().recentTabIds || []).filter((tid) =>
        keepIds.has(tid),
      );
      set({ tabs: keep, activeTabId: nextActiveId, recentTabIds: nextRecent });
      debouncedSaveSession(keep, nextActiveId);
    }
  },

  moveTabToWorkspace: async (tabId: string, targetWorkspaceId: string) => {
    const { tabs, activeTabId } = get();
    const tabToMove = tabs.find((t) => t.id === tabId);
    if (!tabToMove) return;

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
    set({
      tabs: remainingTabs,
      activeTabId: nextActiveId,
      recentTabIds: nextRecent,
    });
    debouncedSaveSession(remainingTabs, nextActiveId);

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
          w.id === targetWorkspaceId ? updatedTargetWs : w,
        ),
      });
    }
  },

  setActiveTab: (id: string) => {
    const { tabs, activeTabId, recentTabIds } = get();
    const nextRecent = [
      id,
      ...(recentTabIds || []).filter((tabId) => tabId !== id),
    ];
    if (id === activeTabId) {
      set({ recentTabIds: nextRecent });
      return;
    }
    const targetTab = tabs.find((t) => t.id === id);
    set({
      activeTabId: id,
      recentTabIds: nextRecent,
      activeCursorPos: targetTab?.cursorPos || {
        line: 1,
        col: 1,
        selectedChars: 0,
      },
    });
    debouncedSaveSession(tabs, id);
  },

  updateTabContent: (id: string, content: string) => {
    const { tabs, activeTabId } = get();
    const currentTab = tabs.find((t) => t.id === id);
    if (currentTab && currentTab.content === content) return;

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
    const { tabs } = get();
    const tab = tabs.find((t) => t.id === id);
    if (tab) {
      tab.cursorPos = pos;
    }
    set({ activeCursorPos: pos });
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

  setLanguageForActiveTab: (lang: SupportedLanguage) => {
    const { tabs, activeTabId } = get();
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (!activeTab) return;

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
        const encoded = encodeString(t.content, encoding);
        return {
          ...t,
          encoding,
          rawBuffer: encoded,
          isModified: true,
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
});
