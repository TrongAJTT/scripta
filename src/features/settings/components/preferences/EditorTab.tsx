import React from "react";
import { useEditorStore } from "../../../tabs/store";
import { SliderControl } from "../../../../shared/components/SliderControl";
import { ToggleSwitch } from "../../../../shared/components/ToggleSwitch";

export const EditorTab: React.FC = () => {
  const settings = useEditorStore((s) => s.settings);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Font size */}
      <div>
        <SliderControl
          label="Font Size"
          value={settings.fontSize}
          min={11}
          max={28}
          unit="px"
          onChange={(fontSize: number) => updateSettings({ fontSize })}
        />
      </div>

      {/* Tab size */}
      <div>
        <h3 className="text-xs font-semibold text-[var(--text-highlight)] uppercase tracking-wider mb-2">
          Tab Indentation Size
        </h3>
        <div className="flex gap-2">
          {[2, 4, 8].map((size) => (
            <button
              key={size}
              onClick={() => updateSettings({ tabSize: size })}
              className={`px-3 py-1 rounded-sm text-xs font-mono font-medium border transition-all ${
                settings.tabSize === size
                  ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
                  : "border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-tab-hover)]"
              }`}
            >
              {size} Spaces
            </button>
          ))}
        </div>
      </div>

      {/* Clean Toggle Switches */}
      <div className="space-y-1 pt-3 border-t border-[var(--border-subtle)]">
        <ToggleSwitch
          label="Line Wrapping (Word Wrap)"
          description="Wrap long lines to fit within editor boundaries without horizontal scrolling"
          checked={settings.lineWrapping ?? true}
          onChange={(lineWrapping: boolean) => updateSettings({ lineWrapping })}
        />

        <ToggleSwitch
          label="Auto-Save to IndexedDB"
          description="Continuously preserve virtual workspace tabs and edits locally"
          checked={settings.autoSave ?? false}
          onChange={(autoSave: boolean) => updateSettings({ autoSave })}
        />
      </div>
    </div>
  );
};
