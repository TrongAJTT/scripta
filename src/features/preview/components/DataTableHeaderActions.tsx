import React, { useState, useCallback } from "react";
import { Search, Copy, Download, Check } from "lucide-react";
import { tableToCsv } from "../services/csvParser";
import { triggerFileDownload } from "../../../core/utils/downloadUtils";

export interface DataTableHeaderActionsProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  columns: string[];
  rows: Record<string, unknown>[];
  fileName: string;
  delimiter?: string;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

/**
 * Reusable header toolbar actions for tabular preview (CSV & JSON Table View).
 * Encapsulates search filter, CSV copying, and CSV file downloading.
 */
export const DataTableHeaderActions: React.FC<DataTableHeaderActionsProps> = ({
  searchQuery,
  onSearchQueryChange,
  columns,
  rows,
  fileName,
  delimiter = ",",
  leftSlot,
  rightSlot,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCsv = useCallback(async () => {
    try {
      const csv = tableToCsv(columns, rows, delimiter);
      await navigator.clipboard.writeText(csv);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback
    }
  }, [columns, rows, delimiter]);

  const handleDownloadCsv = useCallback(() => {
    const csv = tableToCsv(columns, rows, delimiter);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    triggerFileDownload(blob, `${fileName}.csv`);
  }, [columns, rows, delimiter, fileName]);

  return (
    <div className="flex items-center gap-1.5 select-none">
      {/* Optional Left Slot (e.g. Table candidate selector) */}
      {leftSlot}

      {/* Unified Search Input */}
      <div className="relative flex items-center min-w-[100px] max-w-[120px] md:max-w-[150px]">
        <Search className="absolute left-2 w-3 h-3 text-[var(--text-subtle)] pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder="Filter rows..."
          className="w-full pl-6 pr-2 py-0.5 text-[11px] rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-color)] text-[var(--text-main)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] transition-colors"
        />
      </div>

      {/* Copy CSV */}
      <button
        onClick={handleCopyCsv}
        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-[var(--text-muted)] hover:text-[var(--text-highlight)] hover:bg-[var(--bg-surface-elevated)] transition-colors"
        title="Copy Table as CSV"
      >
        {copied ? (
          <>
            <Check className="w-3 h-3 text-[var(--accent)]" />
            <span className="text-[10px] text-[var(--accent)] font-medium">
              Copied
            </span>
          </>
        ) : (
          <>
            <Copy className="w-3 h-3" />
            <span className="text-[10px] hidden md:inline">Copy CSV</span>
          </>
        )}
      </button>

      {/* Export CSV */}
      <button
        onClick={handleDownloadCsv}
        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-[var(--text-muted)] hover:text-[var(--text-highlight)] hover:bg-[var(--bg-surface-elevated)] transition-colors"
        title="Download as .csv file"
      >
        <Download className="w-3 h-3" />
        <span className="text-[10px] hidden md:inline">Export CSV</span>
      </button>

      {/* Optional Right Slot (e.g. Delimiter badge, mode toggle) */}
      {rightSlot}
    </div>
  );
};
