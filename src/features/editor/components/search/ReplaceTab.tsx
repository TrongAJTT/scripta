import React from "react";
import { ArrowDown, Replace, Layers } from "lucide-react";
import type { SearchOptions } from "../../services/searchService";
import { SearchOptionsPanel } from "./SearchOptionsPanel";

interface ReplaceTabProps {
  options: SearchOptions;
  onChangeOptions: (opts: SearchOptions) => void;
  onFindNext: () => void;
  onReplaceOnce: () => void;
  onReplaceAll: () => void;
  onReplaceAllInOpenDocs: () => void;
  onClose: () => void;
}

export const ReplaceTab: React.FC<ReplaceTabProps> = ({
  options,
  onChangeOptions,
  onFindNext,
  onReplaceOnce,
  onReplaceAll,
  onReplaceAllInOpenDocs,
  onClose,
}) => {
  return (
    <div className="space-y-4">
      {/* Inputs and Buttons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_170px] gap-3">
        <div className="space-y-2.5">
          <div>
            <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1">
              Find what:
            </label>
            <input
              type="text"
              value={options.findText}
              onChange={(e) =>
                onChangeOptions({ ...options, findText: e.target.value })
              }
              placeholder="Text to replace..."
              className="w-full px-2.5 py-1.5 rounded-sm bg-[var(--bg-app)] border border-[var(--border-color)] text-[var(--text-main)] font-mono text-xs focus:outline-none focus:border-[var(--accent)]"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1">
              Replace with:
            </label>
            <input
              type="text"
              value={options.replaceText}
              onChange={(e) =>
                onChangeOptions({ ...options, replaceText: e.target.value })
              }
              placeholder="Replacement text..."
              className="w-full px-2.5 py-1.5 rounded-sm bg-[var(--bg-app)] border border-[var(--border-color)] text-[var(--text-main)] font-mono text-xs focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        {/* Action Buttons Column */}
        <div className="flex flex-col gap-1.5">
          <button
            onClick={onFindNext}
            disabled={!options.findText}
            className="w-full px-3 py-1.5 rounded-sm bg-[var(--bg-surface)] hover:bg-[var(--bg-tab-hover)] border border-[var(--border-color)] text-[var(--text-main)] font-medium disabled:opacity-50 transition-colors text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowDown className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
            <span>Find Next</span>
          </button>

          <button
            onClick={onReplaceOnce}
            disabled={!options.findText}
            className="w-full px-3 py-1.5 rounded-sm bg-accent text-accent-contrast font-medium hover:brightness-110 disabled:opacity-50 transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Replace className="w-3.5 h-3.5" />
            <span>Replace</span>
          </button>

          <button
            onClick={onReplaceAll}
            disabled={!options.findText}
            className="w-full px-3 py-1.5 rounded-sm bg-[var(--bg-surface)] hover:bg-[var(--bg-tab-hover)] border border-[var(--border-color)] text-[var(--text-main)] text-xs font-semibold disabled:opacity-50 transition-colors cursor-pointer"
          >
            Replace All
          </button>

          <button
            onClick={onReplaceAllInOpenDocs}
            disabled={!options.findText}
            className="w-full px-2 py-1 rounded-sm bg-[var(--bg-surface)] hover:bg-[var(--bg-tab-hover)] border border-[var(--border-color)] text-[var(--text-main)] text-[11px] truncate flex items-center justify-center gap-1 disabled:opacity-50 transition-colors cursor-pointer"
            title="Replace All in All Opened Documents"
          >
            <Layers className="w-3 h-3 text-[var(--accent-purple)]" />
            <span>Replace in All Tabs</span>
          </button>

          <button
            onClick={onClose}
            className="w-full px-3 py-1 rounded-sm hover:bg-[var(--bg-tab-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] text-xs transition-colors cursor-pointer mt-1"
          >
            Close
          </button>
        </div>
      </div>

      <SearchOptionsPanel
        options={options}
        onChange={onChangeOptions}
        showInSelection={true}
      />
    </div>
  );
};
