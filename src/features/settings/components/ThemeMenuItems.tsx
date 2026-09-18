import React from "react";
import { Moon, Sun, Laptop, WrapText } from "lucide-react";
import { DropdownMenu } from "../../../shared/components/DropdownMenu";
import { useEditorStore } from "../../tabs/store";
import { setThemeMode } from "../services/themeService";

interface ThemeMenuItemsProps {
  includeWordWrap?: boolean;
  onAfterSelect?: () => void;
}

export const ThemeMenuItems: React.FC<ThemeMenuItemsProps> = ({
  includeWordWrap = false,
  onAfterSelect,
}) => {
  const settings = useEditorStore((s) => s.settings);
  const toggleLineWrapping = useEditorStore((s) => s.toggleLineWrapping);

  return (
    <>
      <DropdownMenu.Item
        label="Dark Theme"
        icon={<Moon className="w-3.5 h-3.5" />}
        checked={settings.theme === "dark"}
        onSelect={() => {
          setThemeMode("dark");
          onAfterSelect?.();
        }}
      />
      <DropdownMenu.Item
        label="Light Theme"
        icon={<Sun className="w-3.5 h-3.5" />}
        checked={settings.theme === "light"}
        onSelect={() => {
          setThemeMode("light");
          onAfterSelect?.();
        }}
      />
      <DropdownMenu.Item
        label="System"
        icon={<Laptop className="w-3.5 h-3.5" />}
        checked={settings.theme === "system"}
        onSelect={() => {
          setThemeMode("system");
          onAfterSelect?.();
        }}
      />

      {includeWordWrap && (
        <>
          <DropdownMenu.Separator />
          <DropdownMenu.Item
            label="Word Wrap"
            icon={<WrapText className="w-3.5 h-3.5" />}
            commandId="view.toggleWordWrap"
            checked={settings.lineWrapping}
            onSelect={() => {
              toggleLineWrapping();
              onAfterSelect?.();
            }}
          />
        </>
      )}
    </>
  );
};
