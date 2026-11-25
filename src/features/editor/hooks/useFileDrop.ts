import type React from "react";
import { useEffect, useRef, useState } from "react";
import type { DroppedFileItem } from "../../../core/types/file.types";
import { useEditorStore } from "../../tabs/store";

export type DropTargetZone = "open" | "append";

interface DataTransferItemWithHandle extends DataTransferItem {
  getAsFileSystemHandle?: () => Promise<FileSystemFileHandle | null>;
}

export function useFileDrop(onInsertText: (text: string) => void) {
  const openDroppedFiles = useEditorStore((s) => s.openDroppedFiles);
  const appendDroppedFilesToActiveTab = useEditorStore(
    (s) => s.appendDroppedFilesToActiveTab,
  );

  const [isDragOver, setIsDragOver] = useState(false);
  const [dragTargetZone, setDragTargetZone] = useState<DropTargetZone>("open");
  const dragCounterRef = useRef(0);

  // Window-level safety reset for drag-and-drop
  useEffect(() => {
    const handleWindowDragLeave = (e: DragEvent) => {
      if (e.relatedTarget === null || !e.relatedTarget) {
        dragCounterRef.current = 0;
        setIsDragOver(false);
      }
    };

    const handleWindowDropOrEnd = () => {
      dragCounterRef.current = 0;
      setIsDragOver(false);
    };

    window.addEventListener("dragleave", handleWindowDragLeave);
    window.addEventListener("dragend", handleWindowDropOrEnd);
    window.addEventListener("drop", handleWindowDropOrEnd);
    return () => {
      window.removeEventListener("dragleave", handleWindowDragLeave);
      window.removeEventListener("dragend", handleWindowDropOrEnd);
      window.removeEventListener("drop", handleWindowDropOrEnd);
    };
  }, []);

  const handleDragEnter = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    setIsDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  };

  const handleDrop = async (
    e: React.DragEvent,
    forcedZone?: DropTargetZone,
  ) => {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);

    const zone = forcedZone || dragTargetZone;
    const dt = e.dataTransfer;
    const droppedItems: DroppedFileItem[] = [];

    if (dt.items && dt.items.length > 0) {
      for (let i = 0; i < dt.items.length; i++) {
        const item = dt.items[i] as DataTransferItemWithHandle;
        if (item.kind !== "file") continue;
        const file = item.getAsFile();
        if (!file) continue;

        let handlePromise: Promise<FileSystemFileHandle | null> | undefined;
        if (typeof item.getAsFileSystemHandle === "function") {
          try {
            handlePromise = item.getAsFileSystemHandle().catch(() => null);
          } catch {
            handlePromise = undefined;
          }
        }
        droppedItems.push({ file, handlePromise });
      }
    } else if (dt.files && dt.files.length > 0) {
      for (let i = 0; i < dt.files.length; i++) {
        const file = dt.files[i];
        if (file) {
          droppedItems.push({ file });
        }
      }
    }

    if (droppedItems.length === 0) return;

    if (zone === "append") {
      await appendDroppedFilesToActiveTab(droppedItems, onInsertText);
    } else {
      await openDroppedFiles(droppedItems);
    }
  };

  return {
    isDragOver,
    dragTargetZone,
    setDragTargetZone,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
