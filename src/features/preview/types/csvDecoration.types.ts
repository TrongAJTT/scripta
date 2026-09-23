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

export interface CsvDecorationConfig {
  rules: CsvDecorationRule[];
}

export interface DecorationMap {
  rows: Map<number, CsvDecorationStyle>; // 0-based rowIndex -> style
  cells: Map<string, CsvDecorationStyle>; // "rowIndex:colName" -> style
  indexCells: Map<number, CsvDecorationStyle>; // 0-based rowIndex -> style
}
