import React from "react";
import { UploadCloud, FilePlus2, FileText } from "lucide-react";
import { Z_INDEX } from "../../../core/constants/zIndex";
import type { DropTargetZone } from "../hooks/useFileDrop";

interface FileDropOverlayProps {
  activeFileName?: string;
  dragTargetZone: DropTargetZone;
  onSelectZone: (zone: DropTargetZone) => void;
  onDropZone: (e: React.DragEvent, zone: DropTargetZone) => void;
}

export const FileDropOverlay: React.FC<FileDropOverlayProps> = ({
  activeFileName,
  dragTargetZone,
  onSelectZone,
  onDropZone,
}) => {
  return (
    <div
      style={{ zIndex: Z_INDEX.WORKSPACE_FLOATING }}
      className="absolute inset-0 bg-[var(--bg-app)]/90 backdrop-blur-xs p-4 flex flex-col gap-3 animate-fade-in select-none"
    >
      {/* Header banner */}
      <div className="flex items-center justify-center gap-2 py-1 text-xs text-[var(--text-muted)] shrink-0">
        <UploadCloud className="w-4 h-4 text-[var(--accent)] animate-bounce" />
        <span>Choose action by dropping into left or right zone:</span>
      </div>

      {/* 2 Zones (Left / Right) */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
        {/* Left Zone: Open as New Linked Tab(s) */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = "copy";
            onSelectZone("open");
          }}
          onDrop={(e) => onDropZone(e, "open")}
          className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed transition-all duration-200 cursor-pointer ${
            dragTargetZone === "open"
              ? "border-[var(--accent)] bg-[var(--accent)]/15 scale-[1.01] shadow-lg shadow-[var(--accent)]/10"
              : "border-[var(--border-color)] bg-[var(--bg-surface)]/60 hover:border-[var(--accent)]/50"
          }`}
        >
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-colors ${
              dragTargetZone === "open"
                ? "bg-[var(--accent)] text-[var(--bg-app)] shadow-md"
                : "bg-[var(--bg-surface)] text-[var(--accent)] border border-[var(--border-color)]"
            }`}
          >
            <FilePlus2 className="w-7 h-7" />
          </div>
          <h2 className="text-base md:text-lg font-bold text-[var(--text-highlight)]">
            Open as New Tab(s)
          </h2>
          <p className="text-xs text-[var(--text-muted)] text-center mt-1 max-w-xs">
            Creates linked document tab(s) with direct local file saving support
          </p>
          <span className="mt-3 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)]">
            Default / Linked Files
          </span>
        </div>

        {/* Right Zone: Append / Insert at Cursor */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = "copy";
            onSelectZone("append");
          }}
          onDrop={(e) => onDropZone(e, "append")}
          className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed transition-all duration-200 cursor-pointer ${
            dragTargetZone === "append"
              ? "border-sky-400 bg-sky-500/15 scale-[1.01] shadow-lg shadow-sky-500/10"
              : "border-[var(--border-color)] bg-[var(--bg-surface)]/60 hover:border-sky-400/50"
          }`}
        >
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-colors ${
              dragTargetZone === "append"
                ? "bg-sky-400 text-[var(--bg-app)] shadow-md"
                : "bg-[var(--bg-surface)] text-sky-400 border border-[var(--border-color)]"
            }`}
          >
            <FileText className="w-7 h-7" />
          </div>
          <h2 className="text-base md:text-lg font-bold text-[var(--text-highlight)]">
            Append to Current File
          </h2>
          <p className="text-xs text-[var(--text-muted)] text-center mt-1 max-w-xs">
            Inserts file text content at cursor position in{" "}
            <span className="text-[var(--text-main)] font-semibold">
              &quot;{activeFileName || "current file"}&quot;
            </span>
          </p>
          <span className="mt-3 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400">
            Insert at Cursor
          </span>
        </div>
      </div>
    </div>
  );
};
