import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import type { CommandId } from "../../core/commands/types";
import { KeybindingHint } from "../../features/settings/components/KeybindingHint";
import { Z_INDEX } from "../../core/constants/zIndex";

// ---------------------------------------------------------------------------
import {
  DropdownContext,
  useDropdown,
  type DropdownContextValue,
} from "./dropdownContext";

export type { DropdownContextValue };

/**
 * Props for the root DropdownMenu component.
 */
export interface DropdownMenuProps {
  /** Menu items, submenus, and separators rendered inside the dropdown. */
  children: ReactNode;
  /** Trigger element (button, icon, etc.) that opens/toggles the menu on click. */
  trigger: ReactNode;
  /** Alignment of the dropdown popup relative to the trigger element. Defaults to 'left'. */
  align?: "left" | "right";
  /** When true, items without an icon render an empty spacer matching the icon width for neat vertical alignment. */
  alignGutter?: boolean;
  /** Custom CSS classes passed to the dropdown container. */
  className?: string;
  /**
   * When true, on mobile devices (<768px), the menu renders as a top-centered modal dialog
   * with a backdrop overlay instead of an anchored popup. Ideal for primary menubar items.
   */
  topDialogOnMobile?: boolean;
}

/**
 * Props for standard menu items inside DropdownMenu or ContextMenu.
 */
export interface DropdownMenuItemProps {
  /** Primary label displayed for the item. Can be a string or a custom ReactNode. */
  label: ReactNode;
  /** Optional icon displayed before the label (recommended 14px-16px). */
  icon?: ReactNode;
  /** Optional keyboard shortcut string (e.g. "Alt+W", "Ctrl+S") displayed on the right edge. */
  shortcut?: string;
  /** Optional registered CommandId to automatically lookup and display its active keybinding. */
  commandId?: CommandId;
  /** Optional checkbox state: true shows a checkmark indicator, false reserves space or omits. */
  checked?: boolean;
  /** Whether the item is disabled. Disabled items are non-interactive with reduced opacity. */
  disabled?: boolean;
  /** Whether the item triggers a destructive action (styles text in red accent). */
  danger?: boolean;
  /** Optional native tooltip text on hover. */
  title?: string;
  /** Callback fired when the item is clicked/selected. Also automatically closes the parent menu. */
  onSelect?: () => void;
  /** Custom CSS class names for styling overrides. */
  className?: string;
}

/**
 * Props for nested submenus inside DropdownMenu or ContextMenu.
 *
 * Automatically adapts based on device / screen width:
 * - **Desktop**: Renders a floating flyout on hover. Automatically measures viewport boundaries
 *   via `getBoundingClientRect()` to flip horizontally (`flipLeft`) if overflowing the right edge
 *   and vertically (`flipTop`) if overflowing the bottom edge.
 * - **Mobile (<768px)**: Renders an inline collapsible accordion panel on tap to avoid safe-area clipping.
 */
export interface DropdownMenuSubProps {
  /** Label for the submenu trigger item. */
  label: ReactNode;
  /** Icon displayed next to the submenu trigger label. */
  icon?: ReactNode;
  /** Propagates vertical gutter alignment to nested child items. */
  alignGutter?: boolean;
  /** Whether the submenu trigger is disabled. */
  disabled?: boolean;
  /** Child menu items or nested submenus rendered inside this submenu. */
  children: ReactNode;
  /** Custom CSS class names. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
  label,
  icon,
  shortcut,
  commandId,
  checked,
  disabled = false,
  danger = false,
  title,
  onSelect,
  className = "",
}) => {
  const { close, alignGutter } = useDropdown();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onSelect?.();
    close();
  };

  return (
    <button
      role="menuitem"
      disabled={disabled}
      title={title}
      onClick={handleClick}
      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors select-none ${
        disabled
          ? "opacity-40 cursor-not-allowed text-[var(--text-muted)]"
          : danger
            ? "text-red-500 hover:bg-red-500/10 cursor-pointer"
            : "text-[var(--text-main)] hover:bg-[var(--bg-tab-hover)] hover:text-[var(--text-highlight)] cursor-pointer"
      } ${className}`}
    >
      <div className="flex items-center gap-2 min-w-0 pr-2 truncate">
        {checked !== undefined ? (
          <span className="w-4 h-4 flex items-center justify-center font-bold text-[var(--accent)] shrink-0">
            {checked ? "✓" : ""}
          </span>
        ) : icon ? (
          <span className="w-4 h-4 flex items-center justify-center shrink-0">
            {icon}
          </span>
        ) : alignGutter ? (
          <span className="w-4 h-4 shrink-0" />
        ) : null}
        <span className="truncate">{label}</span>
      </div>

      <div className="shrink-0 text-[10px] text-[var(--text-muted)] font-mono">
        {commandId ? (
          <KeybindingHint commandId={commandId} />
        ) : (
          shortcut && <span>{shortcut}</span>
        )}
      </div>
    </button>
  );
};

export const DropdownMenuSub: React.FC<DropdownMenuSubProps> = ({
  label,
  icon,
  alignGutter = false,
  disabled = false,
  children,
  className = "",
}) => {
  const parentCtx = useDropdown();
  const { isMobile } = parentCtx;
  const [isOpen, setIsOpen] = useState(false);
  const [flipLeft, setFlipLeft] = useState(false);
  const [flipTop, setFlipTop] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const subMenuRef = useRef<HTMLDivElement>(null);

  // Auto-flip if overflowing viewport edge on desktop
  useEffect(() => {
    if (isOpen && !isMobile && subMenuRef.current) {
      const rect = subMenuRef.current.getBoundingClientRect();
      if (rect.right > window.innerWidth - 10) {
        setFlipLeft(true);
      } else {
        setFlipLeft(false);
      }

      if (rect.bottom > window.innerHeight - 10) {
        setFlipTop(true);
      } else {
        setFlipTop(false);
      }
    }
  }, [isOpen, isMobile]);

  if (isMobile) {
    // Accordion Mode for mobile: expands inline to prevent safe area / clipping issues
    return (
      <DropdownContext.Provider value={{ ...parentCtx, alignGutter }}>
        <div className=" my-0.5">
          <button
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) setIsOpen((prev) => !prev);
            }}
            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors select-none ${
              disabled
                ? "opacity-40 cursor-not-allowed"
                : "text-[var(--text-main)] hover:bg-[var(--bg-tab-hover)]"
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              {icon ? (
                <span className="w-4 h-4 flex items-center justify-center shrink-0">
                  {icon}
                </span>
              ) : parentCtx.alignGutter ? (
                <span className="w-4 h-4 shrink-0" />
              ) : null}
              <span className="truncate font-medium">{label}</span>
            </div>
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform text-[var(--text-muted)] ${
                isOpen ? "rotate-90" : ""
              }`}
            />
          </button>
          {isOpen && (
            <div className="pl-3 pr-1 py-1 bg-[var(--bg-app)]/50 border-l-2 border-[var(--accent)] ml-2 my-0.5 rounded-sm">
              {children}
            </div>
          )}
        </div>
      </DropdownContext.Provider>
    );
  }

  // Desktop Hover / Floating Flyout Mode
  return (
    <div
      ref={itemRef}
      className={`relative group/sub ${className}`}
      onMouseEnter={() => !disabled && setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div
        role="menuitem"
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={`flex items-center justify-between px-3 py-1.5 text-xs cursor-pointer select-none transition-colors ${
          disabled
            ? "opacity-40 cursor-not-allowed text-[var(--text-muted)]"
            : "text-[var(--text-main)] hover:bg-[var(--bg-tab-hover)] hover:text-[var(--text-highlight)]"
        }`}
      >
        <div className="flex items-center gap-2 truncate pr-2">
          {icon ? (
            <span className="w-4 h-4 flex items-center justify-center shrink-0">
              {icon}
            </span>
          ) : parentCtx.alignGutter ? (
            <span className="w-4 h-4 shrink-0" />
          ) : null}
          <span className="truncate">{label}</span>
        </div>
        <ChevronRight className="w-3 h-3 text-[var(--text-muted)] group-hover/sub:text-[var(--text-main)] shrink-0" />
      </div>

      {isOpen && (
        <DropdownContext.Provider value={{ ...parentCtx, alignGutter }}>
          <div
            ref={subMenuRef}
            role="menu"
            className={`absolute z-50 min-w-[180px] py-1 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-md shadow-xl backdrop-blur-md animate-fade-in ${
              flipTop ? "bottom-0" : "top-0"
            } ${flipLeft ? "right-full mr-1" : "left-full ml-1"}`}
          >
            {children}
          </div>
        </DropdownContext.Provider>
      )}
    </div>
  );
};

export const DropdownMenuSeparator: React.FC<{ className?: string }> = ({
  className = "",
}) => <hr className={`border-[var(--border-color)] my-1 ${className}`} />;

// ---------------------------------------------------------------------------
// Root DropdownMenu Component
// ---------------------------------------------------------------------------

/**
 * Generic Dropdown Menu component with compound components (`Item`, `Sub`, `Separator`).
 *
 * Features:
 * - Triggered by any clickable React element.
 * - Renders into a document portal (`createPortal`) to guarantee proper z-index layering above editors/dialogs.
 * - Closes automatically when clicking outside or pressing Escape.
 * - Supports responsive nested submenus with desktop viewport overflow auto-flipping (`flipLeft`, `flipTop`)
 *   and mobile touch accordion expansion.
 */
export function DropdownMenu({
  children,
  trigger,
  align = "left",
  alignGutter = false,
  className = "",
  topDialogOnMobile = false,
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [menuPos, setMenuPos] = useState<{
    top: number;
    left?: number;
    right?: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const updatePosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const isRight = align === "right";
      setMenuPos({
        top: rect.bottom + 2,
        left: isRight
          ? undefined
          : Math.max(4, Math.min(rect.left, window.innerWidth - 240)),
        right: isRight
          ? Math.max(4, window.innerWidth - rect.right)
          : undefined,
      });
    }
  }, [align]);

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();
    const handleScroll = (e: Event) => {
      const target = e.target as Node | null;
      // If scroll originates inside the menu itself (e.g. scrollable language list), ignore
      if (menuRef.current && target && menuRef.current.contains(target)) {
        return;
      }
      close();
    };

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen, updatePosition, close]);

  const useTopDialog = isMobile && topDialogOnMobile;

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent | PointerEvent) => {
      // In mobile top dialog mode, the full-screen backdrop handles outside taps safely
      if (useTopDialog) return;

      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        close();
      }
    };
    document.addEventListener("pointerdown", handleClickOutside);
    return () =>
      document.removeEventListener("pointerdown", handleClickOutside);
  }, [isOpen, close, useTopDialog]);

  return (
    <DropdownContext.Provider value={{ isOpen, close, isMobile, alignGutter }}>
      <div
        ref={containerRef}
        className="relative inline-block text-left shrink-0"
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsOpen((prev) => !prev)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsOpen((prev) => !prev);
            } else if (e.key === "Escape") {
              close();
            }
          }}
          className="cursor-pointer select-none"
        >
          {trigger}
        </div>

        {isOpen &&
          (useTopDialog || menuPos) &&
          createPortal(
            useTopDialog ? (
              <>
                {/* Dimmed backdrop that absorbs all touch/pointer events to isolate context and prevent ghost clicks */}
                <div
                  aria-hidden="true"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    close();
                  }}
                  style={{ zIndex: Z_INDEX.DROPDOWN_PORTAL }}
                  className="fixed inset-0 bg-black/45 backdrop-blur-[2px] animate-fade-in touch-none select-none"
                />
                {/* Top-centered modal container */}
                <div
                  ref={menuRef}
                  role="menu"
                  style={{ zIndex: Z_INDEX.DROPDOWN_PORTAL + 1 }}
                  className={`fixed top-11 left-1/2 -translate-x-1/2 w-[calc(100vw-32px)] max-w-[340px] max-h-[82vh] overflow-y-auto py-1.5 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 scrollbar-thin ${className}`}
                >
                  {children}
                </div>
              </>
            ) : (
              <div
                ref={menuRef}
                role="menu"
                style={{
                  position: "fixed",
                  top: menuPos?.top,
                  left: menuPos?.left,
                  right: menuPos?.right,
                  zIndex: Z_INDEX.DROPDOWN_PORTAL,
                }}
                className={`min-w-[190px] py-1 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-md shadow-xl backdrop-blur-md animate-fade-in ${className}`}
              >
                {children}
              </div>
            ),
            document.body,
          )}
      </div>
    </DropdownContext.Provider>
  );
}

DropdownMenu.Item = DropdownMenuItem;
DropdownMenu.Sub = DropdownMenuSub;
DropdownMenu.Separator = DropdownMenuSeparator;

export default DropdownMenu;
