import React, { Suspense, lazy, useEffect, useState, useCallback } from "react";
import { useEditorStore } from "./features/tabs/store";
import { MenuBar } from "./app/layout/MenuBar";
import { Toolbar } from "./features/editor/components/Toolbar";
import { TabBar } from "./features/tabs/components/TabBar";
import { CodeEditor } from "./features/editor/components/CodeEditor";
import { PreviewPanel } from "./features/preview/components/PreviewPanel";
import { StatusBar } from "./features/editor/components/StatusBar";
import { SplitPane } from "./shared/components/SplitPane";
import type { SettingsCategory } from "./features/settings/components/PreferencesModal";
import { useScriptStore } from "./features/scripts/store/scriptStore";
import { useWorkspaceStore } from "./features/workspace/store/workspaceStore";
import { useCloudStorageStore } from "./features/storage/store/cloudStorageStore";
import { initSystemThemeListener } from "./features/settings/services/themeService";
import {
  checkForUpdates,
  shouldPerformAutoCheck,
} from "./features/settings/services/updateService";
import type { ScriptMetadata } from "./features/scripts/types/script.types";
import { FileCode2 } from "lucide-react";
import { GlobalDialogHost } from "./shared/dialog/GlobalDialogHost";
import { useEditorCommands } from "./features/editor/hooks/useEditorCommands";
import { useGlobalShortcuts } from "./features/editor/hooks/useGlobalShortcuts";
import { useFileDrop } from "./features/editor/hooks/useFileDrop";
import { FileDropOverlay } from "./features/editor/components/FileDropOverlay";

const MobileTabDrawer = lazy(() =>
  import("./features/tabs/components/MobileTabDrawer").then((m) => ({
    default: m.MobileTabDrawer,
  })),
);
const FindReplaceModal = lazy(() =>
  import("./features/editor/components/FindReplaceModal").then((m) => ({
    default: m.FindReplaceModal,
  })),
);
const ExternalFileAlertModal = lazy(() =>
  import("./features/editor/components/ExternalFileAlertModal").then((m) => ({
    default: m.ExternalFileAlertModal,
  })),
);
const ShortcutMapperModal = lazy(() =>
  import("./features/settings/components/ShortcutMapperModal").then((m) => ({
    default: m.ShortcutMapperModal,
  })),
);
const PreferencesModal = lazy(() =>
  import("./features/settings/components/PreferencesModal").then((m) => ({
    default: m.PreferencesModal,
  })),
);
const ScriptManagerModal = lazy(() =>
  import("./features/scripts/components/ScriptManagerModal").then((m) => ({
    default: m.ScriptManagerModal,
  })),
);
const ScriptRunModal = lazy(() =>
  import("./features/scripts/components/ScriptRunModal").then((m) => ({
    default: m.ScriptRunModal,
  })),
);
const AppUpdateModal = lazy(() =>
  import("./features/settings/components/AppUpdateModal").then((m) => ({
    default: m.AppUpdateModal,
  })),
);
const AboutModal = lazy(() =>
  import("./features/settings/components/AboutModal").then((m) => ({
    default: m.AboutModal,
  })),
);
const InstallAppModal = lazy(() =>
  import("./features/settings/components/InstallAppModal").then((m) => ({
    default: m.InstallAppModal,
  })),
);
const CloudSyncModal = lazy(() =>
  import("./features/storage/components/CloudSyncModal").then((m) => ({
    default: m.CloudSyncModal,
  })),
);
const WorkspaceInfoModal = lazy(() =>
  import("./features/workspace/components/WorkspaceInfoModal").then((m) => ({
    default: m.WorkspaceInfoModal,
  })),
);
const TabInfoModal = lazy(() =>
  import("./features/tabs/components/TabInfoModal").then((m) => ({
    default: m.TabInfoModal,
  })),
);
const InsertCharacterModal = lazy(() =>
  import("./features/editor/components/InsertCharacterModal").then((m) => ({
    default: m.InsertCharacterModal,
  })),
);
const GoToModal = lazy(() =>
  import("./features/editor/components/GoToModal").then((m) => ({
    default: m.GoToModal,
  })),
);

export const App: React.FC = () => {
  const initStore = useEditorStore((s) => s.initStore);
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const previewMode = useEditorStore((s) => s.previewMode);
  const createTab = useEditorStore((s) => s.createTab);
  const isSearching = useEditorStore((s) => s.isSearching);
  const [hasOpenedSearch, setHasOpenedSearch] = useState(false);
  if (isSearching && !hasOpenedSearch) {
    setHasOpenedSearch(true);
  }
  const settings = useEditorStore((s) => s.settings);
  const previewRatio = settings.previewWidthRatio;
  const setPreviewRatio = useEditorStore((s) => s.setPreviewRatio);

  // External file watcher state & actions
  const externalAlert = useEditorStore((s) => s.externalAlert);
  const checkActiveTabExternalChanges = useEditorStore(
    (s) => s.checkActiveTabExternalChanges,
  );
  const handleExternalKeepContent = useEditorStore(
    (s) => s.handleExternalKeepContent,
  );
  const handleExternalCloseTab = useEditorStore(
    (s) => s.handleExternalCloseTab,
  );
  const handleExternalReloadDisk = useEditorStore(
    (s) => s.handleExternalReloadDisk,
  );
  const handleExternalKeepMyChanges = useEditorStore(
    (s) => s.handleExternalKeepMyChanges,
  );
  const clearExternalAlert = useEditorStore((s) => s.clearExternalAlert);

  const [isShortcutMapperOpen, setIsShortcutMapperOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [preferencesCategory, setPreferencesCategory] =
    useState<SettingsCategory>("general");
  const [isScriptManagerOpen, setIsScriptManagerOpen] = useState(false);
  const [isInsertCharacterOpen, setIsInsertCharacterOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isInstallAppOpen, setIsInstallAppOpen] = useState(false);
  const [isMobileTabDrawerOpen, setIsMobileTabDrawerOpen] = useState(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
  const [isWorkspaceInfoOpen, setIsWorkspaceInfoOpen] = useState(false);
  const [isTabInfoOpen, setIsTabInfoOpen] = useState(false);
  const [isGoToOpen, setIsGoToOpen] = useState(false);
  const [runningScript, setRunningScript] = useState<ScriptMetadata | null>(
    null,
  );

  const editorCmds = useEditorCommands();
  const initScriptStore = useScriptStore((s) => s.initScriptStore);
  const initCloudStatus = useCloudStorageStore((s) => s.initCloudStatus);

  const handleInsertDroppedText = useCallback(
    (text: string) => editorCmds.insertText(text),
    [editorCmds],
  );
  const {
    isDragOver,
    dragTargetZone,
    setDragTargetZone,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useFileDrop(handleInsertDroppedText);

  useGlobalShortcuts({
    editorCmds,
    onOpenGoTo: useCallback(() => setIsGoToOpen(true), []),
    onOpenShortcutMapper: useCallback(() => setIsShortcutMapperOpen(true), []),
    onOpenPreferences: useCallback(() => setIsPreferencesOpen(true), []),
    onOpenScriptManager: useCallback(() => setIsScriptManagerOpen(true), []),
    onOpenInsertCharacter: useCallback(
      () => setIsInsertCharacterOpen(true),
      [],
    ),
    onOpenTabInfo: useCallback(() => setIsTabInfoOpen(true), []),
    onOpenWorkspaceInfo: useCallback(() => setIsWorkspaceInfoOpen(true), []),
  });

  // Init store, load session, and check automated updates
  useEffect(() => {
    const cleanupSystemTheme = initSystemThemeListener();

    const handleOpenCloudSync = () => setIsCloudSyncOpen(true);
    const handleOpenWorkspaceInfo = () => setIsWorkspaceInfoOpen(true);
    const handleOpenPreferencesModal = (e: Event) => {
      const customEvent = e as CustomEvent<{ category?: SettingsCategory }>;
      if (customEvent.detail?.category) {
        setPreferencesCategory(customEvent.detail.category);
      }
      setIsPreferencesOpen(true);
    };

    window.addEventListener("open-cloud-sync-modal", handleOpenCloudSync);
    window.addEventListener(
      "open-workspace-info-modal",
      handleOpenWorkspaceInfo,
    );
    window.addEventListener(
      "open-preferences-modal",
      handleOpenPreferencesModal,
    );

    const initApp = async () => {
      await initStore();
      await initScriptStore();
      await useWorkspaceStore.getState().initWorkspaces();
      await initCloudStatus();

      // Automated update check based on interval settings
      if (shouldPerformAutoCheck()) {
        const updateInfo = await checkForUpdates();
        if (updateInfo.hasUpdate) {
          // Open the update center if a new version is detected
          setIsUpdateModalOpen(true);
        }
      }
    };
    void initApp();
    return () => {
      cleanupSystemTheme();
      window.removeEventListener("open-cloud-sync-modal", handleOpenCloudSync);
      window.removeEventListener(
        "open-workspace-info-modal",
        handleOpenWorkspaceInfo,
      );
      window.removeEventListener(
        "open-preferences-modal",
        handleOpenPreferencesModal,
      );
    };
  }, [initStore, initScriptStore, initCloudStatus]);

  // External File Watcher: Check for changes on window focus and periodically
  useEffect(() => {
    const onFocus = () => {
      checkActiveTabExternalChanges();
    };

    window.addEventListener("focus", onFocus);
    const intervalId = setInterval(() => {
      checkActiveTabExternalChanges();
    }, 3000);

    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(intervalId);
    };
  }, [checkActiveTabExternalChanges]);

  // Check if active tab supports preview
  const canPreview = activeTab && activeTab.previewType !== "none";

  const showPreview =
    previewMode === "preview-only" ||
    previewMode === "split" ||
    (previewMode === "auto" && Boolean(canPreview));

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={(e) => void handleDrop(e)}
      className="h-screen w-screen flex flex-col overflow-hidden bg-[var(--bg-app)] relative select-none"
    >
      {/* 1. Top Menu Bar */}
      <MenuBar
        onOpenShortcutMapper={() => setIsShortcutMapperOpen(true)}
        onOpenPreferences={() => setIsPreferencesOpen(true)}
        onOpenScriptManager={() => setIsScriptManagerOpen(true)}
        onOpenInsertCharacter={() => setIsInsertCharacterOpen(true)}
        onOpenUpdateModal={() => setIsUpdateModalOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenInstallApp={() => setIsInstallAppOpen(true)}
        onRunScript={(script) => setRunningScript(script)}
        onOpenWorkspaceInfo={() => setIsWorkspaceInfoOpen(true)}
        onOpenTabInfo={() => setIsTabInfoOpen(true)}
        onOpenGoTo={() => setIsGoToOpen(true)}
      />

      {/* 2. Main Toolbar */}
      {settings.showToolbar && <Toolbar />}

      {/* 3. Horizontal Tab Bar
          - Always rendered on desktop if tabBarPosition === 'top'
          - On mobile (<md), if tabBarPosition is 'left' or 'right', render horizontal bar as a compact top bar with drawer button
      */}
      {settings.showTabBar && (
        <div
          className={
            settings.tabBarPosition === "top" ? "block" : "block md:hidden"
          }
        >
          <TabBar
            orientation="horizontal"
            onOpenDrawer={() => setIsMobileTabDrawerOpen(true)}
          />
        </div>
      )}

      {/* 4. Outer Content Container (Handles Left/Right TabBar on desktop + Center Workspace) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* TabBar on Left (Outermost Sidebar - Hidden on mobile) */}
        {settings.showTabBar && settings.tabBarPosition === "left" && (
          <div className="hidden md:block w-60 border-r border-[var(--border-color)] h-full shrink-0">
            <TabBar orientation="vertical" />
          </div>
        )}

        {/* Editor & Preview Workspace */}
        <main className="flex-1 overflow-hidden relative">
          {activeTab ? (
            <SplitPane
              left={
                <CodeEditor
                  key={activeTab.id}
                  tabId={activeTab.id}
                  initialContent={activeTab.content}
                  content={activeTab.content}
                  language={activeTab.language}
                />
              }
              right={<PreviewPanel tab={activeTab} />}
              previewMode={previewMode}
              showPreview={Boolean(showPreview)}
              initialRatio={previewRatio}
              onRatioChange={setPreviewRatio}
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center text-[var(--text-muted)] gap-3">
              <FileCode2 className="w-12 h-12 stroke-1 text-[var(--text-subtle)]" />
              <p className="text-sm">No files open</p>
              <button
                onClick={() => createTab()}
                className="px-4 py-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-tab-hover)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)] transition-colors"
              >
                Create New File (Alt+N)
              </button>
            </div>
          )}

          <Suspense fallback={null}>
            {/* External File Alert Modal */}
            {externalAlert && (
              <ExternalFileAlertModal
                alert={externalAlert}
                onClose={clearExternalAlert}
                onKeepContent={handleExternalKeepContent}
                onCloseTab={handleExternalCloseTab}
                onReloadDisk={handleExternalReloadDisk}
                onKeepMyChanges={handleExternalKeepMyChanges}
              />
            )}

            {/* Shortcut Mapper Dialog */}
            {isShortcutMapperOpen && (
              <ShortcutMapperModal
                isOpen={isShortcutMapperOpen}
                onClose={() => setIsShortcutMapperOpen(false)}
              />
            )}

            {/* Preferences Modal */}
            {isPreferencesOpen && (
              <PreferencesModal
                isOpen={isPreferencesOpen}
                onClose={() => setIsPreferencesOpen(false)}
                initialCategory={preferencesCategory}
                onOpenShortcutMapper={() => {
                  setIsPreferencesOpen(false);
                  setIsShortcutMapperOpen(true);
                }}
                onOpenUpdateModal={() => setIsUpdateModalOpen(true)}
              />
            )}

            {/* App Update & Cache Control Modal */}
            {isUpdateModalOpen && (
              <AppUpdateModal
                isOpen={isUpdateModalOpen}
                onClose={() => setIsUpdateModalOpen(false)}
              />
            )}

            {/* About Application Modal */}
            {isAboutOpen && (
              <AboutModal
                isOpen={isAboutOpen}
                onClose={() => setIsAboutOpen(false)}
                onOpenUpdateModal={() => setIsUpdateModalOpen(true)}
              />
            )}

            {/* Install App (PWA) Modal */}
            {isInstallAppOpen && (
              <InstallAppModal
                isOpen={isInstallAppOpen}
                onClose={() => setIsInstallAppOpen(false)}
              />
            )}

            {/* Cloud Sync & Encryption Modal */}
            {isCloudSyncOpen && (
              <CloudSyncModal
                isOpen={isCloudSyncOpen}
                onClose={() => setIsCloudSyncOpen(false)}
              />
            )}

            {/* Workspace Information Modal */}
            {isWorkspaceInfoOpen && (
              <WorkspaceInfoModal
                isOpen={isWorkspaceInfoOpen}
                onClose={() => setIsWorkspaceInfoOpen(false)}
                onOpenCloudSync={() => setIsCloudSyncOpen(true)}
              />
            )}

            {/* Tab Information Modal */}
            {isTabInfoOpen && (
              <TabInfoModal
                isOpen={isTabInfoOpen}
                tab={activeTab ?? null}
                onClose={() => setIsTabInfoOpen(false)}
              />
            )}

            {/* Script Manager Modal */}
            {isScriptManagerOpen && (
              <ScriptManagerModal
                isOpen={isScriptManagerOpen}
                onClose={() => setIsScriptManagerOpen(false)}
                onRunScript={(script) => {
                  setIsScriptManagerOpen(false);
                  setRunningScript(script);
                }}
              />
            )}

            {/* Script Run Modal */}
            {runningScript && (
              <ScriptRunModal
                script={runningScript}
                isOpen={Boolean(runningScript)}
                onClose={() => setRunningScript(null)}
              />
            )}

            {/* Insert Character Modal */}
            {isInsertCharacterOpen && (
              <InsertCharacterModal
                isOpen={isInsertCharacterOpen}
                onClose={() => setIsInsertCharacterOpen(false)}
                onInsert={(char) => editorCmds.insertText(char)}
              />
            )}

            {/* Go To Line/Offset/Bookmark Modal */}
            {isGoToOpen && (
              <GoToModal
                isOpen={isGoToOpen}
                onClose={() => setIsGoToOpen(false)}
                editorCmds={editorCmds}
              />
            )}
          </Suspense>

          {/* Drag & Drop Dual-Zone Visual Overlay */}
          {isDragOver && (
            <FileDropOverlay
              activeFileName={activeTab?.name}
              dragTargetZone={dragTargetZone}
              onSelectZone={setDragTargetZone}
              onDropZone={(e, zone) => void handleDrop(e, zone)}
            />
          )}
        </main>

        {/* TabBar on Right (Outermost Sidebar - Hidden on mobile) */}
        {settings.showTabBar && settings.tabBarPosition === "right" && (
          <div className="hidden md:block w-60 border-l border-[var(--border-color)] h-full shrink-0">
            <TabBar orientation="vertical" />
          </div>
        )}
      </div>

      {/* 5. Status Bar */}
      {settings.showStatusBar && <StatusBar />}

      <Suspense fallback={null}>
        {/* 6. Find & Replace Floating Draggable Dialog */}
        {hasOpenedSearch && <FindReplaceModal />}

        {/* 7. Global Dialog Host (Imperative Promise-based alert, confirm, prompt) */}
        <GlobalDialogHost />

        {/* 8. Mobile Tab Drawer (Sliding vertical tab drawer for mobile) */}
        {isMobileTabDrawerOpen && (
          <MobileTabDrawer
            isOpen={isMobileTabDrawerOpen}
            onClose={() => setIsMobileTabDrawerOpen(false)}
          />
        )}
      </Suspense>
    </div>
  );
};
export default App;
