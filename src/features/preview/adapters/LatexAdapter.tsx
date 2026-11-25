import React, { useMemo, useRef } from "react";
import type { PreviewAdapterProps } from "./types";
import { compileLatexToHtml } from "../services/latexCompilerService";
import { FileText } from "lucide-react";
import { EmptyState } from "../../../shared/components/EmptyState";
import { InlineBanner } from "../../../shared/components/InlineBanner";

export const LatexAdapter: React.FC<PreviewAdapterProps> = ({ tab }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rawContent = tab.content || "";

  const renderResult = useMemo(() => {
    return compileLatexToHtml(rawContent);
  }, [rawContent]);

  if (!rawContent.trim()) {
    return (
      <EmptyState
        icon={<FileText className="w-10 h-10 stroke-[1.25]" />}
        title="Empty LaTeX Document"
        description="Start typing LaTeX code with sections, text, equations ($...$), or tables to see the live document preview."
      />
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
          <InlineBanner
            variant="error"
            compact
            dismissible={false}
            message={renderResult.errors[0]}
            className="mb-4"
          />
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
