# Commit Summary

> [!IMPORTANT]
> This document records the commit message and detailed change log for the **current staged and upcoming commit**.
> Prior to creating any new commit, the contents below MUST be **COMPLETELY REWRITTEN** to reflect only the changes belonging to that specific commit, rather than appending new entries.

## 📌 Commit Message

```text
feat: add basic client-side LaTeX document support and live preview

- Add LaTeX (.tex, .latex, .sty, .cls) language and preview support across file detection and menus.
- Implement CodeMirror syntax highlighting for LaTeX using @codemirror/legacy-modes/mode/stex.
- Implement client-side LaTeX compiler service with KaTeX math equation rendering, document structure parsing (sections, lists, tables, abstract, metadata), and DOMPurify sanitization.
- Add LatexAdapter component displaying an academic paper-styled view with multi-page WYSIWYG print export support.
- Register LaTeX preview adapter, icon, and preview threshold limits.
- Update Workbox maximumFileSizeToCacheInBytes in vite.config.ts to accommodate PWA precaching.
```

---

## 📝 Detailed Change Log

### 1. Language Definitions & Detection (`src/core/types/`, `src/core/utils/`, `src/app/layout/`)

- [file.types.ts](file:///g:/TextEditor/src/core/types/file.types.ts):
  - Added `"latex"` to `SupportedLanguage` and `PreviewType` unions.
- [fileDetection.ts](file:///g:/TextEditor/src/core/utils/fileDetection.ts):
  - Mapped `.tex`, `.latex`, `.sty`, and `.cls` file extensions to `language: "latex"` and `previewType: "latex"`.
  - Added default extension mapping (`"latex"` -> `"tex"`).
  - Added heuristic content detection for typical LaTeX keywords (`\documentclass`, `\begin{document}`, `\section`, `\usepackage`, etc.).
- [MenuBar.tsx](file:///g:/TextEditor/src/app/layout/MenuBar.tsx):
  - Added `LATEX` option in the Language switcher dropdown.

### 2. CodeMirror 6 Syntax Highlighting (`src/features/editor/components/`)

- [CodeEditor.tsx](file:///g:/TextEditor/src/features/editor/components/CodeEditor.tsx):
  - Integrated `StreamLanguage.define(stex)` from `@codemirror/legacy-modes/mode/stex` for native LaTeX code highlighting.

### 3. LaTeX Compiler Service & Live Preview Adapter (`src/features/preview/`)

- [latexCompilerService.ts](file:///g:/TextEditor/src/features/preview/services/latexCompilerService.ts) (**NEW**):
  - Client-side compiler using KaTeX for high-performance math rendering (inline `$ ... $`, `\( ... \)`, display `$$ ... $$`, `\[ ... \]`, and environments `equation`, `align`, `gather`, `multline`).
  - Parses document metadata (`\title`, `\author`, `\date`), section hierarchies (`\section`, `\subsection`, `\subsubsection`, `\paragraph`), formatting (`\textbf`, `\textit`, `\emph`, `\underline`, `\texttt`), lists (`itemize`, `enumerate`), tables (`tabular`), links (`\href`, `\url`), and online image references (`\includegraphics{https://...}`).
  - Sanitizes compiled markup via `DOMPurify` with MathML tag whitelisting.
- [LatexAdapter.tsx](file:///g:/TextEditor/src/features/preview/adapters/LatexAdapter.tsx) (**NEW**):
  - Renders compiled LaTeX content within a centered, responsive academic paper container (`<article>`) with dark/light mode typography.
- [registry.ts](file:///g:/TextEditor/src/features/preview/adapters/registry.ts) & [types.ts](file:///g:/TextEditor/src/features/preview/adapters/types.ts):
  - Registered `latex` in the adapter registry with `LATEX` badge and `Binary` icon.
- [PreviewPanel.tsx](file:///g:/TextEditor/src/features/preview/components/PreviewPanel.tsx):
  - Bound `latex` iconType to `Binary` icon in the preview header.
- [previewLimits.ts](file:///g:/TextEditor/src/core/constants/previewLimits.ts):
  - Configured soft performance thresholds for LaTeX preview (4,000 lines / 400 KB).

### 4. Styles, Print Engine & PWA Build (`src/main.tsx`, `src/core/utils/`, `vite.config.ts`)

- [main.tsx](file:///g:/TextEditor/src/main.tsx):
  - Imported `katex/dist/katex.min.css` globally for mathematical symbol fonts and rendering.
- [printUtils.ts](file:///g:/TextEditor/src/core/utils/printUtils.ts):
  - Added paper-article and KaTeX math specific print styles for crisp PDF exports.
- [vite.config.ts](file:///g:/TextEditor/vite.config.ts):
  - Configured `workbox.maximumFileSizeToCacheInBytes: 5 * 1024 * 1024` (5 MiB) to ensure complete PWA offline precaching.
