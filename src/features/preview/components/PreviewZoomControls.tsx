import React from "react";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from "lucide-react";

interface PreviewZoomControlsProps {
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
  step?: number;
  onZoomChange: (nextZoom: number) => void;
  onReset: () => void;
  onFit?: () => void;
}

export const PreviewZoomControls: React.FC<PreviewZoomControlsProps> = ({
  zoom,
  minZoom = 0.2,
  maxZoom = 5,
  step = 0.2,
  onZoomChange,
  onReset,
  onFit,
}) => {
  const handleZoomOut = () => {
    onZoomChange(Math.max(minZoom, Number((zoom - step).toFixed(2))));
  };

  const handleZoomIn = () => {
    onZoomChange(Math.min(maxZoom, Number((zoom + step).toFixed(2))));
  };

  return (
    <div className="flex items-center gap-0.5 select-none">
      <button
        type="button"
        onClick={handleZoomOut}
        className="p-1 text-[var(--text-muted)] hover:text-[var(--text-highlight)] transition-colors rounded hover:bg-[var(--bg-surface-elevated)] cursor-pointer"
        title="Zoom out"
      >
        <ZoomOut className="w-3.5 h-3.5" />
      </button>
      <span className="px-1 font-mono text-[10px] text-[var(--text-main)] min-w-[36px] text-center">
        {Math.round(zoom * 100)}%
      </span>
      <button
        type="button"
        onClick={handleZoomIn}
        className="p-1 text-[var(--text-muted)] hover:text-[var(--text-highlight)] transition-colors rounded hover:bg-[var(--bg-surface-elevated)] cursor-pointer"
        title="Zoom in"
      >
        <ZoomIn className="w-3.5 h-3.5" />
      </button>
      {onFit && (
        <button
          type="button"
          onClick={onFit}
          className="p-1 text-[var(--text-muted)] hover:text-[var(--text-highlight)] transition-colors rounded hover:bg-[var(--bg-surface-elevated)] cursor-pointer"
          title="Fit to view"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      )}
      <button
        type="button"
        onClick={onReset}
        className="p-1 text-[var(--text-muted)] hover:text-[var(--text-highlight)] transition-colors rounded hover:bg-[var(--bg-surface-elevated)] border-l border-[var(--border-subtle)] ml-0.5 pl-1.5 cursor-pointer"
        title="Reset zoom & position"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
