import React from "react";
import {
  Plus,
  PencilLine,
  ChevronsDownUp,
  ChevronsUpDown,
  Ungroup,
  XCircle,
  Check,
} from "lucide-react";
import type { TabGroup } from "../../../core/types/file.types";
import { TAB_GROUP_COLORS } from "../../../core/constants/tabGroups";
import { ContextMenu } from "../../../shared/components/ContextMenu";
import { dialog } from "../../../shared/dialog/dialogStore";
import { useEditorStore } from "../store";

export interface TabGroupContextMenuProps {
  group: TabGroup;
  x: number;
  y: number;
  onClose: () => void;
}

export const TabGroupContextMenu: React.FC<TabGroupContextMenuProps> = ({
  group,
  x,
  y,
  onClose,
}) => {
  const createTabInGroup = useEditorStore((s) => s.createTabInGroup);
  const updateTabGroup = useEditorStore((s) => s.updateTabGroup);
  const toggleTabGroupCollapse = useEditorStore(
    (s) => s.toggleTabGroupCollapse,
  );
  const ungroupTabGroup = useEditorStore((s) => s.ungroupTabGroup);
  const closeTabGroup = useEditorStore((s) => s.closeTabGroup);

  return (
    <ContextMenu x={x} y={y} onClose={onClose}>
      {/* Color Swatch Picker */}
      <div className="px-3 py-1.5 flex items-center justify-between gap-1.5">
        {TAB_GROUP_COLORS.map((c) => {
          const isSelected = group.color === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                updateTabGroup(group.id, { color: c.id });
                onClose();
              }}
              style={{ backgroundColor: c.cssVar }}
              className={`w-4 h-4 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110 ${
                isSelected ? "ring-2 ring-offset-1 ring-[var(--text-main)]" : ""
              }`}
              title={c.label}
              aria-label={`Set group color ${c.label}`}
            >
              {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
            </button>
          );
        })}
      </div>

      <ContextMenu.Separator />

      <ContextMenu.Item
        label="New Tab in Group"
        icon={<Plus className="w-3.5 h-3.5 text-[var(--accent)]" />}
        onSelect={() => createTabInGroup(group.id)}
      />

      <ContextMenu.Item
        label="Rename Group..."
        icon={<PencilLine className="w-3.5 h-3.5 text-[var(--accent-blue)]" />}
        onSelect={async () => {
          const newName = await dialog.prompt({
            title: "Rename Tab Group",
            message: "Enter a new name for the tab group",
            initialValue: group.name,
            validate: (value) =>
              value.trim().length === 0 ? "Group name cannot be empty" : null,
          });
          const trimmed = newName?.trim();
          if (trimmed) {
            updateTabGroup(group.id, { name: trimmed });
          }
        }}
      />

      <ContextMenu.Item
        label={group.collapsed ? "Expand Group" : "Collapse Group"}
        icon={
          group.collapsed ? (
            <ChevronsUpDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          ) : (
            <ChevronsDownUp className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          )
        }
        onSelect={() => toggleTabGroupCollapse(group.id)}
      />

      <ContextMenu.Separator />

      <ContextMenu.Item
        label="Ungroup"
        icon={<Ungroup className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
        onSelect={() => ungroupTabGroup(group.id)}
      />

      <ContextMenu.Item
        label="Close Group"
        icon={<XCircle className="w-3.5 h-3.5 text-[var(--accent-red)]" />}
        danger
        onSelect={() => void closeTabGroup(group.id)}
      />
    </ContextMenu>
  );
};
