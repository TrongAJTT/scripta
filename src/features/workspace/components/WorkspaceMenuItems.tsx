import React from "react";
import {
  Plus,
  Info,
  Trash2,
  Check,
  Cloud,
  FolderOpen,
  FolderDown,
  Save,
  HardDrive,
} from "lucide-react";
import { useWorkspaceStore } from "../store/workspaceStore";
import {
  promptCreateWorkspace,
  promptDeleteWorkspace,
} from "../services/workspaceService";
import { workspaceFolderService } from "../services/workspaceFolderService";
import { DropdownMenu } from "../../../shared/components/DropdownMenu";
import { dialog } from "../../../shared/dialog/dialogStore";

export interface WorkspaceMenuItemsProps {
  onAfterSelect?: () => void;
  onOpenWorkspaceInfo?: () => void;
}

const isFSASupported = "showDirectoryPicker" in window;

export const WorkspaceMenuItems: React.FC<WorkspaceMenuItemsProps> = ({
  onAfterSelect,
  onOpenWorkspaceInfo,
}) => {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const switchWorkspace = useWorkspaceStore((s) => s.switchWorkspace);

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  const isLinked = Boolean(
    activeWorkspace?.folderLinkedAt && activeWorkspace?.folderName,
  );

  const handleSaveWorkspace = async () => {
    if (!activeWorkspace) return;
    onAfterSelect?.();
    const result = await workspaceFolderService.saveWorkspace(
      activeWorkspace.id,
    );
    if (result === "no-folder") {
      // No folder linked — open picker to save as folder
      await workspaceFolderService.saveWorkspaceToFolder(activeWorkspace);
    } else if (result === "permission-denied") {
      await dialog.alert({
        title: "Permission Denied",
        message:
          "Scripta was denied write access to the linked folder. Please try again or re-link the folder from Workspace Information.",
        variant: "warning",
      });
    }
  };

  return (
    <>
      {/* List of Workspaces */}
      {workspaces.map((ws) => {
        const isActive = ws.id === activeWorkspaceId;
        const isSynced = Boolean(ws.lastSyncedAt);
        const wsIsLinked = Boolean(ws.folderLinkedAt && ws.folderName);

        return (
          <DropdownMenu.Item
            key={ws.id}
            icon={
              isActive && <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
            }
            label={
              <div className="flex items-center justify-between w-full pr-1">
                <span
                  className={
                    isActive
                      ? "font-semibold text-[var(--accent)]"
                      : "text-[var(--text-main)]"
                  }
                >
                  {ws.name}
                </span>
                <div className="flex items-center gap-1.5 ml-2 shrink-0">
                  {isSynced && (
                    <span
                      title={
                        ws.lastSyncedProvider
                          ? `Synced to ${ws.lastSyncedProvider === "dropbox" ? "Dropbox" : "GitHub"}`
                          : "Synced to Cloud"
                      }
                      className="inline-flex items-center"
                    >
                      <Cloud className="w-3 h-3 text-[var(--accent-blue)] shrink-0" />
                    </span>
                  )}
                  {wsIsLinked && (
                    <span title={`Linked to folder: ${ws.folderName}`}>
                      <FolderOpen className="w-3 h-3 text-[var(--accent-yellow)] shrink-0" />
                    </span>
                  )}
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                    {ws.tabs.length} {ws.tabs.length === 1 ? "tab" : "tabs"}
                  </span>
                </div>
              </div>
            }
            onSelect={() => {
              void switchWorkspace(ws.id);
              onAfterSelect?.();
            }}
          />
        );
      })}

      <DropdownMenu.Separator />

      {/* Create new workspace */}
      <DropdownMenu.Item
        icon={<Plus className="w-3.5 h-3.5 text-[var(--accent)]" />}
        label="New Workspace..."
        onSelect={() => {
          void promptCreateWorkspace();
          onAfterSelect?.();
        }}
      />

      {activeWorkspace && (
        <>
          {/* View Workspace Information */}
          <DropdownMenu.Item
            icon={<Info className="w-3.5 h-3.5 text-[var(--accent-blue)]" />}
            label="View Information"
            commandId="workspace.info"
            onSelect={() => {
              if (onOpenWorkspaceInfo) {
                onOpenWorkspaceInfo();
              } else {
                window.dispatchEvent(
                  new CustomEvent("open-workspace-info-modal"),
                );
              }
              onAfterSelect?.();
            }}
          />

          {/* Save Workspace — Alt+S */}
          <DropdownMenu.Item
            icon={
              isLinked ? (
                <Save className="w-3.5 h-3.5 text-[var(--accent)]" />
              ) : isFSASupported ? (
                <FolderDown className="w-3.5 h-3.5 text-[var(--accent)]" />
              ) : (
                <HardDrive className="w-3.5 h-3.5 text-[var(--accent)]" />
              )
            }
            label={
              isLinked
                ? `Save to "${activeWorkspace.folderName}"`
                : isFSASupported
                  ? "Save Workspace..."
                  : "Download as ZIP"
            }
            commandId="workspace.save"
            onSelect={() => void handleSaveWorkspace()}
          />

          {/* Delete — only if more than 1 workspace */}
          {workspaces.length > 1 && (
            <DropdownMenu.Item
              icon={<Trash2 className="w-3.5 h-3.5" color="red" />}
              label="Delete Current..."
              onSelect={() => {
                void promptDeleteWorkspace(
                  activeWorkspace.id,
                  activeWorkspace.name,
                );
                onAfterSelect?.();
              }}
            />
          )}
        </>
      )}
    </>
  );
};
