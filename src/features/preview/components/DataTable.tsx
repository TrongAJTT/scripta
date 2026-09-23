import React, { useState, useMemo, useCallback } from "react";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Copy,
  Check,
  Table as TableIcon,
} from "lucide-react";
import { analyzeCellValue } from "../services/jsonTableUtils";
import { tableToCsv } from "../services/csvParser";
import { triggerFileDownload } from "../../../core/utils/downloadUtils";

export interface DataTableProps {
  columns: string[];
  rows: Record<string, unknown>[];
  tableName?: string;
  onExportCsv?: () => void;
  showExportButton?: boolean;
}

type SortDirection = "asc" | "desc" | null;

interface SortState {
  column: string | null;
  direction: SortDirection;
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  rows,
  tableName = "table",
  showExportButton = true,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortState, setSortState] = useState<SortState>({
    column: null,
    direction: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [copied, setCopied] = useState(false);

  // Filter rows based on search query across all columns
  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return rows;

    return rows.filter((row) =>
      columns.some((col) => {
        const val = row[col];
        if (val === null || val === undefined) return false;
        if (typeof val === "object") {
          return JSON.stringify(val).toLowerCase().includes(query);
        }
        return String(val).toLowerCase().includes(query);
      }),
    );
  }, [rows, columns, searchQuery]);

  // Sort rows based on sort state
  const sortedRows = useMemo(() => {
    if (!sortState.column || !sortState.direction) return filteredRows;

    const { column, direction } = sortState;
    const sorted = [...filteredRows].sort((a, b) => {
      const valA = a[column];
      const valB = b[column];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      // Numeric comparison
      const numA = Number(valA);
      const numB = Number(valB);
      if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
        return direction === "asc" ? numA - numB : numB - numA;
      }

      // String comparison
      const strA =
        typeof valA === "object" ? JSON.stringify(valA) : String(valA);
      const strB =
        typeof valB === "object" ? JSON.stringify(valB) : String(valB);
      return direction === "asc"
        ? strA.localeCompare(strB, undefined, { numeric: true })
        : strB.localeCompare(strA, undefined, { numeric: true });
    });

    return sorted;
  }, [filteredRows, sortState]);

  // Pagination calculation
  const totalRows = sortedRows.length;
  const isAllPages = pageSize === -1;
  const totalPages = isAllPages
    ? 1
    : Math.max(1, Math.ceil(totalRows / pageSize));

  // Current slice of rows to display
  const paginatedRows = useMemo(() => {
    if (isAllPages) return sortedRows;
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize, isAllPages]);

  // Handle column header click for sorting
  const handleSort = useCallback((column: string) => {
    setSortState((prev) => {
      if (prev.column !== column) {
        return { column, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { column, direction: "desc" };
      }
      return { column: null, direction: null };
    });
  }, []);

  // Export as CSV download
  const handleDownloadCsv = useCallback(() => {
    const csvContent = tableToCsv(columns, rows);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    triggerFileDownload(blob, `${tableName}.csv`);
  }, [columns, rows, tableName]);

  // Copy CSV to clipboard
  const handleCopyCsv = useCallback(async () => {
    try {
      const csvContent = tableToCsv(columns, rows);
      await navigator.clipboard.writeText(csvContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback
    }
  }, [columns, rows]);

  // Render cell content intelligently (primitives, booleans, shallow lists/objects)
  const renderCell = (value: unknown) => {
    const analyzed = analyzeCellValue(value);

    switch (analyzed.kind) {
      case "empty":
        return (
          <span className="text-[var(--text-subtle)] font-mono text-xs select-none">
            -
          </span>
        );

      case "primitive": {
        if (typeof analyzed.raw === "boolean") {
          return (
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                analyzed.raw
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
              }`}
            >
              {analyzed.raw ? "true" : "false"}
            </span>
          );
        }
        if (typeof analyzed.raw === "number") {
          return (
            <span className="font-mono text-xs text-amber-600 dark:text-amber-400">
              {analyzed.displayText}
            </span>
          );
        }
        return (
          <span className="text-xs text-[var(--text-main)] break-words">
            {analyzed.displayText}
          </span>
        );
      }

      case "shallow-array":
        return (
          <div className="flex flex-wrap items-center gap-1">
            {analyzed.items?.map((item, idx) => (
              <span
                key={idx}
                className="px-1.5 py-0.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-color)] text-[11px] font-mono text-[var(--text-main)]"
              >
                {typeof item === "object" ? JSON.stringify(item) : String(item)}
              </span>
            ))}
          </div>
        );

      case "shallow-object":
        return (
          <div className="flex flex-wrap items-center gap-1">
            {analyzed.entries?.map(([k, v]) => (
              <span
                key={k}
                className="px-1.5 py-0.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-color)] text-[10px] font-mono text-[var(--text-main)]"
                title={`${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`}
              >
                <strong className="text-[var(--text-muted)] font-normal">
                  {k}:
                </strong>{" "}
                {typeof v === "object" ? JSON.stringify(v) : String(v)}
              </span>
            ))}
          </div>
        );

      case "complex":
        return (
          <span
            className="px-1.5 py-0.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-muted)] cursor-help"
            title={JSON.stringify(analyzed.raw, null, 2)}
          >
            {analyzed.displayText}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg-preview)] select-text">
      {/* Table Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-[var(--border-color)] bg-[var(--bg-surface)] shrink-0 select-none">
        {/* Search Input */}
        <div className="relative flex items-center min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 w-3.5 h-3.5 text-[var(--text-subtle)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={`Filter ${totalRows} rows...`}
            className="w-full pl-8 pr-2.5 py-1 text-xs rounded-md bg-[var(--bg-app)] border border-[var(--border-color)] text-[var(--text-main)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>

        {/* Actions & Meta */}
        <div className="flex items-center gap-2">
          {searchQuery && (
            <span className="text-[11px] text-[var(--text-muted)]">
              {filteredRows.length} of {rows.length} rows
            </span>
          )}

          {showExportButton && (
            <div className="flex items-center gap-1 border-l border-[var(--border-color)] pl-2">
              <button
                onClick={handleCopyCsv}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[var(--text-muted)] hover:text-[var(--text-highlight)] hover:bg-[var(--bg-surface-elevated)] transition-colors"
                title="Copy Table as CSV"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span className="text-[11px] text-[var(--accent)] font-medium">
                      Copied
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px] hidden sm:inline">
                      Copy CSV
                    </span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadCsv}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[var(--text-muted)] hover:text-[var(--text-highlight)] hover:bg-[var(--bg-surface-elevated)] transition-colors"
                title="Download as .csv file"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden sm:inline">Export CSV</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table Content Container */}
      <div className="flex-1 overflow-auto">
        {columns.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[var(--text-muted)] select-none">
            <TableIcon className="w-10 h-10 stroke-[1.2] text-[var(--text-subtle)] mb-2" />
            <p className="text-xs font-medium text-[var(--text-main)]">
              No Table Columns Found
            </p>
          </div>
        ) : paginatedRows.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[var(--text-muted)] select-none">
            <Search className="w-8 h-8 stroke-[1.5] text-[var(--text-subtle)] mb-2" />
            <p className="text-xs font-medium text-[var(--text-main)]">
              No Matching Rows Found
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Try adjusting your filter search query.
            </p>
          </div>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-[var(--bg-surface)] shadow-xs select-none">
              <tr className="border-b border-[var(--border-color)]">
                {/* Row Index Column Header */}
                <th className="w-12 px-3 py-2 text-[10px] font-mono font-medium text-[var(--text-subtle)] bg-[var(--bg-surface)] text-center border-r border-[var(--border-subtle)]">
                  #
                </th>
                {columns.map((col) => {
                  const isSorted = sortState.column === col;
                  return (
                    <th
                      key={col}
                      onClick={() => handleSort(col)}
                      className="px-3 py-2 text-xs font-semibold text-[var(--text-main)] bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] cursor-pointer hover:bg-[var(--bg-surface-elevated)] transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span>{col}</span>
                        <span className="text-[var(--text-subtle)]">
                          {isSorted ? (
                            sortState.direction === "asc" ? (
                              <ArrowUp className="w-3.5 h-3.5 text-[var(--accent)]" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-[var(--accent)]" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, idx) => {
                const rowIndex = isAllPages
                  ? idx + 1
                  : (currentPage - 1) * pageSize + idx + 1;
                return (
                  <tr
                    key={rowIndex}
                    className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-elevated)]/50 transition-colors"
                  >
                    {/* Row Index Cell */}
                    <td className="px-3 py-2 text-[10px] font-mono text-[var(--text-subtle)] text-center border-r border-[var(--border-subtle)] select-none">
                      {rowIndex}
                    </td>
                    {columns.map((col) => (
                      <td
                        key={col}
                        className="px-3 py-2 text-xs border-r border-[var(--border-subtle)] align-top"
                      >
                        {renderCell(row[col])}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {totalRows > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 border-t border-[var(--border-color)] bg-[var(--bg-surface)] shrink-0 select-none text-xs text-[var(--text-muted)]">
          {/* Row count summary */}
          <div className="flex items-center gap-2">
            <span>
              Total <strong>{totalRows}</strong>{" "}
              {totalRows === 1 ? "row" : "rows"}
              {columns.length > 0 && ` • ${columns.length} columns`}
            </span>

            <div className="h-3 w-[1px] bg-[var(--border-color)] hidden sm:block" />

            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5">
              <span className="hidden sm:inline text-[11px]">Show:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-1.5 py-0.5 rounded bg-[var(--bg-app)] border border-[var(--border-color)] text-[11px] text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
                <option value={-1}>All</option>
              </select>
            </div>
          </div>

          {/* Page navigation */}
          {!isAllPages && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <span className="text-[11px] mr-1">
                Page {currentPage} of {totalPages}
              </span>

              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-highlight)] hover:bg-[var(--bg-surface-elevated)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <button
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-highlight)] hover:bg-[var(--bg-surface-elevated)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
