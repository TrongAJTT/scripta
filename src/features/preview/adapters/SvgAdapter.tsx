import React, { useState, useEffect } from "react";
import type { PreviewAdapterProps } from "./types";
import DOMPurify from "dompurify";
import { Code } from "lucide-react";
import { PreviewZoomControls } from "../components/PreviewZoomControls";
import { EmptyState } from "../../../shared/components/EmptyState";

export const SvgAdapter: React.FC<PreviewAdapterProps> = ({
  tab,
  setHeaderActions,
}) => {
  const [zoom, setZoom] = useState(1);

  const rawContent = tab.content || "";
  const cleanSvg = DOMPurify.sanitize(rawContent, {
    USE_PROFILES: { svg: true, svgFilters: true },
  });

  // Inject zoom controls into unified PreviewPanel header
  useEffect(() => {
    if (!rawContent.trim()) {
      setHeaderActions?.(null);
      return;
    }

    setHeaderActions?.(
      <PreviewZoomControls
        zoom={zoom}
        onZoomChange={setZoom}
        onReset={() => setZoom(1)}
      />,
    );

    return () => setHeaderActions?.(null);
  }, [setHeaderActions, zoom, rawContent]);

  if (!rawContent.trim()) {
    return (
      <EmptyState
        icon={<Code className="w-10 h-10 stroke-[1.25]" />}
        title="Empty SVG Document"
        description="Enter valid SVG markup in the editor to preview vector graphics."
      />
    );
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden relative bg-[var(--bg-preview)]">
      <div className="flex-1 w-full h-full overflow-auto flex items-center justify-center p-8 bg-canvas-dots">
        <div
          className="transition-transform duration-100 flex items-center justify-center"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "center center",
          }}
          dangerouslySetInnerHTML={{ __html: cleanSvg }}
        />
      </div>
    </div>
  );
};
