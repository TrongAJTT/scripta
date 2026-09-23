import type { MermaidTheme, ThemeMode } from "../../../core/types/file.types";
import mermaid from "mermaid";
import {
  TIMESTAMP_MS,
  resolveExportFileName,
  triggerFileDownload,
} from "../../../core/utils/exportNaming";

export type ExportImageFormat = "svg" | "png" | "jpeg" | "webp";

/**
 * Maps user setting / system theme into an official Mermaid theme string
 */
export function resolveMermaidTheme(
  configuredTheme: MermaidTheme = "auto",
  appTheme: ThemeMode = "dark",
): string {
  if (configuredTheme !== "auto") {
    return configuredTheme;
  }

  // When 'auto', follow application or OS theme
  if (appTheme === "system") {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return isDark ? "dark" : "default";
  }

  return appTheme === "light" ? "default" : "dark";
}

/**
 * Initialize or re-initialize Mermaid with the designated theme
 */
export function applyMermaidTheme(
  configuredTheme: MermaidTheme = "auto",
  appTheme: ThemeMode = "dark",
): void {
  const theme = resolveMermaidTheme(configuredTheme, appTheme);
  mermaid.initialize({
    startOnLoad: false,
    theme: theme as "dark" | "default" | "forest" | "neutral" | "base",
    securityLevel: "loose",
    fontFamily: "var(--font-sans)",
  });
}

/**
 * Downloads raw SVG markup as a .svg file named {TAB_NAME}_svg_{TIMESTAMP_MS}.svg
 */
export function exportSvgToFile(
  svgContent: string,
  tabOrFileName = "diagram",
): void {
  const baseName = tabOrFileName.endsWith(".svg")
    ? tabOrFileName.slice(0, -4)
    : tabOrFileName;
  const nameTemplate = baseName.includes(TIMESTAMP_MS)
    ? baseName
    : `${baseName}_svg_${TIMESTAMP_MS}`;
  const fileName = resolveExportFileName(nameTemplate, "svg");

  const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
  triggerFileDownload(blob, fileName);
}

/**
 * Prepares and sanitizes SVG content for rasterization on Canvas.
 * Removes external resources (@import, external font links, foreignObject with external links)
 * that cause browsers to mark the Canvas as "tainted" and throw SecurityError on toBlob().
 */
function sanitizeSvgForCanvas(svgContent: string): string {
  // Remove external CSS @import rules (e.g., Google Fonts or remote font-face)
  let clean = svgContent.replace(
    /@import\s+(?:url\()?['"][^'"]+['"](?:\))?[^;]*;/gi,
    "",
  );

  // Remove external <link> tags if any exist inside SVG
  clean = clean.replace(/<link[\s\S]*?>/gi, "");

  return clean;
}

/**
 * Converts SVG markup to raster formats (PNG, JPEG, WEBP) using an in-memory Canvas
 * named {TAB_NAME}_svg_{TIMESTAMP_MS}.{ext}
 */
export async function exportSvgToRaster(
  svgContent: string,
  format: "png" | "jpeg" | "webp",
  tabOrFileName = "diagram",
  options?: { backgroundColor?: string; scale?: number },
): Promise<void> {
  const scale = options?.scale ?? 2; // 2x high resolution
  const mimeType =
    format === "jpeg"
      ? "image/jpeg"
      : format === "webp"
        ? "image/webp"
        : "image/png";
  const extension = format === "jpeg" ? "jpg" : format;

  const baseName = tabOrFileName.replace(
    new RegExp(`\\.${extension}$|\\.png$|\\.jpg$|\\.jpeg$|\\.webp$`, "i"),
    "",
  );
  const nameTemplate = baseName.includes(TIMESTAMP_MS)
    ? baseName
    : `${baseName}_svg_${TIMESTAMP_MS}`;
  const targetName = resolveExportFileName(nameTemplate, extension);

  const sanitizedSvg = sanitizeSvgForCanvas(svgContent);

  // Parse SVG dimensions
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(sanitizedSvg, "image/svg+xml");
  const svgEl = svgDoc.documentElement;

  let width = parseFloat(svgEl.getAttribute("width") || "0");
  let height = parseFloat(svgEl.getAttribute("height") || "0");

  if (!width || !height) {
    const viewBox = svgEl.getAttribute("viewBox");
    if (viewBox) {
      const parts = viewBox.split(/\s+/).map(Number);
      if (parts.length === 4) {
        width = parts[2];
        height = parts[3];
      }
    }
  }

  if (!width || !height) {
    width = 800;
    height = 600;
  }

  // Ensure svg element has explicit width and height attributes matching dimensions for canvas rendering
  svgEl.setAttribute("width", width.toString());
  svgEl.setAttribute("height", height.toString());
  const serializedSvg = new XMLSerializer().serializeToString(svgEl);

  return new Promise((resolve, reject) => {
    const img = new Image();

    // Use base64 Data URL to prevent origin contamination across different browser implementations
    const encodedSvg = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(serializedSvg)))}`;

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Canvas 2D context not available"));
          return;
        }

        // If format is JPEG, draw a solid background (JPEG does not support transparency)
        if (format === "jpeg" || options?.backgroundColor) {
          ctx.fillStyle = options?.backgroundColor || "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to create raster blob"));
              return;
            }
            triggerFileDownload(blob, targetName);
            resolve();
          },
          mimeType,
          0.95,
        );
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => {
      reject(err);
    };

    img.src = encodedSvg;
  });
}
