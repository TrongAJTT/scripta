# Scripta 🚀

> A modern Web PWA hybrid blending lightning-fast responsiveness with an interactive **Live File Viewer** (Markdown, Mermaid diagrams, vector SVG, and image viewing).

![Scripta Interface](https://raw.githubusercontent.com/placeholder/texteditor-demo.png)

---

## ✨ Key Features

- 📑 **Multi-tab Workflow**: Open dozens of files simultaneously with real-time modified indicators (`•`), tab switching, and context controls.
- ⚡ **Native File System Access API**: Read, Edit, and Save (`Ctrl+S`) files directly to your local computer with automatic fallback for all browsers.
- 📊 **Real-time Live Preview Engine**:
  - **Markdown**: Instant HTML rendering via `marked` with `DOMPurify` security.
  - **Mermaid Diagrams**: Dynamic AST parsing and interactive vector SVG diagram rendering.
  - **Vector SVG & Image Viewer**: Inspect raw vector SVGs and view `.png`, `.jpg`, `.webp`, `.gif` files with interactive zoom controls.
- 🎛️ **Classic Desktop Tooling**:
  - Top Menu Bar: `File`, `Edit`, `View`, `Language`, `Help`.
  - Classic Toolbar: New, Open, Save, Save As, Find/Replace, Zoom In/Out, Layout toggle, and Theme switcher.
  - Comprehensive Status Bar: Real-time `Ln`, `Col`, `Sel`, `Lines`, `Length`, `Size`, `CRLF / LF`, `UTF-8`, and active language.
- 🔍 **Floating Find & Replace Dialog**: Regex search, case matching, single replace, and replace all.
- 🌓 **Zero-FOUC Dark/Light Themes**: Modern Catppuccin Mocha slate theme with system mode sync.
- 💾 **Automatic Session Recovery**: IndexedDB-backed session persistence restores all tabs and unsaved edits upon browser refresh.
- 📱 **Installable PWA**: Offline-first architecture powered by Workbox and service workers.

---

## 🛠️ Tech Stack

- **Runtime & Framework**: [Vite 8](https://vitejs.dev/) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (Strict mode)
- **Editor Engine**: [CodeMirror 6](https://codemirror.net/) (Dynamic language & theme compartments)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + CSS Semantic Theme Tokens
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Persistence**: [idb](https://github.com/jakearchibald/idb) (IndexedDB Wrapper)
- **Preview & Rendering**: [Marked](https://marked.js.org/) + [Mermaid.js](https://mermaid.js.org/) + [DOMPurify](https://github.com/cure53/DOMPurify)
- **PWA**: [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) + Workbox

---

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js**: >= 20.x (Node 22+ or 24+ recommended)
- **pnpm**: >= 10.x (`pnpm@12.3.4` used)

### 2. Installation

```sh
# Clone repository
git clone https://github.com/your-username/TextEditor.git
cd TextEditor

# Install dependencies
pnpm install
```

### 3. Development

```sh
pnpm dev
# App starts at http://localhost:5173/
```

### 4. Production Build & Linting

```sh
# Run code quality checks
pnpm lint

# Build production bundle and PWA service worker
pnpm build

# Preview production build locally
pnpm preview
```

---

## 📚 Documentation

Detailed documentation is available in the [`docs/`](./docs/) directory:

- [System Architecture](./docs/ARCHITECTURE.md)
- [User Guide & Shortcuts](./docs/FEATURES_USER_GUIDE.md)
- [Development & Extension Guide](./docs/DEVELOPMENT_GUIDE.md)
- [Cloudflare Pages Deployment Guide](./docs/DEPLOYMENT_CLOUDFLARE.md)

---

## 📄 License

This project is open-source under the MIT License.
