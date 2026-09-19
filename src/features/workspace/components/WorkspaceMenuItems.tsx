import React from "react";
import { Plus, Edit2, Trash2, Check, Cloud } from "lucide-react";
import { useWorkspaceStore } from "../store/workspaceStore";
import {
  promptCreateWorkspace,
  promptRenameWorkspace,
  promptDeleteWorkspace,
} from "../services/workspaceService";
import { DropdownMenu } from "../../../shared/components/DropdownMenu";

export interface WorkspaceMenuItemsProps {
  onAfterSelect?: () => void;
}

export const WorkspaceMenuItems: React.FC<WorkspaceMenuItemsProps> = ({
  onAfterSelect,
}) => {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const switchWorkspace = useWorkspaceStore((s) => s.switchWorkspace);

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  return (
    <>
      {/* <div className="px-3 py-1.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-subtle)] mb-1 flex items-center justify-between">
        <span>Workspaces ({workspaces.length})</span>
      </div> */}

      {/* List of Workspaces */}
      {workspaces.map((ws) => {
        const isActive = ws.id === activeWorkspaceId;
        const isSynced = Boolean(ws.lastSyncedAt);

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

      {/* Actions */}
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
          <DropdownMenu.Item
            icon={<Edit2 className="w-3.5 h-3.5 text-[var(--accent-blue)]" />}
            label="Rename Current..."
            onSelect={() => {
              void promptRenameWorkspace(
                activeWorkspace.id,
                activeWorkspace.name,
              );
              onAfterSelect?.();
            }}
          />
          {workspaces.length > 1 && (
            <DropdownMenu.Item
              danger
              icon={<Trash2 className="w-3.5 h-3.5" />}
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
