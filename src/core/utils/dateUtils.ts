/**
 * Utility functions for date formatting and timestamp conversions across the application.
 */

const DEFAULT_DATETIME_OPTIONS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

/**
 * Formats a timestamp (epoch ms) or Date object into a localized date-time string.
 * Returns a fallback string (default: "Unknown") if timestamp is invalid or falsy.
 */
export function formatDateTime(
  timestamp?: number | Date | null,
  options: Intl.DateTimeFormatOptions = DEFAULT_DATETIME_OPTIONS,
  fallback: string = "Unknown",
): string {
  if (!timestamp) return fallback;

  try {
    const dateObj =
      typeof timestamp === "number" ? new Date(timestamp) : timestamp;
    if (isNaN(dateObj.getTime())) return fallback;

    return dateObj.toLocaleString(undefined, options);
  } catch {
    return fallback;
  }
}
