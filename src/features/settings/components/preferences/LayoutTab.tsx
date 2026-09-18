import React from "react";
import { Sparkles, Check, CircleDot, Palette } from "lucide-react";
import { useEditorStore } from "../../../tabs/store";
import type { TabBarPosition, TabIconTheme } from "../../../../core/types/file.types";
import { CardPicker, type CardPickerOption } from "../../../../shared/components/CardPicker";
import { ToggleSwitch } from "../../../../shared/components/ToggleSwitch";
import { TAB_BAR_POSITION_OPTIONS } from "../../../../core/constants/tabBarPositions";

const tabBarOptions: CardPickerOption<TabBarPosition>[] = TAB_BAR_POSITION_OPTIONS.map((opt) => ({
  id: opt.id,
  label: opt.label,
  description: opt.description,
  icon: opt.icon,
}));

const tabIconThemeOptions: CardPickerOption<TabIconTheme>[] = [
  {
    id: "vibrant",
    label: "Vibrant Brand",
    description: "Distinct official language colors",
    icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
  },
  {
    id: "accent",
    label: "Theme Accent",
    description: "Harmonized with app accent color",
    icon: <Check className="w-3.5 h-3.5 text-[var(--accent)]" />,
  },
  {
    id: "monochrome",
    label: "Monochrome",
    description: "Clean minimalist typography tone",
    icon: <CircleDot className="w-3.5 h-3.5 text-[var(--text-muted)]" />,
  },
  {
    id: "pastel",
    label: "Soft Pastel",
    description: "Gentle eye-friendly hues",
    icon: <Palette className="w-3.5 h-3.5 text-sky-400" />,
  },
];

export const LayoutTab: React.FC = () => {
  const settings = useEditorStore((s) => s.settings);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h3 className="text-xs font-semibold text-[var(--text-highlight)] uppercase tracking-wider mb-1.5">
          Tab Bar Position
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-3">
          Position the tab bar horizontally on top or as a vertical sidebar on desktop. On mobile, vertical tabs adapt smoothly into a quick sliding Drawer.
        </p>

        <CardPicker
          options={tabBarOptions}
          selectedId={settings.tabBarPosition || "top"}
          onChange={(tabBarPosition: TabBarPosition) => updateSettings({ tabBarPosition })}
        />
      </div>

      <div className="pt-3 border-t border-[var(--border-subtle)]">
        <h3 className="text-xs font-semibold text-[var(--text-highlight)] uppercase tracking-wider mb-1.5">
          Tab File Icon Color
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-3">
          Color palette for saved and linked file tabs (unlinked drafts remain neutral gray).
        </p>

        <CardPicker
          options={tabIconThemeOptions}
          selectedId={settings.tabIconTheme || "vibrant"}
          onChange={(tabIconTheme: TabIconTheme) => updateSettings({ tabIconTheme })}
        />
      </div>

      {/* Clean Toggle Switches */}
      <div className="pt-3 border-t border-[var(--border-subtle)] space-y-1">
        <h3 className="text-xs font-semibold text-[var(--text-highlight)] uppercase tracking-wider mb-2">
          Interface Elements
        </h3>

        <ToggleSwitch
          label="Show Toolbar"
          description="Display quick action buttons (Open, Save, Cut, Copy, Zoom) below menu bar"
          checked={settings.showToolbar ?? true}
          onChange={(showToolbar: boolean) => updateSettings({ showToolbar })}
        />

        <ToggleSwitch
          label="Show Status Bar"
          description="Display line, column, encoding, and cursor statistics at the bottom"
          checked={settings.showStatusBar ?? true}
          onChange={(showStatusBar: boolean) => updateSettings({ showStatusBar })}
        />
      </div>
    </div>
  );
};
