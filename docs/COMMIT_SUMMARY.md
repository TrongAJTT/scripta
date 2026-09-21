# Commit Summary

> [!IMPORTANT]
> This document records the commit message and detailed change log for the **current staged commit**.
> Prior to creating any new commit, the contents below MUST be **COMPLETELY REWRITTEN** to reflect only the changes belonging to that specific commit, rather than appending new entries.

## 📌 Commit Message

```text
perf(editor): optimize large-file performance and eliminate input lag

- Implement 300ms debounce on document content synchronization to Zustand store to prevent large string allocations and React tree re-renders on every keystroke.
- Separate `activeCursorPos` in EditorState and mutate `tab.cursorPos` in-place, preserving `tabs` array reference stability and eliminating keystroke re-renders in TabBar and App.
- Add zero-data-loss content flush on tab switch/unmount, Ctrl+S, and global save actions (MenuBar, Toolbar, Command Palette).
- Guard CodeEditor against internal echo updates via `lastSyncedContentRef`.
- Compute status bar lines and length in O(1) from CodeMirror document state, and memoize byte size calculation.
```

---

## 📝 Detailed Change Log

### Fix 4 bottlenecks:

- **doc.toString() 3.8MB + detectLineEnding() every keystroke (highest):** Debounce 300ms content sync
- **StatusBar: split('\n') + new Blob() every render (High)**: Read from EditorView.state.doc (O(1) B-Tree)
- **TabBar + App re-render due to s.tabs contains content (High)**: useShallow + narrow selector
- **detectLineEnding() called redundant in store (Medium)**: Skip if content unchanged

### 1. Editor Types (`src/core/types/`)

- [file.types.ts](file:///g:/TextEditor/src/core/types/file.types.ts): Added optional `linesCount` and `charsCount` to `CursorPosition` interface so CodeMirror can pass $O(1)$ document metrics directly without string scanning.

### 2. Tab & Editor State Management (`src/features/tabs/`)

- [store.ts](file:///g:/TextEditor/src/features/tabs/store.ts):
  - Added `activeCursorPos` and `flushCurrentTabContent` to `EditorState`.
  - Updated `updateCursorPos` to update `tab.cursorPos` in-place and only publish `activeCursorPos`, preserving the `state.tabs` array reference on every keystroke/arrow navigation.
  - Initialized `activeCursorPos` properly during `initStore` and `setActiveTab`.
  - Added early exit in `updateTabContent` when content is unchanged.
  - Added synchronous call to `flushCurrentTabContent()` in `saveCurrentTab` and `saveCurrentTabAs` before writing files to ensure no un-synced keystrokes are lost.

### 3. Editor Core & Performance Lifecycle (`src/features/editor/`)

- [CodeEditor.tsx](file:///g:/TextEditor/src/features/editor/components/CodeEditor.tsx):
  - Introduced `syncContentTimeoutRef` (300ms debounce) for document syncing into Zustand store, keeping high-frequency typing operations entirely within CodeMirror's in-memory B-tree.
  - Implemented `flushDoc` to synchronously flush pending edits before tab switch/component unmount or upon `Mod-s` (Ctrl+S).
  - Registered `flushCurrentTabContent` in the Zustand store on mount and cleaned up on unmount.
  - Tracked `lastSyncedContentRef` to eliminate redundant re-dispatch cycles when `content` prop echoes back from the store.
  - Forwarded `linesCount` and `charsCount` in $O(1)$ from `update.state.doc` via `updateCursorPos`.

### 4. Status Bar Optimization (`src/features/editor/`)

- [StatusBar.tsx](file:///g:/TextEditor/src/features/editor/components/StatusBar.tsx):
  - Subscribed to `s.activeCursorPos` instead of pulling cursor position from `tabs`.
  - Derived `linesCount` and `charsCount` directly from `cursorPos` in $O(1)$, completely removing `content.split("\n")` calls on every render.
  - Memoized `byteSize` using `useMemo` based on `activeTab?.content`, preventing repetitive `new Blob` allocations on cursor movements.
