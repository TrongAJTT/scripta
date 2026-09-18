import React from 'react';
import type { PreviewAdapterProps } from './types';
import { FileCode, Columns2, Terminal, ArrowRight } from 'lucide-react';
import { useEditorStore } from '../../tabs/store';

export const NoneAdapter: React.FC<PreviewAdapterProps> = ({ tab }) => {
  const setPreviewMode = useEditorStore((s) => s.setPreviewMode);

  const handleOpenConsole = () => {
    useEditorStore.setState((state) => ({
      tabs: state.tabs.map((t) => (t.id === tab.id ? { ...t, previewType: 'console' } : t)),
    }));
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center select-none bg-[var(--bg-preview)]">
      <div className="w-14 h-14 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-color)] flex items-center justify-center mb-4 text-[var(--accent-blue)] shadow-sm">
        <FileCode className="w-7 h-7 stroke-[1.5]" />
      </div>

      <h3 className="text-sm font-semibold text-[var(--text-highlight)] mb-1">
        No Visual Preview Available
      </h3>
      <p className="text-xs text-[var(--text-muted)] max-w-sm mb-6 leading-relaxed">
        <strong className="text-[var(--text-main)] uppercase font-mono">{tab.language}</strong> files contain source code logic rather than formatted document markup.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-2">
        <button
          onClick={() => setPreviewMode('editor-only')}
          className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-tab-hover)] border border-[var(--border-color)] text-xs text-[var(--text-main)] hover:text-white transition-colors flex items-center justify-center gap-2 shadow-xs"
        >
          <Columns2 className="w-3.5 h-3.5" />
          <span>Switch to Editor Only</span>
        </button>

        <button
          onClick={handleOpenConsole}
          className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[var(--accent)] hover:brightness-110 text-slate-950 font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-xs"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Open Code Console</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
