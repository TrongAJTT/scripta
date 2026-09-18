import React from "react";
import type { SearchOptions } from "../../services/searchService";

interface SearchOptionsPanelProps {
  options: SearchOptions;
  onChange: (options: SearchOptions) => void;
  showInSelection?: boolean;
}

export const SearchOptionsPanel: React.FC<SearchOptionsPanelProps> = ({
  options,
  onChange,
  showInSelection = true,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[11px] text-[var(--text-muted)] border-t border-[var(--border-subtle)]">
      {/* Column 1: Checkbox Flags */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-2 cursor-pointer hover:text-[var(--text-main)] transition-colors">
          <input
            type="checkbox"
            checked={options.matchCase}
            onChange={(e) =>
              onChange({ ...options, matchCase: e.target.checked })
            }
            className="rounded-xs accent-[var(--accent)] cursor-pointer"
          />
          <span>Match case</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer hover:text-[var(--text-main)] transition-colors">
          <input
            type="checkbox"
            checked={options.matchWholeWord}
            onChange={(e) =>
              onChange({ ...options, matchWholeWord: e.target.checked })
            }
            className="rounded-xs accent-[var(--accent)] cursor-pointer"
          />
          <span>Match whole word only</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer hover:text-[var(--text-main)] transition-colors">
          <input
            type="checkbox"
            checked={options.wrapAround}
            onChange={(e) =>
              onChange({ ...options, wrapAround: e.target.checked })
            }
            className="rounded-xs accent-[var(--accent)] cursor-pointer"
          />
          <span>Wrap around</span>
        </label>

        {showInSelection && (
          <label className="flex items-center gap-2 cursor-pointer hover:text-[var(--text-main)] transition-colors">
            <input
              type="checkbox"
              checked={options.inSelection}
              onChange={(e) =>
                onChange({ ...options, inSelection: e.target.checked })
              }
              className="rounded-xs accent-[var(--accent)] cursor-pointer"
            />
            <span>In selection</span>
          </label>
        )}
      </div>

      {/* Column 2: Search Mode Radio Group */}
      <div className="bg-[var(--bg-app)]/50 p-2 rounded border border-[var(--border-color)] space-y-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-highlight)] mb-1">
          Search Mode
        </div>

        <label className="flex items-center gap-2 cursor-pointer hover:text-[var(--text-main)] transition-colors">
          <input
            type="radio"
            name="searchMode"
            value="normal"
            checked={options.searchMode === "normal"}
            onChange={() => onChange({ ...options, searchMode: "normal" })}
            className="accent-[var(--accent)] cursor-pointer"
          />
          <span>Normal</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer hover:text-[var(--text-main)] transition-colors">
          <input
            type="radio"
            name="searchMode"
            value="extended"
            checked={options.searchMode === "extended"}
            onChange={() => onChange({ ...options, searchMode: "extended" })}
            className="accent-[var(--accent)] cursor-pointer"
          />
          <span title="Supports \n, \r, \t, \0, \\">
            Extended (\n, \r, \t, \0)
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer hover:text-[var(--text-main)] transition-colors">
          <input
            type="radio"
            name="searchMode"
            value="regex"
            checked={options.searchMode === "regex"}
            onChange={() => onChange({ ...options, searchMode: "regex" })}
            className="accent-[var(--accent)] cursor-pointer"
          />
          <span>Regular expression</span>
        </label>
      </div>
    </div>
  );
};
