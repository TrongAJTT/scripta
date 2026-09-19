# Commit Summary

> [!IMPORTANT]
> This document records the commit message and detailed change log for the **current staged commit**.
> Prior to creating any new commit, the contents below MUST be **COMPLETELY REWRITTEN** to reflect only the changes belonging to that specific commit, rather than appending new entries.

## 📌 Commit Message

```text
feat(editor): implement MS Unicode Hex conversion & enhance character actions

- Unicode Hex Toggle Engine:
  - Created standalone `UnicodeHexService` implementing bidirectional conversion between Unicode code points and characters modeled.
  - Converts preceding hex strings (e.g. "2014", "1F600", or optional "U+...") into characters, and vice versa from character back to uppercase hex code point.
  - Supports non-empty selections, collapsed cursors with backward lookahead, and full surrogate pair handling (emojis and high astral plane symbols).
  - Registered `edit.toggleUnicodeHex` command bound to `Alt+X` default keybinding.
  - Added "Toggle Unicode Hex" action item inside the `Edit` menu (MenuBar) while preserving a clean Toolbar.

- Character Modal UX Enhancement:
  - Added dedicated quick-copy button alongside the insert button for each special character in `InsertCharacterModal`.
```

---

## 📝 Detailed Change Log

### 1. Unicode Hex Conversion Service (`src/features/editor/`)

- [unicodeHexService.ts](file:///g:/TextEditor/src/features/editor/services/unicodeHexService.ts): Core bidirectional conversion engine supporting both selection-based and cursor lookback conversion with surrogate pair awareness.
- [editorCommands.ts](file:///g:/TextEditor/src/core/utils/editorCommands.ts): Exported `toggleUnicodeHex` wrapper invoking the service on active `EditorView`.
- [useEditorCommands.ts](file:///g:/TextEditor/src/features/editor/hooks/useEditorCommands.ts): Integrated `toggleUnicodeHex` into the command execution hook.
- [InsertCharacterModal.tsx](file:///g:/TextEditor/src/features/editor/components/InsertCharacterModal.tsx): Added an inline Copy button (`handleCopy`) next to the Insert button in the character table.

### 2. Command Architecture & Menu Integration (`src/core/`, `src/app/`)

- [types.ts](file:///g:/TextEditor/src/core/commands/types.ts): Added `edit.toggleUnicodeHex` to `CommandId`.
- [registry.ts](file:///g:/TextEditor/src/core/commands/registry.ts): Registered `edit.toggleUnicodeHex` under the "Edit" category with default keybinding `Alt+X`.
- [App.tsx](file:///g:/TextEditor/src/App.tsx): Mapped `edit.toggleUnicodeHex` command dispatching `editorCmds.toggleUnicodeHex()` in the global keyboard listener.
- [MenuBar.tsx](file:///g:/TextEditor/src/app/layout/MenuBar.tsx): Added "Toggle Unicode Hex" menu item inside the `Edit` dropdown menu.
