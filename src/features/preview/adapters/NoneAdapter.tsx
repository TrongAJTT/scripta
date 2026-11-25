import React from "react";
import type { PreviewAdapterProps } from "./types";
import { FileCode, Columns2, Terminal, ArrowRight } from "lucide-react";
import { useEditorStore } from "../../tabs/store";
import { EmptyState } from "../../../shared/components/EmptyState";

export const NoneAdapter: React.FC<PreviewAdapterProps> = ({ tab }) => {
  const setPreviewMode = useEditorStore((s) => s.setPreviewMode);

  const handleOpenConsole = () => {
    useEditorStore.setState((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === tab.id ? { ...t, previewType: "console" } : t,
      ),
    }));
  };

  return (
    <EmptyState
      icon={<FileCode className="w-10 h-10 stroke-[1.25] text-[var(--accent-blue)]" />}
      title="No Visual Preview Available"
      description={
        <>
          <strong className="text-[var(--text-main)] uppercase font-mono">
            {tab.language}
          </strong>{" "}
          files contain source code logic rather than formatted document markup.
        </>
      }
      actions={
        <>
          <button
            type="button"
            onClick={() => setPreviewMode("editor-only")}
            className="px-3 py-1.5 rounded bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-tab-hover)] border border-[var(--border-color)] text-xs text-[var(--text-main)] hover:text-[var(--text-highlight)] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>Switch to Editor Only</span>
          </button>

          <button
            type="button"
            onClick={handleOpenConsole}
            className="px-3 py-1.5 rounded bg-[var(--accent)] hover:brightness-110 text-[var(--text-on-accent)] font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Open Code Console</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </>
      }
    />
  );
};
