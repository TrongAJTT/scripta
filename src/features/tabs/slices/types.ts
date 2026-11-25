import type { StateCreator } from "zustand";
import type {
  FileTab,
  PreviewMode,
  ThemeMode,
  EditorSettings,
  CursorPosition,
  SupportedLanguage,
  RecentFileEntry,
  DroppedFileItem,
  TabGroup,
  TabGroupColor,
} from "../../../core/types/file.types";
import type { ExternalAlertData } from "../../editor/components/ExternalFileAlertModal";
import type { SupportedEncoding } from "../../../core/utils/encodingUtils";

export interface TabsSlice {
  tabs: FileTab[];
  tabGroups: TabGroup[];
  activeTabId: string | null;
  recentTabIds: string[];
  activeCursorPos: CursorPosition;

  createTab: (name?: string, content?: string, lang?: string) => void;
  createTabGroup: (
    name: string,
    color: TabGroupColor,
    initialTabId?: string,
  ) => string;
  assignTabToGroup: (tabId: string, groupId: string | null) => void;
  updateTabGroup: (
    groupId: string,
    patch: Partial<Pick<TabGroup, "name" | "color" | "collapsed">>,
  ) => void;
  toggleTabGroupCollapse: (groupId: string) => void;
  ungroupTabGroup: (groupId: string) => void;
  closeTabGroup: (groupId: string) => Promise<void>;
  createTabInGroup: (groupId: string) => void;
  closeTab: (id: string) => void;
  closeOtherTabs: (id: string) => Promise<void>;
  closeToRightTabs: (id: string) => Promise<void>;
  closeSavedTabs: () => void;
  closeAllTabs: () => void;
  closeAllTabsWithPrompt: () => Promise<void>;
  togglePinTab: (id: string) => void;
  toggleLockTab: (id: string) => void;
  renameTab: (id: string, newName: string) => void;
  moveTabToWorkspace: (
    tabId: string,
    targetWorkspaceId: string,
  ) => Promise<void>;
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
}

export interface FileIoSlice {
  recentFiles: RecentFileEntry[];
  closedFilesStack: RecentFileEntry[];
  flushCurrentTabContent?: () => void;

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
  reopenClosedFile: () => Promise<void>;
  openRecentFile: (entry: RecentFileEntry) => Promise<void>;
  clearRecentFiles: () => Promise<void>;
}

export interface ExternalWatcherSlice {
  externalAlert: ExternalAlertData | null;

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
}

export interface SettingsViewSlice {
  previewMode: PreviewMode;
  isSearching: boolean;
  settings: EditorSettings;
  bypassedPreviewTabIds: string[];

  initStore: () => Promise<void>;
  bypassPreviewThreshold: (tabId: string) => void;
  resetBypassedPreviewThreshold: (tabId?: string) => void;
  setPreviewMode: (mode: PreviewMode) => void;
  toggleSearch: (show?: boolean) => void;

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

export type EditorState = TabsSlice &
  FileIoSlice &
  ExternalWatcherSlice &
  SettingsViewSlice;

export type EditorSliceCreator<T> = StateCreator<EditorState, [], [], T>;
