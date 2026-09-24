import type {
  CsvDecorationRule,
  DecorationMap,
  CsvDecorationStyle,
  CsvMergeConfig,
  MergeSpanMap,
} from "../types/csvDecoration.types";

/**
 * Computes rowSpan map for rows based on the selected merge mode.
 * - "empty": Merges any downward consecutive empty cells into the top non-empty cell per column.
 * - "id": Merges all consecutive rows that share the same value in `idColumn` across all columns.
 */
export function computeMergeSpanMap(
  rows: Record<string, unknown>[],
  columns: string[],
  mergeConfig: CsvMergeConfig,
): MergeSpanMap {
  const spanMap: MergeSpanMap = {};
  if (!mergeConfig || mergeConfig.mode === "none" || rows.length === 0) {
    return spanMap;
  }

  // Initialize all cells with rowSpan = 1
  for (let r = 0; r < rows.length; r++) {
    spanMap[r] = {};
    for (const col of columns) {
      spanMap[r][col] = { rowSpan: 1 };
    }
  }

  if (mergeConfig.mode === "empty") {
    // Merge consecutive empty cells below a value per column
    for (const col of columns) {
      let anchorRow = 0;
      for (let r = 1; r < rows.length; r++) {
        const val = rows[r]?.[col];
        const isEmpty =
          val === null || val === undefined || String(val).trim() === "";

        if (isEmpty) {
          spanMap[anchorRow][col].rowSpan += 1;
          spanMap[r][col].rowSpan = 0;
        } else {
          anchorRow = r;
        }
      }
    }
  } else if (mergeConfig.mode === "id" && mergeConfig.idColumn) {
    const idCol = mergeConfig.idColumn;
    let groupStart = 0;

    for (let r = 1; r <= rows.length; r++) {
      const prevVal =
        rows[r - 1]?.[idCol] !== undefined ? String(rows[r - 1][idCol]) : "";
      const currVal =
        r < rows.length && rows[r]?.[idCol] !== undefined
          ? String(rows[r][idCol])
          : null;

      const isNewGroup = r === rows.length || currVal !== prevVal;

      if (isNewGroup) {
        const groupSize = r - groupStart;
        if (groupSize > 1) {
          // 1. Merge the reference ID column across the entire group
          spanMap[groupStart][idCol].rowSpan = groupSize;
          for (let sub = groupStart + 1; sub < r; sub++) {
            spanMap[sub][idCol].rowSpan = 0;
          }

          // 2. For all other columns: ONLY merge downward cells if they are empty
          for (const col of columns) {
            if (col === idCol) continue;
            let anchor = groupStart;
            for (let sub = groupStart + 1; sub < r; sub++) {
              const val = rows[sub]?.[col];
              const isEmpty =
                val === null || val === undefined || String(val).trim() === "";

              if (isEmpty) {
                spanMap[anchor][col].rowSpan += 1;
                spanMap[sub][col].rowSpan = 0;
              } else {
                anchor = sub;
              }
            }
          }
        }
        groupStart = r;
      }
    }
  }

  return spanMap;
}

/**
 * Builds a fast lookup DecorationMap from the decoration rules for a given dataset.
 *
 * Rules priority: First rule that matches a target takes precedence.
 * Scope:
 * - "all": Scans across all columns of every row.
 * - "column": Scans only the specified column (scopeColumn) of every row.
 *
 * Target:
 * - "cell": Highlights the specific matching cell(s).
 * - "row": Highlights the entire row if matching cell is found.
 * - "index": Highlights the row number/index cell (# column) if matching cell is found.
 */
export function buildDecorationMap(
  rules: CsvDecorationRule[],
  rows: Record<string, unknown>[],
  columns: string[],
): DecorationMap {
  const map: DecorationMap = {
    rows: new Map<number, CsvDecorationStyle>(),
    cells: new Map<string, CsvDecorationStyle>(),
    indexCells: new Map<number, CsvDecorationStyle>(),
  };

  const activeRules = rules.filter((r) => r.enabled && r.pattern.trim() !== "");
  if (activeRules.length === 0 || rows.length === 0) {
    return map;
  }

  for (const rule of activeRules) {
    let regex: RegExp | null = null;
    let patternLower = "";

    if (rule.isRegex) {
      try {
        regex = new RegExp(rule.pattern, "i");
      } catch {
        // Invalid regex pattern, skip this rule
        continue;
      }
    } else {
      patternLower = rule.pattern.toLowerCase();
    }

    const testMatch = (value: unknown): boolean => {
      if (value === null || value === undefined) return false;
      const str =
        typeof value === "object" ? JSON.stringify(value) : String(value);
      if (regex) {
        return regex.test(str);
      }
      return str.toLowerCase().includes(patternLower);
    };

    // Determine which columns to scan for this rule
    const colsToScan: string[] =
      rule.scope === "column" && rule.scopeColumn
        ? columns.includes(rule.scopeColumn)
          ? [rule.scopeColumn]
          : []
        : columns;

    if (colsToScan.length === 0) continue;

    for (let rIdx = 0; rIdx < rows.length; rIdx++) {
      const row = rows[rIdx];
      if (!row) continue;

      let rowMatched = false;
      const matchingCols: string[] = [];

      for (const col of colsToScan) {
        if (testMatch(row[col])) {
          rowMatched = true;
          matchingCols.push(col);
        }
      }

      if (rowMatched) {
        if (rule.target === "row") {
          // If row not already styled by an earlier rule
          if (!map.rows.has(rIdx)) {
            map.rows.set(rIdx, rule.style);
          }
        } else if (rule.target === "index") {
          // Index cell styling
          if (!map.indexCells.has(rIdx)) {
            map.indexCells.set(rIdx, rule.style);
          }
        } else if (rule.target === "cell") {
          // Cell styling for all matching columns in this row
          for (const col of matchingCols) {
            const cellKey = `${rIdx}:${col}`;
            if (!map.cells.has(cellKey)) {
              map.cells.set(cellKey, rule.style);
            }
          }
        }
      }
    }
  }

  return map;
}
