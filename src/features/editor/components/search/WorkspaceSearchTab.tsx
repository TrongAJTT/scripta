import React from "react";
import { FolderSearch, FileText } from "lucide-react";
import type {
  SearchOptions,
  WorkspaceMatchResult,
  SearchMatch,
} from "../../services/searchService";
import { SearchOptionsPanel } from "./SearchOptionsPanel";

interface WorkspaceSearchTabProps {
  options: SearchOptions;
  onChangeOptions: (opts: SearchOptions) => void;
  onSearchWorkspace: () => void;
  results: WorkspaceMatchResult[];
  onSelectResult: (tabId: string, line: number, from: number, to: number) => void;
  onClose: () => void;
}

export const WorkspaceSearchTab: React.FC<WorkspaceSearchTabProps> = ({
  options,
  onChangeOptions,
  onSearchWorkspace,
  results,
  onSelectResult,
  onClose,
}) => {
  const totalMatches = results.reduce(
    (acc, item) => acc + item.matches.length,
    0,
  );

  return (
    <div className="space-y-4">
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
              placeholder="Search across all tabs in workspace..."
              className="w-full px-2.5 py-1.5 rounded-sm bg-[var(--bg-app)] border border-[var(--border-color)] text-[var(--text-main)] font-mono text-xs focus:outline-none focus:border-[var(--accent)]"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1">
              File Filters (e.g. *.md, *.ts, or leave empty):
            </label>
            <input
              type="text"
              value={options.tabFilters || ""}
              onChange={(e) =>
                onChangeOptions({ ...options, tabFilters: e.target.value })
              }
              placeholder="*.*"
              className="w-full px-2.5 py-1.5 rounded-sm bg-[var(--bg-app)] border border-[var(--border-color)] text-[var(--text-main)] font-mono text-xs focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        {/* Action Buttons Column */}
        <div className="flex flex-col gap-1.5">
          <button
            onClick={onSearchWorkspace}
            disabled={!options.findText}
            className="w-full px-3 py-2 rounded-sm bg-accent text-accent-contrast font-medium hover:brightness-110 disabled:opacity-50 transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FolderSearch className="w-4 h-4" />
            <span>Find All</span>
          </button>

          <button
            onClick={onClose}
            className="w-full px-3 py-1.5 rounded-sm hover:bg-[var(--bg-tab-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] text-xs transition-colors cursor-pointer mt-1"
          >
            Close
          </button>
        </div>
      </div>

      <SearchOptionsPanel
        options={options}
        onChange={onChangeOptions}
        showInSelection={false}
      />

      {/* Results View */}
      {results.length > 0 && (
        <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[var(--text-highlight)]">
              Results: {totalMatches} matches across {results.length} files
            </span>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1 border border-[var(--border-color)] rounded p-2 bg-[var(--bg-app)]/60 text-xs">
            {results.map((res) => (
              <div key={res.tabId} className="space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-[var(--accent)] text-[11px] sticky top-0 bg-[var(--bg-surface)] px-1.5 py-0.5 rounded-xs border border-[var(--border-subtle)]">
                  <FileText className="w-3.5 h-3.5 text-[var(--accent-yellow)]" />
                  <span>{res.tabName}</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-normal">
                    ({res.matches.length})
                  </span>
                </div>

                <div className="space-y-0.5 pl-3">
                  {res.matches.map((m: SearchMatch, idx: number) => (
                    <button
                      key={idx}
                      onClick={() =>
                        onSelectResult(res.tabId, m.line, m.from, m.to)
                      }
                      className="w-full text-left font-mono text-[11px] px-1.5 py-1 rounded hover:bg-[var(--bg-tab-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-baseline gap-2 transition-colors cursor-pointer"
                    >
                      <span className="text-[var(--text-subtle)] text-[10px] w-6 shrink-0 text-right">
                        :{m.line}
                      </span>
                      <span className="truncate">{m.lineText}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
