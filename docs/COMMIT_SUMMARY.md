# Commit Summary

> [!IMPORTANT]
> This document records the commit message and detailed change log for the **current staged commit**.
> Prior to creating any new commit, the contents below MUST be **COMPLETELY REWRITTEN** to reflect only the changes belonging to that specific commit, rather than appending new entries.

## 📌 Commit Message

```text
feat(workspace): add folder workspace integration, folder-sync popup & information modals

- Workspace Folder Integration & Manifest:
  - Created `workspaceFolderService` integrating the File System Access API (FSA) to open local folders as workspaces, link folders to active workspaces, and read/write the `.workspace.scripta` manifest file.
  - Implemented automatic fallback to JSZip downloading for non-FSA browsers when exporting a workspace folder.
  - Added IndexedDB directory handle persistence and retrieval (`idbStorage.ts`) with permission query/request helpers.
  - Added folder linking metadata (`folderName`, `folderLinkedAt`) to `WorkspaceSession` in `workspace.types.ts` and `workspaceStore.ts`.

- Unified Shared Menus (DRY / Anti-Duplication):
  - Created reusable `WorkspaceFolderSyncMenuItems` component containing:
    - "Open Folder as Workspace" (`workspace.openFolder` / `Alt+0`)
    - "Save Workspace as Folder..." (`workspace.saveFolder` / `Alt+Shift+S`)
    - "Cloud Sync & Backup..." (`workspace.cloudSync` / `Alt+Shift+C`)
  - Integrated `WorkspaceFolderSyncMenuItems` as a dedicated submenu under "Workspace" in MenuBar (File menu).
  - Replaced single "Cloud Save" button on Toolbar with a parent "Folder & Cloud Sync" dropdown menu (desktop) and accordion submenu (mobile).
  - Cleaned up duplicated folder/cloud items from `WorkspaceMenuItems`.

- Modals & Commands:
  - Added `WorkspaceInfoModal`: View workspace details (name, description, tabs count, linked folder, cloud sync status) and edit metadata inline. Uses `createPortal` to `document.body` for robust overlay stacking.
  - Added `TabInfoModal`: View detailed active file metadata (tab name, language, size, line/character count, line ending, encoding, FSA status).
  - Registered `workspace.info` and `file.tabInfo` commands in `registry.ts` and wired global event listeners in `App.tsx`.
```

---

## 📝 Detailed Change Log

### 1. Workspace Folder Service & Types (`src/features/workspace/`, `src/core/`)

- [workspaceFolderService.ts](file:///g:/TextEditor/src/features/workspace/services/workspaceFolderService.ts): Core service handling `openFolderAsWorkspace`, `saveWorkspaceToFolder`, `saveWorkspace`, `linkFolderToWorkspace`, and `unlinkFolder` via File System Access API with `.workspace.scripta` manifest support.
- [workspace.types.ts](file:///g:/TextEditor/src/core/types/workspace.types.ts): Added `folderName` and `folderLinkedAt` properties to `WorkspaceSession`, plus manifest interfaces.
- [workspaceStore.ts](file:///g:/TextEditor/src/features/workspace/store/workspaceStore.ts): Added folder linkage state fields and updater actions (`updateWorkspaceInfo`).
- [idbStorage.ts](file:///g:/TextEditor/src/core/utils/idbStorage.ts): Added `saveFolderHandle`, `loadFolderHandle`, and `deleteFolderHandle` using IndexedDB structured cloning for native `FileSystemDirectoryHandle`.

### 2. UI Components & Shared Menus (`src/features/workspace/`, `src/features/tabs/`, `src/features/editor/`)

- [WorkspaceFolderSyncMenuItems.tsx](file:///g:/TextEditor/src/features/workspace/components/WorkspaceFolderSyncMenuItems.tsx): Reusable component grouping folder import/export and cloud sync options.
- [WorkspaceMenuItems.tsx](file:///g:/TextEditor/src/features/workspace/components/WorkspaceMenuItems.tsx): Removed duplicated folder/sync items; enhanced "View Information" with global event fallback (`open-workspace-info-modal`).
- [WorkspaceInfoModal.tsx](file:///g:/TextEditor/src/features/workspace/components/WorkspaceInfoModal.tsx): Interactive modal to inspect workspace details, edit name/description, view tab inventory, link/unlink folders, and launch sync.
- [TabInfoModal.tsx](file:///g:/TextEditor/src/features/tabs/components/TabInfoModal.tsx): Modal presenting active document technical metrics and file storage status.
- [Toolbar.tsx](file:///g:/TextEditor/src/features/editor/components/Toolbar.tsx): Replaced the standalone Cloud icon button with the "Folder & Cloud Sync" dropdown menu on desktop and accordion submenu in the mobile drawer.

### 3. Command Architecture & App Integration (`src/core/commands/`, `src/app/`)

- [types.ts](file:///g:/TextEditor/src/core/commands/types.ts): Added `workspace.info` to `CommandId`.
- [registry.ts](file:///g:/TextEditor/src/core/commands/registry.ts): Registered `workspace.info` command under the "File" category.
- [MenuBar.tsx](file:///g:/TextEditor/src/app/layout/MenuBar.tsx): Added "Folder & Cloud Sync" submenu directly under "Workspace" in the File menu.
- [App.tsx](file:///g:/TextEditor/src/App.tsx): Registered `open-workspace-info-modal` event listener, mapped `workspace.info` in keyboard/command map, and mounted `WorkspaceInfoModal` and `TabInfoModal`.
