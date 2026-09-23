/**
 * Placeholder token representing the current timestamp in milliseconds
 * for export file name templates.
 */
export const TIMESTAMP_MS = "{TIMESTAMP_MS}";

/**
 * Sanitizes a tab or file name for use as the TAB_NAME portion in export filenames.
 * Strips file extensions and removes invalid filename characters.
 */
export function sanitizeTabName(
  rawName?: string,
  fallback = "diagram",
): string {
  if (!rawName) return fallback;

  // Remove existing file extension (e.g., 'workflow.md' -> 'workflow')
  const withoutExt = rawName.replace(/\.[^/.]+$/, "").trim();

  // Replace invalid filesystem characters: < > : " / \ | ? *
  const sanitized = withoutExt.replace(/[<>:"/\\|?*]/g, "_").trim();

  return sanitized || fallback;
}

/**
 * Resolves an export filename template (e.g., `{TAB_NAME}_svg_{TIMESTAMP_MS}`)
 * by substituting the TIMESTAMP_MS constant token with the current timestamp in milliseconds,
 * and appending the specified file extension.
 *
 * @param template Filename template string containing TIMESTAMP_MS
 * @param extension Optional file extension (e.g. 'svg', 'png', 'jpg')
 * @returns Final resolved filename with timestamp and extension
 */
export function resolveExportFileName(
  template: string,
  extension?: string,
): string {
  const currentTimestamp = Date.now().toString();

  // Replace both {TIMESTAMP_MS} and TIMESTAMP_MS tokens
  let resolved = template
    .split(TIMESTAMP_MS)
    .join(currentTimestamp)
    .replace(/TIMESTAMP_MS/g, currentTimestamp);

  if (extension) {
    const cleanExt = extension.replace(/^\.+/, "").trim();
    if (
      cleanExt &&
      !resolved.toLowerCase().endsWith(`.${cleanExt.toLowerCase()}`)
    ) {
      resolved = `${resolved}.${cleanExt}`;
    }
  }

  return resolved;
}

export { triggerFileDownload } from "./downloadUtils";
