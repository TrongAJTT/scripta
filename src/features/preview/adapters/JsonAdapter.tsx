import React, { useState, useEffect, useMemo, useCallback } from "react";
import type { PreviewAdapterProps } from "./types";
import {
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  AlertCircle,
  Braces,
  Table as TableIcon,
} from "lucide-react";

import {
  JSON_THEMES,
  type JsonThemeColors,
} from "../../../core/constants/jsonThemes";
import { useEditorStore } from "../../tabs/store";
import { analyzeJsonForTables } from "../services/jsonTableUtils";
import { DataTable } from "../components/DataTable";
import { DataTableHeaderActions } from "../components/DataTableHeaderActions";

interface JsonNodeProps {
  name?: string | number;
  value: unknown;
  depth: number;
  isAllExpanded: boolean | null;
  isLast?: boolean;
  colors: JsonThemeColors;
}

const JsonNode: React.FC<JsonNodeProps> = ({
  name,
  value,
  depth,
  isAllExpanded,
  isLast = true,
  colors,
}) => {
  const isObject = value !== null && typeof value === "object";
  const isArray = Array.isArray(value);

  // Initialize open state based on expand mode
  const [isOpen, setIsOpen] = useState(() => {
    if (isAllExpanded === true) return true;
    if (isAllExpanded === false) return depth === 0;
    return depth < 2;
  });

  const toggle = () => setIsOpen((prev) => !prev);

  // Primitive value renderer
  const renderPrimitive = (val: unknown) => {
    if (val === null) {
      return (
        <span
          style={{ color: colors.nullValue }}
          className="font-semibold italic"
        >
          null
        </span>
      );
    }
    if (val === undefined) {
      return (
        <span className="text-slate-500 font-semibold italic">undefined</span>
      );
    }
    switch (typeof val) {
      case "string":
        return <span style={{ color: colors.string }}>"{val}"</span>;
      case "number":
        return (
          <span style={{ color: colors.number }} className="font-mono">
            {val}
          </span>
        );
      case "boolean":
        return (
          <span style={{ color: colors.boolean }} className="font-bold">
            {val ? "true" : "false"}
          </span>
        );
      default:
        return <span className="text-[var(--text-main)]">{String(val)}</span>;
    }
  };

  const comma = !isLast && <span style={{ color: colors.bracket }}>,</span>;

  if (!isObject) {
    return (
      <div className="flex items-start gap-1 py-0.5 font-mono text-xs hover:bg-[var(--bg-surface-elevated)]/40 rounded px-1 group">
        {name !== undefined && (
          <span style={{ color: colors.key }} className="font-medium shrink-0">
            {typeof name === "string" ? `"${name}"` : name}:
          </span>
        )}
        <span className="break-all">{renderPrimitive(value)}</span>
        {comma}
      </div>
    );
  }

  const entries = isArray
    ? (value as unknown[]).map((v, i) => [i, v] as const)
    : Object.entries(value as Record<string, unknown>);
  const itemCount = entries.length;
  const openBracket = isArray ? "[" : "{";
  const closeBracket = isArray ? "]" : "}";

  return (
    <div className="font-mono text-xs select-text">
      {/* Node Header */}
      <div
        onClick={toggle}
        className="flex items-center gap-1 py-0.5 hover:bg-[var(--bg-surface-elevated)]/60 rounded px-1 cursor-pointer select-none group"
      >
        <span className="text-[var(--text-subtle)] group-hover:text-[var(--text-highlight)] transition-colors p-0.5">
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
          )}
        </span>

        {name !== undefined && (
          <span style={{ color: colors.key }} className="font-medium">
            {typeof name === "string" ? `"${name}"` : name}:
          </span>
        )}

        <span style={{ color: colors.bracket }} className="font-bold">
          {openBracket}
        </span>

        {!isOpen && (
          <>
            <span
              style={{
                backgroundColor: colors.countBadgeBg,
                color: colors.countBadgeText,
                borderColor: colors.countBadgeBorder,
              }}
              className="px-1.5 py-0.2 rounded border text-[10px] font-semibold mx-1"
            >
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
            <span style={{ color: colors.bracket }} className="font-bold">
              {closeBracket}
            </span>
            {comma}
          </>
        )}
      </div>

      {/* Expanded Children */}
      {isOpen && (
        <div className="pl-4 border-l border-[var(--border-color)] ml-2.5 my-0.5 space-y-0.5">
          {itemCount === 0 ? (
            <div className="text-[var(--text-subtle)] italic pl-1 py-0.5">
              empty
            </div>
          ) : (
            entries.map(([childKey, childVal], idx) => (
              <JsonNode
                key={childKey}
                name={childKey}
                value={childVal}
                depth={depth + 1}
                isAllExpanded={isAllExpanded}
                isLast={idx === entries.length - 1}
                colors={colors}
              />
            ))
          )}
        </div>
      )}

      {isOpen && (
        <div
          style={{ color: colors.bracket }}
          className="pl-4 py-0.5 font-bold select-none"
        >
          {closeBracket}
          {comma}
        </div>
      )}
    </div>
  );
};

// Smart type caster for edited cell values
function castJsonValue(val: string): unknown {
  const trimmed = val.trim();
  if (trimmed === "null") return null;
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed !== "" && !Number.isNaN(Number(trimmed))) {
    return Number(trimmed);
  }
  if (
    (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
    (trimmed.startsWith("{") && trimmed.endsWith("}"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // Fallback to string
    }
  }
  return val;
}

export const JsonAdapter: React.FC<PreviewAdapterProps> = ({
  tab,
  setHeaderActions,
}) => {
  const jsonTheme = useEditorStore((s) => s.settings.jsonTheme || "default");
  const themeColors = JSON_THEMES[jsonTheme] || JSON_THEMES.default;
  const updateTabContent = useEditorStore((s) => s.updateTabContent);

  const [expandMode, setExpandMode] = useState<{
    isAllExpanded: boolean | null;
    key: number;
  }>({
    isAllExpanded: null,
    key: 0,
  });
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"tree" | "table">("tree");
  const [searchQuery, setSearchQuery] = useState("");

  const rawContent = tab.content || "";

  // Parse JSON
  const { data, error } = useMemo(() => {
    if (!rawContent.trim()) {
      return { data: null, error: null };
    }
    try {
      const parsed = JSON.parse(rawContent);
      return { data: parsed, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  }, [rawContent]);

  // Analyze if JSON can be presented as a table
  const tableAnalysis = useMemo(() => analyzeJsonForTables(data), [data]);

  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState<
    number | null
  >(null);
  const activeCandidateIndex =
    selectedCandidateIndex !== null &&
    selectedCandidateIndex < tableAnalysis.candidates.length
      ? selectedCandidateIndex
      : tableAnalysis.defaultCandidateIndex;

  const currentCandidate =
    tableAnalysis.candidates[activeCandidateIndex] ||
    tableAnalysis.candidates[0];

  const handleCopyPretty = useCallback(async () => {
    if (data === null) return;
    try {
      const formatted = JSON.stringify(data, null, 2);
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, [data]);

  const handleExpandAll = useCallback(() => {
    setExpandMode({ isAllExpanded: true, key: Date.now() });
  }, []);

  const handleCollapseAll = useCallback(() => {
    setExpandMode({ isAllExpanded: false, key: Date.now() });
  }, []);

  // 2-Way Data-Binding Handlers for JSON
  const handleUpdateCell = useCallback(
    (rowIndex: number, column: string, newValue: string) => {
      if (!data || !currentCandidate) return;
      try {
        const cloned = JSON.parse(JSON.stringify(data));
        const parsedVal = castJsonValue(newValue);

        if (currentCandidate.id === "root") {
          if (Array.isArray(cloned) && cloned[rowIndex]) {
            cloned[rowIndex][column] = parsedVal;
          }
        } else if (currentCandidate.id === "__dictionary__") {
          const targetId = currentCandidate.rows[rowIndex]?._id as string;
          if (targetId && cloned[targetId]) {
            cloned[targetId][column] = parsedVal;
          }
        } else {
          // Property array in root object
          const candidateArray = cloned[currentCandidate.id];
          if (Array.isArray(candidateArray) && candidateArray[rowIndex]) {
            candidateArray[rowIndex][column] = parsedVal;
          }
        }

        updateTabContent(tab.id, JSON.stringify(cloned, null, 2));
      } catch {
        // Guard against clone errors
      }
    },
    [data, currentCandidate, tab.id, updateTabContent],
  );

  const handleRenameColumn = useCallback(
    (oldColumn: string, newColumn: string) => {
      if (!data || !currentCandidate || !newColumn.trim() || newColumn === oldColumn) return;
      try {
        const cloned = JSON.parse(JSON.stringify(data));
        const renameInRow = (r: Record<string, unknown>) => {
          r[newColumn] = r[oldColumn];
          delete r[oldColumn];
        };

        if (currentCandidate.id === "root" && Array.isArray(cloned)) {
          cloned.forEach(renameInRow);
        } else if (currentCandidate.id === "__dictionary__") {
          Object.values(cloned).forEach((v) => {
            if (v && typeof v === "object") renameInRow(v as Record<string, unknown>);
          });
        } else {
          const candidateArray = cloned[currentCandidate.id];
          if (Array.isArray(candidateArray)) {
            candidateArray.forEach(renameInRow);
          }
        }

        updateTabContent(tab.id, JSON.stringify(cloned, null, 2));
      } catch {
        // Guard
      }
    },
    [data, currentCandidate, tab.id, updateTabContent],
  );

  const handleDeleteRow = useCallback(
    (rowIndex: number) => {
      if (!data || !currentCandidate) return;
      try {
        const cloned = JSON.parse(JSON.stringify(data));

        if (currentCandidate.id === "root" && Array.isArray(cloned)) {
          cloned.splice(rowIndex, 1);
        } else if (currentCandidate.id === "__dictionary__") {
          const targetId = currentCandidate.rows[rowIndex]?._id as string;
          if (targetId) delete cloned[targetId];
        } else {
          const candidateArray = cloned[currentCandidate.id];
          if (Array.isArray(candidateArray)) {
            candidateArray.splice(rowIndex, 1);
          }
        }

        updateTabContent(tab.id, JSON.stringify(cloned, null, 2));
      } catch {
        // Guard
      }
    },
    [data, currentCandidate, tab.id, updateTabContent],
  );

  const handleDeleteColumn = useCallback(
    (column: string) => {
      if (!data || !currentCandidate) return;
      try {
        const cloned = JSON.parse(JSON.stringify(data));
        const deleteInRow = (r: Record<string, unknown>) => {
          delete r[column];
        };

        if (currentCandidate.id === "root" && Array.isArray(cloned)) {
          cloned.forEach(deleteInRow);
        } else if (currentCandidate.id === "__dictionary__") {
          Object.values(cloned).forEach((v) => {
            if (v && typeof v === "object") deleteInRow(v as Record<string, unknown>);
          });
        } else {
          const candidateArray = cloned[currentCandidate.id];
          if (Array.isArray(candidateArray)) {
            candidateArray.forEach(deleteInRow);
          }
        }

        updateTabContent(tab.id, JSON.stringify(cloned, null, 2));
      } catch {
        // Guard
      }
    },
    [data, currentCandidate, tab.id, updateTabContent],
  );

  const handleMoveColumn = useCallback(
    (column: string, direction: "left" | "right") => {
      if (!data || !currentCandidate) return;
      const idx = currentCandidate.columns.indexOf(column);
      if (idx === -1) return;
      if (direction === "left" && idx === 0) return;
      if (direction === "right" && idx === currentCandidate.columns.length - 1) return;

      const targetIdx = direction === "left" ? idx - 1 : idx + 1;
      const reorderedCols = [...currentCandidate.columns];
      const [movedCol] = reorderedCols.splice(idx, 1);
      reorderedCols.splice(targetIdx, 0, movedCol);

      try {
        const cloned = JSON.parse(JSON.stringify(data));
        const reorderInRow = (r: Record<string, unknown>) => {
          const newRow: Record<string, unknown> = {};
          for (const c of reorderedCols) {
            if (Object.prototype.hasOwnProperty.call(r, c)) {
              newRow[c] = r[c];
            }
          }
          // Preserve any extra keys not in reorderedCols
          for (const k of Object.keys(r)) {
            if (!Object.prototype.hasOwnProperty.call(newRow, k)) {
              newRow[k] = r[k];
            }
          }
          // Clear and copy back
          for (const k of Object.keys(r)) {
            delete r[k];
          }
          Object.assign(r, newRow);
        };

        if (currentCandidate.id === "root" && Array.isArray(cloned)) {
          cloned.forEach(reorderInRow);
        } else if (currentCandidate.id === "__dictionary__") {
          Object.values(cloned).forEach((v) => {
            if (v && typeof v === "object") reorderInRow(v as Record<string, unknown>);
          });
        } else {
          const candidateArray = cloned[currentCandidate.id];
          if (Array.isArray(candidateArray)) {
            candidateArray.forEach(reorderInRow);
          }
        }

        updateTabContent(tab.id, JSON.stringify(cloned, null, 2));
      } catch {
        // Guard
      }
    },
    [data, currentCandidate, tab.id, updateTabContent],
  );

  // Inject trailing actions into unified PreviewPanel header
  useEffect(() => {
    if (error || data === null) {
      setHeaderActions?.(null);
      return;
    }

    const modeToggle = tableAnalysis.isTableCompatible ? (
      <div className="flex items-center rounded-md p-0.5 bg-[var(--bg-surface-elevated)] border border-[var(--border-color)] ml-0.5">
        <button
          onClick={() => setViewMode("tree")}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
            viewMode === "tree"
              ? "bg-[var(--bg-app)] text-[var(--text-highlight)] shadow-xs"
              : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
          }`}
          title="View as JSON Tree"
        >
          <Braces className="w-3 h-3 text-[var(--accent-yellow)]" />
          <span>JSON</span>
        </button>
        <button
          onClick={() => setViewMode("table")}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
            viewMode === "table"
              ? "bg-[var(--bg-app)] text-emerald-500 shadow-xs"
              : "text-[var(--text-muted)] hover:text-emerald-400"
          }`}
          title="Switch to Table View"
        >
          <TableIcon className="w-3 h-3 text-emerald-500" />
          <span>Table</span>
        </button>
      </div>
    ) : null;

    if (viewMode === "table" && currentCandidate) {
      const tableSelector =
        tableAnalysis.candidates.length > 1 ? (
          <select
            value={activeCandidateIndex}
            onChange={(e) => setSelectedCandidateIndex(Number(e.target.value))}
            className="px-1.5 py-0.5 rounded text-[11px] bg-[var(--bg-surface-elevated)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)]"
            title="Select Table"
          >
            {tableAnalysis.candidates.map((c, i) => (
              <option key={c.id} value={i}>
                {c.title} ({c.totalRows})
              </option>
            ))}
          </select>
        ) : null;

      setHeaderActions?.(
        <DataTableHeaderActions
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          columns={currentCandidate.columns}
          rows={currentCandidate.rows}
          fileName={`${tab.name.replace(/\.[^/.]+$/, "")}_${currentCandidate.title}`}
          leftSlot={tableSelector}
          rightSlot={modeToggle}
        />,
      );
      return () => setHeaderActions?.(null);
    }

    // Tree View Controls
    setHeaderActions?.(
      <div className="flex items-center gap-1.5 select-none">
        <button
          onClick={handleExpandAll}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-[var(--text-muted)] hover:text-[var(--text-highlight)] hover:bg-[var(--bg-surface-elevated)] transition-colors"
          title="Expand All"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="hidden md:inline text-[10px]">Expand All</span>
        </button>

        <button
          onClick={handleCollapseAll}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-[var(--text-muted)] hover:text-[var(--text-highlight)] hover:bg-[var(--bg-surface-elevated)] transition-colors"
          title="Collapse All"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span className="hidden md:inline text-[10px]">Collapse All</span>
        </button>

        <button
          onClick={handleCopyPretty}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-[var(--text-muted)] hover:text-[var(--text-highlight)] hover:bg-[var(--bg-surface-elevated)] transition-colors border-l border-[var(--border-color)] ml-0.5 pl-1.5"
          title="Copy Formatted JSON"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span className="text-[var(--accent)] font-medium text-[10px]">
                Copied
              </span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[10px]">
                Copy JSON
              </span>
            </>
          )}
        </button>

        {modeToggle}
      </div>,
    );

    return () => setHeaderActions?.(null);
  }, [
    setHeaderActions,
    data,
    error,
    tableAnalysis,
    viewMode,
    currentCandidate,
    activeCandidateIndex,
    searchQuery,
    copied,
    tab.name,
    handleExpandAll,
    handleCollapseAll,
    handleCopyPretty,
  ]);

  if (!rawContent.trim()) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center text-[var(--text-muted)] select-none">
        <Braces className="w-12 h-12 stroke-[1.2] text-[var(--text-subtle)] mb-3" />
        <p className="text-xs font-medium text-[var(--text-main)]">
          Empty JSON Document
        </p>
        <p className="text-[11px] text-[var(--text-muted)] mt-1 max-w-xs">
          Enter valid JSON in the editor to explore the interactive tree view.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-[var(--accent-red)] mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--text-highlight)] mb-1">
          Invalid JSON Syntax
        </h3>
        <p className="text-xs text-red-400 font-mono bg-red-950/40 border border-red-800/60 px-3 py-2 rounded-lg max-w-md break-all">
          {error}
        </p>
      </div>
    );
  }

  if (
    viewMode === "table" &&
    tableAnalysis.isTableCompatible &&
    currentCandidate
  ) {
    return (
      <div className="h-full w-full overflow-hidden">
        <DataTable
          tabId={tab.id}
          columns={currentCandidate.columns}
          rows={currentCandidate.rows}
          tableName={`${tab.name.replace(/\.[^/.]+$/, "")}_${currentCandidate.title}`}
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
  }

  return (
    <div className="h-full w-full overflow-auto bg-[var(--bg-preview)] p-4 select-text">
      <JsonNode
        key={expandMode.key}
        value={data}
        depth={0}
        isAllExpanded={expandMode.isAllExpanded}
        isLast={true}
        colors={themeColors}
      />
    </div>
  );
};
