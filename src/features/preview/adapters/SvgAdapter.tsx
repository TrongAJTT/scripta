import React, { useState, useEffect } from 'react';
import type { PreviewAdapterProps } from './types';
import DOMPurify from 'dompurify';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export const SvgAdapter: React.FC<PreviewAdapterProps> = ({ tab, setHeaderActions }) => {
  const [zoom, setZoom] = useState(1);

  const cleanSvg = DOMPurify.sanitize(tab.content || '', {
    USE_PROFILES: { svg: true, svgFilters: true },
  });

  // Inject zoom controls into unified PreviewPanel header
  useEffect(() => {
    setHeaderActions?.(
      <div className="flex items-center gap-1 select-none">
        <button
          onClick={() => setZoom((z) => Math.max(0.2, Number((z - 0.2).toFixed(1))))}
          className="p-1 text-[var(--text-muted)] hover:text-[var(--text-highlight)] transition-colors rounded hover:bg-[var(--bg-surface-elevated)]"
          title="Zoom out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="px-1 font-mono text-[10px] text-[var(--text-main)] min-w-[34px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(5, Number((z + 0.2).toFixed(1))))}
          className="p-1 text-[var(--text-muted)] hover:text-[var(--text-highlight)] transition-colors rounded hover:bg-[var(--bg-surface-elevated)]"
          title="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoom(1)}
          className="p-1 text-[var(--text-muted)] hover:text-[var(--text-highlight)] transition-colors rounded hover:bg-[var(--bg-surface-elevated)] border-l border-[var(--border-color)] ml-0.5 pl-1.5"
          title="Reset Zoom"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    );

    return () => setHeaderActions?.(null);
  }, [setHeaderActions, zoom]);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden relative">
      <div className="flex-1 w-full h-full overflow-auto flex items-center justify-center p-8">
        <div
          className="transition-transform duration-100 p-8 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl shadow-lg flex items-center justify-center"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          dangerouslySetInnerHTML={{ __html: cleanSvg }}
        />
      </div>
    </div>
  );
};
