import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Table as TableIcon,
  Search,
  Trash2,
  Edit2,
  Rows3,
} from "lucide-react";
import { analyzeCellValue } from "../services/jsonTableUtils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { computeMergeSpanMap } from "../services/csvDecorationEngine";
import { usePreviewSessionStore } from "../store/previewSessionStore";

import type {
  DecorationMap,
  CsvMergeConfig,
} from "../types/csvDecoration.types";

export interface DataTableProps {
  /** Used to persist interactive state (sort, page, pageSize, mergedView) across tab switches. */
  tabId: string;
  columns: string[];
  rows: Record<string, unknown>[];
  tableName?: string;
  searchQuery?: string;
  onUpdateCell?: (rowIndex: number, column: string, newValue: string) => void;
  onRenameColumn?: (oldColumn: string, newColumn: string) => void;
  onMoveColumn?: (column: string, direction: "left" | "right") => void;
  onDeleteRow?: (rowIndex: number) => void;
  onDeleteColumn?: (column: string) => void;
  isReadOnly?: boolean;
  decorationMap?: DecorationMap;
  mergeConfig?: CsvMergeConfig;
}

type SortDirection = "asc" | "desc" | null;

interface SortState {
  column: string | null;
  direction: SortDirection;
}

interface ContextMenuState {
  x: number;
  y: number;
  type: "row" | "column";
  targetRowIndex?: number;
  targetColumn?: string;
}

export const DataTable: React.FC<DataTableProps> = ({
  tabId,
  columns,
  rows,
  searchQuery = "",
  onUpdateCell,
  onRenameColumn,
  onDeleteRow,
  onDeleteColumn,
  onMoveColumn,
  isReadOnly = false,
  decorationMap,
  mergeConfig,
}) => {
  // Per-tab session state — select sessions[tabId] directly so Zustand
  // can detect changes and trigger re-renders correctly.
  const updateSession = usePreviewSessionStore((s) => s.updateSession);
  const rawSession = usePreviewSessionStore((s) => s.sessions[tabId]);
  const session = rawSession ?? {
    filterQuery: "",
    currentPage: 1,
    pageSize: 50,
    sortState: { column: null as string | null, direction: null as "asc" | "desc" | null },
    isMergedView: false,
  };

  const sortState: SortState = session.sortState;
  const setSortState = useCallback(
    (updater: SortState | ((prev: SortState) => SortState)) => {
      const prev = usePreviewSessionStore.getState().sessions[tabId]?.sortState
        ?? { column: null, direction: null };
      const next = typeof updater === "function" ? updater(prev) : updater;
      updateSession(tabId, { sortState: next });
    },
    [tabId, updateSession],
  );

  const currentPage = session.currentPage;
  const setCurrentPage = useCallback(
    (updater: number | ((prev: number) => number)) => {
      const prev = usePreviewSessionStore.getState().sessions[tabId]?.currentPage ?? 1;
      const next = typeof updater === "function" ? updater(prev) : updater;
      updateSession(tabId, { currentPage: next });
    },
    [tabId, updateSession],
  );

  const pageSize = session.pageSize;
  const setPageSize = useCallback(
    (size: number) => updateSession(tabId, { pageSize: size }),
    [tabId, updateSession],
  );

  // Auto-merge view state (toggleable via footer button)
  const isMergedView = session.isMergedView;
  const setIsMergedView = useCallback(
    (updater: boolean | ((prev: boolean) => boolean)) => {
      const prev = usePreviewSessionStore.getState().sessions[tabId]?.isMergedView ?? false;
      const next = typeof updater === "function" ? updater(prev) : updater;
      updateSession(tabId, { isMergedView: next });
    },
    [tabId, updateSession],
  );

  const canMerge = Boolean(mergeConfig && mergeConfig.mode !== "none");
  const effectiveMergedView = canMerge && isMergedView;
  const effectiveReadOnly = isReadOnly || effectiveMergedView;


  // Editing state for cells and column headers
  const [editingCell, setEditingCell] = useState<{
    rowIndex: number;
    col: string;
    value: string;
  } | null>(null);

  const [editingColumn, setEditingColumn] = useState<{
    oldName: string;
    value: string;
  } | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const cellInputRef = useRef<HTMLInputElement>(null);
  const colInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus and select text ONLY when entering edit mode (not on every keystroke)
  const cellKey = editingCell
    ? `${editingCell.rowIndex}:${editingCell.col}`
    : null;
  const prevCellKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (cellKey && cellKey !== prevCellKeyRef.current && cellInputRef.current) {
      cellInputRef.current.focus();
      cellInputRef.current.select();
    }
    prevCellKeyRef.current = cellKey;
  }, [cellKey]);

  const colKey = editingColumn?.oldName ?? null;
  const prevColKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (colKey && colKey !== prevColKeyRef.current && colInputRef.current) {
      colInputRef.current.focus();
      colInputRef.current.select();
    }
    prevColKeyRef.current = colKey;
  }, [colKey]);

  // Close context menu on outside click or Escape
  useEffect(() => {
    if (!contextMenu) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node)
      ) {
        setContextMenu(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setContextMenu(null);
      }
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [contextMenu]);

  // Reset page when search query changes
  useEffect(() => {
    updateSession(tabId, { currentPage: 1 });
  }, [searchQuery, tabId, updateSession]);

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

  // Calculate merge span map for the current displayed page
  const mergeSpanMap = useMemo(() => {
    if (!effectiveMergedView || !mergeConfig) return null;
    return computeMergeSpanMap(paginatedRows, columns, mergeConfig);
  }, [effectiveMergedView, mergeConfig, paginatedRows, columns]);

  // Handle column header click for sorting
  const handleSort = useCallback((column: string) => {
    // If currently renaming this column, don't sort
    setSortState((prev) => {
      if (prev.column !== column) {
        return { column, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { column, direction: "desc" };
      }
      return { column: null, direction: null };
    });
  }, [setSortState]);

  // Commit cell changes
  const handleCommitCell = useCallback(() => {
    if (!editingCell) return;
    const { rowIndex, col, value } = editingCell;
    const originalVal = rows[rowIndex]?.[col];
    const originalStr =
      originalVal === null || originalVal === undefined
        ? ""
        : typeof originalVal === "object"
          ? JSON.stringify(originalVal)
          : String(originalVal);

    if (value !== originalStr) {
      onUpdateCell?.(rowIndex, col, value);
    }
    setEditingCell(null);
  }, [editingCell, rows, onUpdateCell]);

  // Commit column renaming
  const handleCommitColumn = useCallback(() => {
    if (!editingColumn) return;
    const { oldName, value } = editingColumn;
    const trimmed = value.trim();
    if (trimmed && trimmed !== oldName) {
      onRenameColumn?.(oldName, trimmed);
    }
    setEditingColumn(null);
  }, [editingColumn, onRenameColumn]);

  // Open context menu for row
  const handleRowContextMenu = (e: React.MouseEvent, rowIndex: number) => {
    if (effectiveReadOnly || !onDeleteRow) return;
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: Math.min(e.clientX, window.innerWidth - 160),
      y: Math.min(e.clientY, window.innerHeight - 100),
      type: "row",
      targetRowIndex: rowIndex,
    });
  };

  // Open context menu for column
  const handleColContextMenu = (e: React.MouseEvent, column: string) => {
    if (effectiveReadOnly || (!onRenameColumn && !onDeleteColumn)) return;
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: Math.min(e.clientX, window.innerWidth - 180),
      y: Math.min(e.clientY, window.innerHeight - 140),
      type: "column",
      targetColumn: column,
    });
  };

  // Render cell content intelligently (primitives, booleans, shallow lists/objects)
  const renderCell = (value: unknown, realRowIndex: number, col: string) => {
    const isEditing =
      editingCell?.rowIndex === realRowIndex && editingCell?.col === col;

    if (isEditing) {
      return (
        <input
          ref={cellInputRef}
          type="text"
          value={editingCell.value}
          onChange={(e) =>
            setEditingCell((prev) =>
              prev ? { ...prev, value: e.target.value } : null,
            )
          }
          onBlur={handleCommitCell}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCommitCell();
            if (e.key === "Escape") setEditingCell(null);
          }}
          className="w-full px-1.5 py-0.5 text-xs font-mono rounded bg-[var(--bg-app)] border border-[var(--accent)] text-[var(--text-main)] outline-none shadow-xs"
        />
      );
    }

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
      {/* Table Content Container - Directly at the top to save vertical space */}
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
                  const isRenaming = editingColumn?.oldName === col;

                  return (
                    <th
                      key={col}
                      onContextMenu={(e) => handleColContextMenu(e, col)}
                      className="px-3 py-1.5 text-xs font-semibold text-[var(--text-main)] bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] hover:bg-[var(--bg-surface-elevated)] transition-colors whitespace-nowrap"
                    >
                      {isRenaming ? (
                        <input
                          ref={colInputRef}
                          type="text"
                          value={editingColumn.value}
                          onChange={(e) =>
                            setEditingColumn((prev) =>
                              prev ? { ...prev, value: e.target.value } : null,
                            )
                          }
                          onBlur={handleCommitColumn}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCommitColumn();
                            if (e.key === "Escape") setEditingColumn(null);
                          }}
                          className="px-1.5 py-0.5 text-xs rounded bg-[var(--bg-app)] border border-[var(--accent)] text-[var(--text-main)] outline-none"
                        />
                      ) : (
                        <div
                          onDoubleClick={(e) => {
                            if (!effectiveReadOnly && onRenameColumn) {
                              e.stopPropagation();
                              setEditingColumn({ oldName: col, value: col });
                            }
                          }}
                          className="flex items-center justify-between gap-2"
                          title={
                            effectiveReadOnly
                              ? undefined
                              : "Double-click to rename"
                          }
                        >
                          <span className="truncate">{col}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSort(col);
                            }}
                            className="p-0.5 rounded text-[var(--text-subtle)] hover:text-[var(--text-highlight)] hover:bg-[var(--bg-app)] cursor-pointer transition-colors"
                            title={`Sort by ${col}`}
                          >
                            {isSorted ? (
                              sortState.direction === "asc" ? (
                                <ArrowUp className="w-3.5 h-3.5 text-[var(--accent)]" />
                              ) : (
                                <ArrowDown className="w-3.5 h-3.5 text-[var(--accent)]" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                            )}
                          </button>
                        </div>
                      )}
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
                const realRowIndex = rows.indexOf(row);
                const rowStyle = decorationMap?.rows.get(realRowIndex);
                const indexStyle = decorationMap?.indexCells.get(realRowIndex);

                return (
                  <tr
                    key={rowIndex}
                    onContextMenu={(e) => handleRowContextMenu(e, realRowIndex)}
                    style={
                      rowStyle?.background
                        ? { backgroundColor: rowStyle.background }
                        : undefined
                    }
                    className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-elevated)]/50 transition-colors group"
                  >
                    {/* Row Index Cell with context menu on right click */}
                    <td
                      onContextMenu={(e) =>
                        handleRowContextMenu(e, realRowIndex)
                      }
                      style={{
                        backgroundColor: indexStyle?.background,
                        color: indexStyle?.color,
                        fontWeight: indexStyle?.bold ? "bold" : undefined,
                        fontStyle: indexStyle?.italic ? "italic" : undefined,
                        textDecoration: indexStyle?.underline
                          ? "underline"
                          : undefined,
                      }}
                      className="px-3 py-2 text-[10px] font-mono text-[var(--text-subtle)] text-center border-r border-[var(--border-subtle)] select-none cursor-context-menu"
                      title="Right-click for options"
                    >
                      {rowIndex}
                    </td>
                    {columns.map((col) => {
                      // In merged view: if this cell is merged into an earlier cell, omit td
                      const span = mergeSpanMap?.[idx]?.[col];
                      if (span && span.rowSpan === 0) {
                        return null;
                      }

                      const rowSpanAttr =
                        span && span.rowSpan > 1 ? span.rowSpan : undefined;

                      const cellStyle =
                        decorationMap?.cells.get(`${realRowIndex}:${col}`) ||
                        (rowStyle &&
                        !decorationMap?.cells.has(`${realRowIndex}:${col}`)
                          ? rowStyle
                          : undefined);

                      return (
                        <td
                          key={col}
                          rowSpan={rowSpanAttr}
                          onDoubleClick={() => {
                            if (!effectiveReadOnly && onUpdateCell) {
                              const val = row[col];
                              setEditingCell({
                                rowIndex: realRowIndex,
                                col,
                                value:
                                  val === null || val === undefined
                                    ? ""
                                    : typeof val === "object"
                                      ? JSON.stringify(val)
                                      : String(val),
                              });
                            }
                          }}
                          style={{
                            backgroundColor: cellStyle?.background,
                            color: cellStyle?.color,
                            fontWeight: cellStyle?.bold ? "bold" : undefined,
                            fontStyle: cellStyle?.italic ? "italic" : undefined,
                            textDecoration: cellStyle?.underline
                              ? "underline"
                              : undefined,
                            verticalAlign:
                              rowSpanAttr && rowSpanAttr > 1
                                ? "middle"
                                : undefined,
                          }}
                          className={`px-3 py-2 text-xs border-r border-[var(--border-subtle)] ${
                            rowSpanAttr && rowSpanAttr > 1
                              ? "align-middle"
                              : "align-top"
                          }`}
                          title={
                            !effectiveReadOnly && onUpdateCell
                              ? "Double-click to edit cell"
                              : undefined
                          }
                        >
                          {renderCell(row[col], realRowIndex, col)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {totalRows > 0 && (
        <div data-no-print="true" className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 border-t border-[var(--border-color)] bg-[var(--bg-surface)] shrink-0 select-none text-xs text-[var(--text-muted)]">
          {/* Row count summary & Merged View toggle */}
          <div className="flex items-center gap-2">
            <span>
              Total <strong>{totalRows}</strong>{" "}
              {totalRows === 1 ? "row" : "rows"}
              {columns.length > 0 && ` • ${columns.length} columns`}
            </span>

            {/* Render Merged View button */}
            {canMerge && (
              <>
                <div className="h-3 w-[1px] bg-[var(--border-color)]" />
                <button
                  type="button"
                  onClick={() => setIsMergedView((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                    effectiveMergedView
                      ? "bg-[var(--accent-blue)] text-white shadow-xs"
                      : "text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/15 border border-[var(--accent-blue)]/30"
                  }`}
                  title={
                    effectiveMergedView
                      ? "Exit Merged View (switch back to editable table)"
                      : `Render Merged View (Read-only, ${mergeConfig?.mode === "empty" ? "If Empty" : `By ID: ${mergeConfig?.idColumn}`})`
                  }
                >
                  <Rows3 className="w-3.5 h-3.5" />
                  <span>
                    {effectiveMergedView ? "Merged View: ON" : "Render Merged"}
                  </span>
                </button>
              </>
            )}

            <div className="h-3 w-[1px] bg-[var(--border-color)] hidden sm:block" />

            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5">
              <span className="hidden sm:inline text-[11px]">Show:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  updateSession(tabId, { currentPage: 1 });
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

      {/* Floating Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 min-w-[150px] p-1 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-color)] shadow-2xl text-xs backdrop-blur-md animate-in fade-in zoom-in-95 select-none"
        >
          {contextMenu.type === "column" && contextMenu.targetColumn && (
            <>
              {onMoveColumn &&
                (() => {
                  const colIdx = columns.indexOf(contextMenu.targetColumn!);
                  const canMoveLeft = colIdx > 0;
                  const canMoveRight =
                    colIdx >= 0 && colIdx < columns.length - 1;

                  return (
                    <>
                      <button
                        disabled={!canMoveLeft}
                        onClick={() => {
                          const col = contextMenu.targetColumn!;
                          setContextMenu(null);
                          onMoveColumn(col, "left");
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-[var(--bg-surface)] disabled:opacity-30 disabled:pointer-events-none text-[var(--text-main)] text-left transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 text-[var(--accent)]" />
                        <span>Move Column Left</span>
                      </button>

                      <button
                        disabled={!canMoveRight}
                        onClick={() => {
                          const col = contextMenu.targetColumn!;
                          setContextMenu(null);
                          onMoveColumn(col, "right");
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-[var(--bg-surface)] disabled:opacity-30 disabled:pointer-events-none text-[var(--text-main)] text-left transition-colors"
                      >
                        <ArrowRight className="w-3.5 h-3.5 text-[var(--accent)]" />
                        <span>Move Column Right</span>
                      </button>

                      <div className="h-[1px] bg-[var(--border-color)] my-1" />
                    </>
                  );
                })()}

              {onRenameColumn && (
                <button
                  onClick={() => {
                    const col = contextMenu.targetColumn!;
                    setContextMenu(null);
                    setEditingColumn({ oldName: col, value: col });
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-[var(--bg-surface)] text-[var(--text-main)] text-left transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                  <span>Rename Column</span>
                </button>
              )}
              {onDeleteColumn && (
                <button
                  onClick={() => {
                    const col = contextMenu.targetColumn!;
                    setContextMenu(null);
                    onDeleteColumn(col);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-rose-500/10 text-rose-500 text-left transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Column</span>
                </button>
              )}
            </>
          )}

          {contextMenu.type === "row" &&
            contextMenu.targetRowIndex !== undefined && (
              <button
                onClick={() => {
                  const idx = contextMenu.targetRowIndex!;
                  setContextMenu(null);
                  onDeleteRow?.(idx);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-rose-500/10 text-rose-500 text-left transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Row #{contextMenu.targetRowIndex + 1}</span>
              </button>
            )}
        </div>
      )}
    </div>
  );
};
