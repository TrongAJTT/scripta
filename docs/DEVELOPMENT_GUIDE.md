# 💻 Development & Extension Guide

## 1. Environment Requirements
- **Node.js**: >= 20.x (Node 22+ or 24+ recommended)
- **Package Manager**: `pnpm` >= 10.x (Repository uses `pnpm@12.3.4`)

---

## 2. Common Commands (NPM Scripts)

```sh
# Install all workspace dependencies
pnpm install

# Start local development server (Vite)
pnpm dev

# Run Oxlint for code quality and convention checks
pnpm lint

# Compile TypeScript and bundle production PWA
pnpm build

# Preview production build locally
pnpm preview
```

---

## 3. Extending Features

### Adding a New Language to CodeMirror 6:
1. Install the respective language package (e.g., `@codemirror/lang-rust`, `@codemirror/lang-go`).
2. Add the language identifier to `SupportedLanguage` in `src/core/types/file.types.ts`.
3. Add the file extension mapping in `src/core/utils/fileDetection.ts`.
4. Configure `getLanguageExtension` in `src/features/editor/components/CodeEditor.tsx`.
5. Add an entry in the Menu Bar dropdown at `src/app/layout/MenuBar.tsx`.

### Adding a New Preview Viewer:
1. Define the viewer type under `previewType` (`'markdown' | 'mermaid' | 'svg' | 'image' | 'custom'`).
2. Implement the parsing or rendering branch inside `src/features/preview/components/PreviewPanel.tsx`.

---

## 4. Coding Standards
- **TypeScript**: Strict mode with `verbatimModuleSyntax: true`. Always use `import type { ... }` when importing interfaces or type aliases.
- **Design Tokens**: Style UI elements using design tokens from `src/index.css` (`var(--bg-editor)`, `var(--accent)`, `var(--text-main)`) rather than arbitrary hardcoded hex codes.
- **Conventional Commits**: Enforce standard commit message prefixes: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `chore:`.
