# Commit Summary

> [!IMPORTANT]
> This document records the commit message and detailed change log for the **current staged commit**.
> Prior to creating any new commit, the contents below MUST be **COMPLETELY REWRITTEN** to reflect only the changes belonging to that specific commit, rather than appending new entries.

## 📌 Commit Message

```text
refactor(ui): extract ConvertCaseMenuItems component & refine menu presentations

- DRY Menu Refactoring:
  - Extracted `ConvertCaseMenuItems` into a reusable component (`src/features/editor/components/ConvertCaseMenuItems.tsx`).
  - Unified uppercase, lowercase, proper case, title case, and invert case actions across MenuBar (Edit menu) and Toolbar (both desktop dropdown and mobile accordion drawer).

- Presentation & Responsiveness Polish:
  - Added configurable `showIcon` prop to `WorkspaceFolderSyncMenuItems` (defaults to `true`), allowing cleanly hiding icons in nested mobile accordions for cleaner typography alignment.
  - Adjusted mobile Toolbar drawer popup width (`w-[60vw]`) to prevent layout clipping and enhance touch ergonomics.
  - Removed redundant `alignGutter` props in mobile submenus where icon spacers are omitted.
```

---

## 📝 Detailed Change Log

### 1. Reusable Menu Components (`src/features/editor/`, `src/features/workspace/`)

- [ConvertCaseMenuItems.tsx](file:///g:/TextEditor/src/features/editor/components/ConvertCaseMenuItems.tsx): Created standalone component encapsulating case conversion actions (`edit.toUpperCase`, `edit.toLowerCase`, `edit.toProperCase`, `edit.toTitleCase`, `edit.invertCase`).
- [WorkspaceFolderSyncMenuItems.tsx](file:///g:/TextEditor/src/features/workspace/components/WorkspaceFolderSyncMenuItems.tsx): Added `showIcon` optional prop to flexibly toggle icon rendering based on surface context.

### 2. Layout & Menu Integration (`src/app/layout/`, `src/features/editor/`)

- [MenuBar.tsx](file:///g:/TextEditor/src/app/layout/MenuBar.tsx): Integrated `ConvertCaseMenuItems` in the "Convert Case to" submenu under the Edit menu, eliminating duplicated item definitions.
- [Toolbar.tsx](file:///g:/TextEditor/src/features/editor/components/Toolbar.tsx):
  - Replaced inline case conversion items on desktop and mobile with `ConvertCaseMenuItems`.
  - Passed `showIcon={false}` to `WorkspaceFolderSyncMenuItems` inside the mobile drawer accordion.
  - Set `className="w-[60vw]"` on the mobile options dropdown to ensure comfortable reading and tap targets.
