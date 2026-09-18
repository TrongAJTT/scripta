import React from "react";
import { Moon, Sun, Laptop, Sparkles } from "lucide-react";
import type { ThemeMode } from "../../../../core/types/file.types";
import {
  type CardPickerOption,
  CardPicker,
} from "../../../../shared/components/CardPicker";
import { ToggleSwitch } from "../../../../shared/components/ToggleSwitch";
import { useEditorStore } from "../../../tabs/store";
import { THEME_OPTIONS, setThemeMode } from "../../services/themeService";

interface GeneralTabProps {
  onOpenUpdateModal?: () => void;
  onClosePreferences?: () => void;
}

const themeIcons: Record<ThemeMode, React.ReactNode> = {
  dark: <Moon className="w-3.5 h-3.5" />,
  light: <Sun className="w-3.5 h-3.5" />,
  system: <Laptop className="w-3.5 h-3.5" />,
};

const themeOptions: CardPickerOption<ThemeMode>[] = THEME_OPTIONS.map(
  (opt) => ({
    id: opt.id,
    label: opt.label,
    description: opt.description,
    icon: themeIcons[opt.id],
  }),
);

export const GeneralTab: React.FC<GeneralTabProps> = ({
  onOpenUpdateModal,
  onClosePreferences,
}) => {
  const settings = useEditorStore((s) => s.settings);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-xs font-semibold text-[var(--text-highlight)] uppercase tracking-wider mb-1.5">
          Theme Mode
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-3">
          Select your preferred interface palette for the editor, preview, and
          toolbars.
        </p>

        <CardPicker
          options={themeOptions}
          selectedId={settings.theme}
          onChange={(theme) => setThemeMode(theme)}
        />
      </div>

      {/* Updates Section */}
      <div className="pt-4 border-t border-[var(--border-subtle)] space-y-4">
        <div>
          <h3 className="text-xs font-semibold text-[var(--text-highlight)] uppercase tracking-wider mb-1.5">
            Application Updates
          </h3>
          <p className="text-xs text-[var(--text-muted)] mb-3">
            Verify new releases, purge cached offline bundles, and manage
            automated background checks.
          </p>

          <div className="pt-2 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-semibold text-[var(--text-main)] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Check for Updates &amp; Clear Cache</span>
              </h4>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Verify latest build metadata, purge cached bundles, and refresh
                app.
              </p>
            </div>
            <button
              onClick={() => {
                onClosePreferences?.();
                onOpenUpdateModal?.();
              }}
              className="px-3 py-1.5 rounded-sm border border-[var(--border-color)] hover:border-[var(--accent)] text-xs font-medium text-[var(--text-main)] hover:text-[var(--accent)] hover:bg-[var(--bg-tab-hover)] transition-all cursor-pointer shrink-0"
            >
              Check for updates
            </button>
          </div>
          <div className="pt-2">
            <ToggleSwitch
              label="Automatic Update Checks"
              description="Automatically check for updates every 3 hours in the background"
              checked={settings.autoCheckUpdates ?? true}
              onChange={(autoCheckUpdates) =>
                updateSettings({ autoCheckUpdates })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};
