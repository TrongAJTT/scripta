import {
  mdiCodeJson,
  mdiLanguageMarkdown,
  mdiLanguageJavascript,
  mdiLanguageTypescript,
  mdiLanguageHtml5,
  mdiLanguageCss3,
  mdiLanguagePython,
  mdiXml,
  mdiDatabase,
  mdiFileDocumentOutline,
  mdiFileImageOutline,
  mdiSvg,
  mdiGraphOutline,
  mdiCodeBraces,
  mdiFileCodeOutline,
  mdiFileTableOutline,
  mdiLock,
} from "@mdi/js";
import type {
  SupportedLanguage,
  PreviewType,
  TabIconTheme,
} from "../types/file.types";

export interface FileIconConfig {
  path: string;
  color: string;
}

/**
 * Brand/Distinctive colors for recognized file formats and languages.
 * When a file is linked/saved, these vivid colors are applied.
 * When unlinked/unsaved (draft/scratchpad), the icon will render with neutral muted color.
 */
export const FILE_TYPE_COLORS: Record<string, string> = {
  json: "#f59e0b", // Amber
  csv: "#10b981", // Emerald / Spreadsheet green
  markdown: "#38bdf8", // Sky blue
  javascript: "#facc15", // JavaScript Yellow
  typescript: "#3b82f6", // TypeScript Blue
  html: "#ea580c", // HTML5 Orange
  css: "#06b6d4", // Cyan
  python: "#10b981", // Emerald / Python green
  svg: "#a855f7", // Purple
  xml: "#f97316", // Orange
  yaml: "#ec4899", // Pink
  sql: "#6366f1", // Indigo
  mermaid: "#0ea5e9", // Vivid Cyan
  image: "#eab308", // Yellow
  plaintext: "#94a3b8", // Slate
  lock: "#f59e0b", // Amber/Gold for lock state
  default: "#94a3b8", // Muted Slate
};

export const PASTEL_FILE_TYPE_COLORS: Record<string, string> = {
  json: "#fbbf24",
  csv: "#6ee7b7",
  markdown: "#7dd3fc",
  javascript: "#fde047",
  typescript: "#93c5fd",
  html: "#fb923c",
  css: "#67e8f9",
  python: "#6ee7b7",
  svg: "#d8b4fe",
  xml: "#fdba74",
  yaml: "#f472b6",
  sql: "#a5b4fc",
  mermaid: "#38bdf8",
  image: "#fef08a",
  plaintext: "#cbd5e1",
  lock: "#fbbf24",
  default: "#cbd5e1",
};

export const LOCK_ICON_PATH = mdiLock;

/**
 * Resolve the Material Design Icon path and designated color for a file tab.
 */
export function getFileIconConfig(
  language?: SupportedLanguage,
  previewType?: PreviewType,
  fileName?: string,
  tabIconTheme: TabIconTheme = "vibrant",
): FileIconConfig {
  // If user chooses accent or monochrome preset, apply global color
  if (tabIconTheme === "accent") {
    const rawConfig = getRawFileIconConfig(
      language,
      previewType,
      fileName,
      "vibrant",
    );
    return { path: rawConfig.path, color: "var(--accent)" };
  }
  if (tabIconTheme === "monochrome") {
    const rawConfig = getRawFileIconConfig(
      language,
      previewType,
      fileName,
      "vibrant",
    );
    return { path: rawConfig.path, color: "var(--text-main)" };
  }

  return getRawFileIconConfig(language, previewType, fileName, tabIconTheme);
}

function getRawFileIconConfig(
  language?: SupportedLanguage,
  previewType?: PreviewType,
  fileName?: string,
  tabIconTheme: "vibrant" | "pastel" = "vibrant",
): FileIconConfig {
  const colors =
    tabIconTheme === "pastel" ? PASTEL_FILE_TYPE_COLORS : FILE_TYPE_COLORS;
  if (previewType === "image") {
    return {
      path: mdiFileImageOutline,
      color: colors.image,
    };
  }

  if (previewType === "svg" || language === "svg") {
    return {
      path: mdiSvg,
      color: colors.svg,
    };
  }

  if (language === "mermaid" || previewType === "mermaid") {
    return {
      path: mdiGraphOutline,
      color: colors.mermaid,
    };
  }

  if (language === "markdown" || previewType === "markdown") {
    return {
      path: mdiLanguageMarkdown,
      color: colors.markdown,
    };
  }

  if (language === "json" || previewType === "json") {
    return {
      path: mdiCodeJson,
      color: colors.json,
    };
  }

  if (language === "javascript") {
    return {
      path: mdiLanguageJavascript,
      color: colors.javascript,
    };
  }

  if (language === "typescript") {
    return {
      path: mdiLanguageTypescript,
      color: colors.typescript,
    };
  }

  if (language === "html" || previewType === "html") {
    return {
      path: mdiLanguageHtml5,
      color: colors.html,
    };
  }

  if (language === "css" || previewType === "css") {
    return {
      path: mdiLanguageCss3,
      color: colors.css,
    };
  }

  if (language === "python") {
    return {
      path: mdiLanguagePython,
      color: colors.python,
    };
  }

  if (language === "xml") {
    return {
      path: mdiXml,
      color: colors.xml,
    };
  }

  if (language === "yaml") {
    return {
      path: mdiCodeBraces,
      color: colors.yaml,
    };
  }

  if (language === "sql") {
    return {
      path: mdiDatabase,
      color: colors.sql,
    };
  }

  if (language === "csv" || previewType === "csv") {
    return {
      path: mdiFileTableOutline,
      color: colors.csv,
    };
  }

  // Check by file extension if language was set to generic/other
  if (fileName) {
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "json":
        return { path: mdiCodeJson, color: colors.json };
      case "csv":
      case "tsv":
        return { path: mdiFileTableOutline, color: colors.csv };
      case "md":
      case "markdown":
        return { path: mdiLanguageMarkdown, color: colors.markdown };
      case "js":
      case "mjs":
      case "cjs":
        return { path: mdiLanguageJavascript, color: colors.javascript };
      case "ts":
      case "tsx":
        return { path: mdiLanguageTypescript, color: colors.typescript };
      case "html":
      case "htm":
        return { path: mdiLanguageHtml5, color: colors.html };
      case "css":
      case "scss":
      case "less":
        return { path: mdiLanguageCss3, color: colors.css };
      case "py":
        return { path: mdiLanguagePython, color: colors.python };
      case "sql":
        return { path: mdiDatabase, color: colors.sql };
      case "svg":
        return { path: mdiSvg, color: colors.svg };
      case "xml":
        return { path: mdiXml, color: colors.xml };
      case "yaml":
      case "yml":
        return { path: mdiCodeBraces, color: colors.yaml };
      default:
        break;
    }
  }

  if (language === "other") {
    return {
      path: mdiFileCodeOutline,
      color: colors.default,
    };
  }

  return {
    path: mdiFileDocumentOutline,
    color: colors.plaintext,
  };
}
