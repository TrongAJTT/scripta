# Commit Summary

> [!IMPORTANT]
> This document records the commit message and detailed change log for the **current staged commit**.
> Prior to creating any new commit, the contents below MUST be **COMPLETELY REWRITTEN** to reflect only the changes belonging to that specific commit, rather than appending new entries.

## 📌 Commit Message

```text
feat(shortcuts): enhance Shortcut Mapper reactivity, relax modifier rules, and align defaults

- Shortcut Mapper Reactivity:
  - Subscribed `ShortcutMapperModal` directly to `useKeybindingStore.overrides` state, enabling instant UI updates upon deleting or resetting shortcuts without closing/reopening the dialog.
  - Dynamically resolved keybindings directly from overrides within command filter lists to ensure smooth reactivity.

- Flexible Modifier System:
  - Removed strict Alt-only enforcement; shortcuts now permit any standard modifier (Ctrl, Alt, Shift, Meta) or standalone Function keys (F1-F12).
  - Softened browser collision warnings to focus strictly on reserved, non-overridable shortcuts (Ctrl+N, Ctrl+T, Ctrl+W).
  - Updated Shortcut Mapper modal subtitle and badge indicator to highlight customizable shortcut support.

- Standardized Default Keybindings:
  - Updated core file commands in `registry.ts` to use conventional desktop standards:
    - Open File: `Ctrl+O`
    - Save File: `Ctrl+S`
    - Save As: `Ctrl+Shift+S`
    - Find & Replace: `Ctrl+F`
```

---

## 📝 Detailed Change Log

### 1. Command Registry & Keybinding Definitions (`src/core/commands/`)

- [registry.ts](file:///g:/TextEditor/src/core/commands/registry.ts):
  - Standardized default shortcuts: `file.open` (`Ctrl+O`), `file.save` (`Ctrl+S`), `file.saveAs` (`Ctrl+Shift+S`), and `edit.findReplace` (`Ctrl+F`).
  - Refined `checkBrowserConflict` to issue soft warnings specifically for OS/browser-reserved shortcuts (`Ctrl+N`, `Ctrl+T`, `Ctrl+W`) instead of blocking general `Ctrl` combinations.

### 2. Shortcut Mapper Modal (`src/features/settings/`)

- [ShortcutMapperModal.tsx](file:///g:/TextEditor/src/features/settings/components/ShortcutMapperModal.tsx):
  - Subscribed to `useKeybindingStore.overrides` to trigger immediate re-renders when shortcuts are deleted or modified.
  - Relaxed keystroke validation to allow any combination containing at least one modifier (`Ctrl`, `Alt`, `Shift`, `Meta`) or function keys (`F1`–`F12`).
  - Updated header badge to "Customizable" and refined modal descriptive text.


