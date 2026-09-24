export type CsvDecorationScope = "all" | "column";
export type CsvDecorationTarget = "cell" | "row" | "index";

export interface CsvDecorationStyle {
  background?: string; // Hex color with optional alpha e.g. #ffeb3b80
  color?: string; // Hex color e.g. #000000
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export interface CsvDecorationRule {
  id: string;
  enabled: boolean;
  scope: CsvDecorationScope;
  scopeColumn?: string; // Column name when scope is "column"
  pattern: string;
  isRegex?: boolean;
  target: CsvDecorationTarget;
  style: CsvDecorationStyle;
  label?: string;
}

export type CsvMergeMode = "none" | "empty" | "id";

export interface CsvMergeConfig {
  mode: CsvMergeMode;
  idColumn?: string; // Column name when mode is "id"
}

export interface CsvDecorationConfig {
  rules: CsvDecorationRule[];
  merge?: CsvMergeConfig;
}

export interface CellSpanInfo {
  rowSpan: number; // >= 1: render td with rowSpan; 0: hidden (part of merged cell)
}

export type MergeSpanMap = Record<number, Record<string, CellSpanInfo>>;

export interface DecorationMap {
  rows: Map<number, CsvDecorationStyle>; // 0-based rowIndex -> style
  cells: Map<string, CsvDecorationStyle>; // "rowIndex:colName" -> style
  indexCells: Map<number, CsvDecorationStyle>; // 0-based rowIndex -> style
}

export function isAnyDecorationActive(config: CsvDecorationConfig): boolean {
  if (config.rules.length === 0 && (config.merge?.mode ?? "none") === "none") return false;
  const hasActiveMerge = (config.merge?.mode ?? "none") !== "none";
  const hasActiveRule = config.rules.some((r) => r.enabled && r.pattern.trim() !== "");
  return hasActiveMerge || hasActiveRule;
}
