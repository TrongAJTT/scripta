# Commit Summary

> [!IMPORTANT]
> This document records the commit message and detailed change log for the **current staged commit**.
> Prior to creating any new commit, the contents below MUST be **COMPLETELY REWRITTEN** to reflect only the changes belonging to that specific commit, rather than appending new entries.

## 📌 Commit Message

```text
feat: publish Scripta v1.1.4

- Core Architecture & Engine:
  - Vite 8 + React 19 + TypeScript strict mode with CodeMirror 6 text editor.
  - Multi-tab management with persistent IndexedDB session recovery, tab pinning, locking, and tab reordering.
  - Native File System Access API integration with fallback download handlers and external file change detection.
- Live Previews & Adapters:
  - Real-time Markdown rendering with DOMPurify sanitization.
  - Interactive Mermaid.js diagrams with vector SVG export.
  - Live HTML/CSS runner, Vector SVG viewer, Image inspector, and in-browser Python (Pyodide WASM).
- v1.1.4 Feature Additions:
  - Line Bookmarks: CodeMirror 6 custom gutter markers, keyboard shortcuts (Ctrl+F2, F2, Shift+F2), and unified BookmarkMenuItems component.
  - Dual-Zone Drag & Drop: Side-by-side overlay to Open as New Tab(s) or Append to Cursor without sticky hover bugs.
  - Reopen Closed Files: Closed files stack and Recent Files Service backed by IndexedDB.
- Scripting & Automation:
  - Client-side Web Worker script execution engine with JSON Mode Editor, sample data runner, and macro templates.
- Workspaces & Settings:
  - Multi-workspace isolated session management.
  - Comprehensive shortcut mapper, centralized command registry, encoding converter, and zero-FOUC theme presets.
```

---

## 📝 Detailed Change Log

### 1. Editor Core & Line Bookmarks (`src/features/editor/`)

- [bookmarkExtension.ts](file:///g:/TextEditor/src/features/editor/services/bookmarkExtension.ts): Custom CodeMirror 6 gutter marker, position mapping through document changes, and line jumper helpers (`Ctrl+F2`, `F2`, `Shift+F2`).
- [BookmarkMenuItems.tsx](file:///g:/TextEditor/src/features/editor/components/BookmarkMenuItems.tsx): Reusable, DRY menu component for bookmarks across `MenuBar` and `Toolbar`.
- [CodeEditor.tsx](file:///g:/TextEditor/src/features/editor/components/CodeEditor.tsx): Compartmentalized CodeMirror view supporting syntax highlighting, theme switching, whitespace rendering, dynamic line numbers, and session bookmark syncing.

### 2. File Operations & Dual-Zone Drag & Drop (`src/features/file-system/`, `src/features/tabs/`)

- [store.ts](file:///g:/TextEditor/src/features/tabs/store.ts): Multi-tab state management with dual-zone drag handlers (`Open as New Tab` vs `Append to Active Tab`), tab pinning/locking, and debounced IndexedDB autosave.
- [recentFilesService.ts](file:///g:/TextEditor/src/features/file-system/services/recentFilesService.ts): Recent files tracking and `reopenClosedFile` stack (`Ctrl+Shift+T`).
- [fileSystemApi.ts](file:///g:/TextEditor/src/features/file-system/data/fileSystemApi.ts): File System Access API wrapper with graceful cross-browser fallback.

### 3. Live Previews (`src/features/preview/`)

- Multi-format preview adapters: Markdown, Mermaid diagrams, HTML, CSS, Vector SVG, Raster images, and Python execution via WebAssembly Pyodide.

### 4. Workspaces & Script Automation (`src/features/workspace/`, `src/features/scripts/`)

- Workspace switcher and session organizer in IndexedDB.
- Script runner executing JavaScript batch transformations safely inside sandboxed Web Workers.

### 5. Application Infrastructure & Distribution (`.github/`, root)

- [release.yml](file:///g:/TextEditor/.github/workflows/release.yml): Automated GitHub release workflow packaging standalone `scripta-v*.zip` with SHA256 checksums and Sigstore provenance attestations.
- [README.md](file:///g:/TextEditor/README.md): Polished project documentation with hero preview banner, feature matrix, and keyboard shortcut reference.
- [package.json](file:///g:/TextEditor/package.json): Version 1.1.4 with Apache-2.0 license.
