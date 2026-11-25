import React, { useState, useEffect } from "react";
import type { PreviewAdapterProps } from "./types";
import { Image as ImageIcon } from "lucide-react";
import { PreviewZoomControls } from "../components/PreviewZoomControls";
import { EmptyState } from "../../../shared/components/EmptyState";

export const ImageAdapter: React.FC<PreviewAdapterProps> = ({
  tab,
  setHeaderActions,
}) => {
  const [zoom, setZoom] = useState(1);

  // Inject zoom controls into unified PreviewPanel header
  useEffect(() => {
    if (!tab.imageDataUrl) {
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
  }, [setHeaderActions, zoom, tab.imageDataUrl]);

  if (!tab.imageDataUrl) {
    return (
      <EmptyState
        icon={<ImageIcon className="w-10 h-10 stroke-[1.25]" />}
        title="No Image Data Loaded"
        description="Open or drop an image file (.png, .jpg, .webp, .gif) to view it here."
      />
    );
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden relative bg-[var(--bg-preview)]">
      <div className="flex-1 w-full h-full overflow-auto flex items-center justify-center p-8">
        <div
          className="transition-transform duration-100 ease-out rounded overflow-hidden border border-[var(--border-color)] bg-[var(--bg-surface)] max-w-full max-h-full flex items-center justify-center"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "center center",
          }}
        >
          <img
            src={tab.imageDataUrl}
            alt={tab.name}
            className="max-h-[75vh] max-w-[80vw] object-contain select-none"
          />
        </div>
      </div>
    </div>
  );
};
