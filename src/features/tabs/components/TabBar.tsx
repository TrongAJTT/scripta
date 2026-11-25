import React, { useState, useRef } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, PanelLeft } from "lucide-react";
import { useEditorStore } from "../store";
import type { FileTab, TabGroup } from "../../../core/types/file.types";
import { TAB_GROUP_COLOR_MAP } from "../../../core/constants/tabGroups";
import { dialog } from "../../../shared/dialog/dialogStore";
import { TabContextMenu } from "./TabContextMenu";
import { TabGroupChip } from "./TabGroupChip";
import { TabGroupContextMenu } from "./TabGroupContextMenu";
import { SortableTabItem } from "./SortableTabItem";
import { ContextMenu } from "../../../shared/components/ContextMenu";
import { SampleFilesMenuItems } from "../../editor/components/SampleFilesMenuItems";
import { MdiIcon } from "../../../shared/components/MdiIcon";
import {
  getFileIconConfig,
  LOCK_ICON_PATH,
} from "../../../core/constants/fileTypeIcons";

export interface TabBarProps {
  orientation?: "horizontal" | "vertical";
  onOpenDrawer?: () => void;
  onTabClick?: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  orientation = "horizontal",
  onOpenDrawer,
  onTabClick,
}) => {
  const tabs = useEditorStore((s) => s.tabs);
  const tabGroups = useEditorStore((s) => s.tabGroups);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const recentTabIds = useEditorStore((s) => s.recentTabIds);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);
  const closeTab = useEditorStore((s) => s.closeTab);
  const togglePinTab = useEditorStore((s) => s.togglePinTab);
  const toggleTabGroupCollapse = useEditorStore(
    (s) => s.toggleTabGroupCollapse,
  );
  const assignTabToGroup = useEditorStore((s) => s.assignTabToGroup);
  const createTab = useEditorStore((s) => s.createTab);
  const reorderTabs = useEditorStore((s) => s.reorderTabs);
  const tabIconTheme = useEditorStore(
    (s) => s.settings.tabIconTheme || "vibrant",
  );
  const tabBarPosition = useEditorStore((s) => s.settings.tabBarPosition);

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{
    tab: FileTab;
    x: number;
    y: number;
  } | null>(null);

  // Group Context Menu state
  const [groupContextMenu, setGroupContextMenu] = useState<{
    group: TabGroup;
    x: number;
    y: number;
  } | null>(null);

  // Sample Files menu state for [+] button (long-press or right-click)
  const [sampleMenuPos, setSampleMenuPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const newTabLongPressTimerRef = useRef<number | null>(null);
  const newTabLongPressTriggeredRef = useRef(false);

  const clearNewTabLongPress = () => {
    if (newTabLongPressTimerRef.current !== null) {
      window.clearTimeout(newTabLongPressTimerRef.current);
      newTabLongPressTimerRef.current = null;
    }
  };

  // Active dragged tab for DragOverlay visual preview
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Sensor configuration: requires 8px movement before dragging begins
  // This allows normal clicks and short pointer taps to pass through reliably.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const isVertical = orientation === "vertical";
  const isVerticalSetting =
    tabBarPosition === "left" || tabBarPosition === "right";
  // Only limit to 2 tabs on mobile horizontal bar if Tab Bar Position is vertical (left/right)
  const shouldLimitMobileTabs = !isVertical && isVerticalSetting;

  // Calculate 2 most recent tabs for compact mobile view
  const recentTwoIds = (recentTabIds || [])
    .filter((id) => tabs.some((t) => t.id === id))
    .slice(0, 2);
  const mobileTabSet = new Set(
    recentTwoIds.length > 0 ? recentTwoIds : tabs.slice(0, 2).map((t) => t.id),
  );
  const pinnedTabs = tabs.filter((t) => t.isPinned);
  const unpinnedTabs = tabs.filter((t) => !t.isPinned);

  const groupMap = new Map(tabGroups.map((g) => [g.id, g]));
  const renderedGroupIds = new Set<string>();
  const unpinnedBlocks: Array<
    | { type: "tab"; tab: FileTab }
    | { type: "group"; group: TabGroup; tabs: FileTab[] }
  > = [];

  for (const tab of unpinnedTabs) {
    if (tab.groupId) {
      const group = groupMap.get(tab.groupId);
      if (group) {
        if (!renderedGroupIds.has(group.id)) {
          renderedGroupIds.add(group.id);
          unpinnedBlocks.push({
            type: "group",
            group,
            tabs: unpinnedTabs.filter((t) => t.groupId === group.id),
          });
        }
        continue;
      }
    }
    unpinnedBlocks.push({ type: "tab", tab });
  }

  const visibleUnpinnedTabIds = unpinnedBlocks.flatMap((block) => {
    if (block.type === "tab") return [block.tab.id];
    const visibleTabs = block.group.collapsed
      ? block.tabs.filter((t) => t.id === activeTabId)
      : block.tabs;
    return visibleTabs.map((t) => t.id);
  });

  const handleCloseTab = async (tab: FileTab) => {
    if (tab.isModified) {
      const confirmed = await dialog.confirm({
        title: "Unsaved Changes",
        message: `File "${tab.name}" has unsaved changes.\nAre you sure you want to close it?`,
        confirmText: "Close Without Saving",
        cancelText: "Cancel",
        variant: "warning",
      });
      if (!confirmed) return;
    }
    closeTab(tab.id);
  };

  const handleContextMenu = (e: React.MouseEvent, tab: FileTab) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ tab, x: e.clientX, y: e.clientY });
  };

  const handleLongPress = (tab: FileTab, x: number, y: number) => {
    setContextMenu({ tab, x, y });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over || active.id === over.id) return;

    const overId = String(over.id);
    if (overId.startsWith("group-header:")) {
      const targetGroupId = overId.slice("group-header:".length);
      const activeTab = tabs.find((t) => t.id === active.id);
      if (activeTab && !activeTab.isPinned) {
        assignTabToGroup(activeTab.id, targetGroupId);
      }
      return;
    }

    const fromIndex = tabs.findIndex((t) => t.id === active.id);
    const toIndex = tabs.findIndex((t) => t.id === over.id);
    if (fromIndex !== -1 && toIndex !== -1) {
      reorderTabs(fromIndex, toIndex);
    }
  };

  const activeDragTab = activeDragId
    ? tabs.find((t) => t.id === activeDragId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveDragId(null)}
    >
      <div
        onDoubleClick={(e) => {
          if (e.target === e.currentTarget) createTab();
        }}
        className={
          isVertical
            ? "w-full h-full bg-[var(--bg-toolbar)] flex flex-col border-[var(--border-color)] overflow-y-auto overflow-x-hidden select-none p-1.5 gap-1 shrink-0"
            : "h-8 bg-[var(--bg-toolbar)] flex items-center border-b border-[var(--border-color)] overflow-x-auto overflow-y-hidden select-none px-1.5 gap-1 shrink-0"
        }
      >
        {/* Mobile Drawer trigger button on horizontal tab bar - ONLY when Tab Bar Position is vertical */}
        {!isVertical && isVerticalSetting && onOpenDrawer && (
          <button
            onClick={onOpenDrawer}
            className="flex md:hidden items-center gap-1.5 px-2.5 h-[26px] rounded bg-[var(--bg-surface)] hover:bg-[var(--bg-tab-hover)] border border-[var(--border-color)] text-xs text-[var(--text-main)] hover:text-[var(--accent)] font-medium shrink-0 transition-colors"
            title="Open Tabs Drawer"
          >
            <PanelLeft className="w-4 h-4 text-[var(--accent)]" />
            <span className="font-mono text-xs">Tabs ({tabs.length})</span>
          </button>
        )}

        {/* Pinned Tabs Group */}
        {pinnedTabs.length > 0 && (
          <SortableContext
            items={pinnedTabs.map((t) => t.id)}
            strategy={
              isVertical
                ? verticalListSortingStrategy
                : horizontalListSortingStrategy
            }
          >
            {pinnedTabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              const isVisibleOnMobile =
                !shouldLimitMobileTabs || mobileTabSet.has(tab.id);

              return (
                <SortableTabItem
                  key={tab.id}
                  tab={tab}
                  isActive={isActive}
                  isVertical={isVertical}
                  tabIconTheme={tabIconTheme}
                  onSelect={() => {
                    setActiveTab(tab.id);
                    onTabClick?.();
                  }}
                  onClose={handleCloseTab}
                  onTogglePin={togglePinTab}
                  onContextMenu={handleContextMenu}
                  onLongPress={handleLongPress}
                  className={
                    shouldLimitMobileTabs && !isVisibleOnMobile
                      ? "hidden md:flex"
                      : "flex"
                  }
                />
              );
            })}
          </SortableContext>
        )}

        {/* Visual separator between pinned tabs and unpinned tabs */}
        {pinnedTabs.length > 0 && unpinnedTabs.length > 0 && (
          <div
            className={
              isVertical
                ? "w-full my-0.5 border-b border-[var(--border-color)] opacity-70 shrink-0"
                : "h-5 my-auto border-r border-[var(--border-color)] opacity-70 mx-1 shrink-0"
            }
          />
        )}

        {/* Unpinned Tabs & Groups */}
        <SortableContext
          items={visibleUnpinnedTabIds}
          strategy={
            isVertical
              ? verticalListSortingStrategy
              : horizontalListSortingStrategy
          }
        >
          {unpinnedBlocks.map((block) => {
            if (block.type === "tab") {
              const tab = block.tab;
              const isActive = tab.id === activeTabId;
              const isVisibleOnMobile =
                !shouldLimitMobileTabs || mobileTabSet.has(tab.id);

              return (
                <SortableTabItem
                  key={tab.id}
                  tab={tab}
                  isActive={isActive}
                  isVertical={isVertical}
                  tabIconTheme={tabIconTheme}
                  onSelect={() => {
                    setActiveTab(tab.id);
                    onTabClick?.();
                  }}
                  onClose={handleCloseTab}
                  onTogglePin={togglePinTab}
                  onContextMenu={handleContextMenu}
                  onLongPress={handleLongPress}
                  className={
                    shouldLimitMobileTabs && !isVisibleOnMobile
                      ? "hidden md:flex"
                      : "flex"
                  }
                />
              );
            }

            const { group, tabs: groupTabs } = block;
            const visibleTabs = group.collapsed
              ? groupTabs.filter((t) => t.id === activeTabId)
              : groupTabs;

            return (
              <React.Fragment key={`group-${group.id}`}>
                <TabGroupChip
                  group={group}
                  tabCount={groupTabs.length}
                  isVertical={isVertical}
                  onToggleCollapse={toggleTabGroupCollapse}
                  onContextMenu={(e, g) =>
                    setGroupContextMenu({
                      group: g,
                      x: e.clientX,
                      y: e.clientY,
                    })
                  }
                  onLongPress={(g, x, y) =>
                    setGroupContextMenu({ group: g, x, y })
                  }
                />
                {visibleTabs.map((tab) => {
                  const isActive = tab.id === activeTabId;
                  const isVisibleOnMobile =
                    !shouldLimitMobileTabs || mobileTabSet.has(tab.id);

                  return (
                    <SortableTabItem
                      key={tab.id}
                      tab={tab}
                      isActive={isActive}
                      isVertical={isVertical}
                      tabIconTheme={tabIconTheme}
                      groupColor={TAB_GROUP_COLOR_MAP[group.color]}
                      onSelect={() => {
                        setActiveTab(tab.id);
                        onTabClick?.();
                      }}
                      onClose={handleCloseTab}
                      onTogglePin={togglePinTab}
                      onContextMenu={handleContextMenu}
                      onLongPress={handleLongPress}
                      className={
                        shouldLimitMobileTabs && !isVisibleOnMobile
                          ? "hidden md:flex"
                          : "flex"
                      }
                    />
                  );
                })}
              </React.Fragment>
            );
          })}
        </SortableContext>

        {/* New Tab Button - Highlighted with theme accent and smooth hover */}
        <button
          onClick={() => {
            if (newTabLongPressTriggeredRef.current) {
              newTabLongPressTriggeredRef.current = false;
              return;
            }
            createTab();
            onTabClick?.();
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            clearNewTabLongPress();
            setSampleMenuPos({ x: e.clientX, y: e.clientY });
          }}
          onPointerDown={(e) => {
            if (e.button !== 0 && e.pointerType === "mouse") return;
            clearNewTabLongPress();
            newTabLongPressTriggeredRef.current = false;
            const rect = e.currentTarget.getBoundingClientRect();
            const menuX = e.clientX || rect.left;
            const menuY = rect.bottom + 4;
            newTabLongPressTimerRef.current = window.setTimeout(() => {
              newTabLongPressTriggeredRef.current = true;
              setSampleMenuPos({ x: menuX, y: menuY });
            }, 400);
          }}
          onPointerUp={clearNewTabLongPress}
          onPointerLeave={clearNewTabLongPress}
          onPointerCancel={clearNewTabLongPress}
          className={`flex items-center justify-center rounded transition-all shrink-0 cursor-pointer ${
            isVertical
              ? "w-full py-1.5 px-2.5 bg-[var(--bg-surface-elevated)] hover:bg-[var(--accent)]/15 border border-[var(--border-color)] hover:border-[var(--accent)] text-[var(--text-main)] hover:text-[var(--accent)] text-xs font-medium gap-1.5 mt-1 shadow-2xs group"
              : "w-6 h-6 ml-0.5 bg-[var(--bg-surface)] hover:bg-[var(--accent)]/15 hover:border-[var(--accent)]/50 border border-transparent text-[var(--text-muted)] hover:text-[var(--accent)] shadow-2xs"
          }`}
          title="New Tab (Alt+N) • Hold or Right-Click for Sample Files"
        >
          <Plus className="w-3.5 h-3.5 text-[var(--accent)] group-hover:scale-110 transition-transform" />
          {isVertical && <span>New File</span>}
        </button>

        {/* Drag Overlay for smooth visual feedback */}
        <DragOverlay>
          {activeDragTab ? (
            <div
              className={`px-2 flex items-center gap-1.5 rounded shadow-xl border border-[var(--accent)] bg-[var(--bg-tab-active)] opacity-90 cursor-grabbing pointer-events-none ${
                isVertical
                  ? "h-[34px] w-56"
                  : "h-[28px] min-w-[110px] max-w-[220px]"
              }`}
            >
              {(() => {
                const config = getFileIconConfig(
                  activeDragTab.language,
                  activeDragTab.previewType,
                  activeDragTab.name,
                  tabIconTheme,
                );
                return (
                  <MdiIcon
                    path={activeDragTab.isLocked ? LOCK_ICON_PATH : config.path}
                    size={16}
                    color={config.color}
                    className="w-4 h-4 shrink-0"
                  />
                );
              })()}
              <span className="truncate font-mono text-[13px] text-[var(--text-highlight)] font-medium">
                {activeDragTab.isModified ? "*" : ""}
                {activeDragTab.name}
              </span>
            </div>
          ) : null}
        </DragOverlay>

        {/* Tab Context Menu */}
        {contextMenu && (
          <TabContextMenu
            tab={contextMenu.tab}
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
          />
        )}

        {/* Tab Group Context Menu */}
        {groupContextMenu && (
          <TabGroupContextMenu
            group={groupContextMenu.group}
            x={groupContextMenu.x}
            y={groupContextMenu.y}
            onClose={() => setGroupContextMenu(null)}
          />
        )}

        {/* New Tab Sample Files Menu */}
        {sampleMenuPos && (
          <ContextMenu
            x={sampleMenuPos.x}
            y={sampleMenuPos.y}
            onClose={() => setSampleMenuPos(null)}
          >
            <SampleFilesMenuItems onSelectSample={() => onTabClick?.()} />
          </ContextMenu>
        )}
      </div>
    </DndContext>
  );
};
