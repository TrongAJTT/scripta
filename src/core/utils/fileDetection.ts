import type { SupportedLanguage, PreviewType } from "../types/file.types";

export function detectLanguageFromFilename(filename: string): {
  language: SupportedLanguage;
  previewType: PreviewType;
} {
  const dotIdx = filename.lastIndexOf(".");
  if (dotIdx === -1) {
    return { language: "plaintext", previewType: "text" };
  }

  const ext = filename.substring(dotIdx + 1).toLowerCase();

  switch (ext) {
    case "md":
    case "markdown":
      return { language: "markdown", previewType: "markdown" };

    case "mmd":
    case "mermaid":
      return { language: "mermaid", previewType: "mermaid" };

    case "svg":
      return { language: "svg", previewType: "svg" };

    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "webp":
    case "bmp":
    case "ico":
      return { language: "plaintext", previewType: "image" };

    case "js":
    case "jsx":
    case "mjs":
    case "cjs":
      return { language: "javascript", previewType: "console" };

    case "ts":
    case "tsx":
    case "mts":
    case "cts":
      return { language: "typescript", previewType: "console" };

    case "html":
    case "htm":
      return { language: "html", previewType: "html" };

    case "css":
    case "scss":
    case "less":
      return { language: "css", previewType: "css" };

    case "json":
      return { language: "json", previewType: "json" };

    case "csv":
    case "tsv":
      return { language: "csv", previewType: "csv" };

    case "py":
      return { language: "python", previewType: "console" };

    case "xml":
      return { language: "xml", previewType: "none" };

    case "yml":
    case "yaml":
      return { language: "yaml", previewType: "none" };

    case "sql":
      return { language: "sql", previewType: "none" };

    case "txt":
    case "text":
    case "log":
    case "ini":
    case "conf":
      return { language: "plaintext", previewType: "text" };

    default:
      // Mở file có extension không nằm trong danh sách -> other
      return { language: "other", previewType: "none" };
  }
}

export function getDefaultExtensionForLanguage(
  lang: SupportedLanguage,
): string {
  switch (lang) {
    case "markdown":
      return "md";
    case "javascript":
      return "js";
    case "typescript":
      return "ts";
    case "html":
      return "html";
    case "css":
      return "css";
    case "json":
      return "json";
    case "csv":
      return "csv";
    case "python":
      return "py";
    case "svg":
      return "svg";
    case "mermaid":
      return "mmd";
    case "xml":
      return "xml";
    case "yaml":
      return "yml";
    case "sql":
      return "sql";
    case "plaintext":
    case "other":
    default:
      return "txt";
  }
}

export function replaceFileExtension(filename: string, newExt: string): string {
  const dotIdx = filename.lastIndexOf(".");
  if (dotIdx > 0) {
    return `${filename.substring(0, dotIdx)}.${newExt}`;
  }
  return `${filename}.${newExt}`;
}

export function getPreviewTypeForLanguage(
  lang: SupportedLanguage,
): PreviewType {
  switch (lang) {
    case "markdown":
      return "markdown";
    case "mermaid":
      return "mermaid";
    case "svg":
      return "svg";
    case "html":
      return "html";
    case "plaintext":
      return "text";
    case "javascript":
    case "typescript":
    case "python":
      return "console";
    case "json":
      return "json";
    case "css":
      return "css";
    case "csv":
      return "csv";
    default:
      return "none";
  }
}

export function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function detectLineEnding(content: string): "CRLF" | "LF" {
  return content.includes("\r\n") ? "CRLF" : "LF";
}

/**
 * Heuristic detector that inspects content body to suggest language if mismatched
 */
export function detectLanguageFromContent(
  content: string,
): SupportedLanguage | null {
  const trimmed = content.trim();
  if (trimmed.length < 5) return null;

  // 1. JSON: Starts with { or [ and parses successfully
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      JSON.parse(trimmed);
      return "json";
    } catch {
      // Not complete/valid JSON, check if mostly JSON
      if (/^\{[\s\S]*"[A-Za-z0-9_]+"\s*:/.test(trimmed)) {
        return "json";
      }
    }
  }

  // 2. HTML: Contains HTML tags or DOCTYPE
  if (
    /<!doctype\s+html>/i.test(trimmed) ||
    /<html[\s>]/i.test(trimmed) ||
    (/<(div|p|span|table|body|head|script|style|h[1-6]|form|input)[\s>]/i.test(
      trimmed,
    ) &&
      /<\/(div|p|span|table|body|head|h[1-6]|form)>/i.test(trimmed))
  ) {
    return "html";
  }

  // 3. SVG: Root is <svg>
  if (/<svg[\s\S]*?xmlns/i.test(trimmed) || /^<svg[\s>]/i.test(trimmed)) {
    return "svg";
  }

  // 4. CSS: Contains CSS selector blocks with typical declarations
  if (
    /(?:[.#][A-Za-z0-9_-]+|[a-z0-9_-]+)\s*\{[\s\S]*?(?:color|margin|padding|display|background|border|font|width|height)\s*:/i.test(
      trimmed,
    ) &&
    !/(?:function|const|let|var|class|def)\s+/i.test(trimmed)
  ) {
    return "css";
  }

  // 5. Python: typical python keywords, builtins, and constructs
  if (
    /(?:def\s+[a-zA-Z_]\w*\s*\(|class\s+[a-zA-Z_]\w*\s*[:(]|if\s+__name__\s*==\s*['"]__main__['"]|from\s+\w+\s+import\s+\w+|import\s+(?:sys|os|math|random|json|time|re|datetime)\b)/m.test(
      trimmed,
    ) ||
    // Python calls, f-strings, comments & assignments: e.g. print(f"..."), input("..."), float(input(...)), elif, elif :
    /(?:print\s*\([fFrRuUbB]?['"]|input\s*\(['"]|float\s*\(|int\s*\(|str\s*\(|elif\s+.+:|#\s+[a-zA-Z0-9].*\n.*(?:print|input|=|def))/m.test(
      trimmed,
    )
  ) {
    return "python";
  }

  // 6. JavaScript / TypeScript
  if (
    /(?:import\s+.*?\s+from\s+['"].*?['"]|export\s+(?:default\s+)?(?:const|function|class)|const\s+\w+\s*=\s*(?:\([^)]*\)|[a-zA-Z_]\w*)\s*=>|console\.(?:log|error|warn)\()/m.test(
      trimmed,
    )
  ) {
    // Check if TypeScript specific
    if (
      /(?:interface\s+\w+|type\s+\w+\s*=|:\s*(?:string|number|boolean|any|unknown)\b)/.test(
        trimmed,
      )
    ) {
      return "typescript";
    }
    return "javascript";
  }

  // 7. Markdown: requires at least 2 markdown structural indicators or headers with markdown formatting
  if (
    /(?:^#{1,6}\s+[a-zA-Z0-9].*?(?:\n|$)|```[\s\S]*?```|\[.+?\]\(https?:\/\/.+?\)|^\s*[-*+]\s+[a-zA-Z0-9].*\n\s*[-*+]\s+[a-zA-Z0-9])/m.test(
      trimmed,
    ) &&
    // Ensure it's not a Python comment file (e.g. starting with # but containing python code like print or =)
    !/(?:print\s*\(|input\s*\(|def\s+\w+|import\s+\w+|[a-zA-Z_]\w*\s*=\s*float\(|[a-zA-Z_]\w*\s*=\s*input\()/m.test(
      trimmed,
    )
  ) {
    return "markdown";
  }

  // 8. Mermaid: standard diagram header declarations
  if (
    /^(?:graph\s+(?:TD|TB|BT|RL|LR)|flowchart\s+(?:TD|TB|BT|RL|LR)|sequenceDiagram|classDiagram(?:-v2)?|stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie(?:\s+title)?|gitGraph|mindmap|timeline|quadrantChart|sankey-beta|xychart-beta|block-beta|kanban|architecture-beta)\b/m.test(
      trimmed,
    )
  ) {
    return "mermaid";
  }

  // 9. CSV / TSV heuristic: multiple non-empty lines with consistent delimiter count
  const sampleLines = trimmed
    .split("\n")
    .filter((l) => l.trim().length > 0)
    .slice(0, 10);
  if (sampleLines.length >= 2) {
    const delimiters = [",", "\t", ";"];
    for (const del of delimiters) {
      const counts = sampleLines.map((l) => l.split(del).length - 1);
      if (counts[0] >= 1 && counts.every((c) => c === counts[0])) {
        return "csv";
      }
    }
  }

  return null;
}
