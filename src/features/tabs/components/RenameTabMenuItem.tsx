import React from "react";
import { PencilLine } from "lucide-react";
import type { FileTab } from "../../../core/types/file.types";
import { DropdownMenu } from "../../../shared/components/DropdownMenu";
import { dialog } from "../../../shared/dialog/dialogStore";
import { useEditorStore } from "../store";

export interface RenameTabMenuItemProps {
  tab: FileTab;
  label?: string;
}

export const RenameTabMenuItem: React.FC<RenameTabMenuItemProps> = ({
  tab,
  label = "Rename",
}) => {
  const renameTab = useEditorStore((s) => s.renameTab);

  return (
    <DropdownMenu.Item
      label={label}
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
  );
};
