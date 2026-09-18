# 📖 Features & User Guide

Scripta marries lightning speed and ergonomics with an interactive **Live File Viewer** for modern developer workflows.

---

## ⌨️ Standard Keyboard Shortcuts

| Shortcut              | Function        | Description                                                 |
| --------------------- | --------------- | ----------------------------------------------------------- |
| **Ctrl + N**          | New Tab         | Creates a new in-memory document (`new n`)                  |
| **Ctrl + O**          | Open File       | Invokes the native file picker to open files from disk      |
| **Ctrl + S**          | Save File       | Writes directly to disk (or triggers Save As for new files) |
| **Ctrl + W**          | Close Tab       | Closes the active file tab                                  |
| **Ctrl + F**          | Find & Replace  | Opens floating Find & Replace dialog with Regex support     |
| **Tab / Shift + Tab** | Indent / Dedent | Code indentation using standard 2-space tab width           |

---

## 🎛️ User Interface Overview

### 1. Classic Desktop Menu Bar

- **File**: New, Open, Save, Save As, Close All.
- **Edit**: Find & Replace dialog.
- **View**: Toggle Split / Editor Only / Preview Only views, Switch Themes.
- **Language**: Manually re-assign language syntax (Markdown, TS, JS, HTML, CSS, JSON, Python, SVG, Plaintext).
- **Help**: About and application information.

### 2. Classic Quick-Action Toolbar

- Single-click action buttons: New, Open, Save, Save As, Search, Zoom In, Zoom Out.
- **Workspace Layout Switcher**:
  - `Editor`: Focused single-pane code editing.
  - `Split`: Side-by-side editor and live preview with draggable resize handle.
  - `Preview`: Full-width rendering of Markdown, Mermaid, SVG, or Images.
- **Theme Switcher**: Cycle between Dark (Catppuccin Mocha), Light, and System modes.

### 3. Multi-tab System

- **Unsaved Indicator**: Pulsing red dot next to tab title indicating pending modifications (`isModified`).
- **Tab Close**: Fast `x` button per tab.
- **Tab Creation**: Quick `+` button or double-clicking the empty tab bar area.
- **Context Actions**: Right-click to close other tabs (`Close Others`).

### 4. Status Bar Metrics

- **Cursor Metrics**: Real-time `Ln : x  Col : y  Sel : z` (selected character count).
- **Document Size**: `Lines : n  Length : m  Size : KB/MB`.
- **Save Status**: `Saved` (green) or `Modified` (red).
- **Line Endings**: `Windows (CRLF)` vs `Unix (LF)`.
- **Character Encoding**: `UTF-8`.
- **Active Syntax**: `MARKDOWN`, `TYPESCRIPT`, etc.

### 5. Seamless Drag & Drop

- Drag single or multiple files from your desktop or file manager into the window.
- Automatically creates dedicated tabs for code, markdown, diagrams, and image files.
