# Commit Summary

> [!IMPORTANT]
> This document records the commit message and detailed change log for the **current staged commit**.
> Prior to creating any new commit, the contents below MUST be **COMPLETELY REWRITTEN** to reflect only the changes belonging to that specific commit, rather than appending new entries.

## 📌 Commit Message

```text
feat(preview): add JSON table view toggle mode and CSV/TSV file format support

- Implement JSON table compatibility analyzer (jsonTableUtils.ts) supporting Level 1 lists of objects, key-list records, and shallow Level 2 nesting (<= 4 items as inline chips).
- Add [JSON | Table] view mode toggle in JsonAdapter.tsx with candidate selector for multi-table payloads while keeping JSON tree view as default.
- Introduce first-class CSV and TSV support with zero-dependency RFC-4180 parser (csvParser.ts), CsvAdapter.tsx preview, language detection, and emerald table branding.
- Build reusable DataTable.tsx component featuring global search filtering, multi-state column sorting, responsive pagination, and 1-click CSV copy & export.
```

---

## 📝 Detailed Change Log

### 1. Core Types, File Detection & Constants (`src/core/`)

- [file.types.ts](file:///g:/TextEditor/src/core/types/file.types.ts):
  - Added `"csv"` to `SupportedLanguage` and `PreviewType` union types.
- [fileDetection.ts](file:///g:/TextEditor/src/core/utils/fileDetection.ts):
  - Mapped `.csv` and `.tsv` extensions to `{ language: "csv", previewType: "csv" }`.
  - Added `"csv"` mappings to `getDefaultExtensionForLanguage` and `getPreviewTypeForLanguage`.
  - Added heuristic detector in `detectLanguageFromContent` to detect CSV/TSV patterns by delimiter uniformity across sample lines.
- [fileTypeIcons.ts](file:///g:/TextEditor/src/core/constants/fileTypeIcons.ts):
  - Configured emerald spreadsheet color `#10b981` (vibrant) and `#6ee7b7` (pastel) for `csv`.
  - Assigned `mdiFileTableOutline` icon for CSV/TSV files and preview types.
- [previewLimits.ts](file:///g:/TextEditor/src/core/constants/previewLimits.ts):
  - Added baseline performance threshold configuration for `csv` (8,000 lines / 800 KB).

### 2. Tabular Data Services (`src/features/preview/services/`)

- [csvParser.ts](file:///g:/TextEditor/src/features/preview/services/csvParser.ts):
  - Implemented zero-dependency RFC-4180 compliant CSV and TSV parser.
  - Added heuristic delimiter detection for `,`, `\t`, `;`, and `|`.
  - Handled quoted fields, escaped quotes (`""`), carriage returns, and duplicate/empty header normalization.
  - Exported `tableToCsv` serialization utility for 1-click table exports.
- [jsonTableUtils.ts](file:///g:/TextEditor/src/features/preview/services/jsonTableUtils.ts):
  - Built structure analyzer to identify table-compatible JSON payloads (arrays of objects, object containing array properties, dictionary records).
  - Implemented `analyzeCellValue` to support Level 1 and Level 2 shallow nesting ($\le 4$ items rendered as badges or `key: value` chips; larger objects formatted with count summaries).
  - Extracted union columns and generated candidate table definitions.

### 3. Reusable Components (`src/features/preview/components/`)

- [DataTable.tsx](file:///g:/TextEditor/src/features/preview/components/DataTable.tsx):
  - Built high-performance, theme-aware tabular data viewer.
  - Integrated real-time search filter across all columns with match counter.
  - Implemented column sorting with support for numeric and alphabetical comparison (ASC / DESC / Natural).
  - Added pagination controls with customizable page sizes (25, 50, 100, 250, All) for smooth 60 FPS rendering.
  - Added cell renderers for booleans, numbers, nulls, shallow arrays, and shallow objects.
  - Added "Copy CSV" to clipboard and "Export CSV" via `triggerFileDownload`.

### 4. Preview Adapters (`src/features/preview/adapters/`, `src/features/preview/components/`)

- [JsonAdapter.tsx](file:///g:/TextEditor/src/features/preview/adapters/JsonAdapter.tsx):
  - Kept interactive JSON Tree View as the default view mode.
  - Added prominent segmented toggle `[JSON | Table]` in the preview toolbar when table compatibility is detected.
  - Added candidate selector dropdown when a root object contains multiple table candidates.
  - Integrated `DataTable` component when viewing in Table mode.
- [CsvAdapter.tsx](file:///g:/TextEditor/src/features/preview/adapters/CsvAdapter.tsx):
  - Created dedicated preview adapter for CSV and TSV files.
  - Injected header toolbar stats including delimiter badge (`CSV (Comma)`, `TSV (Tab)`, etc.) and total row/column counts.
  - Rendered data using the unified `DataTable` component.
- [registry.ts](file:///g:/TextEditor/src/features/preview/adapters/registry.ts) & [types.ts](file:///g:/TextEditor/src/features/preview/adapters/types.ts):
  - Registered `csv` preview adapter with table icon and `CSV` badge.
- [PreviewPanel.tsx](file:///g:/TextEditor/src/features/preview/components/PreviewPanel.tsx):
  - Added emerald `TableIcon` mapping in `renderIcon` for `csv` preview panel headers.

### 5. Code Editor & App Layout (`src/features/editor/`, `src/app/layout/`)

- [CodeEditor.tsx](file:///g:/TextEditor/src/features/editor/components/CodeEditor.tsx):
  - Added explicit handling for `"csv"` language in `getLanguageExtension`.
- [MenuBar.tsx](file:///g:/TextEditor/src/app/layout/MenuBar.tsx):
  - Extracted and deduplicated `LANGUAGE_OPTIONS` array shared across desktop and mobile menus.
  - Added `CSV / TSV` option to Language selection menus.
