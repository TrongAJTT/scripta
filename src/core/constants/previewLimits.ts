import type {
  PreviewType,
  PreviewPerformancePreset,
} from "../types/file.types";

export type { PreviewPerformancePreset };

export interface PreviewThreshold {
  maxLines: number;
  maxBytes: number;
  label: string;
  description: string;
}

export interface PresetConfig {
  id: PreviewPerformancePreset;
  label: string;
  multiplier: number;
  description: string;
  badge: string;
  stepIndex: number;
}

export const PREVIEW_PERF_PRESETS: Record<
  PreviewPerformancePreset,
  PresetConfig
> = {
  eco: {
    id: "eco",
    label: "Eco",
    multiplier: 0.5,
    description: "Lower limits for battery preservation or low-spec devices",
    badge: "0.5x Limits",
    stepIndex: 0,
  },
  balanced: {
    id: "balanced",
    label: "Balanced",
    multiplier: 1.0,
    description:
      "Optimal balance between preview fidelity and typing smoothness (Recommended)",
    badge: "1.0x Default",
    stepIndex: 1,
  },
  performance: {
    id: "performance",
    label: "High Spec",
    multiplier: 2.5,
    description:
      "Extended thresholds for powerful workstations and high-RAM PCs",
    badge: "2.5x Limits",
    stepIndex: 2,
  },
  unlimited: {
    id: "unlimited",
    label: "Unlimited",
    multiplier: Infinity,
    description:
      "Disable auto-pausing; always render previews regardless of file size",
    badge: "No Limits",
    stepIndex: 3,
  },
};

export const PRESET_STEP_ORDER: PreviewPerformancePreset[] = [
  "eco",
  "balanced",
  "performance",
  "unlimited",
];

// Baseline thresholds (Balanced / 1.0x multiplier)
export const BASE_PREVIEW_THRESHOLDS: Record<PreviewType, PreviewThreshold> = {
  mermaid: {
    maxLines: 400,
    maxBytes: 25 * 1024, // 25 KB - layout engine (dagre/d3) is CPU-intensive
    label: "Mermaid",
    description: "Flowcharts & Architecture Diagrams",
  },
  json: {
    maxLines: 2500,
    maxBytes: 200 * 1024, // 200 KB - AST parsing & interactive tree nodes
    label: "JSON",
    description: "Interactive Tree & Object Inspector",
  },
  svg: {
    maxLines: 2000,
    maxBytes: 250 * 1024, // 250 KB - SVG vector DOM nodes
    label: "SVG",
    description: "Vector Graphics & Elements",
  },
  html: {
    maxLines: 3500,
    maxBytes: 350 * 1024, // 350 KB - Sandboxed DOM / iframe rendering
    label: "HTML",
    description: "Live Webpage & Component Preview",
  },
  markdown: {
    maxLines: 5000,
    maxBytes: 500 * 1024, // 500 KB - Markdown AST & syntax highlighting
    label: "Markdown",
    description: "Document Formatting & Code Blocks",
  },
  css: {
    maxLines: 4000,
    maxBytes: 300 * 1024, // 300 KB - CSS AST parser & stylesheet injection
    label: "CSS",
    description: "Stylesheet & Style Rules Inspector",
  },
  console: {
    maxLines: 3000,
    maxBytes: 200 * 1024, // 200 KB - JavaScript evaluation sandbox
    label: "Console",
    description: "JavaScript Interactive Sandbox",
  },
  text: {
    maxLines: 10000,
    maxBytes: 1024 * 1024, // 1 MB - Plain text / tabular data
    label: "Text",
    description: "Plain Text & Formatted Data",
  },
  csv: {
    maxLines: 8000,
    maxBytes: 800 * 1024, // 800 KB - Tabular data & CSV grid
    label: "CSV",
    description: "Tabular Spreadsheet & Delimited Data",
  },
  image: {
    maxLines: Infinity,
    maxBytes: 10 * 1024 * 1024, // 10 MB - Raster images
    label: "Image",
    description: "Raster Graphics (PNG, JPG, WebP)",
  },
  none: {
    maxLines: Infinity,
    maxBytes: Infinity,
    label: "None",
    description: "Unsupported Preview",
  },
};

/**
 * Calculates the active threshold for a given preview type and preset.
 */
export function getActivePreviewThreshold(
  type: PreviewType = "none",
  preset: PreviewPerformancePreset = "balanced",
): PreviewThreshold {
  const base = BASE_PREVIEW_THRESHOLDS[type] || BASE_PREVIEW_THRESHOLDS.none;
  if (preset === "unlimited") {
    return {
      ...base,
      maxLines: Infinity,
      maxBytes: Infinity,
    };
  }

  const multiplier = PREVIEW_PERF_PRESETS[preset]?.multiplier ?? 1.0;
  return {
    ...base,
    maxLines: Math.round(base.maxLines * multiplier),
    maxBytes: Math.round(base.maxBytes * multiplier),
  };
}

export interface ThresholdCheckResult {
  exceeds: boolean;
  reason?: "lines" | "bytes" | "both";
  lineCount: number;
  byteCount: number;
  maxLines: number;
  maxBytes: number;
  threshold: PreviewThreshold;
}

/**
 * Checks whether the given text content exceeds soft limits for its preview type.
 */
export function checkPreviewThreshold(
  content: string,
  type: PreviewType = "none",
  preset: PreviewPerformancePreset = "balanced",
): ThresholdCheckResult {
  const threshold = getActivePreviewThreshold(type, preset);

  if (threshold.maxLines === Infinity && threshold.maxBytes === Infinity) {
    return {
      exceeds: false,
      lineCount: 0,
      byteCount: 0,
      maxLines: Infinity,
      maxBytes: Infinity,
      threshold,
    };
  }

  // Count lines quickly
  let lineCount = 1;
  for (let i = 0; i < content.length; i++) {
    if (content.charCodeAt(i) === 10) {
      // '\n'
      lineCount++;
    }
  }

  // Approximate byte length using UTF-8 byte length (fast length calculation)
  // For standard string, Blob or TextEncoder byteLength gives accurate count
  const byteCount =
    typeof Blob !== "undefined" ? new Blob([content]).size : content.length;

  const exceedsLines = lineCount > threshold.maxLines;
  const exceedsBytes = byteCount > threshold.maxBytes;

  let reason: "lines" | "bytes" | "both" | undefined;
  if (exceedsLines && exceedsBytes) {
    reason = "both";
  } else if (exceedsLines) {
    reason = "lines";
  } else if (exceedsBytes) {
    reason = "bytes";
  }

  return {
    exceeds: exceedsLines || exceedsBytes,
    reason,
    lineCount,
    byteCount,
    maxLines: threshold.maxLines,
    maxBytes: threshold.maxBytes,
    threshold,
  };
}

/**
 * Formats byte size into human-readable representation.
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  if (bytes === Infinity) return "Unlimited";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
