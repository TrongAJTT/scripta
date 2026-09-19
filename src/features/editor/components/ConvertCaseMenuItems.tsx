import DropdownMenu from "../../../shared/components/DropdownMenu";
import type { useEditorCommands } from "../hooks/useEditorCommands";

interface ConvertCaseMenuItemsProps {
  editorCmds: ReturnType<typeof useEditorCommands>;
}

export const ConvertCaseMenuItems: React.FC<ConvertCaseMenuItemsProps> = ({
  editorCmds,
}) => {
  return (
    <>
      <DropdownMenu.Item
        label="UPPERCASE"
        commandId="edit.toUpperCase"
        onSelect={editorCmds.toUpperCase}
      />
      <DropdownMenu.Item
        label="lowercase"
        commandId="edit.toLowerCase"
        onSelect={editorCmds.toLowerCase}
      />
      <DropdownMenu.Item
        label="Proper Case (Blend)"
        commandId="edit.toProperCase"
        onSelect={editorCmds.toProperCase}
      />
      <DropdownMenu.Item
        label="Title Case"
        commandId="edit.toTitleCase"
        onSelect={editorCmds.toTitleCase}
      />
      <DropdownMenu.Item
        label="iNVERT cASE"
        commandId="edit.invertCase"
        onSelect={editorCmds.invertCase}
      />
    </>
  );
};
