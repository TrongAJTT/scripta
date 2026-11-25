import React, { useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { TabGroup } from "../../../core/types/file.types";
import { TAB_GROUP_COLOR_MAP } from "../../../core/constants/tabGroups";

export interface TabGroupChipProps {
  group: TabGroup;
  tabCount: number;
  isVertical: boolean;
  onToggleCollapse: (groupId: string) => void;
  onContextMenu: (e: React.MouseEvent, group: TabGroup) => void;
  onLongPress: (group: TabGroup, x: number, y: number) => void;
}

export const TabGroupChip: React.FC<TabGroupChipProps> = ({
  group,
  tabCount,
  isVertical,
  onToggleCollapse,
  onContextMenu,
  onLongPress,
}) => {
  const colorVar = TAB_GROUP_COLOR_MAP[group.color] || "var(--accent)";
  const { setNodeRef, isOver } = useDroppable({
    id: `group-header:${group.id}`,
  });
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);

  const clearTimer = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => {
        if (longPressTriggeredRef.current) {
          longPressTriggeredRef.current = false;
          return;
        }
        onToggleCollapse(group.id);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        clearTimer();
        onContextMenu(e, group);
      }}
      onPointerDown={(e) => {
        if (e.button !== 0 && e.pointerType === "mouse") return;
        clearTimer();
        longPressTriggeredRef.current = false;
        const x = e.clientX;
        const y = e.clientY;
        holdTimerRef.current = setTimeout(() => {
          longPressTriggeredRef.current = true;
          onLongPress(group, x, y);
        }, 400);
      }}
      onPointerUp={clearTimer}
      onPointerLeave={clearTimer}
      onPointerCancel={clearTimer}
      style={{ borderColor: colorVar }}
      className={`group flex items-center gap-1.5 rounded border text-[11px] font-semibold transition-colors shrink-0 cursor-pointer select-none ${
        isOver ? "ring-2 ring-[var(--accent)]" : ""
      } ${
        isVertical
          ? "w-full px-2 py-1 mt-1 bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-tab-hover)] text-[var(--text-main)]"
          : "h-[24px] px-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-tab-hover)] text-[var(--text-main)]"
      }`}
      title={`${group.name} (${tabCount} ${tabCount === 1 ? "tab" : "tabs"}) • Click to ${group.collapsed ? "expand" : "collapse"}, Right-click for options`}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: colorVar }}
      />
      <span className="truncate max-w-[100px]">{group.name}</span>
      {group.collapsed && (
        <span className="text-[10px] font-mono text-[var(--text-muted)]">
          ({tabCount})
        </span>
      )}
      {group.collapsed ? (
        <ChevronRight className="w-3 h-3 text-[var(--text-muted)] shrink-0 ml-auto" />
      ) : (
        <ChevronDown className="w-3 h-3 text-[var(--text-muted)] shrink-0 ml-auto" />
      )}
    </button>
  );
};
