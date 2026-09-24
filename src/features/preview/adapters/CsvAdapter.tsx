import React, { useState, useMemo, useEffect, useCallback } from "react";
import type { PreviewAdapterProps } from "./types";
import { parseCsv, tableToCsv } from "../services/csvParser";
import { DataTable } from "../components/DataTable";
import { DataTableHeaderActions } from "../components/DataTableHeaderActions";
import { CsvDecorationModal } from "../components/CsvDecorationModal";
import {
  parseDecorationFromCsv,
  stripDecorationFromCsv,
  serializeDecorationToCsv,
} from "../services/csvDecorationStorage";
import { buildDecorationMap } from "../services/csvDecorationEngine";
import type {
  CsvDecorationRule,
  CsvMergeConfig,
} from "../types/csvDecoration.types";
import { useEditorStore } from "../../tabs/store";
import { Table as TableIcon, Palette } from "lucide-react";

export const CsvAdapter: React.FC<PreviewAdapterProps> = ({
  tab,
  setHeaderActions,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDecorationOpen, setIsDecorationOpen] = useState(false);
  const updateTabContent = useEditorStore((s) => s.updateTabContent);

  const rawContent = tab.content || "";

  // Extract decoration metadata embedded in the CSV content
  const decorationConfig = useMemo(() => {
    return parseDecorationFromCsv(rawContent);
  }, [rawContent]);

  const mergeConfig: CsvMergeConfig = useMemo(() => {
    return decorationConfig.merge ?? { mode: "none" };
  }, [decorationConfig.merge]);

  // Clean CSV content without decoration tag for tabular data parsing
  const cleanContent = useMemo(() => {
    return stripDecorationFromCsv(rawContent);
  }, [rawContent]);

  const parsed = useMemo(() => {
    return parseCsv(cleanContent);
  }, [cleanContent]);

  // Build high-performance lookup map for decorated rows and cells
  const decorationMap = useMemo(() => {
    return buildDecorationMap(
      decorationConfig.rules,
      parsed.rows,
      parsed.columns,
    );
  }, [decorationConfig.rules, parsed.rows, parsed.columns]);

  const delimiterName = useMemo(() => {
    switch (parsed.delimiter) {
      case "\t":
        return "TSV";
      case ";":
        return "SSV";
      case "|":
        return "DSV";
      default:
        return "CSV";
    }
  }, [parsed.delimiter]);

  // Helper to persist updated CSV rows while keeping decoration rules and merge intact
  const commitCsvData = useCallback(
    (columns: string[], rows: Record<string, string>[]) => {
      const newCsv = tableToCsv(columns, rows, parsed.delimiter);
      const withDecoration = serializeDecorationToCsv(newCsv, decorationConfig);
      updateTabContent(tab.id, withDecoration);
    },
    [parsed.delimiter, decorationConfig, tab.id, updateTabContent],
  );

  // Update decoration rules and serialize into CSV content
  const handleChangeRules = useCallback(
    (newRules: CsvDecorationRule[]) => {
      const withDecoration = serializeDecorationToCsv(cleanContent, {
        rules: newRules,
        merge: decorationConfig.merge,
      });
      updateTabContent(tab.id, withDecoration);
    },
    [cleanContent, decorationConfig.merge, tab.id, updateTabContent],
  );

  // Update merge configuration and serialize into CSV content
  const handleChangeMerge = useCallback(
    (newMerge: CsvMergeConfig) => {
      const withDecoration = serializeDecorationToCsv(cleanContent, {
        rules: decorationConfig.rules,
        merge: newMerge,
      });
      updateTabContent(tab.id, withDecoration);
    },
    [cleanContent, decorationConfig.rules, tab.id, updateTabContent],
  );

  // 2-Way Data-Binding Handlers
  const handleUpdateCell = useCallback(
    (rowIndex: number, column: string, newValue: string) => {
      const newRows = parsed.rows.map((r, i) =>
        i === rowIndex ? { ...r, [column]: newValue } : r,
      );
      commitCsvData(parsed.columns, newRows);
    },
    [parsed.rows, parsed.columns, commitCsvData],
  );

  const handleRenameColumn = useCallback(
    (oldColumn: string, newColumn: string) => {
      if (!newColumn.trim() || newColumn === oldColumn) return;
      const newColumns = parsed.columns.map((c) =>
        c === oldColumn ? newColumn : c,
      );
      const newRows = parsed.rows.map((row) => {
        const updated: Record<string, string> = {};
        for (const col of parsed.columns) {
          if (col === oldColumn) {
            updated[newColumn] = row[oldColumn] || "";
          } else {
            updated[col] = row[col] || "";
          }
        }
        return updated;
      });
      commitCsvData(newColumns, newRows);
    },
    [parsed.columns, parsed.rows, commitCsvData],
  );

  const handleDeleteRow = useCallback(
    (rowIndex: number) => {
      const newRows = parsed.rows.filter((_, i) => i !== rowIndex);
      commitCsvData(parsed.columns, newRows);
    },
    [parsed.rows, parsed.columns, commitCsvData],
  );

  const handleDeleteColumn = useCallback(
    (column: string) => {
      const newColumns = parsed.columns.filter((c) => c !== column);
      const newRows = parsed.rows.map((row) => {
        const updated = { ...row };
        delete updated[column];
        return updated;
      });
      commitCsvData(newColumns, newRows);
    },
    [parsed.columns, parsed.rows, commitCsvData],
  );

  const handleMoveColumn = useCallback(
    (column: string, direction: "left" | "right") => {
      const idx = parsed.columns.indexOf(column);
      if (idx === -1) return;
      if (direction === "left" && idx === 0) return;
      if (direction === "right" && idx === parsed.columns.length - 1) return;

      const targetIdx = direction === "left" ? idx - 1 : idx + 1;
      const newColumns = [...parsed.columns];
      const [removed] = newColumns.splice(idx, 1);
      newColumns.splice(targetIdx, 0, removed);

      commitCsvData(newColumns, parsed.rows);
    },
    [parsed.columns, parsed.rows, commitCsvData],
  );

  // Inject unified actions into PreviewPanel header
  useEffect(() => {
    if (!cleanContent.trim() || parsed.columns.length === 0) {
      setHeaderActions?.(null);
      return;
    }

    setHeaderActions?.(
      <DataTableHeaderActions
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        columns={parsed.columns}
        rows={parsed.rows}
        fileName={tab.name.replace(/\.[^/.]+$/, "")}
        delimiter={parsed.delimiter}
        rightSlot={
          <div className="flex items-center gap-1.5">
            {/* Decoration Modal Button */}
            <button
              type="button"
              onClick={() => setIsDecorationOpen(true)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                isDecorationOpen
                  ? "bg-[var(--accent)]/15 border border-[var(--accent)] text-[var(--accent)] font-medium"
                  : decorationConfig.rules.length > 0 ||
                      mergeConfig.mode !== "none"
                    ? "text-[var(--accent)] hover:bg-[var(--accent)]/20"
                    : "text-[var(--text-muted)] hover:text-[var(--text-highlight)] hover:bg-[var(--bg-surface-elevated)]"
              }`}
              title="Manage CSV Visual Highlights & Automated Row Merging"
            >
              <Palette className="w-3 h-3" />
              <span className="text-[10px] hidden md:inline">Decoration</span>
              {(decorationConfig.rules.length > 0 ||
                mergeConfig.mode !== "none") && (
                <span className="flex items-center gap-0.5 px-1 rounded-full text-[9px] font-mono bg-[var(--accent)] text-[var(--bg-app)] font-bold">
                  {decorationConfig.rules.length > 0 &&
                    decorationConfig.rules.length}
                  {mergeConfig.mode !== "none" && (
                    <span className="text-[8px] font-sans">M</span>
                  )}
                </span>
              )}
            </button>

            {/* Delimiter Badge */}
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--bg-surface-elevated)] border border-[var(--border-color)] text-[var(--accent)] tracking-tight">
              {delimiterName}
            </span>
          </div>
        }
      />,
    );

    return () => setHeaderActions?.(null);
  }, [
    setHeaderActions,
    cleanContent,
    parsed,
    delimiterName,
    searchQuery,
    tab.name,
    isDecorationOpen,
    decorationConfig.rules.length,
    mergeConfig.mode,
  ]);

  if (!cleanContent.trim() || parsed.columns.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center text-[var(--text-muted)] select-none">
        <TableIcon className="w-12 h-12 stroke-[1.2] text-[var(--text-subtle)] mb-3" />
        <p className="text-xs font-medium text-[var(--text-main)]">
          Empty CSV / TSV Document
        </p>
        <p className="text-[11px] text-[var(--text-muted)] mt-1 max-w-xs">
          Enter tabular data or paste CSV records in the editor to see the live
          table preview.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Visual Decoration & Layout Modal */}
      <CsvDecorationModal
        isOpen={isDecorationOpen}
        onClose={() => setIsDecorationOpen(false)}
        rules={decorationConfig.rules}
        onChangeRules={handleChangeRules}
        mergeConfig={mergeConfig}
        onChangeMerge={handleChangeMerge}
        columns={parsed.columns}
      />

      {/* Main Data Table */}
      <div className="flex-1 w-full overflow-hidden">
        <DataTable
          columns={parsed.columns}
          rows={parsed.rows}
          tableName={tab.name.replace(/\.[^/.]+$/, "")}
          searchQuery={searchQuery}
          onUpdateCell={handleUpdateCell}
          onRenameColumn={handleRenameColumn}
          onDeleteRow={handleDeleteRow}
          onDeleteColumn={handleDeleteColumn}
          onMoveColumn={handleMoveColumn}
          isReadOnly={Boolean(tab.isLocked)}
          decorationMap={decorationMap}
          mergeConfig={mergeConfig}
        />
      </div>
    </div>
  );
};
