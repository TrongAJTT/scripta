import React from "react";
import {
  Pin,
  PinOff,
  Lock,
  Unlock,
  FolderSymlink,
  X,
  XCircle,
  ArrowRightToLine,
  FileCheck2,
  Trash2,
  Layout,
  Check,
  PencilLine,
} from "lucide-react";
import { useEditorStore } from "../store";
import { useWorkspaceStore } from "../../workspace/store/workspaceStore";
import type { FileTab, TabBarPosition } from "../../../core/types/file.types";
import { TAB_BAR_POSITION_OPTIONS } from "../../../core/constants/tabBarPositions";
import { ContextMenu } from "../../../shared/components/ContextMenu";
import { dialog } from "../../../shared/dialog/dialogStore";

export interface TabContextMenuProps {
  tab: FileTab;
  x: number;
  y: number;
  onClose: () => void;
}

export const TabContextMenu: React.FC<TabContextMenuProps> = ({
  tab,
  x,
  y,
  onClose,
}) => {
  const togglePinTab = useEditorStore((s) => s.togglePinTab);
  const toggleLockTab = useEditorStore((s) => s.toggleLockTab);
  const renameTab = useEditorStore((s) => s.renameTab);
  const closeTab = useEditorStore((s) => s.closeTab);
  const closeOtherTabs = useEditorStore((s) => s.closeOtherTabs);
  const closeToRightTabs = useEditorStore((s) => s.closeToRightTabs);
  const closeSavedTabs = useEditorStore((s) => s.closeSavedTabs);
  const closeAllTabsWithPrompt = useEditorStore(
    (s) => s.closeAllTabsWithPrompt,
  );
  const moveTabToWorkspace = useEditorStore((s) => s.moveTabToWorkspace);
  const tabBarPosition = useEditorStore((s) => s.settings.tabBarPosition);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const otherWorkspaces = workspaces.filter((w) => w.id !== activeWorkspaceId);

  return (
    <ContextMenu x={x} y={y} onClose={onClose}>
      {/* 1. Pin / Unpin */}
      <ContextMenu.Item
        label={tab.isPinned ? "Unpin" : "Pin"}
        icon={
          tab.isPinned ? (
            <PinOff className="w-3.5 h-3.5 text-[var(--accent-yellow)]" />
          ) : (
            <Pin className="w-3.5 h-3.5 text-[var(--accent)]" />
          )
        }
        onSelect={() => togglePinTab(tab.id)}
      />

      {/* 2. Lock / Unlock */}
      <ContextMenu.Item
        label={tab.isLocked ? "Unlock" : "Lock (Read-Only)"}
        icon={
          tab.isLocked ? (
            <Unlock className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-amber-400" />
          )
        }
        onSelect={() => toggleLockTab(tab.id)}
      />

      {/* 3. Rename tab */}
      <ContextMenu.Item
        label="Rename"
        icon={<PencilLine className="w-3.5 h-3.5 text-[var(--accent-blue)]" />}
        onSelect={async () => {
          const newName = await dialog.prompt({
            title: "Rename Tab",
            message: "Enter a new name for the tab",
            initialValue: tab.name,
            validate: (value) => {
              if (value.trim().length === 0) {
                return "Name cannot be empty";
              }
              return null;
            },
          });
          const trimmedName = newName?.trim();
          if (trimmedName) {
            renameTab(tab.id, trimmedName);
          }
        }}
      />

      {/* 4. Move to Workspace Submenu */}
      <ContextMenu.Sub
        label="Move to Workspace"
        icon={
          <FolderSymlink className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
        }
      >
        {otherWorkspaces.length === 0 ? (
          <div className="px-3 py-1.5 text-[11px] text-[var(--text-muted)] italic">
            No other workspaces
          </div>
        ) : (
          otherWorkspaces.map((ws) => (
            <ContextMenu.Item
              key={ws.id}
              label={ws.name}
              onSelect={() => {
                void moveTabToWorkspace(tab.id, ws.id);
              }}
            />
          ))
        )}
      </ContextMenu.Sub>

      <ContextMenu.Separator />

      {/* 5. Close Tab */}
      <ContextMenu.Item
        label="Close"
        icon={<X className="w-3.5 h-3.5 text-[var(--accent-red)]" />}
        shortcut="Alt+W"
        onSelect={() => closeTab(tab.id)}
      />

      {/* 6. Close Others */}
      <ContextMenu.Item
        label="Close Others"
        icon={<XCircle className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
        onSelect={() => void closeOtherTabs(tab.id)}
      />

      {/* 7. Close to the Right */}
      <ContextMenu.Item
        label="Close to the Right"
        icon={
          <ArrowRightToLine className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        }
        onSelect={() => void closeToRightTabs(tab.id)}
      />

      {/* 8. Close Saved */}
      <ContextMenu.Item
        label="Close Saved"
        icon={<FileCheck2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
        onSelect={() => closeSavedTabs()}
      />

      {/* 9. Close All */}
      <ContextMenu.Item
        label="Close All"
        icon={<Trash2 className="w-3.5 h-3.5 text-red-400" />}
        danger
        onSelect={() => void closeAllTabsWithPrompt()}
      />

      <ContextMenu.Separator />

      {/* 10. Tab Bar Position Submenu */}
      <ContextMenu.Sub
        label="Tab Bar Position"
        icon={<Layout className="w-3.5 h-3.5 text-[var(--accent)]" />}
      >
        {TAB_BAR_POSITION_OPTIONS.map((pos) => {
          const isSelected = tabBarPosition === pos.id;
          return (
            <ContextMenu.Item
              key={pos.id}
              label={
                <span className="flex items-center justify-between w-full">
                  <span>{pos.shortLabel || pos.label}</span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-[var(--accent)] shrink-0 ml-2" />
                  )}
                </span>
              }
              icon={pos.icon}
              className={
                isSelected
                  ? "text-[var(--accent)] font-medium bg-[var(--accent)]/10"
                  : ""
              }
              onSelect={() => {
                updateSettings({ tabBarPosition: pos.id as TabBarPosition });
              }}
            />
          );
        })}
      </ContextMenu.Sub>
    </ContextMenu>
  );
};
