# Commit Summary

> [!IMPORTANT]
> This document records the commit message and detailed change log for the **current staged commit**.
> Prior to creating any new commit, the contents below MUST be **COMPLETELY REWRITTEN** to reflect only the changes belonging to that specific commit, rather than appending new entries.

## 📌 Commit Message

```text
feat(preview): fix svg exporting and add dynamic export naming

- Fix tainted canvas `SecurityError` during SVG raster export (PNG/JPG/WEBP) by stripping external font/stylesheet references and encoding SVG as base64 data URI.
- Standardize diagram export filenames to `{TAB_NAME}_svg_{TIMESTAMP_MS}.{ext}` via shared `exportNaming.ts` utility and caller-side tab name sanitization.
- Centralize anchor-based browser file downloads into shared `triggerFileDownload` utility.
```

---

## 📝 Detailed Change Log

### 1. Core Utilities (`src/core/utils/`)

- [downloadUtils.ts](file:///g:/TextEditor/src/core/utils/downloadUtils.ts):
  - Created reusable `triggerFileDownload(source, fileName)` function to centralize browser anchor tag creation, click dispatching, and automatic ObjectURL revocation.
- [exportNaming.ts](file:///g:/TextEditor/src/core/utils/exportNaming.ts):
  - Exported `TIMESTAMP_MS` constant token (`"{TIMESTAMP_MS}"`).
  - Added `sanitizeTabName(rawName)` to clean the `TAB_NAME` portion at caller/terminal logic by stripping file extensions and invalid filename characters.
  - Added `resolveExportFileName(template, extension)` to substitute the `TIMESTAMP_MS` token with epoch milliseconds and append the clean file extension.
  - Re-exported `triggerFileDownload` for export workflows.

### 2. Diagram Export & File System (`src/features/preview/`, `src/features/file-system/`)

- [mermaidExportService.ts](file:///g:/TextEditor/src/features/preview/services/mermaidExportService.ts):
  - Formatted export filenames as `${tabName}_svg_${TIMESTAMP_MS}` using `TIMESTAMP_MS` and `resolveExportFileName` for both SVG vector files and raster images (`.png`, `.jpg`, `.webp`).
  - Switched download triggers to `triggerFileDownload` for automated DOM node handling and URL cleanup.
  - Fixed `SecurityError: Failed to execute 'toBlob' on 'HTMLCanvasElement': Tainted canvases may not be exported` by sanitizing external fonts/stylesheets (`sanitizeSvgForCanvas`) and encoding SVG as UTF-8 base64 Data URLs.
- [MermaidExportMenu.tsx](file:///g:/TextEditor/src/features/preview/components/MermaidExportMenu.tsx):
  - Processed `TAB_NAME` at the terminal/caller logic using `sanitizeTabName(baseFileName)` to strip file extensions and invalid characters before invoking export services.
- [MarkdownAdapter.tsx](file:///g:/TextEditor/src/features/preview/adapters/MarkdownAdapter.tsx):
  - Forwarded `tab.name` prefix into embedded diagram export actions.
- [fileSystemApi.ts](file:///g:/TextEditor/src/features/file-system/data/fileSystemApi.ts):
  - Refactored fallback save download to use `triggerFileDownload`.
