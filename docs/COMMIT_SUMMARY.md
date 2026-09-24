# Commit Summary

> [!IMPORTANT]
> This document records the commit message and detailed change log for the **current staged and upcoming commit**.
> Prior to creating any new commit, the contents below MUST be **COMPLETELY REWRITTEN** to reflect only the changes belonging to that specific commit, rather than appending new entries.

## 📌 Commit Message

```text
feat(preview): add CSV decoration modal with auto-merge rows and card picker

- Refactor CSV Visual Decoration from an inline sub-panel into a tabbed modal dialog (Highlight Rules and Auto-Merge Rows) with comfortable internal padding.
- Add Auto-Merge Rows capability supporting "Merge if Empty" (consecutive blank cells below) and "Merge by ID Reference Column" (consecutive rows sharing the same identifier).
- Implement read-only Merged View toggle in DataTable footer, computing rowSpan matrices while preserving full physical row-index numbering and topmost decoration anchors.
- Convert Select Merge Mode into a unified CardPicker component supporting single-column vertical layout with clear descriptions and iconography.
- Persist merge configuration alongside decoration rules inside the inline CSV comment block (# <scripta.csv.decoration>{ rules, merge }</scripta.csv.decoration>).
```

---

## 📝 Detailed Change Log

### 1. CSV Decoration & Merge Types (`src/features/preview/types/`)

- [csvDecoration.types.ts](file:///g:/TextEditor/src/features/preview/types/csvDecoration.types.ts):
  - Added `CsvMergeMode = "none" | "empty" | "id"`.
  - Added `CsvMergeConfig` interface (`mode`, optional `idColumn`).
  - Added `CellSpanInfo` (`rowSpan`: $\ge 1$ for visible anchor cells, $0$ for collapsed/hidden cells) and `MergeSpanMap` dictionary type.
  - Extended `CsvDecorationConfig` to include optional `merge?: CsvMergeConfig`.

### 2. Serialization & Engine Updates (`src/features/preview/services/`)

- [csvDecorationStorage.ts](file:///g:/TextEditor/src/features/preview/services/csvDecorationStorage.ts):
  - Updated `parseDecorationFromCsv` to extract and validate `merge` settings with fallback to `{ mode: "none" }`.
  - Updated `serializeDecorationToCsv` to include the `merge` payload whenever active, stripping the block if both rules and merge are empty/none.

- [csvDecorationEngine.ts](file:///g:/TextEditor/src/features/preview/services/csvDecorationEngine.ts):
  - Added `computeMergeSpanMap(rows, columns, mergeConfig)` pure function:
    - `"empty"` mode: Scans each column top-to-bottom, accumulating `rowSpan` on the non-empty anchor cell and zeroing subsequent empty cells.
    - `"id"` mode: Groups contiguous row records sharing the same `idColumn` value into a consolidated block for the reference column. For all other columns, only downward blank/empty cells are merged into their preceding non-empty anchor, preserving populated cells across grouped rows.

### 3. Modal Architecture & CardPicker UI (`src/features/preview/components/`, `src/shared/components/`)

- [CsvDecorationModal.tsx](file:///g:/TextEditor/src/features/preview/components/CsvDecorationModal.tsx) (**NEW**):
  - Replaces inline drawer panel with a clean `ModalWrapper` dialog (`max-w-3xl`) featuring standard `p-5` body padding.
  - **Tab 1 ("Highlight Rules")**: Full rule management interface (Add/Edit form, regex toggle, column scoping, target selector, ColorPickerPopover, B/I/U toggles, drag-and-drop reordering, and global dialog deletion confirm).
  - **Tab 2 ("Auto-Merge Rows")**: Configures table consolidation using `CardPicker`:
    - **Disabled (Default)**: Normal flat table layout with full inline editing.
    - **Merge if Empty**: Automatic downward blank cell consolidation.
    - **Merge by ID Reference Column**: Grouping rows by an identifier column (with other columns merged only when empty) and an interactive column dropdown selector.

- [CardPicker.tsx](file:///g:/TextEditor/src/shared/components/CardPicker.tsx):
  - Added support for `columns={1}` (vertical card stack) in addition to 2, 3, and 4 column grid modes.

### 4. DataTable Integration & Merged View (`src/features/preview/components/`)

- [DataTable.tsx](file:///g:/TextEditor/src/features/preview/components/DataTable.tsx):
  - Accepts `mergeConfig?: CsvMergeConfig` prop.
  - Added `isMergedView` local toggle and `effectiveReadOnly = isReadOnly || effectiveMergedView`.
  - Computes `mergeSpanMap` dynamically for the current visible `paginatedRows`.
  - In `<tbody>`: renders `<td rowSpan={span.rowSpan}>` for anchor cells and omits rendering `<td>` when `span.rowSpan === 0`.
  - Automatically vertically centers content (`align-middle` / `verticalAlign: "middle"`) for any cells spanning multiple rows (`rowSpan > 1`).
  - Preserves exact physical row index numbers (`#` column) for auditing and navigation.
  - Naturally applies decoration rules from the topmost anchor row to cover the full merged block.
  - Added **"Render Merged" / "Merged View: ON"** toggle button at the footer summary bar (adjacent to total row/column counts).

### 5. CSV Preview Adapter Wiring (`src/features/preview/adapters/`)

- [CsvAdapter.tsx](file:///g:/TextEditor/src/features/preview/adapters/CsvAdapter.tsx):
  - Replaced `CsvDecorationPanel` with `CsvDecorationModal`.
  - Added `handleChangeMerge` handler and integrated `mergeConfig` into `commitCsvData` and `handleChangeRules`.
  - Updated header **Decoration** button badge to display rule count plus a `M` indicator when auto-merge is active.
