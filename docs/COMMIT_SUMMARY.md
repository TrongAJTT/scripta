# Commit Summary

> [!IMPORTANT]
> This document records the commit message and detailed change log for the **current staged commit**.
> Prior to creating any new commit, the contents below MUST be **COMPLETELY REWRITTEN** to reflect only the changes belonging to that specific commit, rather than appending new entries.

## 📌 Commit Message

```text
feat(preview): introduce soft thresholds and hardware performance presets for split view

- Add format-specific soft thresholds (lines & bytes) in `previewLimits.ts` to automatically pause heavy real-time preview rendering on large documents in Split View.
- Provide 4 stepped hardware performance presets (Eco 0.5x, Balanced 1.0x, High Spec 2.5x, and Unlimited) with a slider in Preferences > Preview.
- Introduce `PreviewThresholdFallback` with real-time file metric metrics, "Render Anyway" session bypass, and quick switch to full preview-only mode.
- Add `bypassedPreviewTabIds` session tracking in Zustand tabs store with automatic cleanup on tab close.
- Support deep linking into Preferences categories via custom event `open-preferences-modal`.
```

---

## 📝 Detailed Change Log

### 1. Core Constants & Limits (`src/core/constants/`)

- [previewLimits.ts](file:///g:/TextEditor/src/core/constants/previewLimits.ts):
  - Created `BASE_PREVIEW_THRESHOLDS` mapping format-specific baseline soft limits (`maxLines`, `maxBytes`):
    - **Mermaid**: `400` lines / `25 KB` (CPU-heavy Dagre/D3 layout)
    - **JSON**: `2,500` lines / `200 KB` (AST and interactive DOM tree nodes)
    - **SVG**: `2,000` lines / `250 KB` (Vector DOM element injection)
    - **HTML**: `3,500` lines / `350 KB` (Sandboxed DOM / iframe updates)
    - **Markdown**: `5,000` lines / `500 KB` (AST parsing and syntax highlight)
    - **CSS**: `4,000` lines / `300 KB` (AST parsing and stylesheet injection)
    - **Console**: `3,000` lines / `200 KB` (JavaScript evaluation sandbox)
    - **Text**: `10,000` lines / `1 MB` (Plain text / tabular data)
  - Configured 4 hardware presets with multiplier coefficients (`eco`: 0.5x, `balanced`: 1.0x, `performance`: 2.5x, `unlimited`: Infinity).
  - Added helper functions `checkPreviewThreshold`, `getActivePreviewThreshold`, and `formatBytes`.

### 2. Editor & File Types (`src/core/types/`)

- [file.types.ts](file:///g:/TextEditor/src/core/types/file.types.ts):
  - Added `PreviewPerformancePreset` type (`"eco" | "balanced" | "performance" | "unlimited"`).
  - Added optional `previewPerfPreset?: PreviewPerformancePreset` to `EditorSettings`.

### 3. Tab & View State Management (`src/features/tabs/`)

- [store.ts](file:///g:/TextEditor/src/features/tabs/store.ts):
  - Added `previewPerfPreset: "balanced"` to `DEFAULT_SETTINGS`.
  - Added `bypassedPreviewTabIds: string[]` to `EditorState`.
  - Implemented `bypassPreviewThreshold(tabId)` to allow rendering on demand per tab for the active session.
  - Implemented `resetBypassedPreviewThreshold(tabId?)` and automated cleanup on `closeTab`.

### 4. Preview Protection & Fallback UI (`src/features/preview/`)

- [PreviewThresholdFallback.tsx](file:///g:/TextEditor/src/features/preview/components/PreviewThresholdFallback.tsx):
  - Created lightweight, clean fallback card displayed when a document exceeds soft limits in Split View.
  - Shows line count and payload size compared against active limits.
  - Provides actions: "Render Anyway" (bypass for session), "Switch to Preview Only View", and "Configure Performance Presets".
- [PreviewPanel.tsx](file:///g:/TextEditor/src/features/preview/components/PreviewPanel.tsx):
  - Added `useMemo` threshold check for active tab in `split` and `auto` modes.
  - Conditionally renders `PreviewThresholdFallback` instead of the heavy adapter component when thresholds are exceeded and not bypassed.
  - Hides adapter header actions while auto-paused.

### 5. Preferences Modal & Settings UI (`src/features/settings/`, `src/`)

- [PreviewTab.tsx](file:///g:/TextEditor/src/features/settings/components/preferences/PreviewTab.tsx):
  - Added "Split View Performance & Limits" section with a 4-step hardware profile slider (`Eco` -> `Balanced` -> `High Spec` -> `Unlimited`).
  - Added an interactive "Active Soft Limits for Current Profile" matrix reflecting dynamically updated limits per file type.
- [PreferencesModal.tsx](file:///g:/TextEditor/src/features/settings/components/PreferencesModal.tsx):
  - Added `initialCategory` prop support and state synchronization during render without cascading effect warnings.
  - Included `previewPerfPreset: "balanced"` in default reset action.
- [App.tsx](file:///g:/TextEditor/src/App.tsx):
  - Handled `open-preferences-modal` custom event to open the Preferences dialog directly to the requested category (e.g. `preview`).
