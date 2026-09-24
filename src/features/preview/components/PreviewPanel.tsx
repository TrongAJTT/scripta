import React, { useState, useMemo, useRef, useCallback } from "react";
import type { FileTab } from "../../../core/types/file.types";
import { getPreviewAdapter } from "../adapters/registry";
import {
  Eye,
  Code,
  Image as ImageIcon,
  Globe,
  Terminal,
  FileCode,
  FileText,
  Braces,
  Palette,
  Table as TableIcon,
  Printer,
} from "lucide-react";
import { useEditorStore } from "../../tabs/store";
import { checkPreviewThreshold } from "../../../core/constants/previewLimits";
import { PreviewThresholdFallback } from "./PreviewThresholdFallback";
import { printLiveElement } from "../../../core/utils/printUtils";

interface PreviewPanelProps {
  tab: FileTab;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ tab }) => {
  const [headerActions, setHeaderActions] = useState<React.ReactNode>(null);
  const [printHandler, setPrintHandler] = useState<(() => void) | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previewMode = useEditorStore((s) => s.previewMode);
  const settings = useEditorStore((s) => s.settings);
  const bypassedPreviewTabIds = useEditorStore((s) => s.bypassedPreviewTabIds);
  const bypassPreviewThreshold = useEditorStore(
    (s) => s.bypassPreviewThreshold,
  );

  const adapter = getPreviewAdapter(tab.previewType);
  const AdapterComponent = adapter.Component;

  // Soft threshold check: only active in split or auto mode when content is actively edited side-by-side
  const isSplitOrAuto = previewMode === "split" || previewMode === "auto";
  const isBypassed = bypassedPreviewTabIds.includes(tab.id);

  const thresholdResult = useMemo(() => {
    if (!isSplitOrAuto || isBypassed || !tab.content) {
      return null;
    }
    const result = checkPreviewThreshold(
      tab.content,
      tab.previewType,
      settings.previewPerfPreset || "balanced",
    );
    return result.exceeds ? result : null;
  }, [
    isSplitOrAuto,
    isBypassed,
    tab.content,
    tab.previewType,
    settings.previewPerfPreset,
  ]);

  // Stable wrapper so React state setter accepts (fn | null) correctly
  const handleSetPrintHandler = useCallback(
    (fn: (() => void) | null) => setPrintHandler(() => fn),
    [],
  );

  const handlePrint = useCallback(() => {
    if (printHandler) {
      printHandler();
    } else if (contentRef.current) {
      printLiveElement(contentRef.current);
    }
  }, [printHandler]);

  const renderIcon = () => {
    switch (adapter.iconType) {
      case "image":
        return (
          <ImageIcon className="w-3.5 h-3.5 text-[var(--accent-yellow)]" />
        );
      case "svg":
        return <Code className="w-3.5 h-3.5 text-[var(--accent-purple)]" />;
      case "html":
        return <Globe className="w-3.5 h-3.5 text-[var(--accent-blue)]" />;
      case "console":
        return <Terminal className="w-3.5 h-3.5 text-[var(--accent)]" />;
      case "text":
        return <FileText className="w-3.5 h-3.5 text-[var(--accent)]" />;
      case "json":
        return <Braces className="w-3.5 h-3.5 text-[var(--accent-yellow)]" />;
      case "css":
        return <Palette className="w-3.5 h-3.5 text-pink-400" />;
      case "csv":
        return <TableIcon className="w-3.5 h-3.5 text-emerald-500" />;
      case "mermaid":
      case "markdown":
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
          {adapter.badge === "CONSOLE" && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[var(--bg-surface-elevated)] border border-[var(--border-color)] text-[var(--accent)] tracking-wide">
              CONSOLE
            </span>
          )}
        </div>

        {/* Trailing: Injected UI actions from active adapter + Print button */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!thresholdResult && headerActions}
          {!thresholdResult && (
            <button
              onClick={handlePrint}
              title="Print / Export preview"
              className="p-1 text-[var(--text-muted)] hover:text-[var(--text-highlight)] transition-colors rounded hover:bg-[var(--bg-surface-elevated)]"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Adapter Content or Threshold Fallback */}
      <div ref={contentRef} className="flex-1 w-full h-full overflow-hidden relative">
        {thresholdResult ? (
          <PreviewThresholdFallback
            tab={tab}
            checkResult={thresholdResult}
            onRenderAnyway={() => bypassPreviewThreshold(tab.id)}
          />
        ) : (
          <AdapterComponent
            key={`${tab.id}-${tab.previewType}`}
            tab={tab}
            setHeaderActions={setHeaderActions}
            setPrintHandler={handleSetPrintHandler}
          />
        )}
      </div>
    </div>
  );
};
