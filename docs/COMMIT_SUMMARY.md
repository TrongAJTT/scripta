# Commit Summary

> [!IMPORTANT]
> This document records the commit message and detailed change log for the **current staged commit**.
> Prior to creating any new commit, the contents below MUST be **COMPLETELY REWRITTEN** to reflect only the changes belonging to that specific commit, rather than appending new entries.

## 📌 Commit Message

```text
feat(editor): implement Go To dialog with Line, Offset, and Bookmark navigation

- Introduce GoToModal supporting 3 distinct navigation tabs (Line, Offset, Bookmark) with instant Enter confirmation.
- Register `edit.goTo` command with default `Ctrl+G` shortcut and integrate into Edit menu.
- Support Alt+1/2/3 for rapid tab switching and provide a global info help dialog via Header trailing action.
- Add `goToLine`, `goToOffset`, and `getCurrentPosition` navigation operations to `useEditorCommands`.
- Enhance `ModalWrapper` to accept customizable container height classes for compact dialog layouts.
```

---

## 📝 Detailed Change Log

### 1. Navigation Modal & Shared Infrastructure (`src/features/editor/components/`, `src/shared/components/`)

- [GoToModal.tsx](file:///g:/TextEditor/src/features/editor/components/GoToModal.tsx):
  - Created a responsive navigation dialog with 3 tabs:
    - **Line (`Alt+1`)**: Shows current line/column, input field with auto-focus & select, and maximum document line limit.
    - **Offset (`Alt+2`)**: Shows current character offset, target numeric input, and total document length.
    - **Bookmark (`Alt+3`)**: Displays active bookmark count badge, keyboard-navigable (`Up`/`Down`/`Enter`) list with line numbers and preview snippets, plus a helpful empty state when no bookmarks exist.
  - Added header trailing `HelpCircle` button triggering `dialog.alert` via the Global Dialog Host to present shortcuts and navigation guidelines.
  - Implemented `Enter` to jump & close, `Escape` to cancel, and `Alt+1` / `Alt+2` / `Alt+3` for rapid keyboard tab switching.
- [ModalWrapper.tsx](file:///g:/TextEditor/src/shared/components/ModalWrapper.tsx):
  - Added optional `containerHeightClass?: string` prop (defaulting to standard `MODAL_LAYOUT.CONTAINER_HEIGHT_CLASSES`) to allow compact modal dialogs such as `GoToModal` to fit with `h-auto max-h-[85vh]` instead of forcing 80vh full height.

### 2. Editor Operations & Commands Hook (`src/features/editor/hooks/`)

- [useEditorCommands.ts](file:///g:/TextEditor/src/features/editor/hooks/useEditorCommands.ts):
  - Added `goToLine(lineNum: number, col?: number)`: clamps to document range, sets selection anchor, and scrolls line smoothly into view.
  - Added `goToOffset(offset: number)`: clamps offset to document length and scrolls target position into view.
  - Added `getCurrentPosition()`: extracts real-time cursor line, column, max document lines, offset, and total document length.

### 3. Command Registry & Global Shortcuts (`src/core/commands/`)

- [types.ts](file:///g:/TextEditor/src/core/commands/types.ts):
  - Added `"edit.goTo"` to the `CommandId` type union.
- [registry.ts](file:///g:/TextEditor/src/core/commands/registry.ts):
  - Registered `"edit.goTo"` under `"Edit"` category with label `"Go to..."` and default keybinding `Ctrl+G` (`Cmd+G` on macOS).

### 4. Layout & App Integration (`src/App.tsx`, `src/app/layout/`)

- [MenuBar.tsx](file:///g:/TextEditor/src/app/layout/MenuBar.tsx):
  - Added `"Go to..."` menu item under the `Edit` menu (positioned directly below `Find & Replace...`).
  - Added `onOpenGoTo` callback to `MenuBarProps` and destructured in `MenuBar`.
- [App.tsx](file:///g:/TextEditor/src/App.tsx):
  - Added `isGoToOpen` state toggle.
  - Bound `edit.goTo` in the global keyboard shortcut dispatcher.
  - Rendered `<GoToModal />` connected to `editorCmds`.
