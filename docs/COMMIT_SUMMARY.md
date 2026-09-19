# Commit Summary

> [!IMPORTANT]
> This document records the commit message and detailed change log for the **current staged commit**.
> Prior to creating any new commit, the contents below MUST be **COMPLETELY REWRITTEN** to reflect only the changes belonging to that specific commit, rather than appending new entries.

## 📌 Commit Message

```text
feat: implement Cloud Workspace Sync with GitHub & Dropbox providers

- Cloud Storage Architecture:
  - Multi-provider client-side storage adapters: GitHub (Personal Access Token & REST API) and Dropbox (OAuth 2.0 PKCE without backend proxy).
  - Centralized storage endpoint constants, types, and modular provider configuration views (`GitHubConfigForm`, `DropboxConfigView`).
  - Zero-knowledge client-side encryption: AES-GCM-256 with PBKDF2 key derivation for encrypted cloud backups.
  - Client-side token encryption: Non-extractable Web Crypto API device keys stored in IndexedDB (`device_keys`) protecting authentication credentials in `cloud_auth`.

- Workspace Sync & Conflict Management:
  - Filename-encoded metadata: Format `workspaces/{Name}__{tabs}tabs__{timestamp}__{id}.{json|enc}` for O(1) tab counts and last-modified dates across all cloud providers without redundant metadata fetches.
  - Optimized GitHub cache bypass (`_t` query parameter) and pre-check file updates to prevent 404 console errors.
  - Interactive version conflict resolution: 3-way choice (Cancel, Overwrite, or Restore as Copy) with visual side-by-side comparison of local vs cloud tabs and timestamps.
  - Immediate editor tab activation upon workspace restoration (`applyWorkspaceSession`), eliminating short-circuiting bugs.

- UI & UX Refinements:
  - Unified `CloudSyncModal` with 3 segmented views: Sync Current (with 4-state real-time sync badges), Cloud List, and Connection Settings.
  - Streamlined single-row Cloud List item layout with Just-In-Time master password prompt dialog (`dialog.prompt` with `inputType="password"`).
  - Dismissible `InlineBanner` component with internal state and auto-dismiss timer for in-modal feedback.
  - Visual cloud sync indicator on Toolbar and Workspace popup menus with accent color shifts and Cloud badge markers.
  - Centralized `formatDateTime` utility in `dateUtils.ts`.
```

---

## 📝 Detailed Change Log

### 1. Cloud Storage Core & Adapters (`src/features/storage/`)

- [storageEndpoints.ts](file:///g:/TextEditor/src/features/storage/constants/storageEndpoints.ts): Centralized endpoint URLs, REST paths, OAuth URLs, and PAT creation links for GitHub & Dropbox.
- [storage.types.ts](file:///g:/TextEditor/src/features/storage/types/storage.types.ts): Unified interfaces for `CloudStorageAdapter`, `StorageItem`, `GitHubAuthConfig`, `DropboxAuthConfig`, and provider status.
- [cloudStorageStore.ts](file:///g:/TextEditor/src/features/storage/store/cloudStorageStore.ts): Zustand store for connection states, provider credentials, and status initialization.
- [githubAdapter.ts](file:///g:/TextEditor/src/features/storage/adapters/githubAdapter.ts): Direct GitHub API integration with commit sha resolution, cache-busting, and branch handling.
- [dropboxAdapter.ts](file:///g:/TextEditor/src/features/storage/adapters/dropboxAdapter.ts): Pure client-side Dropbox integration with OAuth 2.0 PKCE, code verifier generation, and token refresh.
- [workspaceSyncService.ts](file:///g:/TextEditor/src/features/storage/services/workspaceSyncService.ts): End-to-end workspace sync orchestration, filename metadata parsing, upload deduplication, and conflict resolution dialog comparing local vs cloud versions.
- [GitHubConfigForm.tsx](file:///g:/TextEditor/src/features/storage/components/providers/GitHubConfigForm.tsx): Modular settings form for GitHub token, owner, repository, and branch.
- [DropboxConfigView.tsx](file:///g:/TextEditor/src/features/storage/components/providers/DropboxConfigView.tsx): Modular OAuth connection and disconnect view for Dropbox.
- [CloudSyncModal.tsx](file:///g:/TextEditor/src/features/storage/components/CloudSyncModal.tsx): Feature modal with segmented views (Sync Current with real-time status badges, Cloud List with single-row layout and JIT password prompt, and Connection Settings).

### 2. Security & Core Utilities (`src/core/`)

- [cryptoUtils.ts](file:///g:/TextEditor/src/core/utils/cryptoUtils.ts): Web Crypto API AES-GCM-256 encryption/decryption with PBKDF2 key derivation, IV salting, device key generation, and payload validation.
- [idbStorage.ts](file:///g:/TextEditor/src/core/utils/idbStorage.ts): IndexedDB upgraded to v6 with `device_keys` store for non-extractable CryptoKey persistence, auto-encrypting tokens before writing to `cloud_auth`.
- [dateUtils.ts](file:///g:/TextEditor/src/core/utils/dateUtils.ts): Centralized `formatDateTime` utility for localized date and time representation across the application.
- [app.ts](file:///g:/TextEditor/src/core/constants/app.ts): Cloud storage redirect URI and application constants.
- [workspace.types.ts](file:///g:/TextEditor/src/core/types/workspace.types.ts): Added `lastSyncedAt` and `lastSyncedProvider` to `WorkspaceSession`.

### 3. Workspace Store & Restoration (`src/features/workspace/`)

- [workspaceStore.ts](file:///g:/TextEditor/src/features/workspace/store/workspaceStore.ts): Added `applyWorkspaceSession` to directly persist and load restored tabs into `useEditorStore` (resetting modified flags and canceling pending saves), plus `markWorkspaceSynced`.
- [WorkspaceMenuItems.tsx](file:///g:/TextEditor/src/features/workspace/components/WorkspaceMenuItems.tsx): Added cloud indicator icon and provider title next to tab counts for synced workspaces.

### 4. UI Components & Dialog System (`src/shared/`, `src/app/`, `src/features/editor/`)

- [dialogStore.ts](file:///g:/TextEditor/src/shared/dialog/dialogStore.ts) & [GlobalDialogHost.tsx](file:///g:/TextEditor/src/shared/dialog/GlobalDialogHost.tsx): Added `inputType?: "text" | "password"` support to `dialog.prompt` for secure password entry.
- [InlineBanner.tsx](file:///g:/TextEditor/src/shared/components/InlineBanner.tsx): Reusable dismissible notification banner with auto-dismiss and transition animations.
- [Toolbar.tsx](file:///g:/TextEditor/src/features/editor/components/Toolbar.tsx): Added cloud indicator dot and accent color shifts to the active workspace Folder button when synced; added Quick Cloud Sync button.
- [MenuBar.tsx](file:///g:/TextEditor/src/app/layout/MenuBar.tsx): Added "Cloud Sync & Backup..." menu item under File menu.
- [App.tsx](file:///g:/TextEditor/src/App.tsx): Registered `CloudSyncModal` and global event listener `open-cloud-sync-modal`.

