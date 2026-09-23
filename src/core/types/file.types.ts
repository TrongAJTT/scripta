export type SupportedLanguage =
  | "plaintext"
  | "markdown"
  | "javascript"
  | "typescript"
  | "html"
  | "css"
  | "json"
  | "python"
  | "svg"
  | "xml"
  | "yaml"
  | "sql"
  | "mermaid"
  | "other";

export type PreviewType =
  | "markdown"
  | "mermaid"
  | "svg"
  | "image"
  | "html"
  | "console"
  | "text"
  | "json"
  | "css"
  | "none";

export type PreviewMode = "auto" | "split" | "editor-only" | "preview-only";

export interface CursorPosition {
  line: number;
  col: number;
  selectedChars: number;
  linesCount?: number;
  charsCount?: number;
}

import type { SupportedEncoding } from "../utils/encodingUtils";

export interface FileTab {
  id: string;
  name: string;
  content: string;
  savedContent: string;
  language: SupportedLanguage;
  fileHandle?: FileSystemFileHandle;
  cursorPos?: CursorPosition;
  isModified: boolean;
  encoding: SupportedEncoding;
  rawBuffer?: Uint8Array;
  lineEnding: "LF" | "CRLF";
  lastSavedAt?: number;
  fileLastModified?: number; // Timestamp sửa đổi cuối trên ổ cứng để so sánh
  previewType?: PreviewType;
  imageDataUrl?: string; // Nếu mở file ảnh
  isPinned?: boolean; // Tab được ghim
  isLocked?: boolean; // Tab bị khóa (read-only)
  bookmarks?: number[]; // Danh sách các dòng được đánh dấu (1-based)
}

export type ThemeMode = "dark" | "light" | "system";

export type MermaidTheme = "auto" | "dark" | "default" | "forest" | "neutral";

export type TabBarPosition = "top" | "left" | "right";

export type TabIconTheme = "vibrant" | "accent" | "monochrome" | "pastel";

export type JsonTheme = "default" | "onedark" | "dracula" | "monokai" | "nord";

export type PreviewPerformancePreset =
  | "eco"
  | "balanced"
  | "performance"
  | "unlimited";

export interface EditorSettings {
  theme: ThemeMode;
  fontSize: number;
  tabSize: number;
  lineWrapping: boolean;
  minimap: boolean;
  autoSave: boolean;
  previewWidthRatio: number; // Ratio of split pane width (e.g. 0.5)
  tabBarPosition: TabBarPosition;
  showToolbar: boolean;
  showStatusBar: boolean;
  showTabBar: boolean;
  showLineNumbers: boolean;
  showWhitespace: boolean;
  autoCheckUpdates?: boolean;
  checkUpdateInterval?: number; // In hours: 0 (manual), 1, 3, 24
  mermaidTheme?: MermaidTheme;
  tabIconTheme?: TabIconTheme;
  jsonTheme?: JsonTheme;
  previewPerfPreset?: PreviewPerformancePreset;
}

export interface RecentFileEntry {
  name: string;
  handle: FileSystemFileHandle;
  lastOpenedAt: number;
}

export interface DroppedFileItem {
  file: File;
  handlePromise?: Promise<FileSystemFileHandle | null>;
}
