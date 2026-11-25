# Changelog

All notable user-facing changes to **Scripta** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-11-25

### Added

- **LaTeX Document Support**: Open, edit, and preview `.tex` / LaTeX documents directly in the live preview pane.
- **Collapsible Tab Groups**: Organize open tabs into color-coded, collapsible groups from the tab right-click menu or by dragging tabs into a group; groups are preserved across sessions and workspaces.
- **Sample Files**: Quickly open starter sample files for supported languages from **Help → Sample Files** or by holding / right-clicking the **`+`** (New Tab) button.
- **Resources & Storage Management**: View and clear cached offline resources (such as Python and LaTeX runtime assets) directly inside **Settings → Preferences**.
- **Rename in File Menu**: Added **Rename...** to the **File** menu for quick renaming of the active tab.
- **Reset Confirmation Prompts**: Added confirmation prompts before restoring Preferences or Keyboard Shortcuts to their default values.
- **Donate & About Links**: Added Donate menu options and support links in the About footer.

### Changed

- **Consistent Light & Dark Themes**: Refined visual consistency across dialogs, settings panels, console output, and preview status screens in both Light and Dark modes.
- **Faster Startup & Offline Python**: Language highlights load on demand to speed up initial load, and the Python runtime is cached for offline execution.

### Fixed

- **Mermaid Preview on Mobile & Desktop**:
  - Fixed the Preview Panel header overflowing on narrow mobile screens.
  - Added touch drag-to-pan and two-finger pinch-to-zoom support on mobile devices.
  - Enabled direct mouse-wheel and trackpad zooming on desktop without requiring `Ctrl`.

## [1.1.7] - 2026-09-24

### Added

- **Preview Session Memory**: Remembers table sorting, filtering, pagination, and view state per tab.
- **WYSIWYG Print & Export**: Improved print output to match the live preview layout.
- **CSV Styling Enhancements**: Expanded visual decoration options for CSV tables.

## [1.1.6] - 2026-09-23

### Added

- **CSV Decoration Rules**: Highlight and style cells/rows in CSV previews.
- **Go To Navigation**: Quickly jump to specific lines in the active document.
- **JSON Table View**: Inspect structured JSON data in an interactive table alongside tree/raw views.

### Changed

- **Performance Improvements**: Smoother editing and faster rendering for large files and data previews.

## [1.1.5] - 2026-09-20

### Added

- **Cloud Workspace Sync**: Sync workspaces to GitHub or Dropbox with optional password encryption.
- **Local Folder Integration**: Link and browse local project folders directly from the workspace.
- **Shortcut Mapper**: Customize keyboard shortcuts from **Settings → Shortcut Mapper...**.
- **Unicode / Hex Toggle**: Inspect and toggle Unicode / hexadecimal character representations.

## [1.1.4] - 2026-09-18

### Added

- **Initial Release**: Multi-tab hybrid text editor and live document viewer supporting Markdown, Mermaid diagrams, SVG, HTML, CSV, JSON, CSS, and in-browser Python execution.
