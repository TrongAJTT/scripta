import type {
  CsvDecorationConfig,
  CsvMergeConfig,
} from "../types/csvDecoration.types";

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
  if (!rawContent) return { rules: [], merge: { mode: "none" } };

  const match = rawContent.match(DECORATION_BLOCK_REGEX);
  if (!match || !match[1]) {
    return { rules: [], merge: { mode: "none" } };
  }

  try {
    const parsed = JSON.parse(match[1].trim());
    if (parsed) {
      const rules = Array.isArray(parsed.rules) ? parsed.rules : [];
      const merge: CsvMergeConfig =
        parsed.merge &&
        typeof parsed.merge === "object" &&
        (parsed.merge.mode === "empty" || parsed.merge.mode === "id")
          ? {
              mode: parsed.merge.mode,
              idColumn:
                typeof parsed.merge.idColumn === "string"
                  ? parsed.merge.idColumn
                  : undefined,
            }
          : { mode: "none" };
      return { rules, merge };
    }
  } catch {
    // Malformed JSON inside tag - fallback safely
  }

  return { rules: [], merge: { mode: "none" } };
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
 * If rules is empty and merge mode is none, the decoration block is cleanly stripped.
 */
export function serializeDecorationToCsv(
  rawContent: string,
  config: CsvDecorationConfig,
): string {
  const cleanContent = stripDecorationFromCsv(rawContent).trimEnd();

  const hasRules = config.rules && config.rules.length > 0;
  const hasMerge = config.merge && config.merge.mode !== "none";

  if (!hasRules && !hasMerge) {
    return cleanContent;
  }

  const payload: Record<string, unknown> = {
    rules: config.rules || [],
  };

  if (hasMerge) {
    payload.merge = config.merge;
  }

  const json = JSON.stringify(payload);
  const block = `# ${CSV_DECORATION_START_TAG}${json}${CSV_DECORATION_END_TAG}`;

  return cleanContent ? `${cleanContent}\r\n${block}` : block;
}
