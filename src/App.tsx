import React, { useEffect, useState, useRef } from "react";
import { useEditorStore } from "./features/tabs/store";
import { MenuBar } from "./app/layout/MenuBar";
import { Toolbar } from "./features/editor/components/Toolbar";
import { TabBar } from "./features/tabs/components/TabBar";
import { MobileTabDrawer } from "./features/tabs/components/MobileTabDrawer";
import { CodeEditor } from "./features/editor/components/CodeEditor";
import { PreviewPanel } from "./features/preview/components/PreviewPanel";
import { StatusBar } from "./features/editor/components/StatusBar";
import { SplitPane } from "./shared/components/SplitPane";
import { FindReplaceModal } from "./features/editor/components/FindReplaceModal";
import { ExternalFileAlertModal } from "./features/editor/components/ExternalFileAlertModal";
import { ShortcutMapperModal } from "./features/settings/components/ShortcutMapperModal";
import { PreferencesModal } from "./features/settings/components/PreferencesModal";
import { ScriptManagerModal } from "./features/scripts/components/ScriptManagerModal";
import { ScriptRunModal } from "./features/scripts/components/ScriptRunModal";
import { AppUpdateModal } from "./features/settings/components/AppUpdateModal";
import { AboutModal } from "./features/settings/components/AboutModal";
import { InstallAppModal } from "./features/settings/components/InstallAppModal";
import { CloudSyncModal } from "./features/storage/components/CloudSyncModal";
import { WorkspaceInfoModal } from "./features/workspace/components/WorkspaceInfoModal";
import { TabInfoModal } from "./features/tabs/components/TabInfoModal";
import { workspaceFolderService } from "./features/workspace/services/workspaceFolderService";
import { useScriptStore } from "./features/scripts/store/scriptStore";
import { useWorkspaceStore } from "./features/workspace/store/workspaceStore";
import { useCloudStorageStore } from "./features/storage/store/cloudStorageStore";
import { initSystemThemeListener } from "./features/settings/services/themeService";
import {
  checkForUpdates,
  shouldPerformAutoCheck,
} from "./features/settings/services/updateService";
import type { ScriptMetadata } from "./features/scripts/types/script.types";
import type { DroppedFileItem } from "./core/types/file.types";
import { UploadCloud, FileCode2, FilePlus2, FileText } from "lucide-react";
import { InsertCharacterModal } from "./features/editor/components/InsertCharacterModal";
import { GlobalDialogHost } from "./shared/dialog/GlobalDialogHost";
import { dialog } from "./shared/dialog/dialogStore";
import { useEditorCommands } from "./features/editor/hooks/useEditorCommands";
import type { CommandId } from "./core/commands/types";
import { matchesKeybinding } from "./core/commands/registry";
import { useKeybindingStore } from "./core/commands/keybindingStore";
import { Z_INDEX } from "./core/constants/zIndex";

export const App: React.FC = () => {
  const initStore = useEditorStore((s) => s.initStore);
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const previewMode = useEditorStore((s) => s.previewMode);
  const saveCurrentTab = useEditorStore((s) => s.saveCurrentTab);
  const saveCurrentTabAs = useEditorStore((s) => s.saveCurrentTabAs);
  const openFileAction = useEditorStore((s) => s.openFileAction);
  const reopenClosedFile = useEditorStore((s) => s.reopenClosedFile);
  const createTab = useEditorStore((s) => s.createTab);
  const closeTab = useEditorStore((s) => s.closeTab);
  const toggleSearch = useEditorStore((s) => s.toggleSearch);
  const openDroppedFiles = useEditorStore((s) => s.openDroppedFiles);
  const appendDroppedFilesToActiveTab = useEditorStore(
    (s) => s.appendDroppedFilesToActiveTab,
  );
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

  const [isDragOver, setIsDragOver] = useState(false);
  const [dragTargetZone, setDragTargetZone] = useState<"open" | "append">(
    "open",
  );
  const dragCounterRef = useRef(0);
  const [isShortcutMapperOpen, setIsShortcutMapperOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isScriptManagerOpen, setIsScriptManagerOpen] = useState(false);
  const [isInsertCharacterOpen, setIsInsertCharacterOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isInstallAppOpen, setIsInstallAppOpen] = useState(false);
  const [isMobileTabDrawerOpen, setIsMobileTabDrawerOpen] = useState(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
  const [isWorkspaceInfoOpen, setIsWorkspaceInfoOpen] = useState(false);
  const [isTabInfoOpen, setIsTabInfoOpen] = useState(false);
  const [runningScript, setRunningScript] = useState<ScriptMetadata | null>(
    null,
  );

  const editorCmds = useEditorCommands();
  const initScriptStore = useScriptStore((s) => s.initScriptStore);
  const initCloudStatus = useCloudStorageStore((s) => s.initCloudStatus);

  // Keybinding store actions
  const getKeybinding = useKeybindingStore((s) => s.getKeybinding);

  // Init store, load session, and check automated updates
  useEffect(() => {
    const cleanupSystemTheme = initSystemThemeListener();

    const handleOpenCloudSync = () => setIsCloudSyncOpen(true);
    const handleOpenWorkspaceInfo = () => setIsWorkspaceInfoOpen(true);
    window.addEventListener("open-cloud-sync-modal", handleOpenCloudSync);
    window.addEventListener("open-workspace-info-modal", handleOpenWorkspaceInfo);

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
    };
  }, [initStore, initScriptStore, initCloudStatus]);

  // Centralized keyboard shortcut execution via Command Registry
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid firing shortcuts when user is typing inside text inputs / textareas (unless Alt modifier is used)
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");

      // Command dispatch mapping
      const commandsMap: Array<{ id: CommandId; action: () => void }> = [
        { id: "file.new", action: () => createTab() },
        { id: "file.open", action: () => void openFileAction() },
        { id: "file.save", action: () => void saveCurrentTab() },
        { id: "file.saveAs", action: () => void saveCurrentTabAs() },
        { id: "file.reopenClosed", action: () => void reopenClosedFile() },
        {
          id: "file.toggleBookmark",
          action: () => editorCmds.toggleBookmark(),
        },
        { id: "file.nextBookmark", action: () => editorCmds.nextBookmark() },
        { id: "file.prevBookmark", action: () => editorCmds.prevBookmark() },
        {
          id: "file.clearBookmarks",
          action: () => editorCmds.clearBookmarks(),
        },
        {
          id: "file.closeTab",
          action: () => {
            if (!activeTabId) return;
            const currentTab = useEditorStore
              .getState()
              .tabs.find((t) => t.id === activeTabId);
            if (currentTab?.isModified) {
              void (async () => {
                const confirmed = await dialog.confirm({
                  title: "Unsaved Changes",
                  message: `File "${currentTab.name}" has unsaved changes.\nAre you sure you want to close it?`,
                  confirmText: "Close Without Saving",
                  cancelText: "Cancel",
                  variant: "warning",
                });
                if (confirmed) {
                  closeTab(activeTabId);
                }
              })();
            } else {
              closeTab(activeTabId);
            }
          },
        },
        {
          id: "file.closeAll",
          action: () => {
            const currentTabs = useEditorStore.getState().tabs;
            const hasUnsaved = currentTabs.some((t) => t.isModified);
            if (hasUnsaved) {
              void (async () => {
                const confirmed = await dialog.confirm({
                  title: "Unsaved Changes",
                  message:
                    "Some tabs have unsaved changes.\nAre you sure you want to close all tabs?",
                  confirmText: "Close All",
                  cancelText: "Cancel",
                  variant: "warning",
                });
                if (confirmed) {
                  useEditorStore.getState().closeAllTabs();
                }
              })();
            } else {
              useEditorStore.getState().closeAllTabs();
            }
          },
        },
        { id: "edit.findReplace", action: () => toggleSearch(true) },
        {
          id: "settings.shortcutMapper",
          action: () => setIsShortcutMapperOpen(true),
        },
        {
          id: "settings.preferences",
          action: () => setIsPreferencesOpen(true),
        },
        {
          id: "scripts.manager",
          action: () => setIsScriptManagerOpen(true),
        },
        {
          id: "edit.insertDateTimeShort",
          action: () => editorCmds.insertDateTime("short"),
        },
        {
          id: "edit.insertDateTimeLong",
          action: () => editorCmds.insertDateTime("long"),
        },
        {
          id: "edit.insertCharacter",
          action: () => setIsInsertCharacterOpen(true),
        },
        {
          id: "edit.toggleUnicodeHex",
          action: () => editorCmds.toggleUnicodeHex(),
        },
        {
          id: "view.toggleWordWrap",
          action: () => useEditorStore.getState().toggleLineWrapping(),
        },
        {
          id: "view.zoomIn",
          action: () => useEditorStore.getState().setFontSize(2),
        },
        {
          id: "view.zoomOut",
          action: () => useEditorStore.getState().setFontSize(-2),
        },
        {
          id: "view.zoomReset",
          action: () => useEditorStore.getState().resetFontSize(),
        },
        {
          id: "view.fullScreen",
          action: () => {
            if (!document.fullscreenElement) {
              void document.documentElement.requestFullscreen();
            } else {
              void document.exitFullscreen();
            }
          },
        },
        { id: "file.tabInfo", action: () => setIsTabInfoOpen(true) },
        {
          id: "workspace.save",
          action: () => {
            const ws = useWorkspaceStore.getState().workspaces.find(
              (w) => w.id === useWorkspaceStore.getState().activeWorkspaceId,
            );
            if (!ws) return;
            void workspaceFolderService.saveWorkspace(ws.id).then((result) => {
              if (result === "no-folder")
                void workspaceFolderService.saveWorkspaceToFolder(ws);
            });
          },
        },
        {
          id: "workspace.saveFolder",
          action: () => {
            const ws = useWorkspaceStore.getState().workspaces.find(
              (w) => w.id === useWorkspaceStore.getState().activeWorkspaceId,
            );
            if (ws) void workspaceFolderService.saveWorkspaceToFolder(ws);
          },
        },
        {
          id: "workspace.openFolder",
          action: () => void workspaceFolderService.openFolderAsWorkspace(),
        },
        {
          id: "workspace.cloudSync",
          action: () =>
            window.dispatchEvent(new CustomEvent("open-cloud-sync-modal")),
        },
        {
          id: "workspace.info",
          action: () => setIsWorkspaceInfoOpen(true),
        },
      ];

      for (const cmd of commandsMap) {
        const kb = getKeybinding(cmd.id);
        if (kb && matchesKeybinding(e, kb)) {
          // If typing inside normal input and not an Alt combo, do not intercept
          if (isInputFocused && !kb.alt) {
            continue;
          }
          e.preventDefault();
          e.stopPropagation();
          cmd.action();
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeTabId,
    closeTab,
    createTab,
    editorCmds,
    getKeybinding,
    openFileAction,
    reopenClosedFile,
    saveCurrentTab,
    saveCurrentTabAs,
    toggleSearch,
    // workspace commands don't need reactive deps — they read store state lazily
  ]);

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

  // Window-level safety reset for drag-and-drop
  useEffect(() => {
    const handleWindowDragLeave = (e: DragEvent) => {
      // If mouse leaves the browser window entirely
      if (e.relatedTarget === null || !e.relatedTarget) {
        dragCounterRef.current = 0;
        setIsDragOver(false);
      }
    };

    const handleWindowDropOrEnd = () => {
      dragCounterRef.current = 0;
      setIsDragOver(false);
    };

    window.addEventListener("dragleave", handleWindowDragLeave);
    window.addEventListener("dragend", handleWindowDropOrEnd);
    window.addEventListener("drop", handleWindowDropOrEnd);
    return () => {
      window.removeEventListener("dragleave", handleWindowDragLeave);
      window.removeEventListener("dragend", handleWindowDropOrEnd);
      window.removeEventListener("drop", handleWindowDropOrEnd);
    };
  }, []);

  // Drag & drop handlers (Files from OS)
  const handleDragEnter = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes("Files")) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    setIsDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    // Only intercept when dragging actual files from outside, not tabs or text
    if (!e.dataTransfer.types.includes("Files")) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  };

  const handleDrop = async (
    e: React.DragEvent,
    forcedZone?: "open" | "append",
  ) => {
    if (!e.dataTransfer.types.includes("Files")) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);

    const zone = forcedZone || dragTargetZone;
    const dt = e.dataTransfer;
    const droppedItems: DroppedFileItem[] = [];

    if (dt.items && dt.items.length > 0) {
      for (let i = 0; i < dt.items.length; i++) {
        const item = dt.items[i];
        if (item.kind !== "file") continue;
        const file = item.getAsFile();
        if (!file) continue;

        let handlePromise: Promise<FileSystemFileHandle | null> | undefined;
        if (
          "getAsFileSystemHandle" in item &&
          typeof (item as any).getAsFileSystemHandle === "function"
        ) {
          try {
            handlePromise = (item as any)
              .getAsFileSystemHandle()
              .catch(() => null);
          } catch {
            handlePromise = undefined;
          }
        }
        droppedItems.push({ file, handlePromise });
      }
    } else if (dt.files && dt.files.length > 0) {
      for (let i = 0; i < dt.files.length; i++) {
        const file = dt.files[i];
        if (file) {
          droppedItems.push({ file });
        }
      }
    }

    if (droppedItems.length === 0) return;

    if (zone === "append") {
      await appendDroppedFilesToActiveTab(droppedItems, (text) => {
        editorCmds.insertText(text);
      });
    } else {
      await openDroppedFiles(droppedItems);
    }
  };

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

          {/* External File Alert Modal */}
          <ExternalFileAlertModal
            alert={externalAlert}
            onClose={clearExternalAlert}
            onKeepContent={handleExternalKeepContent}
            onCloseTab={handleExternalCloseTab}
            onReloadDisk={handleExternalReloadDisk}
            onKeepMyChanges={handleExternalKeepMyChanges}
          />

          {/* Shortcut Mapper Dialog */}
          <ShortcutMapperModal
            isOpen={isShortcutMapperOpen}
            onClose={() => setIsShortcutMapperOpen(false)}
          />

          {/* Preferences Modal */}
          <PreferencesModal
            isOpen={isPreferencesOpen}
            onClose={() => setIsPreferencesOpen(false)}
            onOpenShortcutMapper={() => {
              setIsPreferencesOpen(false);
              setIsShortcutMapperOpen(true);
            }}
            onOpenUpdateModal={() => setIsUpdateModalOpen(true)}
          />

          {/* App Update & Cache Control Modal */}
          <AppUpdateModal
            isOpen={isUpdateModalOpen}
            onClose={() => setIsUpdateModalOpen(false)}
          />

          {/* About Application Modal */}
          <AboutModal
            isOpen={isAboutOpen}
            onClose={() => setIsAboutOpen(false)}
            onOpenUpdateModal={() => setIsUpdateModalOpen(true)}
          />

          {/* Install App (PWA) Modal */}
          <InstallAppModal
            isOpen={isInstallAppOpen}
            onClose={() => setIsInstallAppOpen(false)}
          />

          {/* Cloud Sync & Encryption Modal */}
          <CloudSyncModal
            isOpen={isCloudSyncOpen}
            onClose={() => setIsCloudSyncOpen(false)}
          />

          {/* Workspace Information Modal */}
          <WorkspaceInfoModal
            isOpen={isWorkspaceInfoOpen}
            onClose={() => setIsWorkspaceInfoOpen(false)}
            onOpenCloudSync={() => setIsCloudSyncOpen(true)}
          />

          {/* Tab Information Modal */}
          <TabInfoModal
            isOpen={isTabInfoOpen}
            tab={activeTab ?? null}
            onClose={() => setIsTabInfoOpen(false)}
          />

          {/* Script Manager Modal */}
          <ScriptManagerModal
            isOpen={isScriptManagerOpen}
            onClose={() => setIsScriptManagerOpen(false)}
            onRunScript={(script) => {
              setIsScriptManagerOpen(false);
              setRunningScript(script);
            }}
          />

          {/* Script Run Modal */}
          {runningScript && (
            <ScriptRunModal
              script={runningScript}
              isOpen={Boolean(runningScript)}
              onClose={() => setRunningScript(null)}
            />
          )}

          {/* Insert Character Modal */}
          <InsertCharacterModal
            isOpen={isInsertCharacterOpen}
            onClose={() => setIsInsertCharacterOpen(false)}
            onInsert={(char) => editorCmds.insertText(char)}
          />

          {/* Drag & Drop Dual-Zone Visual Overlay */}
          {isDragOver && (
            <div
              style={{ zIndex: Z_INDEX.WORKSPACE_FLOATING }}
              className="absolute inset-0 bg-[var(--bg-app)]/90 backdrop-blur-xs p-4 flex flex-col gap-3 animate-fade-in select-none"
            >
              {/* Header banner */}
              <div className="flex items-center justify-center gap-2 py-1 text-xs text-[var(--text-muted)] shrink-0">
                <UploadCloud className="w-4 h-4 text-[var(--accent)] animate-bounce" />
                <span>Choose action by dropping into left or right zone:</span>
              </div>

              {/* 2 Zones (Left / Right) */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                {/* Left Zone: Open as New Linked Tab(s) */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = "copy";
                    setDragTargetZone("open");
                  }}
                  onDrop={(e) => void handleDrop(e, "open")}
                  className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed transition-all duration-200 cursor-pointer ${
                    dragTargetZone === "open"
                      ? "border-[var(--accent)] bg-[var(--accent)]/15 scale-[1.01] shadow-lg shadow-[var(--accent)]/10"
                      : "border-[var(--border-color)] bg-[var(--bg-surface)]/60 hover:border-[var(--accent)]/50"
                  }`}
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-colors ${
                      dragTargetZone === "open"
                        ? "bg-[var(--accent)] text-[var(--bg-app)] shadow-md"
                        : "bg-[var(--bg-surface)] text-[var(--accent)] border border-[var(--border-color)]"
                    }`}
                  >
                    <FilePlus2 className="w-7 h-7" />
                  </div>
                  <h2 className="text-base md:text-lg font-bold text-[var(--text-highlight)]">
                    Open as New Tab(s)
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] text-center mt-1 max-w-xs">
                    Creates linked document tab(s) with direct local file saving
                    support
                  </p>
                  <span className="mt-3 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)]">
                    Default / Linked Files
                  </span>
                </div>

                {/* Right Zone: Append / Insert at Cursor */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = "copy";
                    setDragTargetZone("append");
                  }}
                  onDrop={(e) => void handleDrop(e, "append")}
                  className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed transition-all duration-200 cursor-pointer ${
                    dragTargetZone === "append"
                      ? "border-sky-400 bg-sky-500/15 scale-[1.01] shadow-lg shadow-sky-500/10"
                      : "border-[var(--border-color)] bg-[var(--bg-surface)]/60 hover:border-sky-400/50"
                  }`}
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-colors ${
                      dragTargetZone === "append"
                        ? "bg-sky-400 text-[var(--bg-app)] shadow-md"
                        : "bg-[var(--bg-surface)] text-sky-400 border border-[var(--border-color)]"
                    }`}
                  >
                    <FileText className="w-7 h-7" />
                  </div>
                  <h2 className="text-base md:text-lg font-bold text-[var(--text-highlight)]">
                    Append to Current File
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] text-center mt-1 max-w-xs">
                    Inserts file text content at cursor position in{" "}
                    <span className="text-[var(--text-main)] font-semibold">
                      "{activeTab?.name || "current file"}"
                    </span>
                  </p>
                  <span className="mt-3 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400">
                    Insert at Cursor
                  </span>
                </div>
              </div>
            </div>
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

      {/* 6. Find & Replace Floating Draggable Dialog */}
      <FindReplaceModal />

      {/* 7. Global Dialog Host (Imperative Promise-based alert, confirm, prompt) */}
      <GlobalDialogHost />

      {/* 8. Mobile Tab Drawer (Sliding vertical tab drawer for mobile) */}
      <MobileTabDrawer
        isOpen={isMobileTabDrawerOpen}
        onClose={() => setIsMobileTabDrawerOpen(false)}
      />
    </div>
  );
};
export default App;
