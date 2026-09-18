import React, { useState, useEffect, useCallback } from 'react';
import type { PreviewAdapterProps } from './types';
import { RotateCw, ExternalLink } from 'lucide-react';

export const HtmlAdapter: React.FC<PreviewAdapterProps> = ({ tab, setHeaderActions }) => {
  const [reloadKey, setReloadKey] = useState(0);

  const handleOpenInNewWindow = useCallback(() => {
    const blob = new Blob([tab.content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }, [tab.content]);

  // Inject trailing actions into unified PreviewPanel header
  useEffect(() => {
    setHeaderActions?.(
      <div className="flex items-center gap-1 select-none">
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          className="p-1 text-[var(--text-muted)] hover:text-[var(--text-highlight)] transition-colors rounded hover:bg-[var(--bg-surface-elevated)]"
          title="Reload HTML Preview"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleOpenInNewWindow}
          className="p-1 text-[var(--text-muted)] hover:text-[var(--text-highlight)] transition-colors rounded hover:bg-[var(--bg-surface-elevated)]"
          title="Open in new window"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    );

    return () => setHeaderActions?.(null);
  }, [setHeaderActions, handleOpenInNewWindow]);

  return (
    <div className="h-full w-full bg-white relative overflow-hidden">
      <iframe
        key={reloadKey}
        srcDoc={tab.content}
        title={tab.name}
        sandbox="allow-scripts allow-modals"
        className="w-full h-full border-none"
      />
    </div>
  );
};
