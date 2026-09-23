import React from "react";
import { Eye, Maximize2, Settings, ShieldAlert } from "lucide-react";
import type { FileTab } from "../../../core/types/file.types";
import type { ThresholdCheckResult } from "../../../core/constants/previewLimits";
import { formatBytes } from "../../../core/constants/previewLimits";
import { useEditorStore } from "../../tabs/store";

interface PreviewThresholdFallbackProps {
  tab: FileTab;
  checkResult: ThresholdCheckResult;
  onRenderAnyway: () => void;
}

export const PreviewThresholdFallback: React.FC<
  PreviewThresholdFallbackProps
> = ({ checkResult, onRenderAnyway }) => {
  const setPreviewMode = useEditorStore((s) => s.setPreviewMode);

  const handleOpenPreferences = () => {
    window.dispatchEvent(
      new CustomEvent("open-preferences-modal", {
        detail: { category: "preview" },
      }),
    );
  };

  const isLinesExceeded = checkResult.lineCount > checkResult.maxLines;
  const isBytesExceeded = checkResult.byteCount > checkResult.maxBytes;

  return (
    <div className="h-full w-full flex items-center justify-center select-none overflow-y-auto">
      <div className="max-w-md w-full flex flex-col items-center text-center animate-fade-in">
        {/* Warning Icon Badge */}
        <div className="w-12 h-12 flex items-center justify-center text-amber-500 mb-2 shrink-0">
          <ShieldAlert className="w-7 h-7 stroke-[1.75]" />
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-bold text-[var(--text-highlight)] tracking-tight mb-1.5">
          Split Preview Auto-Paused
        </h3>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-sm mb-5">
          Real-time preview rendering was temporarily paused to prevent editor
          typing lag on large files.
        </p>

        {/* File Metrics & Limit Cards */}
        <div className="w-full grid grid-cols-2 gap-2.5 mb-5 text-left">
          {/* Line Count Stat */}
          <div
            className={`p-3 rounded-lg border text-xs flex flex-col justify-between transition-colors ${
              isLinesExceeded
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-[var(--bg-editor)] border-[var(--border-subtle)] text-[var(--text-muted)]"
            }`}
          >
            <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Line Count
            </div>
            <div className="text-sm font-mono font-bold text-[var(--text-main)]">
              {checkResult.lineCount.toLocaleString()}{" "}
              <span className="text-[11px] font-normal text-[var(--text-muted)]">
                /{" "}
                {checkResult.maxLines === Infinity
                  ? "∞"
                  : checkResult.maxLines.toLocaleString()}
              </span>
            </div>
            <div className="text-[10px] mt-1 text-[var(--text-muted)]">
              {isLinesExceeded ? "Exceeds soft limit" : "Within limit"}
            </div>
          </div>

          {/* Byte Size Stat */}
          <div
            className={`p-3 rounded-lg border text-xs flex flex-col justify-between transition-colors ${
              isBytesExceeded
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-[var(--bg-editor)] border-[var(--border-subtle)] text-[var(--text-muted)]"
            }`}
          >
            <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Payload Size
            </div>
            <div className="text-sm font-mono font-bold text-[var(--text-main)]">
              {formatBytes(checkResult.byteCount)}{" "}
              <span className="text-[11px] font-normal text-[var(--text-muted)]">
                / {formatBytes(checkResult.maxBytes)}
              </span>
            </div>
            <div className="text-[10px] mt-1 text-[var(--text-muted)]">
              {isBytesExceeded ? "Exceeds soft limit" : "Within limit"}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2">
          {/* Primary: Render Anyway */}
          <button
            type="button"
            onClick={onRenderAnyway}
            className="w-full py-2 px-3 rounded-lg bg-[var(--accent)] hover:opacity-95 text-accent-contrast text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Render Anyway</span>
          </button>

          {/* Secondary: Switch to Preview Only */}
          <button
            type="button"
            onClick={() => setPreviewMode("preview-only")}
            className="w-full py-2 px-3 rounded-lg bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-tab-hover)] border border-[var(--border-color)] text-[var(--text-main)] text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>Switch to Preview Only View</span>
          </button>

          {/* Tertiary: Adjust Performance Presets */}
          <button
            type="button"
            onClick={handleOpenPreferences}
            className="w-full py-1.5 px-3 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-highlight)] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configure Performance Presets</span>
          </button>
        </div>
      </div>
    </div>
  );
};
