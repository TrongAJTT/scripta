# 🏗️ Scripta System Architecture

## 1. Architectural Philosophy: Feature-First & Clean Separation

Scripta follows a **Feature-First** architecture designed for modularity, maintainability, and clean domain isolation:

```text
src/
├── app/                  # Application Shell & Top Menu Layout
├── core/                 # Shared Domain Types, Storage Layer, Utilities
├── features/
│   ├── editor/           # CodeMirror 6 Engine, Toolbar, Status Bar, Find & Replace
│   ├── preview/          # Markdown, Mermaid Diagrams, Raw SVG & Image Viewer
│   ├── tabs/             # Tab Bar, Unsaved Indicators, Multi-tab State
│   └── file-system/      # Native File System Access API & Browser Fallbacks
└── shared/               # Reusable Components (SplitPane, Buttons, Modals)
```

---

## 2. Data Flow & State Management

```mermaid
graph TD
    User([User Interaction]) --> Actions[Zustand Store Actions]
    Actions --> State[Zustand State]
    State --> UI[React UI Components]
    State -->|Debounced Auto-Save (1s)| IDB[(IndexedDB Session Store)]
    IDB -.->|Restore on Startup| State
    Actions -->|Native Read / Write| FS[(Local File System API)]
    FS --> State
```

- **Zustand (`src/features/tabs/store.ts`)**: Central state orchestrator for active tabs, modified flags, preview modes, and editor settings.
- **IndexedDB (`idb`)**: Persists tabs and in-memory unsaved changes across browser reloads or unexpected crash recovery.
- **File System Access API (`src/features/file-system/data/fileSystemApi.ts`)**:
  - Direct local disk operations (`showOpenFilePicker`, `showSaveFilePicker`) for Chromium browsers.
  - Transparent HTML5 `<input type="file">` and Blob download fallback for legacy or unsupported browsers.

---

## 3. Code Editing Engine (CodeMirror 6)

- Built on modular dynamic **Compartments**:
  - `languageCompartment`: On-the-fly syntax switching across Markdown, TypeScript, JavaScript, HTML, CSS, JSON, Python, SVG, etc.
  - `themeCompartment`: Seamless switching between **One Dark** and Light themes.
  - `fontSizeCompartment` & `wrappingCompartment`: Dynamic font scaling and line wrapping.
- Hooks into `EditorView.updateListener` to emit real-time cursor positioning (`Ln`, `Col`, `Sel`) to the classic status bar without full component re-mounts.

---

## 4. Real-time File Viewing Engine (Live Preview)

- **Markdown**: High-performance AST generation with `marked`, sanitized against XSS using `DOMPurify`.
- **Mermaid Diagrams**: Embedded ```mermaid code blocks and standalone `.mmd` files dynamically render into interactive SVG diagrams.
- **Vector SVG**: Live vector rendering with smooth zoom controls.
- **Image Viewer**: Binary image decoding (`.png`, `.jpg`, `.webp`, `.gif`, `.bmp`) with pan and zoom capabilities.

---

## 5. PWA & Offline Caching Strategy (Workbox)

- Configured via `vite-plugin-pwa` using Workbox `generateSW`.
- Pre-caches core JavaScript chunks, web fonts, stylesheets, and SVG icons.
- Fully operational without network connectivity once installed.
