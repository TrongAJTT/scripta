---
name: texteditor-guide
description: >-
  Provides specialized guidelines, architectural patterns, and procedures for extending
  and maintaining the Scripta codebase (CodeMirror 6, Live Markdown & Mermaid preview,
  File System Access API, Zustand store, and IndexedDB session management).
---

# Scripta Developer Skill & Runbook

This skill outlines operational procedures and best practices for developing on **Scripta**.

---

## When to Activate This Skill

- Adding a new syntax language or CodeMirror 6 extension.
- Adding a new live preview renderer (e.g., CSV table preview, MathJax/KaTeX, PlantUML).
- Modifying the multi-tab state management or IndexedDB persistence.
- Enhancing File System Access API interactions or drag-and-drop file handlers.
- Debugging UI layout split-pane, themes, or PWA caching behavior.

---

## 1. CodeMirror 6 Extension Workflow

When modifying or adding features to `src/features/editor/components/CodeEditor.tsx`:

1. **Use Compartments for Dynamic Configuration**:
   Never destroy and re-create `EditorView` when changing themes, font sizes, or syntax.

   ```ts
   const languageCompartment = new Compartment();
   // Dispatch reconfigure effect:
   view.dispatch({
     effects: languageCompartment.reconfigure(newLanguageExtension),
   });
   ```

2. **Handle Cursor Updates Efficiently**:
   Use `EditorView.updateListener` and check `update.selectionSet || update.docChanged` before dispatching cursor position (`Ln`, `Col`, `Sel`) to the Zustand store.

3. **Keymaps & Shortcuts**:
   Bind custom shortcuts using `keymap.of([...])` and always prepend before default keymaps to take precedence.

---

## 2. Live Preview Extension Workflow

When adding new preview capabilities in `src/features/preview/components/PreviewPanel.tsx`:

1. **Safety First**:
   All dynamic HTML rendering must pass through `DOMPurify.sanitize(html)` to avoid XSS vulnerabilities.
2. **Mermaid Rendering**:
   Mermaid diagrams must be initialized once (`mermaid.initialize`) and rendered asynchronously with unique element IDs:
   ```ts
   const id = `mermaid-${Date.now()}`;
   const { svg } = await mermaid.render(id, code);
   ```
   Always catch syntax errors gracefully so that invalid diagram code does not crash the entire preview panel.

---

## 3. UI Command & Menu Composition Pattern

When exposing features or commands to user-facing menus:
1. **Encapsulate Menu Items**:
   If a feature exposes actions in both `MenuBar` and `Toolbar` (or mobile menus), do NOT duplicate `<DropdownMenu.Item>` trees inline.
2. **Create Reusable Submenu Components**:
   Place `<Feature>MenuItems.tsx` under `src/features/<feature>/components/`. Export a component returning the list of items, separators, and dynamic sub-lists.
3. **Keep Commands Hook-Driven**:
   Expose execution methods in `useEditorCommands` or custom feature hooks, allowing both keyboard shortcuts and UI buttons to share exact execution paths.

---

## 4. Testing & Verification Runbook

Before submitting changes:

```sh
# 1. Check for linter errors or warnings
pnpm lint

# 2. Verify TypeScript compile & production bundle
pnpm build
```

Both commands must exit with code 0.
