# Commit Summary

> [!IMPORTANT]
> This document records the commit message and detailed change log for the **current staged commit**.
> Prior to creating any new commit, the contents below MUST be **COMPLETELY REWRITTEN** to reflect only the changes belonging to that specific commit, rather than appending new entries.

## 📌 Commit Message

```text
feat(preview): add CSV visual decoration rules and performance limits table

- Implement a rule-based decoration system for CSV preview that lets users highlight rows, cells, or row-index cells based on text/regex pattern matching.
- Decoration rules are persisted inline within the CSV file as a comment block (# <scripta.csv.decoration>...</scripta.csv.decoration>) and stripped before data parsing, copy, and export.
- Add ColorPickerPopover shared component using react-colorful with HexAlpha support, solid presets, and a clear action.
- Refactor Settings > Preview performance limits into a collapsible DataTable (default collapsed), noting CSV is excluded since it uses paging.
- Add react-colorful to the About dialog's open-source libraries list.
```

---

## 📝 Detailed Change Log

### 1. CSV Decoration Types & Storage (`src/features/preview/types/`, `src/features/preview/services/`)

- [csvDecoration.types.ts](file:///g:/TextEditor/src/features/preview/types/csvDecoration.types.ts) (**NEW**):
  - Defines `CsvDecorationRule` with: `scope` (`"all"` | `"column"`), `scopeColumn`, `pattern`, `isRegex`, `target` (`"cell"` | `"row"` | `"index"`), `style` (background, color, bold, italic, underline), `label`, and `enabled`.
  - Defines `CsvDecorationConfig` and `DecorationMap` for fast O(1) lookup during table rendering.

- [csvDecorationStorage.ts](file:///g:/TextEditor/src/features/preview/services/csvDecorationStorage.ts) (**NEW**):
  - `parseDecorationFromCsv`: extracts and parses the `# <scripta.csv.decoration>{...}</scripta.csv.decoration>` comment block embedded at the end of CSV content.
  - `stripDecorationFromCsv`: removes the decoration block before data parsing, copying, or exporting — ensuring clean output.
  - `serializeDecorationToCsv`: appends or replaces the decoration block at the end of CSV content when rules are saved.

- [csvDecorationEngine.ts](file:///g:/TextEditor/src/features/preview/services/csvDecorationEngine.ts) (**NEW**):
  - `buildDecorationMap`: evaluates all active rules in order (first-match-wins priority), scanning either all columns or a specific column per rule, and produces a `DecorationMap` with `rows`, `cells`, and `indexCells` Maps.

### 2. Decoration Panel UI & Color Picker (`src/features/preview/components/`, `src/shared/components/`)

- [CsvDecorationPanel.tsx](file:///g:/TextEditor/src/features/preview/components/CsvDecorationPanel.tsx) (**NEW**):
  - Inline collapsible drawer rendered below the PreviewPanel header.
  - Unified form for both **adding** and **editing** rules (toggled by the pencil icon on each row).
  - Scan scope selector: "All Columns" or "Specific Column" (dropdown of actual CSV columns).
  - Apply target selector: "Entire Row", "Matching Cell(s)", or "Row Number Cell (#)".
  - Style controls: two `ColorPickerPopover` swatches (background and text color) plus B/I/U toggles.
  - HTML5 native drag-and-drop for reordering rule priority.
  - Delete action invokes `dialog.confirm` via Global Dialog Host before removal.
  - Active edit rule is highlighted with a left accent border.

- [ColorPickerPopover.tsx](file:///g:/TextEditor/src/shared/components/ColorPickerPopover.tsx) (**NEW**):
  - Wraps `react-colorful`'s `HexAlphaColorPicker` with a swatch trigger button.
  - HEX + alpha manual input field (`#RRGGBBAA`), clear action, and 16 solid preset colors (full Tailwind spectrum).
  - Uses render-time state derivation (no `useEffect` for value sync) to avoid linter warnings.

### 3. DataTable Integration (`src/features/preview/components/`)

- [DataTable.tsx](file:///g:/TextEditor/src/features/preview/components/DataTable.tsx):
  - Added optional `decorationMap?: DecorationMap` prop.
  - Row `<tr>` receives `backgroundColor` from `decorationMap.rows` if set.
  - Index `<td>` receives background, color, bold, italic, underline from `decorationMap.indexCells`.
  - Data cells resolve style from `decorationMap.cells` first, then fall back to the row-level style if target is `"row"`.

### 4. CSV Adapter Wiring (`src/features/preview/adapters/`)

- [CsvAdapter.tsx](file:///g:/TextEditor/src/features/preview/adapters/CsvAdapter.tsx):
  - Strips decoration block before passing content to `parseCsv` and `DataTableHeaderActions` (copy/export are unaffected by metadata).
  - Memoizes `decorationConfig`, `cleanContent`, and `decorationMap` independently to minimize re-renders.
  - `commitCsvData` helper re-serializes decoration rules back into tab content after every data mutation.
  - Injects a **"Decoration"** button in the `rightSlot` of `DataTableHeaderActions`:
    - Border highlight appears **only when the panel is open** (not merely when rules exist).
    - Rule count badge uses `text-[var(--bg-app)]` for dark-mode-safe contrast on the accent background.
  - Passes `columns` (not `totalRows`) to `CsvDecorationPanel` for scope column selection.

### 5. Settings & About (`src/features/settings/components/`)

- [PreviewTab.tsx](file:///g:/TextEditor/src/features/settings/components/preferences/PreviewTab.tsx):
  - Refactored the "Split View Performance & Limits" section into a collapsible group (default collapsed) using the existing `DataTable` component.
  - Displays Format, Max Lines, and Max File Size per hardware preset.
  - Adds a note explaining CSV is excluded from limits because it already uses automatic paging.

- [AboutModal.tsx](file:///g:/TextEditor/src/features/settings/components/AboutModal.tsx):
  - Added `"react-colorful"` to the open-source libraries list.

### 6. Dependencies (`package.json`, `pnpm-lock.yaml`)

- Added `react-colorful ^5.8.1` as a runtime dependency.
