import React, { useEffect, useState, useRef } from 'react';
import type { PreviewAdapterProps } from './types';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import mermaid from 'mermaid';
import { AlertCircle } from 'lucide-react';
import { createRoot } from 'react-dom/client';
import { useEditorStore } from '../../tabs/store';
import { applyMermaidTheme } from '../services/mermaidExportService';
import { MermaidExportMenu } from '../components/MermaidExportMenu';

export const MarkdownAdapter: React.FC<PreviewAdapterProps> = ({ tab }) => {
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [hasRenderError, setHasRenderError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mermaidTheme = useEditorStore((s) => s.settings.mermaidTheme);
  const appTheme = useEditorStore((s) => s.settings.theme);

  useEffect(() => {
    let isCancelled = false;

    async function parseMarkdown() {
      setHasRenderError(null);
      try {
        const rawHtml = await marked.parse(tab.content || '');
        const sanitized = DOMPurify.sanitize(rawHtml);
        if (!isCancelled) setRenderedHtml(sanitized);
      } catch (e: unknown) {
        if (!isCancelled) setHasRenderError(e instanceof Error ? e.message : 'Markdown parse error');
      }
    }

    parseMarkdown();
    return () => {
      isCancelled = true;
    };
  }, [tab.content]);

  // Render embedded mermaid code blocks with export action
  useEffect(() => {
    if (!containerRef.current) return;
    const mermaidBlocks = containerRef.current.querySelectorAll('pre code.language-mermaid');
    
    applyMermaidTheme(mermaidTheme, appTheme);

    mermaidBlocks.forEach(async (block, idx) => {
      try {
        const code = block.textContent || '';
        const id = `mermaid-block-${idx}-${Date.now()}`;
        const { svg } = await mermaid.render(id, code);
        const parent = block.parentElement;
        if (parent) {
          const wrapper = document.createElement('div');
          wrapper.className = 'my-4 relative group rounded-lg border border-[var(--border-color)] bg-[var(--bg-statusbar)] p-4 flex flex-col items-center overflow-x-auto';
          
          // Action button bar for this diagram
          const toolbar = document.createElement('div');
          toolbar.className = 'absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10';
          wrapper.appendChild(toolbar);

          const diagramContainer = document.createElement('div');
          diagramContainer.className = 'w-full flex justify-center';
          diagramContainer.innerHTML = svg;
          wrapper.appendChild(diagramContainer);

          parent.replaceWith(wrapper);

          // Mount React ExportMenu inside toolbar
          const root = createRoot(toolbar);
          root.render(<MermaidExportMenu svgContent={svg} baseFileName={`diagram-${idx + 1}`} />);
        }
      } catch {
        // Fallback to plain code block
      }
    });
  }, [renderedHtml, mermaidTheme, appTheme]);

  return (
    <div className="h-full w-full overflow-auto p-6 relative">
      {hasRenderError && (
        <div className="mb-4 p-3 rounded-md bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{hasRenderError}</span>
        </div>
      )}
      <div
        ref={containerRef}
        className="markdown-preview prose prose-sm dark:prose-invert max-w-none break-words"
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    </div>
  );
};
