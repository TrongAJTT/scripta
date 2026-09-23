/**
 * Utilities for analyzing JSON structures and determining table compatibility.
 * Supports Level 1 (lists of uniform objects) and simple Level 2 (nested objects/arrays <= 4 items).
 */

export interface TableCandidate {
  id: string;
  title: string;
  columns: string[];
  rows: Record<string, unknown>[];
  totalRows: number;
}

export interface JsonTableAnalysis {
  isTableCompatible: boolean;
  candidates: TableCandidate[];
  defaultCandidateIndex: number;
}

export type CellValueKind =
  | "primitive"
  | "empty"
  | "shallow-array"
  | "shallow-object"
  | "complex";

export interface AnalyzedCellValue {
  kind: CellValueKind;
  raw: unknown;
  displayText?: string;
  items?: unknown[];
  entries?: [string, unknown][];
}

/**
 * Classify and format a cell value for table rendering, especially for shallow nesting.
 */
export function analyzeCellValue(value: unknown): AnalyzedCellValue {
  if (value === null || value === undefined || value === "") {
    return { kind: "empty", raw: value };
  }

  if (typeof value !== "object") {
    return {
      kind: "primitive",
      raw: value,
      displayText: String(value),
    };
  }

  if (Array.isArray(value)) {
    if (value.length <= 4) {
      return {
        kind: "shallow-array",
        raw: value,
        items: value,
      };
    }
    return {
      kind: "complex",
      raw: value,
      displayText: `Array (${value.length} items)`,
    };
  }

  // Object
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length <= 4) {
    return {
      kind: "shallow-object",
      raw: value,
      entries,
    };
  }

  return {
    kind: "complex",
    raw: value,
    displayText: `Object (${entries.length} keys)`,
  };
}

/**
 * Checks if a given array is composed predominantly of objects and extracts union columns.
 */
function extractTableFromArray(
  arr: unknown[],
  id: string,
  title: string,
): TableCandidate | null {
  if (!Array.isArray(arr) || arr.length === 0) return null;

  // Filter objects
  const objectRows: Record<string, unknown>[] = [];
  for (const item of arr) {
    if (item !== null && typeof item === "object" && !Array.isArray(item)) {
      objectRows.push(item as Record<string, unknown>);
    }
  }

  // Require at least 50% of items to be objects, and at least 1 object
  if (objectRows.length === 0 || objectRows.length < arr.length * 0.5) {
    return null;
  }

  // Extract all unique keys preserving encounter order
  const columnSet = new Set<string>();
  for (const row of objectRows) {
    for (const key of Object.keys(row)) {
      columnSet.add(key);
    }
  }

  const columns = Array.from(columnSet);
  if (columns.length === 0) return null;

  return {
    id,
    title,
    columns,
    rows: objectRows,
    totalRows: objectRows.length,
  };
}

/**
 * Analyzes parsed JSON data and identifies table candidates.
 */
export function analyzeJsonForTables(data: unknown): JsonTableAnalysis {
  const result: JsonTableAnalysis = {
    isTableCompatible: false,
    candidates: [],
    defaultCandidateIndex: 0,
  };

  if (!data || typeof data !== "object") {
    return result;
  }

  // Case 1: Root is an Array of Objects
  if (Array.isArray(data)) {
    const candidate = extractTableFromArray(data, "root", "Root List");
    if (candidate) {
      result.isTableCompatible = true;
      result.candidates.push(candidate);
      return result;
    }
  }

  // Case 2: Root is an Object
  if (!Array.isArray(data) && typeof data === "object") {
    const rootObj = data as Record<string, unknown>;
    const candidates: TableCandidate[] = [];

    // Check direct array properties
    for (const [key, val] of Object.entries(rootObj)) {
      if (Array.isArray(val) && val.length > 0) {
        const candidate = extractTableFromArray(val, key, key);
        if (candidate) {
          candidates.push(candidate);
        }
      }
    }

    // Check if rootObj itself is a Dictionary of uniform objects: { [id: string]: { name: '...', ... } }
    const rootEntries = Object.entries(rootObj);
    if (rootEntries.length >= 2) {
      const isDictOfObjects = rootEntries.every(
        ([, v]) => v !== null && typeof v === "object" && !Array.isArray(v),
      );

      if (isDictOfObjects) {
        const rowsWithKey: Record<string, unknown>[] = rootEntries.map(
          ([k, v]) => ({
            _id: k,
            ...(v as Record<string, unknown>),
          }),
        );

        const colSet = new Set<string>(["_id"]);
        for (const r of rowsWithKey) {
          for (const k of Object.keys(r)) {
            colSet.add(k);
          }
        }

        candidates.unshift({
          id: "__dictionary__",
          title: "Records Dictionary",
          columns: Array.from(colSet),
          rows: rowsWithKey,
          totalRows: rowsWithKey.length,
        });
      }
    }

    if (candidates.length > 0) {
      // Pick the candidate with the highest row count by default
      let maxRowsIdx = 0;
      for (let i = 1; i < candidates.length; i++) {
        if (candidates[i].totalRows > candidates[maxRowsIdx].totalRows) {
          maxRowsIdx = i;
        }
      }

      result.isTableCompatible = true;
      result.candidates = candidates;
      result.defaultCandidateIndex = maxRowsIdx;
    }
  }

  return result;
}
