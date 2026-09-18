import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Check } from "lucide-react";
import { DropdownMenu } from "./DropdownMenu";

export interface ContinuousSectionItem<T extends string = string> {
  id: T;
  label: string;
  desc?: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

export interface ContinuousSectionModalLayoutProps<T extends string = string> {
  sections: ContinuousSectionItem<T>[];
  activeDesktopId: T;
  onSelectDesktopId: (id: T) => void;
  className?: string;
}

/**
 * Generic responsive layout for settings/preferences dialogs.
 *
 * - On Desktop (md+):
 *   Renders standard sidebar tab navigation on the left and active section content on the right.
 * - On Mobile (<md):
 *   Renders all sections sequentially in a continuous scroll feed.
 *   Features a sticky jump-navigation header on top that tracks the currently visible section
 *   and provides a dropdown to quickly jump (smooth-scroll) to any section.
 */
export function ContinuousSectionModalLayout<T extends string = string>({
  sections,
  activeDesktopId,
  onSelectDesktopId,
  className = "",
}: ContinuousSectionModalLayoutProps<T>) {
  const [mobileActiveId, setMobileActiveId] = useState<T>(
    sections[0]?.id ?? ("" as T),
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Map<T, HTMLDivElement>>(new Map());

  // Register section ref callback
  const registerSectionRef = useCallback(
    (id: T) => (node: HTMLDivElement | null) => {
      if (node) {
        sectionRefs.current.set(id, node);
      } else {
        sectionRefs.current.delete(id);
      }
    },
    [],
  );

  // Smooth scroll to a section on mobile
  const scrollToSection = useCallback((id: T) => {
    const targetNode = sectionRefs.current.get(id);
    if (targetNode && containerRef.current) {
      targetNode.scrollIntoView({ behavior: "smooth", block: "start" });
      setMobileActiveId(id);
    }
  }, []);

  // Track active section on mobile using scroll position
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const containerTop = container.getBoundingClientRect().top;
        const scrollThreshold = containerTop + 100;

        let currentId = sections[0]?.id;
        for (const section of sections) {
          const el = sectionRefs.current.get(section.id);
          if (el) {
            const rect = el.getBoundingClientRect();
            // If top of section is at or above the threshold
            if (rect.top <= scrollThreshold) {
              currentId = section.id;
            }
          }
        }
        if (currentId) {
          setMobileActiveId(currentId);
        }
      });
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [sections]);

  const activeMobileMeta =
    sections.find((s) => s.id === mobileActiveId) || sections[0];

  return (
    <div className={`flex-1 flex overflow-hidden ${className}`}>
      {/* ------------------------------------------------------------- */}
      {/* DESKTOP LAYOUT (md+)                                          */}
      {/* ------------------------------------------------------------- */}
      <div className="hidden md:flex w-full flex-1 overflow-hidden">
        {/* Left Navigation Sidebar */}
        <div className="w-44 bg-[var(--bg-app)]/60 border-r border-[var(--border-subtle)] p-2 flex flex-col gap-1 shrink-0">
          {sections.map((sec) => {
            const isActive = activeDesktopId === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => onSelectDesktopId(sec.id)}
                className={`w-full px-3 py-1.5 rounded-sm text-xs font-semibold flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                  isActive
                    ? "bg-accent text-accent-contrast shadow-2xs"
                    : "text-[var(--text-muted)] hover:bg-[var(--bg-tab-hover)] hover:text-[var(--text-main)]"
                }`}
              >
                {sec.icon && <span className="shrink-0">{sec.icon}</span>}
                <span className="truncate">{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Active Content Pane */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {sections.find((sec) => sec.id === activeDesktopId)?.content}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MOBILE LAYOUT (<md) - Continuous Feed with Sticky Jump Bar     */}
      {/* ------------------------------------------------------------- */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto flex flex-col md:hidden relative scroll-smooth"
      >
        {/* Sticky Section Breadcrumb / Jump Navigation Trigger */}
        <div className="sticky top-0 z-30 bg-[var(--bg-toolbar)]/95 backdrop-blur-md border-b border-[var(--border-color)] px-4 py-2 flex items-center justify-between shadow-xs">
          <DropdownMenu
            topDialogOnMobile={false}
            trigger={
              <button
                type="button"
                className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[var(--bg-surface)] hover:bg-[var(--bg-tab-hover)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-highlight)] transition-colors active:scale-95"
              >
                {activeMobileMeta?.icon && (
                  <span className="text-[var(--accent)] shrink-0">
                    {activeMobileMeta.icon}
                  </span>
                )}
                <span>{activeMobileMeta?.label}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] ml-0.5" />
              </button>
            }
          >
            <div className="px-3 py-1.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Jump to Section
            </div>
            {sections.map((sec) => {
              const isSelected = sec.id === mobileActiveId;
              return (
                <DropdownMenu.Item
                  key={sec.id}
                  label={
                    <div className="flex items-center justify-between w-full">
                      <span>{sec.label}</span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[var(--accent)] ml-2" />
                      )}
                    </div>
                  }
                  icon={sec.icon}
                  onSelect={() => scrollToSection(sec.id)}
                  className={
                    isSelected ? "font-semibold text-[var(--accent)]" : ""
                  }
                />
              );
            })}
          </DropdownMenu>

          <span className="text-[10px] text-[var(--text-muted)] italic">
            Tap to jump
          </span>
        </div>

        {/* Sequential Section Feed */}
        <div className="p-4 flex flex-col gap-6">
          {sections.map((sec, index) => (
            <div
              key={sec.id}
              ref={registerSectionRef(sec.id)}
              className={`scroll-mt-14 ${
                index > 0 ? "pt-6 border-t border-[var(--border-color)]" : ""
              }`}
            >
              {/* Section Header Title & Description */}
              <div className="flex items-center gap-2.5 mb-2">
                {sec.icon && (
                  <div className="p-1.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] shrink-0">
                    {sec.icon}
                  </div>
                )}
                <div>
                  <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
                    {sec.label}
                  </h3>
                  {sec.desc && (
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      {sec.desc}
                    </p>
                  )}
                </div>
              </div>

              {/* Section Content Body */}
              <div className="mt-3">{sec.content}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
