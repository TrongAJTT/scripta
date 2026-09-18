import React, { useState } from 'react';
import type { FileTab } from '../../../core/types/file.types';
import { getPreviewAdapter } from '../adapters/registry';
import { Eye, Code, Image as ImageIcon, Globe, Terminal, FileCode, FileText, Braces, Palette } from 'lucide-react';

interface PreviewPanelProps {
  tab: FileTab;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ tab }) => {
  const [headerActions, setHeaderActions] = useState<React.ReactNode>(null);
  const adapter = getPreviewAdapter(tab.previewType);
  const AdapterComponent = adapter.Component;

  const renderIcon = () => {
    switch (adapter.iconType) {
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-[var(--accent-yellow)]" />;
      case 'svg':
        return <Code className="w-3.5 h-3.5 text-[var(--accent-purple)]" />;
      case 'html':
        return <Globe className="w-3.5 h-3.5 text-[var(--accent-blue)]" />;
      case 'console':
        return <Terminal className="w-3.5 h-3.5 text-[var(--accent)]" />;
      case 'text':
        return <FileText className="w-3.5 h-3.5 text-[var(--accent)]" />;
      case 'json':
        return <Braces className="w-3.5 h-3.5 text-[var(--accent-yellow)]" />;
      case 'css':
        return <Palette className="w-3.5 h-3.5 text-pink-400" />;
      case 'mermaid':
      case 'markdown':
        return <Eye className="w-3.5 h-3.5 text-[var(--accent)]" />;
      default:
        return <FileCode className="w-3.5 h-3.5 text-[var(--text-muted)]" />;
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-[var(--bg-preview)] border-l border-[var(--border-color)] overflow-hidden">
      {/* Unified Single Header Bar */}
      <div className="h-9 px-3 flex items-center justify-between bg-[var(--bg-toolbar)] border-b border-[var(--border-color)] text-xs text-[var(--text-muted)] font-medium shrink-0 select-none">
        {/* Leading: Icon + Fixed PREVIEW PANEL Title + optional CONSOLE Badge */}
        <div className="flex items-center gap-2 min-w-0">
          {renderIcon()}
          <span className="uppercase tracking-wider font-bold text-xs text-[var(--text-main)]">
            PREVIEW PANEL
          </span>
          {adapter.badge === 'CONSOLE' && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[var(--bg-surface-elevated)] border border-[var(--border-color)] text-[var(--accent)] tracking-wide">
              CONSOLE
            </span>
          )}
        </div>

        {/* Trailing: Injected UI actions from active adapter */}
        <div className="flex items-center gap-1.5 shrink-0">
          {headerActions}
        </div>
      </div>

      {/* Dynamic Adapter Content with key to automatically reset state on tab or previewType switch */}
      <div className="flex-1 w-full h-full overflow-hidden relative">
        <AdapterComponent
          key={`${tab.id}-${tab.previewType}`}
          tab={tab}
          setHeaderActions={setHeaderActions}
        />
      </div>
    </div>
  );
};
