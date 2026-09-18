import React, { useEffect, useState, useCallback } from 'react';
import type { PreviewAdapterProps } from './types';
import mermaid from 'mermaid';
import { AlertCircle, Copy, Check } from 'lucide-react';
import { useEditorStore } from '../../tabs/store';
import { applyMermaidTheme } from '../services/mermaidExportService';
import { MermaidExportMenu } from '../components/MermaidExportMenu';

export const MermaidAdapter: React.FC<PreviewAdapterProps> = ({ tab, setHeaderActions }) => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const mermaidTheme = useEditorStore((s) => s.settings.mermaidTheme);
  const appTheme = useEditorStore((s) => s.settings.theme);

  // Re-render when content, configured mermaidTheme, or appTheme changes
  useEffect(() => {
    let isCancelled = false;
    async function renderDiagram() {
      setRenderError(null);
      try {
        applyMermaidTheme(mermaidTheme, appTheme);
        const id = `mermaid-standalone-${Date.now()}`;
        const { svg } = await mermaid.render(id, tab.content || '');
        if (!isCancelled) setSvgContent(svg);
      } catch (e: unknown) {
        const errMsg = e instanceof Error ? e.message : String(e);
        if (!isCancelled) setRenderError(errMsg || 'Invalid Mermaid Syntax');
      }
    }
    renderDiagram();
    return () => {
      isCancelled = true;
    };
  }, [tab.content, mermaidTheme, appTheme]);

  const handleCopySvg = useCallback(async () => {
    if (!svgContent) return;
    try {
      await navigator.clipboard.writeText(svgContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, [svgContent]);

  // Inject Copy SVG and Export Menu actions into unified PreviewPanel header
  useEffect(() => {
    if (!svgContent) return;

    setHeaderActions?.(
      <div className="flex items-center gap-1.5 select-none">
        <button
          onClick={handleCopySvg}
          className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--bg-surface)] hover:bg-[var(--bg-tab-hover)] border border-[var(--border-color)] text-xs text-[var(--text-main)] hover:text-[var(--text-highlight)] transition-colors cursor-pointer"
          title="Copy SVG to Clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span className="text-[var(--accent)] font-medium text-[11px]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[11px]">Copy SVG</span>
            </>
          )}
        </button>

        <MermaidExportMenu svgContent={svgContent} baseFileName={tab.name || 'diagram'} />
      </div>
    );

    return () => setHeaderActions?.(null);
  }, [setHeaderActions, handleCopySvg, copied, svgContent, tab.name]);

  return (
    <div className="h-full w-full overflow-auto p-6 flex flex-col items-center justify-center">
      {renderError ? (
        <div className="p-4 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2 max-w-md">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <span>{renderError}</span>
        </div>
      ) : (
        <div
          className="p-6 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl shadow-lg max-w-full overflow-auto flex items-center justify-center"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      )}
    </div>
  );
};
