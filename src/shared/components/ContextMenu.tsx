import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { Z_INDEX } from '../../core/constants/zIndex';
import { DropdownContext } from './dropdownContext';
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSeparator,
} from './DropdownMenu';
import type {
  DropdownMenuItemProps,
  DropdownMenuSubProps,
} from './DropdownMenu';

/**
 * Props for the ContextMenu component.
 */
export interface ContextMenuProps {
  /** Target X coordinate on the screen (e.g. from `e.clientX` or touch event). */
  x: number;
  /** Target Y coordinate on the screen (e.g. from `e.clientY` or touch event). */
  y: number;
  /** Callback fired when the context menu is requested to close (backdrop click, escape key, item selection). */
  onClose: () => void;
  /** Menu items, submenus, and separators (`ContextMenu.Item`, `ContextMenu.Sub`, `ContextMenu.Separator`). */
  children: ReactNode;
  /** When true, items without an icon render an empty spacer matching the icon width for neat vertical alignment. */
  alignGutter?: boolean;
  /** Custom CSS class names applied to the context menu popup. */
  className?: string;
}

/**
 * Generic Context Menu component for right-click / long-press interactions.
 *
 * Design & Architecture:
 * - **Coordinate Clamping**: Clamps `x` and `y` coordinates to ensure the menu remains fully
 *   inside the viewport on initial open, preventing off-screen positioning.
 * - **Reuses Compound Components**: Shares `<ContextMenu.Item>`, `<ContextMenu.Sub>`, and `<ContextMenu.Separator>`
 *   from the standard `DropdownMenu` ecosystem for consistent styling and accessibility.
 * - **Responsive Submenus**:
 *   - On Desktop: Submenus automatically inspect viewport boundaries with `getBoundingClientRect()`
 *     and flip orientation (`flipLeft`, `flipTop`) when placed near screen edges (e.g., right-side vertical tab bars).
 *   - On Mobile: Submenus transform into expandable inline accordions, preventing clipping against safe areas.
 * - **Dismiss Safety**: Features a 250ms threshold filter to prevent synthetic touch events or pointerup
 *   events from immediately dismissing the menu after a long-press gesture.
 */
export const ContextMenu: React.FC<ContextMenuProps> & {
  Item: React.FC<DropdownMenuItemProps>;
  Sub: React.FC<DropdownMenuSubProps>;
  Separator: React.FC<{ className?: string }>;
} = ({
  x,
  y,
  onClose,
  children,
  alignGutter = false,
  className = '',
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const mountTimeRef = useRef(0);

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const close = useCallback(() => {
    onClose();
  }, [onClose]);

  // Click outside / pointerdown / escape listener
  useEffect(() => {
    mountTimeRef.current = Date.now();

    const handleClickOutside = (e: MouseEvent | PointerEvent) => {
      // Ignore click/pointer events firing immediately after long-press release (< 250ms)
      if (Date.now() - mountTimeRef.current < 250) {
        return;
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };

    window.addEventListener('pointerdown', handleClickOutside);
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handleClickOutside);
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [close]);

  // Safe coordinate boundaries
  const safeX = Number.isFinite(x) ? x : 16;
  const safeY = Number.isFinite(y) ? y : 16;
  const menuWidth = isMobile ? Math.min(260, window.innerWidth - 32) : 210;
  const menuHeight = 360;
  const posX = Math.max(12, Math.min(safeX, window.innerWidth - menuWidth - 12));
  const posY = Math.max(12, Math.min(safeY, window.innerHeight - menuHeight - 12));

  return createPortal(
    <DropdownContext.Provider value={{ isOpen: true, close, isMobile, alignGutter }}>
      {/* Backdrop for click outside / mobile tap dismiss */}
      <div
        style={{ zIndex: Z_INDEX.DROPDOWN_PORTAL }}
        className="fixed inset-0 select-none bg-black/25 md:bg-transparent"
        onPointerDown={(e) => {
          if (Date.now() - mountTimeRef.current < 250) return;
          e.stopPropagation();
          close();
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          close();
        }}
      />

      <div
        ref={menuRef}
        role="menu"
        style={{
          position: 'fixed',
          top: posY,
          left: posX,
          width: isMobile ? menuWidth : undefined,
          zIndex: Z_INDEX.DROPDOWN_PORTAL + 1,
        }}
        className={`${
          isMobile ? 'w-64 max-h-[85vh] overflow-y-auto' : 'w-52'
        } py-1 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-md shadow-2xl select-none backdrop-blur-md animate-fade-in text-xs ${className}`}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </DropdownContext.Provider>,
    document.body
  );
};

ContextMenu.Item = DropdownMenuItem;
ContextMenu.Sub = DropdownMenuSub;
ContextMenu.Separator = DropdownMenuSeparator;

export default ContextMenu;
