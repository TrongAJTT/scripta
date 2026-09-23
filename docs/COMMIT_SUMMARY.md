# Commit Summary

> [!IMPORTANT]
> This document records the commit message and detailed change log for the **current staged commit**.
> Prior to creating any new commit, the contents below MUST be **COMPLETELY REWRITTEN** to reflect only the changes belonging to that specific commit, rather than appending new entries.

## 📌 Commit Message

```text
feat(preview): unify table header controls, support column reordering, and fix cell editing selection

- Extract reusable DataTableHeaderActions component to adhere to DRY/SOLID principles across CSV and JSON table views.
- Fix cell text selection bug by selecting text only once upon initiating cell editing rather than on every keystroke.
- Add "Move Column Left" and "Move Column Right" action items to column context popup menu with boundary-aware disabled states.
- Enable full 2-way data-binding for CSV and JSON (inline cell editing, column renaming, column reordering, and row/column deletion).
- Synchronize tabular mutations back to active editor tab with smart type casting for JSON models.
```

---

## 📝 Detailed Change Log

### 1. Tabular Presentation Components (`src/features/preview/components/`)

- [DataTableHeaderActions.tsx](file:///g:/TextEditor/src/features/preview/components/DataTableHeaderActions.tsx):
  - Extracted shared header toolbar component containing search input, CSV clipboard copy, and CSV file download.
  - Implemented flexible slot architecture (`leftSlot`, `rightSlot`) allowing adapters to inject custom widgets (such as the JSON table candidate dropdown or format toggles).
- [DataTable.tsx](file:///g:/TextEditor/src/features/preview/components/DataTable.tsx):
  - Fixed cell input focus & auto-selection bug: tracked key transition (`prevCellKeyRef`) so `.select()` executes only when entering edit mode, allowing continuous typing without clearing or re-selecting text.
  - Added `onMoveColumn?: (column: string, direction: 'left' | 'right') => void` prop.
  - Added "Move Column Left" (`ArrowLeft`) and "Move Column Right" (`ArrowRight`) buttons in column context menu, automatically disabled at boundary column indices.
  - Provided complete 2-way editing capabilities: inline cell value editing, column header renaming, column reordering, and row/column deletion.

### 2. Preview Adapters (`src/features/preview/adapters/`)

- [CsvAdapter.tsx](file:///g:/TextEditor/src/features/preview/adapters/CsvAdapter.tsx):
  - Replaced duplicated header action elements with `<DataTableHeaderActions />`.
  - Implemented `handleMoveColumn` to shift column positions, re-serialized via `tableToCsv`, and propagated to `updateTabContent`.
  - Passed `onMoveColumn` to `<DataTable />`.
- [JsonAdapter.tsx](file:///g:/TextEditor/src/features/preview/adapters/JsonAdapter.tsx):
  - Replaced duplicated table view action elements with `<DataTableHeaderActions />`.
  - Implemented `handleMoveColumn` with key-order preservation across root list, nested property list, and dictionary data models.
  - Passed `onMoveColumn` to `<DataTable />`.
