import React, { useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pin, PinOff, X } from "lucide-react";
import type { FileTab, TabIconTheme } from "../../../core/types/file.types";
import { MdiIcon } from "../../../shared/components/MdiIcon";
import {
  getFileIconConfig,
  LOCK_ICON_PATH,
} from "../../../core/constants/fileTypeIcons";

export interface SortableTabItemProps {
  tab: FileTab;
  isActive: boolean;
  isVertical: boolean;
  tabIconTheme: TabIconTheme;
  onSelect: () => void;
  onClose: (tab: FileTab) => void;
  onTogglePin: (tabId: string) => void;
  onContextMenu: (e: React.MouseEvent, tab: FileTab) => void;
  onLongPress: (tab: FileTab, x: number, y: number) => void;
  className?: string;
}

export const SortableTabItem: React.FC<SortableTabItemProps> = ({
  tab,
  isActive,
  isVertical,
  tabIconTheme,
  onSelect,
  onClose,
  onTogglePin,
  onContextMenu,
  onLongPress,
  className = "",
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id });

  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasTriggeredLongPressRef = useRef(false);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const renderTabIcon = () => {
    const config = getFileIconConfig(
      tab.language,
      tab.previewType,
      tab.name,
      tabIconTheme,
    );
    const isLinkedOrSaved = Boolean(tab.fileHandle || tab.lastSavedAt);
    const iconColor = isLinkedOrSaved ? config.color : "var(--text-muted)";

    if (tab.isLocked) {
      return (
        <MdiIcon
          path={LOCK_ICON_PATH}
          size={14}
          color={iconColor}
          className="w-3.5 h-3.5 shrink-0"
        />
      );
    }

    return (
      <MdiIcon
        path={config.path}
        size={14}
        color={iconColor}
        className="w-3.5 h-3.5 shrink-0"
      />
    );
  };

  const clearTimer = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    if (e.button === 1 || e.button === 2) return;

    hasTriggeredLongPressRef.current = false;
    startPosRef.current = { x: e.clientX, y: e.clientY };

    clearTimer();
    holdTimerRef.current = setTimeout(() => {
      hasTriggeredLongPressRef.current = true;
      if ("vibrate" in navigator) {
        try {
          navigator.vibrate?.(40);
        } catch {
          // ignore vibration errors
        }
      }
      onLongPress(tab, e.clientX, e.clientY);
    }, 400);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!startPosRef.current) return;
    const dist = Math.hypot(
      e.clientX - startPosRef.current.x,
      e.clientY - startPosRef.current.y,
    );
    // If moved more than 6px, user is dragging or scrolling -> cancel context menu hold
    if (dist > 6) {
      clearTimer();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    clearTimer();
    startPosRef.current = null;
    if (hasTriggeredLongPressRef.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      data-tab-id={tab.id}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        clearTimer();
        startPosRef.current = null;
      }}
      onClick={(e) => {
        if (hasTriggeredLongPressRef.current) {
          hasTriggeredLongPressRef.current = false;
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        onSelect();
      }}
      onContextMenu={(e) => onContextMenu(e, tab)}
      className={`group relative px-2 flex items-center gap-1.5 transition-all cursor-pointer select-none ${className} ${
        isDragging
          ? "opacity-30 scale-95 ring-2 ring-dashed ring-[var(--accent)] bg-[var(--bg-tab-hover)]"
          : ""
      } ${
        isVertical
          ? `h-[34px] w-full rounded border-l-2 ${
              isActive
                ? "bg-[var(--bg-tab-active)] text-[var(--text-highlight)] border-[var(--accent)] font-medium shadow-2xs"
                : "bg-[var(--bg-tab-inactive)]/50 text-[var(--text-muted)] hover:bg-[var(--bg-tab-hover)] border-transparent"
            }`
          : `h-[28px] min-w-[140px] max-w-[220px] flex-1 md:flex-initial rounded-t border-t-2 ${
              isActive
                ? "bg-[var(--bg-tab-active)] text-[var(--text-highlight)] border-[var(--accent)] font-medium shadow-2xs"
                : "bg-[var(--bg-tab-inactive)] text-[var(--text-muted)] hover:bg-[var(--bg-tab-hover)] border-transparent"
            }`
      }`}
    >
      {/* File Icon as Drag Handle */}
      <span
        {...listeners}
        className="shrink-0 flex items-center justify-center p-0.5 -m-0.5 rounded hover:bg-[var(--bg-surface-elevated)] cursor-grab active:cursor-grabbing touch-none"
        title="Drag to reorder"
        onClick={(e) => e.stopPropagation()}
      >
        {renderTabIcon()}
      </span>

      {/* File Name */}
      <span
        className="truncate flex-1 font-mono text-xs leading-none"
        title={`${tab.isModified ? "*" : ""}${tab.name}`}
      >
        {tab.isModified && (
          <span className="text-[var(--accent-red)] font-bold mr-0.5">*</span>
        )}
        {tab.name}
      </span>

      {/* Pin Action */}
      {tab.isPinned ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(tab.id);
          }}
          className="w-4 h-4 rounded flex items-center justify-center text-[var(--accent)] hover:text-[var(--text-highlight)] shrink-0 transition-colors"
          title="Unpin tab"
        >
          <Pin className="w-3 h-3 fill-current" />
        </button>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(tab.id);
          }}
          className="w-4 h-4 rounded flex items-center justify-center text-[var(--text-subtle)] hover:text-[var(--accent)] shrink-0 transition-opacity opacity-100 md:opacity-0 md:group-hover:opacity-100 md:pointer-events-none md:group-hover:pointer-events-auto"
          title="Pin tab"
        >
          <PinOff className="w-3 h-3" />
        </button>
      )}

      {/* Close Button */}
      {!tab.isPinned && (
        <div className="flex items-center shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose(tab);
            }}
            className="w-4 h-4 rounded flex items-center justify-center text-[var(--text-subtle)] hover:text-white hover:bg-[var(--accent-red)] transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 md:pointer-events-none md:group-hover:pointer-events-auto"
            title="Close tab (Alt+W)"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
