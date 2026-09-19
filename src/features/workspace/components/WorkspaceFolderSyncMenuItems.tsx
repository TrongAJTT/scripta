import React from "react";
import { FolderOpen, FolderDown, HardDrive, Cloud } from "lucide-react";
import { useWorkspaceStore } from "../store/workspaceStore";
import { workspaceFolderService } from "../services/workspaceFolderService";
import { DropdownMenu } from "../../../shared/components/DropdownMenu";

export interface WorkspaceFolderSyncMenuItemsProps {
  onAfterSelect?: () => void;
}

const isFSASupported = "showDirectoryPicker" in window;

/**
 * Reusable menu items for folder sync & cloud actions:
 * - Open Folder as Workspace
 * - Save Workspace as Folder
 * - Cloud Sync & Backup...
 */
export const WorkspaceFolderSyncMenuItems: React.FC<
  WorkspaceFolderSyncMenuItemsProps
> = ({ onAfterSelect }) => {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  return (
    <>
      {/* Open Folder as Workspace — Alt+0 */}
      <DropdownMenu.Item
        icon={
          <FolderOpen className="w-3.5 h-3.5 text-[var(--accent-yellow)]" />
        }
        label="Open Folder as Workspace"
        commandId="workspace.openFolder"
        onSelect={() => {
          void workspaceFolderService.openFolderAsWorkspace();
          onAfterSelect?.();
        }}
      />

      {/* Save Workspace as Folder — Alt+Shift+S */}
      <DropdownMenu.Item
        icon={
          isFSASupported ? (
            <FolderDown className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
          ) : (
            <HardDrive className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
          )
        }
        label={
          isFSASupported
            ? "Save Workspace as Folder..."
            : "Download Workspace as ZIP"
        }
        commandId="workspace.saveFolder"
        onSelect={() => {
          if (activeWorkspace) {
            void workspaceFolderService.saveWorkspaceToFolder(activeWorkspace);
          }
          onAfterSelect?.();
        }}
      />

      {/* Cloud Sync & Backup — Alt+Shift+C */}
      <DropdownMenu.Item
        icon={<Cloud className="w-3.5 h-3.5 text-[var(--accent-blue)]" />}
        label="Cloud Sync & Backup..."
        commandId="workspace.cloudSync"
        onSelect={() => {
          window.dispatchEvent(new CustomEvent("open-cloud-sync-modal"));
          onAfterSelect?.();
        }}
      />
    </>
  );
};
