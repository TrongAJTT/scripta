import React, { useState, useRef, useCallback, useEffect } from "react";
import type { PreviewMode } from "../../core/types/file.types";

interface SplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
  previewMode: PreviewMode;
  showPreview: boolean;
  initialRatio?: number;
  onRatioChange?: (ratio: number) => void;
}

export const SplitPane: React.FC<SplitPaneProps> = ({
  left,
  right,
  previewMode,
  showPreview,
  initialRatio = 0.5,
  onRatioChange,
}) => {
  const [ratio, setRatio] = useState<number>(initialRatio);
  const isDraggingRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newRatio = (e.clientX - rect.left) / rect.width;
      const clamped = Math.max(0.2, Math.min(0.8, newRatio));
      setRatio(clamped);
      onRatioChange?.(clamped);
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [onRatioChange]);

  // Mobile screen detection (< 768px)
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Điều kiện hiển thị pane theo previewMode
  const shouldRenderPreview = showPreview && previewMode !== "editor-only";
  const isPreviewOnly = previewMode === "preview-only";

  if (isPreviewOnly) {
    return <div className="h-full w-full overflow-hidden">{right}</div>;
  }

  if (!shouldRenderPreview) {
    return <div className="h-full w-full overflow-hidden">{left}</div>;
  }

  // On Mobile: Split view is cramped. Show Editor cleanly on mobile when split mode is active.
  if (isMobile) {
    return (
      <div className="h-full w-full overflow-hidden">
        {left}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full flex overflow-hidden relative"
    >
      {/* Left Pane (Editor) */}
      <div
        style={{ width: `${ratio * 100}%` }}
        className="h-full overflow-hidden shrink-0"
      >
        {left}
      </div>

      {/* Resizer Handle */}
      <div
        onMouseDown={handleMouseDown}
        className="w-2 relative shrink-0 bg-[var(--border-subtle)] hover:bg-[var(--accent-blue)] active:bg-[var(--accent)] cursor-col-resize flex items-center justify-center transition-colors group z-20"
        title="Drag to resize split view"
      >
        <div className="w-0.5 h-6 rounded bg-[var(--text-subtle)] group-hover:bg-white group-active:bg-white transition-colors" />
      </div>

      {/* Right Pane (Preview) */}
      <div
        style={{ width: `${(1 - ratio) * 100}%` }}
        className="h-full overflow-hidden flex-1"
      >
        {right}
      </div>
    </div>
  );
};
