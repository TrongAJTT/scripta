import React, { useEffect } from "react";
import { X } from "lucide-react";
import { MODAL_LAYOUT } from "../constants/modal";
import { Z_INDEX } from "../../core/constants/zIndex";

export interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  headerTrailing?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  maxWidthClass?: string; // default 'max-w-3xl'
}

export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  badge,
  headerTrailing,
  footer,
  children,
  maxWidthClass = "max-w-3xl",
}) => {
  // Close on Escape
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
      style={{ zIndex: Z_INDEX.MODAL_BASE }}
      className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-fade-in p-3 md:p-6"
    >
      {/* Backdrop click handler */}
      <div className="fixed inset-0" onClick={onClose} />

      <div
        className={`relative z-10 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-md shadow-xl w-full ${maxWidthClass} flex flex-col ${MODAL_LAYOUT.CONTAINER_HEIGHT_CLASSES} overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-toolbar)] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && (
              <div className="mr-1 text-[var(--accent)] shrink-0">{icon}</div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-semibold text-[var(--text-highlight)] truncate">
                  {title}
                </h2>
                {badge}
              </div>
              {subtitle && (
                <div className="text-[11px] text-[var(--text-muted)] truncate">
                  {subtitle}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-3">
            {headerTrailing}
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-[var(--bg-tab-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 py-3 border-t border-[var(--border-color)] bg-[var(--bg-toolbar)] flex items-center justify-between text-xs shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
