import React, { useMemo, useRef } from "react";
import type { PreviewAdapterProps } from "./types";
import { compileLatexToHtml } from "../services/latexCompilerService";
import { AlertCircle, FileText } from "lucide-react";

export const LatexAdapter: React.FC<PreviewAdapterProps> = ({ tab }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rawContent = tab.content || "";

  const renderResult = useMemo(() => {
    return compileLatexToHtml(rawContent);
  }, [rawContent]);

  if (!rawContent.trim()) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center text-[var(--text-muted)] select-none">
        <FileText className="w-12 h-12 stroke-[1.2] text-[var(--text-subtle)] mb-3" />
        <p className="text-xs font-medium text-[var(--text-main)]">
          Empty LaTeX Document
        </p>
        <p className="text-[11px] text-[var(--text-muted)] mt-1 max-w-xs">
          Start typing LaTeX code with sections, text, equations ($...$), or tables to see the live document preview.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-auto p-4 sm:p-8 bg-[var(--bg-preview)] flex justify-center select-text"
    >
      {/* Paper-like academic container */}
      <article className="w-full max-w-3xl bg-[var(--bg-app)] border border-[var(--border-color)] rounded-xl shadow-xs p-6 sm:p-10 transition-colors">
        {/* Document Header (Title, Author, Date) */}
        {(renderResult.title || renderResult.author || renderResult.date) && (
          <header className="mb-8 pb-6 border-b border-[var(--border-color)] text-center">
            {renderResult.title && (
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-highlight)] mb-2 font-serif">
                {renderResult.title}
              </h1>
            )}
            {renderResult.author && (
              <div className="text-sm font-medium text-[var(--text-main)] mb-1">
                {renderResult.author}
              </div>
            )}
            {renderResult.date && (
              <div className="text-xs text-[var(--text-muted)]">
                {renderResult.date}
              </div>
            )}
          </header>
        )}

        {/* Error notification if any */}
        {renderResult.hasErrors && renderResult.errors.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/30 border border-red-800/50 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{renderResult.errors[0]}</span>
          </div>
        )}

        {/* LaTeX Compiled Content */}
        <div
          className="latex-preview-content prose prose-sm dark:prose-invert max-w-none text-[var(--text-main)] font-serif leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderResult.html }}
        />
      </article>
    </div>
  );
};
