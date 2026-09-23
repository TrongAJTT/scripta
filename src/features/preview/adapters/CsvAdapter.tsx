import React, { useState, useMemo, useEffect, useCallback } from "react";
import type { PreviewAdapterProps } from "./types";
import { parseCsv, tableToCsv } from "../services/csvParser";
import { DataTable } from "../components/DataTable";
import { DataTableHeaderActions } from "../components/DataTableHeaderActions";
import { useEditorStore } from "../../tabs/store";
import { Table as TableIcon } from "lucide-react";

export const CsvAdapter: React.FC<PreviewAdapterProps> = ({
  tab,
  setHeaderActions,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const updateTabContent = useEditorStore((s) => s.updateTabContent);

  const rawContent = tab.content || "";

  const parsed = useMemo(() => {
    return parseCsv(rawContent);
  }, [rawContent]);

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

  // 2-Way Data-Binding Handlers
  const handleUpdateCell = useCallback(
    (rowIndex: number, column: string, newValue: string) => {
      const newRows = parsed.rows.map((r, i) =>
        i === rowIndex ? { ...r, [column]: newValue } : r,
      );
      const newCsv = tableToCsv(parsed.columns, newRows, parsed.delimiter);
      updateTabContent(tab.id, newCsv);
    },
    [parsed, tab.id, updateTabContent],
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
      const newCsv = tableToCsv(newColumns, newRows, parsed.delimiter);
      updateTabContent(tab.id, newCsv);
    },
    [parsed, tab.id, updateTabContent],
  );

  const handleDeleteRow = useCallback(
    (rowIndex: number) => {
      const newRows = parsed.rows.filter((_, i) => i !== rowIndex);
      const newCsv = tableToCsv(parsed.columns, newRows, parsed.delimiter);
      updateTabContent(tab.id, newCsv);
    },
    [parsed, tab.id, updateTabContent],
  );

  const handleDeleteColumn = useCallback(
    (column: string) => {
      const newColumns = parsed.columns.filter((c) => c !== column);
      const newRows = parsed.rows.map((row) => {
        const updated = { ...row };
        delete updated[column];
        return updated;
      });
      const newCsv = tableToCsv(newColumns, newRows, parsed.delimiter);
      updateTabContent(tab.id, newCsv);
    },
    [parsed, tab.id, updateTabContent],
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

      const newCsv = tableToCsv(newColumns, parsed.rows, parsed.delimiter);
      updateTabContent(tab.id, newCsv);
    },
    [parsed, tab.id, updateTabContent],
  );

  // Inject unified actions into PreviewPanel header
  useEffect(() => {
    if (!rawContent.trim() || parsed.columns.length === 0) {
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
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--bg-surface-elevated)] border border-[var(--border-color)] text-[var(--accent)] tracking-tight">
            {delimiterName}
          </span>
        }
      />,
    );

    return () => setHeaderActions?.(null);
  }, [
    setHeaderActions,
    rawContent,
    parsed,
    delimiterName,
    searchQuery,
    tab.name,
  ]);

  if (!rawContent.trim() || parsed.columns.length === 0) {
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
    <div className="h-full w-full overflow-hidden">
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
      />
    </div>
  );
};
