import type {
  EditorSettings,
  FileTab,
  TabGroup,
} from "../../../core/types/file.types";
import { WELCOME_MD_CONTENT } from "../../../core/data/defaultDocuments";
import { saveSessionTabs, saveSettings } from "../../../core/utils/idbStorage";
import { useWorkspaceStore } from "../../workspace/store/workspaceStore";

export const DEFAULT_SETTINGS: EditorSettings = {
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
  previewPerfPreset: "balanced",
};

export function createInitialTab(name = "welcome.md"): FileTab {
  const initialContent = name === "welcome.md" ? WELCOME_MD_CONTENT : "";

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

let saveSettingsTimeout: ReturnType<typeof setTimeout> | null = null;
export function debouncedSaveSettings(settings: EditorSettings): void {
  if (saveSettingsTimeout) clearTimeout(saveSettingsTimeout);
  saveSettingsTimeout = setTimeout(() => {
    void saveSettings(settings);
  }, 500);
}

let saveSessionTimeout: ReturnType<typeof setTimeout> | null = null;
export function cancelPendingSessionSave(): void {
  if (saveSessionTimeout) {
    clearTimeout(saveSessionTimeout);
    saveSessionTimeout = null;
  }
}

export function debouncedSaveSession(
  tabs: FileTab[],
  activeTabId: string | null,
  tabGroups?: TabGroup[],
): void {
  if (saveSessionTimeout) clearTimeout(saveSessionTimeout);
  saveSessionTimeout = setTimeout(() => {
    void saveSessionTabs(tabs, activeTabId, tabGroups);
    void useWorkspaceStore.getState().saveCurrentWorkspaceState();
  }, 1000);
}

export function readFileAsDataURLHelper(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
