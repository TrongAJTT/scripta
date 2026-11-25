import katex from "katex";
import DOMPurify from "dompurify";

export interface LatexRenderResult {
  html: string;
  title?: string;
  author?: string;
  date?: string;
  hasErrors: boolean;
  errors: string[];
}

/**
 * Escapes plain text for safe insertion into HTML.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Renders LaTeX math expressions using KaTeX.
 */
function renderMath(math: string, displayMode: boolean): string {
  try {
    return katex.renderToString(math.trim(), {
      displayMode,
      throwOnError: false,
      output: "htmlAndMathml",
    });
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    return `<span class="katex-error text-red-500 font-mono text-xs" title="${escapeHtml(err)}">${escapeHtml(math)}</span>`;
  }
}

/**
 * Lightweight LaTeX to HTML document compiler.
 * Supports document metadata, sections, lists, tables, images, and math equations.
 */
export function compileLatexToHtml(latexContent: string): LatexRenderResult {
  const errors: string[] = [];

  // Extract Document Metadata
  let title = "";
  let author = "";
  let date = "";

  const titleMatch = latexContent.match(/\\title\{([^}]+)\}/);
  if (titleMatch) title = titleMatch[1].trim().normalize("NFC");

  const authorMatch = latexContent.match(/\\author\{([^}]+)\}/);
  if (authorMatch) author = authorMatch[1].trim().normalize("NFC");

  const dateMatch = latexContent.match(/\\date\{([^}]+)\}/);
  if (dateMatch) {
    const rawDate = dateMatch[1].trim();
    if (rawDate === "\\today") {
      const now = new Date();
      date = now.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } else {
      date = rawDate.normalize("NFC");
    }
  }

  // Normalize Unicode to Canonical Composed (NFC) form to fix accent spacing
  const normalizedContent = latexContent.normalize("NFC");

  // Strip LaTeX comments (% ...) while preserving escaped \%
  let content = normalizedContent.replace(/(^|[^\\])%.*$/gm, "$1");

  // Extract body between \begin{document} and \end{document} if present
  const docMatch = content.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
  if (docMatch) {
    content = docMatch[1];
  } else {
    // If no document environment, strip preamble (\documentclass, \usepackage, etc.)
    content = content.replace(/^[\s\S]*?\\begin\{document\}/, "");
  }

  // Remove \maketitle (we render title block separately in UI header)
  content = content.replace(/\\maketitle/g, "");

  // Placeholder map to protect math and code blocks from regex transformations
  const placeholders: Map<string, string> = new Map();
  let phCounter = 0;

  function createPlaceholder(html: string): string {
    const key = `@@LATEX_PH_${phCounter++}@@`;
    placeholders.set(key, html);
    return key;
  }

  // 1. Math block environments: \begin{equation}...\end{equation}, \begin{align}...\end{align}, etc.
  content = content.replace(
    /\\begin\{(equation\*?|align\*?|gather\*?|multline\*?)\}([\s\S]*?)\\end\{\1\}/g,
    (_, _env, math) => {
      return createPlaceholder(
        `<div class="latex-math-block my-4 flex justify-center overflow-x-auto">${renderMath(math, true)}</div>`,
      );
    },
  );

  // 2. Display math: $$ ... $$ and \[ ... \]
  content = content.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    return createPlaceholder(
      `<div class="latex-math-block my-4 flex justify-center overflow-x-auto">${renderMath(math, true)}</div>`,
    );
  });
  content = content.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
    return createPlaceholder(
      `<div class="latex-math-block my-4 flex justify-center overflow-x-auto">${renderMath(math, true)}</div>`,
    );
  });

  // 3. Inline math: $ ... $ and \( ... \)
  content = content.replace(/\$([^$\n]+?)\$/g, (_, math) => {
    return createPlaceholder(
      `<span class="latex-math-inline">${renderMath(math, false)}</span>`,
    );
  });
  content = content.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
    return createPlaceholder(
      `<span class="latex-math-inline">${renderMath(math, false)}</span>`,
    );
  });

  // 4. Tabular environment: \begin{tabular}{...}...\end{tabular}
  content = content.replace(
    /\\begin\{tabular\}\{[^}]*\}([\s\S]*?)\\end\{tabular\}/g,
    (_, tableContent) => {
      const rows = tableContent
        .trim()
        .split(/\\\\/)
        .map((r: string) => r.trim())
        .filter((r: string) => r.length > 0 && r !== "\\hline");

      const tableRowsHtml = rows
        .map((row: string, idx: number) => {
          const cells = row.split("&").map((c: string) => c.replace(/\\hline/g, "").trim());
          const cellTag = idx === 0 ? "th" : "td";
          const cellsHtml = cells
            .map(
              (c: string) =>
                `<${cellTag} class="border border-[var(--border-color)] px-3 py-1.5 text-xs text-left">${c}</${cellTag}>`,
            )
            .join("");
          return `<tr class="${idx === 0 ? "bg-[var(--bg-surface-elevated)] font-semibold" : "border-b border-[var(--border-subtle)]"}">${cellsHtml}</tr>`;
        })
        .join("");

      return createPlaceholder(
        `<div class="my-4 overflow-x-auto"><table class="w-full border-collapse border border-[var(--border-color)] my-2">${tableRowsHtml}</table></div>`,
      );
    },
  );

  // 5. Itemize & Enumerate lists
  content = content.replace(
    /\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g,
    (_, itemsText) => {
      const items = itemsText
        .split(/\\item\s+/)
        .map((it: string) => it.trim())
        .filter((it: string) => it.length > 0);
      const itemsHtml = items.map((it: string) => `<li class="my-0.5">${it}</li>`).join("");
      return createPlaceholder(`<ul class="list-disc list-outside pl-5 my-2 space-y-1">${itemsHtml}</ul>`);
    },
  );

  content = content.replace(
    /\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g,
    (_, itemsText) => {
      const items = itemsText
        .split(/\\item\s+/)
        .map((it: string) => it.trim())
        .filter((it: string) => it.length > 0);
      const itemsHtml = items.map((it: string) => `<li class="my-0.5">${it}</li>`).join("");
      return createPlaceholder(`<ol class="list-decimal list-outside pl-5 my-2 space-y-1">${itemsHtml}</ol>`);
    },
  );

  // 6. Section headings
  content = content.replace(/\\section\*?\{([^}]+)\}/g, '<h1 class="text-xl font-bold mt-6 mb-3 pb-1 border-b border-[var(--border-color)] text-[var(--text-highlight)]">$1</h1>');
  content = content.replace(/\\subsection\*?\{([^}]+)\}/g, '<h2 class="text-lg font-semibold mt-5 mb-2 text-[var(--text-highlight)]">$1</h2>');
  content = content.replace(/\\subsubsection\*?\{([^}]+)\}/g, '<h3 class="text-base font-semibold mt-4 mb-1 text-[var(--text-main)]">$1</h3>');
  content = content.replace(/\\paragraph\*?\{([^}]+)\}/g, '<h4 class="text-sm font-bold mt-3 mb-1 text-[var(--text-main)]">$1</h4>');

  // 7. Text Formatting
  content = content.replace(/\\textbf\{([^}]+)\}/g, "<strong>$1</strong>");
  content = content.replace(/\\textit\{([^}]+)\}/g, "<em>$1</em>");
  content = content.replace(/\\emph\{([^}]+)\}/g, "<em>$1</em>");
  content = content.replace(/\\underline\{([^}]+)\}/g, "<u>$1</u>");
  content = content.replace(/\\texttt\{([^}]+)\}/g, '<code class="px-1 py-0.5 rounded bg-[var(--bg-surface-elevated)] font-mono text-xs text-[var(--accent)]">$1</code>');

  // 8. Image inclusion: \includegraphics[...]{url} (supports online URLs)
  content = content.replace(/\\includegraphics(?:\[[^\]]*\])?\{([^}]+)\}/g, (_, src) => {
    return createPlaceholder(
      `<div class="my-4 flex flex-col items-center"><img src="${encodeURI(src.trim())}" alt="LaTeX figure" class="max-w-full rounded border border-[var(--border-color)]" loading="lazy" /></div>`,
    );
  });

  // 9. Hyperlinks: \href{url}{label} and \url{url}
  content = content.replace(/\\href\{([^}]+)\}\{([^}]+)\}/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-[var(--accent-blue)] underline hover:text-[var(--accent)]">$2</a>');
  content = content.replace(/\\url\{([^}]+)\}/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-[var(--accent-blue)] underline hover:text-[var(--accent)]">$1</a>');

  // 10. Abstract environment
  content = content.replace(
    /\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/g,
    '<div class="my-4 p-4 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-xs italic leading-relaxed text-[var(--text-muted)]"><strong class="block not-italic text-center uppercase tracking-wider font-semibold text-xs mb-2 text-[var(--text-main)]">Abstract</strong>$1</div>',
  );

  // 11. Line breaks and paragraphs
  content = content.replace(/\\\\/g, "<br />");
  const paragraphs = content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => {
      // Do not wrap if it's already a block element placeholder or heading
      if (
        p.startsWith("<h1") ||
        p.startsWith("<h2") ||
        p.startsWith("<h3") ||
        p.startsWith("<h4") ||
        p.startsWith("<div") ||
        p.startsWith("<ul") ||
        p.startsWith("<ol") ||
        p.startsWith("<table") ||
        p.startsWith("@@LATEX_PH_")
      ) {
        return p;
      }
      return `<p class="my-2 leading-relaxed text-[var(--text-main)]">${p}</p>`;
    })
    .join("\n");

  // Restore placeholders
  let finalHtml = paragraphs;
  placeholders.forEach((htmlVal, phKey) => {
    finalHtml = finalHtml.replaceAll(phKey, htmlVal);
  });

  // Sanitize final markup safely
  const sanitized = DOMPurify.sanitize(finalHtml, {
    ADD_TAGS: ["math", "annotation", "semantics", "mtext", "mn", "mo", "mi", "mspace", "mover", "munder", "msubsup", "msup", "msub", "mfrac", "mroot", "msqrt", "mtable", "mtr", "mtd", "mrow"],
    ADD_ATTR: ["xmlns", "display", "mathvariant", "columnalign", "rowalign"],
  });

  return {
    html: sanitized,
    title,
    author,
    date,
    hasErrors: errors.length > 0,
    errors,
  };
}
