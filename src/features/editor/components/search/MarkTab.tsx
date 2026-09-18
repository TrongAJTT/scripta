import React from "react";
import { Bookmark, Eraser, Copy } from "lucide-react";
import type { SearchOptions } from "../../services/searchService";
import { SearchOptionsPanel } from "./SearchOptionsPanel";

interface MarkTabProps {
  options: SearchOptions;
  onChangeOptions: (opts: SearchOptions) => void;
  onMarkAll: () => void;
  onClearMarks: () => void;
  onCopyMarkedText: () => void;
  onClose: () => void;
  markedCount: number;
}

export const MarkTab: React.FC<MarkTabProps> = ({
  options,
  onChangeOptions,
  onMarkAll,
  onClearMarks,
  onCopyMarkedText,
  onClose,
  markedCount,
}) => {
  return (
    <div className="space-y-4">
      {/* Inputs & Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_170px] gap-3">
        <div className="space-y-1">
          <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)]">
            Find what to mark:
          </label>
          <input
            type="text"
            value={options.findText}
            onChange={(e) =>
              onChangeOptions({ ...options, findText: e.target.value })
            }
            placeholder="Text or pattern to mark..."
            className="w-full px-2.5 py-1.5 rounded-sm bg-[var(--bg-app)] border border-[var(--border-color)] text-[var(--text-main)] font-mono text-xs focus:outline-none focus:border-[var(--accent)]"
            autoFocus
          />

          {markedCount > 0 && (
            <div className="text-[11px] font-mono text-cyan-400 pt-1">
              Currently highlighted: {markedCount} occurrence(s)
            </div>
          )}
        </div>

        {/* Action Buttons Column */}
        <div className="flex flex-col gap-1.5">
          <button
            onClick={onMarkAll}
            disabled={!options.findText}
            className="w-full px-3 py-1.5 rounded-sm bg-accent text-accent-contrast font-medium hover:brightness-110 disabled:opacity-50 transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Mark All</span>
          </button>

          <button
            onClick={onClearMarks}
            className="w-full px-3 py-1 rounded-sm bg-[var(--bg-surface)] hover:bg-[var(--bg-tab-hover)] border border-[var(--border-color)] text-[var(--text-main)] text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eraser className="w-3.5 h-3.5 text-rose-400" />
            <span>Clear All Marks</span>
          </button>

          <button
            onClick={onCopyMarkedText}
            disabled={markedCount === 0}
            className="w-full px-3 py-1 rounded-sm bg-[var(--bg-surface)] hover:bg-[var(--bg-tab-hover)] border border-[var(--border-color)] text-[var(--text-main)] text-[11px] flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-[var(--accent-yellow)]" />
            <span>Copy Marked Text</span>
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
