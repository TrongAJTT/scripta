# ⚡ Performance & UX Optimization Standards

Scripta is designed to feel as instantaneous as a native desktop editor while running in the browser. To keep initial startup fast, typing latency near zero, and offline usage reliable, all new features and refactors **must** follow the code-splitting and runtime performance standards below.

---

## 1. Bundle & Code-Splitting Architecture

### 1.1 Lazy-Load All Non-Critical Modals & Drawers
* **Rule**: Modals, dialogs, and drawers that are not visible on initial render must be loaded with `React.lazy(...)` in `src/App.tsx` and wrapped in `<Suspense fallback={null}>`.
* **Conditional Mounting**: Render lazy modals only when opened (e.g., `{isPreferencesOpen && <PreferencesModal ... />}`) so Vite does not prefetch their chunks during initial page load.
* **Preserving Stateful Dialogs**: For dialogs that retain user state across open/close cycles (such as `FindReplaceModal`), track a `hasOpened*` flag so the chunk is fetched only on first open and kept mounted afterwards.

### 1.2 Lazy-Load Preview Adapters & Heavy Renderers
* **Adapter Registry (`src/features/preview/adapters/registry.ts`)**: All preview adapters (`MarkdownAdapter`, `MermaidAdapter`, `LatexAdapter`, `CsvAdapter`, `ConsoleAdapter`, etc.) are registered via `React.lazy(...)` and rendered inside `<Suspense>` in `src/features/preview/components/PreviewPanel.tsx`.
* **On-Demand Heavy Libraries**:
  * **Mermaid (`mermaid`)**: Must never be statically imported in entry or Markdown chunks. Use `applyMermaidTheme(...)` in `src/features/preview/services/mermaidExportService.ts`, which dynamically imports `mermaid` only when a diagram is actually rendered.
  * **KaTeX (`katex`)**: Isolated inside `LatexAdapter` / `latexCompilerService.ts` so it loads only when previewing `.tex` / `.latex` files.

### 1.3 Lazy-Load CodeMirror 6 Language Grammars
* **Dynamic Grammar Loading (`src/features/editor/components/CodeEditor.tsx`)**:
  * Do **not** statically import `@codemirror/lang-*` or `@codemirror/legacy-modes` at the top of `CodeEditor.tsx`.
  * Register new languages inside `loadLanguageExtension(lang)` using dynamic `import(...)` and cache resolved extensions in `languageExtensionCache`.
  * Apply loaded extensions asynchronously via `languageCompartment.reconfigure(ext)` with an `isCancelled` guard so typing never blocks and `EditorView` is never recreated.

### 1.4 Vendor Chunking & Avoiding Ineffective Dynamic Imports
* **Vendor Splitting (`vite.config.ts`)**: `build.rolldownOptions.output.manualChunks` separates core runtime vendors into `react-vendor`, `ui-vendor`, and `codemirror-vendor` (excluding `@codemirror/lang-*` and `@codemirror/legacy-modes` so language packs stay in their own on-demand chunks).
* **No Mixed Static + Dynamic Imports**: Never `import()` a module dynamically if another module in the same entry graph already imports it statically (which triggers `[INEFFECTIVE_DYNAMIC_IMPORT]` in Vite/Rolldown).

---

## 2. Typing Responsiveness & Preview Protection

* **Debounced Store & Persistence Sync**:
  * CodeMirror document edits debounce for **300 ms** before syncing to Zustand (`CodeEditor.tsx`).
  * Tab/session mutations debounce for **1,000 ms** before persisting to IndexedDB (`src/features/tabs/slices/sessionHelpers.ts`).
* **Soft Preview Thresholds (`src/core/constants/previewLimits.ts`)**:
  * Side-by-side previews (`split` / `auto`) check line count and UTF-8 byte size against the user's `previewPerfPreset` (`eco`, `balanced`, `performance`, `unlimited`).
  * Oversized files pause live preview with `PreviewThresholdFallback` and allow explicit one-click bypass (`bypassPreviewThreshold`).

---

## 3. PWA Offline Runtime Caching

* Static application assets and fonts are precached by Workbox (`vite-plugin-pwa` in `vite.config.ts`).
* External WASM runtimes such as **Pyodide** (`https://cdn.jsdelivr.net/pyodide/*`) use a `CacheFirst` Workbox `runtimeCaching` rule (30-day expiration, max 30 entries) so Python execution remains available offline after its first load.

---

## 4. Verification Checklist

Before submitting performance-sensitive changes, run:

```sh
pnpm test   # Unit tests (Vitest)
pnpm lint   # Must exit with 0 errors and 0 warnings
pnpm build  # Verify TypeScript compilation, chunk sizes, and zero ineffective dynamic imports
```
