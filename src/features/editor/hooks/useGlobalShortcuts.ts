import { useEffect } from "react";
import { useEditorStore } from "../../tabs/store";
import { useWorkspaceStore } from "../../workspace/store/workspaceStore";
import { workspaceFolderService } from "../../workspace/services/workspaceFolderService";
import { dialog } from "../../../shared/dialog/dialogStore";
import { matchesKeybinding } from "../../../core/commands/registry";
import { useKeybindingStore } from "../../../core/commands/keybindingStore";
import type { CommandId } from "../../../core/commands/types";
import type { useEditorCommands } from "./useEditorCommands";

interface UseGlobalShortcutsOptions {
  editorCmds: ReturnType<typeof useEditorCommands>;
  onOpenGoTo: () => void;
  onOpenShortcutMapper: () => void;
  onOpenPreferences: () => void;
  onOpenScriptManager: () => void;
  onOpenInsertCharacter: () => void;
  onOpenTabInfo: () => void;
  onOpenWorkspaceInfo: () => void;
}

export function useGlobalShortcuts({
  editorCmds,
  onOpenGoTo,
  onOpenShortcutMapper,
  onOpenPreferences,
  onOpenScriptManager,
  onOpenInsertCharacter,
  onOpenTabInfo,
  onOpenWorkspaceInfo,
}: UseGlobalShortcutsOptions): void {
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const createTab = useEditorStore((s) => s.createTab);
  const openFileAction = useEditorStore((s) => s.openFileAction);
  const saveCurrentTab = useEditorStore((s) => s.saveCurrentTab);
  const saveCurrentTabAs = useEditorStore((s) => s.saveCurrentTabAs);
  const reopenClosedFile = useEditorStore((s) => s.reopenClosedFile);
  const closeTab = useEditorStore((s) => s.closeTab);
  const toggleSearch = useEditorStore((s) => s.toggleSearch);
  const getKeybinding = useKeybindingStore((s) => s.getKeybinding);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid firing shortcuts when user is typing inside text inputs / textareas (unless Alt modifier is used)
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");

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
        { id: "edit.goTo", action: onOpenGoTo },
        { id: "settings.shortcutMapper", action: onOpenShortcutMapper },
        { id: "settings.preferences", action: onOpenPreferences },
        { id: "scripts.manager", action: onOpenScriptManager },
        {
          id: "edit.insertDateTimeShort",
          action: () => editorCmds.insertDateTime("short"),
        },
        {
          id: "edit.insertDateTimeLong",
          action: () => editorCmds.insertDateTime("long"),
        },
        { id: "edit.insertCharacter", action: onOpenInsertCharacter },
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
        { id: "file.tabInfo", action: onOpenTabInfo },
        {
          id: "workspace.save",
          action: () => {
            const ws = useWorkspaceStore
              .getState()
              .workspaces.find(
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
            const ws = useWorkspaceStore
              .getState()
              .workspaces.find(
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
        { id: "workspace.info", action: onOpenWorkspaceInfo },
      ];

      for (const cmd of commandsMap) {
        const kb = getKeybinding(cmd.id);
        if (kb && matchesKeybinding(e, kb)) {
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
    onOpenGoTo,
    onOpenInsertCharacter,
    onOpenPreferences,
    onOpenScriptManager,
    onOpenShortcutMapper,
    onOpenTabInfo,
    onOpenWorkspaceInfo,
    openFileAction,
    reopenClosedFile,
    saveCurrentTab,
    saveCurrentTabAs,
    toggleSearch,
  ]);
}
