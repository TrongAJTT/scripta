import React, { useMemo, useEffect } from "react";
import type { PreviewAdapterProps } from "./types";
import { parseCsv } from "../services/csvParser";
import { DataTable } from "../components/DataTable";
import { Table as TableIcon } from "lucide-react";

export const CsvAdapter: React.FC<PreviewAdapterProps> = ({
  tab,
  setHeaderActions,
}) => {
  const rawContent = tab.content || "";

  const parsed = useMemo(() => {
    return parseCsv(rawContent);
  }, [rawContent]);

  const delimiterName = useMemo(() => {
    switch (parsed.delimiter) {
      case "\t":
        return "TSV (Tab)";
      case ";":
        return "CSV (Semicolon)";
      case "|":
        return "DSV (Pipe)";
      default:
        return "CSV (Comma)";
    }
  }, [parsed.delimiter]);

  useEffect(() => {
    if (!rawContent.trim() || parsed.columns.length === 0) {
      setHeaderActions?.(null);
      return;
    }

    setHeaderActions?.(
      <div className="flex items-center gap-2 select-none">
        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--bg-surface-elevated)] border border-[var(--border-color)] text-[var(--accent)]">
          {delimiterName}
        </span>
        <span className="text-[11px] text-[var(--text-muted)] font-mono">
          {parsed.rowCount.toLocaleString()} rows • {parsed.columns.length} cols
        </span>
      </div>,
    );

    return () => setHeaderActions?.(null);
  }, [setHeaderActions, rawContent, parsed, delimiterName]);

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
      />
    </div>
  );
};
