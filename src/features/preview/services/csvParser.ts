/**
 * CSV and TSV parsing & serialization utility conforming to RFC 4180 principles.
 */

export interface ParsedCsvData {
  columns: string[];
  rows: Record<string, string>[];
  delimiter: string;
  rowCount: number;
}

/**
 * Heuristically detect the delimiter used in a CSV/TSV text.
 */
export function detectDelimiter(text: string): string {
  const sample = text.slice(0, 5000);
  const lines = sample
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0)
    .slice(0, 5);
  if (lines.length === 0) return ",";

  const candidates = [",", "\t", ";", "|"];
  let bestDelimiter = ",";
  let bestScore = -1;

  for (const del of candidates) {
    const counts = lines.map((line) => {
      let count = 0;
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') inQuotes = !inQuotes;
        else if (ch === del && !inQuotes) count++;
      }
      return count;
    });

    // Valid delimiter if count > 0 and consistent across lines
    const minCount = Math.min(...counts);
    const maxCount = Math.max(...counts);
    if (minCount > 0 && maxCount === minCount) {
      const score = minCount * 10;
      if (score > bestScore) {
        bestScore = score;
        bestDelimiter = del;
      }
    } else if (minCount > 0) {
      const score = minCount;
      if (score > bestScore) {
        bestScore = score;
        bestDelimiter = del;
      }
    }
  }

  return bestDelimiter;
}

/**
 * Robust RFC-4180 CSV parser supporting quoted strings, multi-line values, and escaped quotes.
 */
export function parseCsv(
  text: string,
  customDelimiter?: string,
): ParsedCsvData {
  if (!text || text.trim().length === 0) {
    return { columns: [], rows: [], delimiter: ",", rowCount: 0 };
  }

  const delimiter = customDelimiter || detectDelimiter(text);
  const rowsRaw: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped double quote
          currentField += '"';
          i++; // Skip the second quote
        } else {
          // End of quoted field
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentField);
        currentField = "";
      } else if (char === "\r") {
        // Carriage return: check if followed by newline
        if (nextChar === "\n") {
          i++;
        }
        currentRow.push(currentField);
        rowsRaw.push(currentRow);
        currentRow = [];
        currentField = "";
      } else if (char === "\n") {
        currentRow.push(currentField);
        rowsRaw.push(currentRow);
        currentRow = [];
        currentField = "";
      } else {
        currentField += char;
      }
    }
  }

  // Push final field/row if content remains
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rowsRaw.push(currentRow);
  }

  // Filter out completely empty trailing lines
  const cleanRows = rowsRaw.filter(
    (row) => row.length > 0 && !(row.length === 1 && row[0].trim() === ""),
  );

  if (cleanRows.length === 0) {
    return { columns: [], rows: [], delimiter, rowCount: 0 };
  }

  // First row is the header
  const rawHeaders = cleanRows[0];
  const seenColumns = new Set<string>();
  const columns: string[] = rawHeaders.map((header, index) => {
    let colName = header.trim();
    if (!colName) {
      colName = `Column_${index + 1}`;
    }
    // Prevent duplicate column keys
    let uniqueName = colName;
    let counter = 2;
    while (seenColumns.has(uniqueName)) {
      uniqueName = `${colName}_${counter++}`;
    }
    seenColumns.add(uniqueName);
    return uniqueName;
  });

  const rows: Record<string, string>[] = [];
  for (let r = 1; r < cleanRows.length; r++) {
    const rawRow = cleanRows[r];
    const rowObj: Record<string, string> = {};
    for (let c = 0; c < columns.length; c++) {
      rowObj[columns[c]] = rawRow[c] !== undefined ? rawRow[c] : "";
    }
    rows.push(rowObj);
  }

  return {
    columns,
    rows,
    delimiter,
    rowCount: rows.length,
  };
}

/**
 * Serializes column headers and row records back into a standard RFC-4180 CSV string.
 */
export function tableToCsv(
  columns: string[],
  rows: Record<string, unknown>[],
  delimiter: string = ",",
): string {
  const escapeCell = (val: unknown): string => {
    if (val === null || val === undefined) return "";
    const str = typeof val === "object" ? JSON.stringify(val) : String(val);
    if (
      str.includes(delimiter) ||
      str.includes('"') ||
      str.includes("\n") ||
      str.includes("\r")
    ) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = columns.map(escapeCell).join(delimiter);
  const rowLines = rows.map((row) =>
    columns.map((col) => escapeCell(row[col])).join(delimiter),
  );

  return [headerLine, ...rowLines].join("\r\n");
}
