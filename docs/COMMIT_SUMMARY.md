# Commit Summary

> [!IMPORTANT]
> This document records the commit message and detailed change log for the **current staged and upcoming commit**.
> Prior to creating any new commit, the contents below MUST be **COMPLETELY REWRITTEN** to reflect only the changes belonging to that specific commit, rather than appending new entries.

## 📌 Commit Message

```text
feat(preview): add per-tab session state and WYSIWYG print export

- Implement in-memory per-tab preview session store (previewSessionStore.ts) persisting filterQuery, currentPage, pageSize, sortState, and isMergedView across tab switches.
- Add print/export preview capability with live DOM sandbox cloning, theme-aware print styling, and multi-page pagination support.
- Allow preview adapters to override printing (e.g. HtmlAdapter using native iframe print).
- Clean up DataTable reactivity, fix search filter rendering loop, and hook clearSession on tab close.
- Add isAnyDecorationActive helper for responsive decoration indicator state.
```

---

## 📝 Detailed Change Log

### 1. In-Memory Preview Session Management (`src/features/preview/store/`, `src/features/tabs/`)

- [previewSessionStore.ts](file:///g:/TextEditor/src/features/preview/store/previewSessionStore.ts) (**NEW**):
  - In-memory Zustand store managing `sessions: Record<string, TabPreviewSession>` per tab ID.
  - Retains interactive preview parameters (`filterQuery`, `currentPage`, `pageSize`, `sortState`, `isMergedView`) when switching tabs without writing to persistent disk storage (resets on page reload).
  - Provides `getSession`, `updateSession`, and `clearSession` actions.
- [store.ts](file:///g:/TextEditor/src/features/tabs/store.ts):
  - In `closeTab`, dynamically imports `previewSessionStore` to invoke `clearSession(id)` for the closed tab ID, preventing in-memory session leakage.

### 2. WYSIWYG Live DOM Print Engine (`src/core/utils/`, `src/features/preview/components/`, `src/features/preview/adapters/`)

- [printUtils.ts](file:///g:/TextEditor/src/core/utils/printUtils.ts) (**NEW**):
  - Replaces custom HTML reconstruction with `printLiveElement(element)` for 100% visual fidelity ("What You See Is What You Print").
  - Clones the target preview element into an isolated DOM sandbox container appended to `document.body`.
  - Injects isolated `@media print` rules: hides the parent application DOM (`body > *:not(#sandbox)`), unconstrains all nested scroll/overflow heights (`height: auto !important`, `overflow: visible !important`), and unlocks `@page { margin: 12mm; size: auto; }` for natural multi-page pagination.
  - Automatically neutralizes dark mode styles on print with paper-friendly light theme variables while preserving exact decoration highlights, table lines, and SVG diagrams via `print-color-adjust: exact !important`.
- [PreviewPanel.tsx](file:///g:/TextEditor/src/features/preview/components/PreviewPanel.tsx):
  - Adds `Printer` action button to the unified preview header bar.
  - Supports adapter-level print overrides via `setPrintHandler` with fallback to `printLiveElement(contentRef.current)`.
- [HtmlAdapter.tsx](file:///g:/TextEditor/src/features/preview/adapters/HtmlAdapter.tsx):
  - Hooks `setPrintHandler` to delegate print commands directly to the embedded HTML iframe's own `contentWindow.print()`.
- [types.ts](file:///g:/TextEditor/src/features/preview/adapters/types.ts):
  - Extends `PreviewAdapterProps` with `setPrintHandler?: (fn: (() => void) | null) => void`.

### 3. Data Table Reactivity & Print Refinements (`src/features/preview/components/`, `src/features/preview/adapters/`, `src/features/preview/types/`)

- [DataTable.tsx](file:///g:/TextEditor/src/features/preview/components/DataTable.tsx):
  - Requires `tabId` prop and binds interactive states (`sortState`, `currentPage`, `pageSize`, `isMergedView`) to `usePreviewSessionStore`.
  - Fixed render-phase state update loop by moving search-driven page resets into a controlled `useEffect`.
  - Added `data-no-print="true"` to pagination footer to exclude paging controls from physical printouts.
- [DataTableHeaderActions.tsx](file:///g:/TextEditor/src/features/preview/components/DataTableHeaderActions.tsx):
  - Added `select-text` styling classes to search input container to ensure unimpeded text selection and typing events.
- [CsvAdapter.tsx](file:///g:/TextEditor/src/features/preview/adapters/CsvAdapter.tsx):
  - Direct selector subscription for `sessions[tab.id]?.filterQuery` for instant, non-stale input re-renders.
  - Uses `isAnyDecorationActive(decorationConfig)` to conditionally highlight the Decoration toolbar button.
- [csvDecoration.types.ts](file:///g:/TextEditor/src/features/preview/types/csvDecoration.types.ts):
  - Added `isAnyDecorationActive(config: CsvDecorationConfig): boolean` utility helper with safe optional chaining on `config.merge?.mode`.
