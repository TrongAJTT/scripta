import type { CsvDecorationConfig } from "../types/csvDecoration.types";

export const CSV_DECORATION_START_TAG = "<scripta.csv.decoration>";
export const CSV_DECORATION_END_TAG = "</scripta.csv.decoration>";

// Regex matching the decoration block anywhere or at the end, optionally prefixed by comment hashes (#, //)
const DECORATION_BLOCK_REGEX =
  /(?:\r?\n)?(?:#|\/\/)?\s*<scripta\.csv\.decoration>([\s\S]*?)<\/scripta\.csv\.decoration>\s*$/i;

/**
 * Parses and extracts CSV decoration configuration from the raw CSV file content.
 * Returns an empty rules array if not present or malformed.
 */
export function parseDecorationFromCsv(
  rawContent: string,
): CsvDecorationConfig {
  if (!rawContent) return { rules: [] };

  const match = rawContent.match(DECORATION_BLOCK_REGEX);
  if (!match || !match[1]) {
    return { rules: [] };
  }

  try {
    const parsed = JSON.parse(match[1].trim());
    if (parsed && Array.isArray(parsed.rules)) {
      return { rules: parsed.rules };
    }
  } catch {
    // Malformed JSON inside tag - fallback safely
  }

  return { rules: [] };
}

/**
 * Strips the decoration block from the CSV content.
 * Used before parsing CSV rows, copying CSV, or exporting CSV.
 */
export function stripDecorationFromCsv(rawContent: string): string {
  if (!rawContent) return "";
  return rawContent.replace(DECORATION_BLOCK_REGEX, "");
}

/**
 * Serializes the CSV decoration configuration into the CSV string.
 * If rules is empty, the decoration block is cleanly stripped.
 */
export function serializeDecorationToCsv(
  rawContent: string,
  config: CsvDecorationConfig,
): string {
  const cleanContent = stripDecorationFromCsv(rawContent).trimEnd();

  if (!config.rules || config.rules.length === 0) {
    return cleanContent;
  }

  const json = JSON.stringify({ rules: config.rules });
  const block = `# ${CSV_DECORATION_START_TAG}${json}${CSV_DECORATION_END_TAG}`;

  return cleanContent ? `${cleanContent}\r\n${block}` : block;
}
