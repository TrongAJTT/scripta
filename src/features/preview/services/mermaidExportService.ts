import type { MermaidTheme, ThemeMode } from '../../../core/types/file.types';
import mermaid from 'mermaid';

export type ExportImageFormat = 'svg' | 'png' | 'jpeg' | 'webp';

/**
 * Maps user setting / system theme into an official Mermaid theme string
 */
export function resolveMermaidTheme(
  configuredTheme: MermaidTheme = 'auto',
  appTheme: ThemeMode = 'dark'
): string {
  if (configuredTheme !== 'auto') {
    return configuredTheme;
  }

  // When 'auto', follow application or OS theme
  if (appTheme === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return isDark ? 'dark' : 'default';
  }

  return appTheme === 'light' ? 'default' : 'dark';
}

/**
 * Initialize or re-initialize Mermaid with the designated theme
 */
export function applyMermaidTheme(
  configuredTheme: MermaidTheme = 'auto',
  appTheme: ThemeMode = 'dark'
): void {
  const theme = resolveMermaidTheme(configuredTheme, appTheme);
  mermaid.initialize({
    startOnLoad: false,
    theme: theme as 'dark' | 'default' | 'forest' | 'neutral' | 'base',
    securityLevel: 'loose',
    fontFamily: 'var(--font-sans)',
  });
}

/**
 * Downloads raw SVG markup as a .svg file
 */
export function exportSvgToFile(svgContent: string, fileName = 'diagram.svg'): void {
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Converts SVG markup to raster formats (PNG, JPEG, WEBP) using an in-memory Canvas
 */
export async function exportSvgToRaster(
  svgContent: string,
  format: 'png' | 'jpeg' | 'webp',
  fileName?: string,
  options?: { backgroundColor?: string; scale?: number }
): Promise<void> {
  const scale = options?.scale ?? 2; // 2x high resolution
  const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
  const extension = format === 'jpeg' ? 'jpg' : format;
  const targetName = fileName || `diagram.${extension}`;

  // Parse SVG dimensions
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
  const svgEl = svgDoc.documentElement;

  let width = parseFloat(svgEl.getAttribute('width') || '0');
  let height = parseFloat(svgEl.getAttribute('height') || '0');

  if (!width || !height) {
    const viewBox = svgEl.getAttribute('viewBox');
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

  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas 2D context not available'));
        return;
      }

      // If format is JPEG, draw a solid background (JPEG does not support transparency)
      if (format === 'jpeg' || options?.backgroundColor) {
        ctx.fillStyle = options?.backgroundColor || '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create raster blob'));
            return;
          }
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = targetName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
          resolve();
        },
        mimeType,
        0.95
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };

    img.src = url;
  });
}
