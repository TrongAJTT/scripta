# 🎨 Scripta Workbench Design System

Scripta is a **desktop-class web productivity workbench** (not a marketing landing page). Its visual language merges **Fluent 2** restraint (compact utility chrome, `1px` structural hairlines, clear surface layering) with **Material Design 3** tonal semantics (adaptive Dark/Light status containers, accessible contrast, and non-destructive state feedback).

---

## 1. Design Principles

1. **Calm Canvas, Zero Noise**: The editor and preview canvas are the primary focus. Avoid heavy drop shadows, oversized `rounded-2xl` marketing cards, or jarring full-screen error boxes.
2. **Tonal Surface Hierarchy**: Separate functional zones using subtle tonal steps and `1px` borders rather than heavy elevation.
3. **Dark & Light Parity**: Every color, border, and status container must use semantic CSS custom properties from `src/index.css`. Never hardcode Tailwind alert colors like `bg-red-950/40` or `text-red-300`.
4. **Non-Destructive Feedback**: During live editing (Mermaid, Markdown, LaTeX), preserve the last valid output when a syntax error occurs and show diagnostics in a docked `InlineBanner` (*stale-while-error*).

---

## 2. Four-Tier Surface Hierarchy

| Tier | Role | Tokens | Borders & Elevation |
| :--- | :--- | :--- | :--- |
| **Tier 0 — Canvas** | Code editor, preview document/diagram area | `--bg-editor`, `--bg-preview` | No shadow; optional `.bg-canvas-dots` for vector/diagram canvases |
| **Tier 1 — Workbench Chrome** | MenuBar, Toolbar, TabBar, Preview Header, StatusBar | `--bg-app`, `--bg-toolbar`, `--bg-statusbar`, `--bg-tab-inactive` | `1px` `--border-color` / `--border-subtle` hairlines, flat |
| **Tier 2 — Elevated Popovers** | Dropdowns, Context Menus, Floating Search | `--bg-surface-elevated` | `1px` `--border-color`, `rounded-md`, subtle shadow |
| **Tier 3 — Modals & Dialogs** | Preferences, Cloud Sync, Script Manager, Confirmations | `--bg-surface` over `bg-black/60 backdrop-blur-xs` | `1px` `--border-color`, `rounded-md`, `shadow-xl` |

---

## 3. Radius, Density & Typography Scale

* **Control Radii**:
  * `rounded` (`4px`): Buttons, inputs, badges, toolbar icon buttons, inline `kbd` hints.
  * `rounded-md` (`6px`): Dropdown menus, context menus, modal windows, dialog windows.
  * `rounded-lg` (`8px`): Inline banners, diagnostic detail blocks, code blocks.
* **Workbench Chrome Heights**:
  * StatusBar: `h-6` (`24px`), `text-[11px] font-mono`.
  * Preview Panel Header / TabBar: `h-9` (`36px`), `text-xs`.
* **Typography**:
  * UI Labels: `11px–12px` (`text-[11px]` / `text-xs`).
  * Section / Modal Titles: `14px` (`text-sm font-semibold`).
  * Code & Metrics: `var(--font-mono)`.

---

## 4. Semantic Status Tokens

Defined in `src/index.css` for both `:root` (Dark) and `html.light` (Light):

* **Info**: `--status-info-bg`, `--status-info-border`, `--status-info-text`
* **Success**: `--status-success-bg`, `--status-success-border`, `--status-success-text`
* **Warning**: `--status-warning-bg`, `--status-warning-border`, `--status-warning-text`
* **Danger / Error**: `--status-danger-bg`, `--status-danger-border`, `--status-danger-text`

---

## 5. Standardized UI State Patterns

| State | Component | Rules |
| :--- | :--- | :--- |
| **Empty** | `EmptyState` (`src/shared/components/EmptyState.tsx`) | Flat & cardless on `--bg-preview` / `--bg-app`. Muted `stroke-[1.25]` icon, concise title, 1-line description, optional compact action buttons. |
| **Live Error (Recoverable)** | `InlineBanner` (`src/shared/components/InlineBanner.tsx`) | Docked at the top of the panel (`variant="error"`, `compact`). Preserve the last valid render underneath whenever possible. |
| **Blocking Parse Error** | `EmptyState` (`tone="danger"`, `detail={...}`) | Flat centered diagnostic with semantic `--status-danger-*` monospace detail block. |
| **Zoomable Visual Canvas** | `PreviewZoomControls` (`src/features/preview/components/PreviewZoomControls.tsx`) | Unified header toolbar (`ZoomOut`, `%`, `ZoomIn`, optional `Fit`, `Reset`) for `MermaidAdapter`, `SvgAdapter`, and `ImageAdapter`. |
