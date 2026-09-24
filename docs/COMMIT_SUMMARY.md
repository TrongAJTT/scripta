# Commit Summary

> [!IMPORTANT]
> This document records the commit message and detailed change log for the **current staged and upcoming commit**.
> Prior to creating any new commit, the contents below MUST be **COMPLETELY REWRITTEN** to reflect only the changes belonging to that specific commit, rather than appending new entries.

## 📌 Commit Message

```text
feat: add dev console bridge, update modal refinements, and mobile dropdown touch guard

- Add centralized dev console bridge adapter (src/core/dev/devConsoleBridge.ts) intercepting /version.json in dev mode without contaminating production services.
- Refine AppUpdateModal layout with improved spacing, rounded banners, and reactive event listener for live mock testing.
- Fix mobile dropdown top-dialog backdrop event absorption to prevent ghost touch bleed-through onto underlying UI.
- Clean up MenuBar sub-menu alignment property.
```

---

## 📝 Detailed Change Log

### 1. Developer Console Bridge (`src/core/dev/`, `src/main.tsx`)

- [devConsoleBridge.ts](file:///g:/TextEditor/src/core/dev/devConsoleBridge.ts) (**NEW**):
  - Exposes `window.__SCRIPTA__.updates` namespace alongside root shortcuts `__triggerAppUpdate` and `__resetAppUpdate` for local developer console testing.
  - Implements network-level `window.fetch` interception for `/version.json` requests during development (`import.meta.env.DEV`), completely isolating mock states away from `updateService.ts`.
  - Dispatches `open-app-update-modal` custom event on mock trigger/reset.
- [main.tsx](file:///g:/TextEditor/src/main.tsx):
  - Automatically initializes `initDevConsoleBridge()` conditionally when running under `import.meta.env.DEV`, allowing zero-overhead tree shaking in production builds.

### 2. App Update Modal Refinements (`src/features/settings/components/`)

- [AppUpdateModal.tsx](file:///g:/TextEditor/src/features/settings/components/AppUpdateModal.tsx):
  - Subscribes to the `open-app-update-modal` custom event while the dialog is open to trigger immediate re-checks when mock versions change in console.
  - Refines the "Version is ready to install" prompt banner into a padded rounded card (`p-3 rounded-md border border-[var(--accent)]/40 bg-[var(--accent)]/10`).
  - Cleans up button iconography and cleans up border spacing across cache diagnosis and bottom safety notes.

### 3. Mobile Dropdown Menu Touch Isolation (`src/shared/components/`)

- [DropdownMenu.tsx](file:///g:/TextEditor/src/shared/components/DropdownMenu.tsx):
  - When `topDialogOnMobile` is active, the dimmed full-screen backdrop now swallows `onPointerDown`, `onMouseDown`, `onTouchStart`, and `onClick` with `preventDefault()` and `stopPropagation()`.
  - Prevents unwanted ghost clicks from activating underlying editor text selections, buttons, or tab switches when tapping outside to close the mobile menu.
  - Bypasses document-level `pointerdown` listener when top dialog mode handles outside taps.

### 4. MenuBar Layout (`src/app/layout/`)

- [MenuBar.tsx](file:///g:/TextEditor/src/app/layout/MenuBar.tsx):
  - Removed obsolete `alignGutter` attribute from Language submenu.
