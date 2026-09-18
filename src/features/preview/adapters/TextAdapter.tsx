import React, { useState, useEffect, useCallback } from 'react';
import type { PreviewAdapterProps } from './types';
import { Copy, Check, Hash, Type, FileText } from 'lucide-react';

export const TextAdapter: React.FC<PreviewAdapterProps> = ({ tab, setHeaderActions }) => {
  const [isMono, setIsMono] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [copied, setCopied] = useState(false);

  const content = tab.content || '';
  const lines = content.split('\n');
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, [content]);

  // Inject trailing actions into unified PreviewPanel header
  useEffect(() => {
    setHeaderActions?.(
      <div className="flex items-center gap-1.5 text-xs select-none">
        {/* Document stats */}
        <span className="text-[10px] text-[var(--text-subtle)] font-mono hidden sm:inline mr-1">
          {wordCount} words • {charCount} chars
        </span>

        {/* Toggle Monospace / Sans */}
        <button
          onClick={() => setIsMono((m) => !m)}
          className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors border ${
            isMono
              ? 'bg-[var(--bg-surface-elevated)] text-[var(--accent)] border-[var(--accent)]/40 font-bold'
              : 'bg-transparent text-[var(--text-muted)] border-transparent hover:text-[var(--text-highlight)] hover:bg-[var(--bg-surface-elevated)]'
          }`}
          title={isMono ? 'Switch to Sans-serif font' : 'Switch to Monospace font'}
        >
          <span className="flex items-center gap-1">
            <Type className="w-3 h-3" />
            {isMono ? 'Mono' : 'Sans'}
          </span>
        </button>

        {/* Toggle Line Numbers */}
        <button
          onClick={() => setShowLineNumbers((n) => !n)}
          className={`p-1 rounded transition-colors ${
            showLineNumbers
              ? 'text-[var(--accent)] bg-[var(--bg-surface-elevated)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-highlight)] hover:bg-[var(--bg-surface-elevated)]'
          }`}
          title={showLineNumbers ? 'Hide line numbers' : 'Show line numbers'}
        >
          <Hash className="w-3.5 h-3.5" />
        </button>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-highlight)] hover:bg-[var(--bg-surface-elevated)] transition-colors ml-0.5"
          title="Copy plain text"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    );

    return () => setHeaderActions?.(null);
  }, [setHeaderActions, isMono, showLineNumbers, copied, wordCount, charCount, handleCopy]);

  if (!content) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center text-[var(--text-muted)] select-none">
        <FileText className="w-12 h-12 stroke-[1.2] text-[var(--text-subtle)] mb-3" />
        <p className="text-xs font-medium text-[var(--text-main)]">Empty Text Document</p>
        <p className="text-[11px] text-[var(--text-muted)] mt-1 max-w-xs">
          Type text in the editor to see formatted reading view here.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`h-full w-full overflow-auto p-6 select-text transition-all ${
        isMono ? 'font-mono text-xs' : 'font-sans text-sm'
      }`}
    >
      {showLineNumbers ? (
        <div className="table w-full border-collapse">
          {lines.map((line, idx) => (
            <div key={idx} className="table-row leading-relaxed hover:bg-[var(--bg-surface-elevated)]/40">
              <span className="table-cell pr-4 text-right select-none text-[var(--text-subtle)] font-mono text-xs w-8 border-r border-[var(--border-subtle)]">
                {idx + 1}
              </span>
              <span className="table-cell pl-4 whitespace-pre-wrap break-words text-[var(--text-main)]">
                {line || '\n'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="whitespace-pre-wrap break-words leading-relaxed text-[var(--text-main)] max-w-none">
          {content}
        </div>
      )}
    </div>
  );
};
