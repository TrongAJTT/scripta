import React from "react";
import { ArrowDown, ArrowUp, Hash, Layers } from "lucide-react";
import type { SearchOptions } from "../../services/searchService";
import { SearchOptionsPanel } from "./SearchOptionsPanel";

interface FindTabProps {
  options: SearchOptions;
  onChangeOptions: (opts: SearchOptions) => void;
  onFindNext: () => void;
  onFindPrev: () => void;
  onCount: () => void;
  onFindAllInCurrent: () => void;
  onFindAllInOpen: () => void;
  onClose: () => void;
}

export const FindTab: React.FC<FindTabProps> = ({
  options,
  onChangeOptions,
  onFindNext,
  onFindPrev,
  onCount,
  onFindAllInCurrent,
  onFindAllInOpen,
  onClose,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        onFindPrev();
      } else {
        onFindNext();
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input Row */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_160px] gap-3">
        <div className="space-y-1">
          <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)]">
            Find what:
          </label>
          <div className="relative">
            <input
              type="text"
              value={options.findText}
              onChange={(e) =>
                onChangeOptions({ ...options, findText: e.target.value })
              }
              onKeyDown={handleKeyDown}
              placeholder="Enter text to find..."
              className="w-full px-2.5 py-1.5 rounded-sm bg-[var(--bg-app)] border border-[var(--border-color)] text-[var(--text-main)] font-mono text-xs focus:outline-none focus:border-[var(--accent)]"
              autoFocus
            />
          </div>
        </div>

        {/* Action Buttons Column */}
        <div className="flex flex-col gap-1.5">
          <button
            onClick={onFindNext}
            disabled={!options.findText}
            className="w-full px-3 py-1.5 rounded-sm bg-accent text-accent-contrast font-medium hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span>Find Next</span>
          </button>

          <button
            onClick={onFindPrev}
            disabled={!options.findText}
            className="w-full px-3 py-1 rounded-sm bg-[var(--bg-surface)] hover:bg-[var(--bg-tab-hover)] border border-[var(--border-color)] text-[var(--text-main)] text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>Find Previous</span>
          </button>

          <button
            onClick={onCount}
            disabled={!options.findText}
            className="w-full px-3 py-1 rounded-sm bg-[var(--bg-surface)] hover:bg-[var(--bg-tab-hover)] border border-[var(--border-color)] text-[var(--text-main)] text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Hash className="w-3.5 h-3.5 text-[var(--accent-yellow)]" />
            <span>Count</span>
          </button>

          <button
            onClick={onFindAllInCurrent}
            disabled={!options.findText}
            className="w-full px-2 py-1 rounded-sm bg-[var(--bg-surface)] hover:bg-[var(--bg-tab-hover)] border border-[var(--border-color)] text-[var(--text-main)] text-[11px] truncate disabled:opacity-50 transition-colors cursor-pointer"
            title="Find All in Current Document"
          >
            Find in Current Doc
          </button>

          <button
            onClick={onFindAllInOpen}
            disabled={!options.findText}
            className="w-full px-2 py-1 rounded-sm bg-[var(--bg-surface)] hover:bg-[var(--bg-tab-hover)] border border-[var(--border-color)] text-[var(--text-main)] text-[11px] truncate flex items-center justify-center gap-1 disabled:opacity-50 transition-colors cursor-pointer"
            title="Find All in All Opened Documents"
          >
            <Layers className="w-3 h-3 text-[var(--accent-blue)]" />
            <span>Find in All Tabs</span>
          </button>

          <button
            onClick={onClose}
            className="w-full px-3 py-1 rounded-sm hover:bg-[var(--bg-tab-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] text-xs transition-colors cursor-pointer mt-1"
          >
            Close
          </button>
        </div>
      </div>

      {/* Options Panel */}
      <SearchOptionsPanel
        options={options}
        onChange={onChangeOptions}
        showInSelection={true}
      />
    </div>
  );
};
