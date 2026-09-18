# Commit Summary

> [!IMPORTANT]
> This document records the commit message and detailed change log for the **current staged commit**.
> Prior to creating any new commit, the contents below MUST be **COMPLETELY REWRITTEN** to reflect only the changes belonging to that specific commit, rather than appending new entries.

## 📌 Commit Message

```text
feat(editor): add line bookmarks with CodeMirror 6 gutter markers, shortcuts, and UI controls

- Implement CodeMirror 6 bookmark extension:
  - Custom GutterMarker rendering ribbon bookmark icon with accent theme styling.
  - Position mapping via tr.changes automatically retains bookmark line references when editing text.
  - Line decoration highlighting bookmarked rows with subtle accent background.
  - Direct gutter click interaction to toggle bookmarks.
- Register Bookmark commands & shortcuts:
  - Ctrl+F2: Toggle Bookmark at cursor position.
  - F2: Navigate to Next Bookmark.
  - Shift+F2: Navigate to Previous Bookmark.
  - Ctrl+Shift+F2: Clear All Bookmarks in active file.
- UI Controls Integration:
  - File Menu: Added Bookmarks submenu with quick actions and scrollable bookmarked lines list.
  - Desktop Toolbar (Right Cluster): Added Bookmarks dropdown button with live count badge and jump-to-line selector.
  - Mobile Toolbar: Added Bookmarks accordion submenu to More menu.
```

---

## 📝 Detailed Change Log

### 1. CodeMirror 6 Bookmark Extension (`src/features/editor/services/`)
- Created [bookmarkExtension.ts](file:///g:/TextEditor/src/features/editor/services/bookmarkExtension.ts):
  - `BookmarkGutterMarker`: Custom gutter marker with SVG bookmark icon and tooltip.
  - `bookmarkStateField`: `StateField<RangeSet<GutterMarker>>` managing bookmark positions and mapping changes through document transactions.
  - `bookmarkLineHighlightField`: Line decoration providing subtle row background highlight for bookmarked lines.
  - `bookmarkGutter`: Gutter component attached next to line numbers with click event to toggle bookmarks.
  - Navigation & inspection helpers: `toggleBookmarkAtCursor`, `jumpToNextBookmark`, `jumpToPrevBookmark`, `jumpToLine`, `clearAllBookmarks`, `getBookmarkedLines`.
- Integrated extension into [CodeEditor.tsx](file:///g:/TextEditor/src/features/editor/components/CodeEditor.tsx).
- Added `.cm-bookmark-gutter` and `.cm-bookmarked-line` styling in [index.css](file:///g:/TextEditor/src/index.css).

### 2. Command Registry & Centralized Shortcuts (`src/core/commands/`, `src/App.tsx`)
- Added `file.toggleBookmark`, `file.nextBookmark`, `file.prevBookmark`, and `file.clearBookmarks` to `CommandId` in [types.ts](file:///g:/TextEditor/src/core/commands/types.ts).
- Registered all 4 commands in [registry.ts](file:///g:/TextEditor/src/core/commands/registry.ts) with standard keybindings (`Ctrl+F2`, `F2`, `Shift+F2`, `Ctrl+Shift+F2`).
- Bound commands in centralized keydown listener in [App.tsx](file:///g:/TextEditor/src/App.tsx).

### 3. Editor Commands Hook (`src/features/editor/hooks/useEditorCommands.ts`)
- Exposed `toggleBookmark`, `nextBookmark`, `prevBookmark`, `clearBookmarks`, `jumpToBookmark`, and `getBookmarks` from `useEditorCommands`.

### 4. UI Integration (`src/app/layout/MenuBar.tsx`, `src/features/editor/components/Toolbar.tsx`)
- Menu Bar `[File]`: Added **Bookmarks** submenu containing toggle, next, previous, clear, and interactive list of bookmarked lines with text snippets.
- Desktop Toolbar: Added Bookmark button in right controls cluster (beside Lock and Workspace) featuring real-time bookmark count badge and jump-to-line dropdown.
- Mobile Toolbar: Added Bookmarks submenu within mobile More dropdown.
