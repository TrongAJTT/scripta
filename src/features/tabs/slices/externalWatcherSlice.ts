import { checkExternalFileChanges } from "../../file-system/data/fileWatcher";
import { debouncedSaveSession } from "./sessionHelpers";
import type { EditorSliceCreator, ExternalWatcherSlice } from "./types";

export const createExternalWatcherSlice: EditorSliceCreator<
  ExternalWatcherSlice
> = (set, get) => ({
  externalAlert: null,

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
});
