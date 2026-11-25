import type {
  EditorSettings,
  FileTab,
  PreviewMode,
  ThemeMode,
} from "../../../core/types/file.types";
import { loadSessionTabs, loadSettings } from "../../../core/utils/idbStorage";
import { RecentFilesService } from "../../file-system/services/recentFilesService";
import { applyThemeToDOM } from "../../settings/services/themeService";
import {
  DEFAULT_SETTINGS,
  createInitialTab,
  debouncedSaveSettings,
} from "./sessionHelpers";
import type { EditorSliceCreator, SettingsViewSlice } from "./types";

export const createSettingsViewSlice: EditorSliceCreator<SettingsViewSlice> = (
  set,
) => ({
  previewMode: "split",
  isSearching: false,
  settings: DEFAULT_SETTINGS,
  bypassedPreviewTabIds: [],

  bypassPreviewThreshold: (tabId: string) => {
    set((state) => ({
      bypassedPreviewTabIds: state.bypassedPreviewTabIds.includes(tabId)
        ? state.bypassedPreviewTabIds
        : [...state.bypassedPreviewTabIds, tabId],
    }));
  },

  resetBypassedPreviewThreshold: (tabId?: string) => {
    set((state) => ({
      bypassedPreviewTabIds: tabId
        ? state.bypassedPreviewTabIds.filter((id) => id !== tabId)
        : [],
    }));
  },

  initStore: async () => {
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
      applyThemeToDOM("dark");
    }

    try {
      const recents = await RecentFilesService.init();
      set({ recentFiles: recents });
    } catch (e) {
      console.warn("Failed to load recent files during initStore", e);
    }

    const saved = await loadSessionTabs();
    if (saved && saved.tabs && saved.tabs.length > 0) {
      const restoredTabs: FileTab[] = saved.tabs.map((t) => ({
        ...t,
        isModified: t.content !== t.savedContent,
      }));
      const activeGroupIds = new Set(
        restoredTabs
          .map((t) => t.groupId)
          .filter((id): id is string => Boolean(id)),
      );
      const restoredGroups = (saved.tabGroups || []).filter((g) =>
        activeGroupIds.has(g.id),
      );
      const restoredActiveId =
        saved.activeTabId &&
        restoredTabs.some((x) => x.id === saved.activeTabId)
          ? saved.activeTabId
          : restoredTabs[0].id;
      const targetTab = restoredTabs.find((x) => x.id === restoredActiveId);
      set({
        tabs: restoredTabs,
        tabGroups: restoredGroups,
        activeTabId: restoredActiveId,
        recentTabIds: [restoredActiveId],
        activeCursorPos: targetTab?.cursorPos || {
          line: 1,
          col: 1,
          selectedChars: 0,
        },
      });
    } else {
      const defaultTab = createInitialTab("welcome.md");
      set({
        tabs: [defaultTab],
        activeTabId: defaultTab.id,
        recentTabIds: [defaultTab.id],
        activeCursorPos: defaultTab.cursorPos || {
          line: 1,
          col: 1,
          selectedChars: 0,
        },
      });
    }
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
});
