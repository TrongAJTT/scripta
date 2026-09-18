# 🤖 Project Rules & Guidelines for Antigravity Agents

Welcome to the **Scripta** project. These rules and conventions are **mandatory** for all AI coding agents working on this codebase.

---

## 1. 🏛️ Architectural Integrity (Feature-First)

- **Feature-First Directory Structure**: Domain logic must reside under `src/features/<feature_name>/` (e.g., `editor`, `preview`, `tabs`, `file-system`).
- **Separation of Concerns**:
  - React components only handle DOM rendering and user interaction bindings.
  - Zustand stores and custom hooks handle state transitions, business rules, and computations.
- **Shared Utilities**: Only truly generic, cross-feature components belong in `src/shared/`. Domain types reside in `src/core/types/`. Storage operations belong in `src/core/utils/idbStorage.ts`.

---

## 2. 🛡️ Strict TypeScript Standards

- **Zero Tolerance for Unchecked `any`**:
  - Define explicit interfaces or types for all payloads, function signatures, and state slices.
- **Verbatim Module Syntax**:
  - The project enforces `"verbatimModuleSyntax": true`. All type-only imports **must** use explicit type syntax:
    ```ts
    import type {
      FileTab,
      SupportedLanguage,
    } from "../../core/types/file.types";
    ```
- **Clean Linter State**:
  - Never leave unused imports, variables, or unhandled errors.
  - Run `pnpm lint` and ensure **0 errors and 0 warnings** before finishing any iteration.
- **CodeMirror 6 Lifecycle**:
  - Do not unmount and re-create `EditorView` instances on minor setting changes. Use dynamic `Compartment` configurations (`languageCompartment`, `themeCompartment`, `fontSizeCompartment`).

---

## 3. 🎨 Design System & Theme Consistency

- Do not hardcode ad-hoc hex colors into inline styles.
- Always use the semantic CSS theme tokens defined in `src/index.css`:
  - Backgrounds: `var(--bg-app)`, `var(--bg-surface)`, `var(--bg-editor)`, `var(--bg-toolbar)`, `var(--bg-statusbar)`
  - Accents: `var(--accent)` (signature emerald green), `var(--accent-blue)`, `var(--accent-purple)`
  - Text: `var(--text-main)`, `var(--text-muted)`, `var(--text-highlight)`
  - Borders: `var(--border-color)`, `var(--border-subtle)`
- Verify visual harmony in both **Dark** and **Light** modes.

---

## 4. 💾 Safe File I/O & State Persistence

- **File System Access API**:
  - Always wrap `showOpenFilePicker()` and `showSaveFilePicker()` in `try...catch` blocks and handle `AbortError` gracefully (when user cancels file selection).
  - Preserve the fallback mechanism (`<input type="file">` and Blob download) for cross-browser safety.
- **IndexedDB Auto-Save**:
  - Any tab mutation (create, close, edit content) must trigger a debounced (1s) session save to IndexedDB to guard against accidental data loss.

---

## 5. 🧩 UI Action & Menu Composition (Anti-Duplication)

- **DRY Menu Structures**:
  - Never duplicate identical action lists or dropdown menu items across `MenuBar`, `Toolbar`, or context menus.
  - When actions or submenus appear in multiple surfaces (e.g., Bookmarks, Workspaces, Share, Encoding), encapsulate them into a single reusable feature component (e.g., `src/features/<feature>/components/<Feature>MenuItems.tsx`).
- **Single Source of Command Truth**:
  - Always bind actions to existing command identifiers (`commandId`) and handlers from `useEditorCommands` or the relevant feature hook so shortcuts and labels remain globally unified.

---

## 6. 📝 Conventional Commits

All git commits must follow the **Conventional Commits** specification:

- `feat: <description>` (New feature)
- `fix: <description>` (Bug fix)
- `docs: <description>` (Documentation update)
- `style: <description>` (Formatting / CSS tweaks)
- `refactor: <description>` (Code restructuring without behavior changes)
- `chore: <description>` (Tooling or dependency updates)
