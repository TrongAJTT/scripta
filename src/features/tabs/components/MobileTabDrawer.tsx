import React, { useEffect } from "react";
import { PanelLeft, X } from "lucide-react";
import { useEditorStore } from "../store";
import { Z_INDEX } from "../../../core/constants/zIndex";
import { TabBar } from "./TabBar";

interface MobileTabDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileTabDrawer: React.FC<MobileTabDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const tabsCount = useEditorStore((s) => s.tabs.length);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex select-none md:hidden"
      style={{ zIndex: Z_INDEX.MODAL_BASE }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative z-10 w-72 max-w-[85vw] h-full bg-[var(--bg-toolbar)] border-r border-[var(--border-color)] flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-3.5 h-12 border-b border-[var(--border-color)] bg-[var(--bg-surface)] shrink-0">
          <div className="flex items-center gap-2">
            <PanelLeft className="w-4 h-4 text-[var(--accent)]" />
            <span className="font-semibold text-sm text-[var(--text-highlight)]">
              Open Tabs
            </span>
            <span className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
              {tabsCount}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-highlight)] hover:bg-[var(--bg-tab-hover)] transition-colors cursor-pointer"
            title="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Reusing TabBar with vertical orientation */}
        <div className="flex-1 overflow-hidden">
          <TabBar orientation="vertical" onTabClick={onClose} />
        </div>
      </div>
    </div>
  );
};
