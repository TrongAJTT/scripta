import React, { useEffect, useState, useCallback, useRef } from "react";
import type { PreviewAdapterProps } from "./types";
import type { MermaidTheme } from "../../../core/types/file.types";
import { Copy, Check, Workflow } from "lucide-react";
import { useEditorStore } from "../../tabs/store";
import { applyMermaidTheme } from "../services/mermaidExportService";
import { MermaidExportMenu } from "../components/MermaidExportMenu";
import { PreviewZoomControls } from "../components/PreviewZoomControls";
import { EmptyState } from "../../../shared/components/EmptyState";
import { InlineBanner } from "../../../shared/components/InlineBanner";

const MERMAID_STARTERS: Array<{ label: string; code: string }> = [
  {
    label: "Flowchart",
    code: `flowchart TD
  A[Start] --> B{Valid Input?}
  B -->|Yes| C[Process Data]
  B -->|No| D[Show Warning]
  C --> E[Done]`,
  },
  {
    label: "Sequence",
    code: `sequenceDiagram
  participant User
  participant App
  participant Storage
  User->>App: Edit Document
  App->>Storage: Auto-Save (1s)
  Storage-->>App: Saved`,
  },
  {
    label: "ER Diagram",
    code: `erDiagram
  WORKSPACE ||--o{ TAB : contains
  TAB {
    string id
    string name
    string language
  }`,
  },
];

const MERMAID_THEMES: Array<{ value: MermaidTheme; label: string }> = [
  { value: "auto", label: "Auto" },
  { value: "dark", label: "Dark" },
  { value: "default", label: "Default" },
  { value: "forest", label: "Forest" },
  { value: "neutral", label: "Neutral" },
];

export const MermaidAdapter: React.FC<PreviewAdapterProps> = ({
  tab,
  setHeaderActions,
}) => {
  const [svgContent, setSvgContent] = useState<string>("");
  const [renderError, setRenderError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const svgWrapperRef = useRef<HTMLDivElement>(null);
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(
    new Map(),
  );
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1);

  const mermaidTheme = useEditorStore((s) => s.settings.mermaidTheme) ?? "auto";
  const appTheme = useEditorStore((s) => s.settings.theme);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const updateTabContent = useEditorStore((s) => s.updateTabContent);

  const rawContent = tab.content || "";
  const isEmpty = !rawContent.trim();

  // Debounced render with stale-while-error preservation
  useEffect(() => {
    if (isEmpty) {
      return;
    }

    let isCancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const mermaid = await applyMermaidTheme(mermaidTheme, appTheme);
          const id = `mermaid-standalone-${Date.now()}`;
          const { svg } = await mermaid.render(id, rawContent);
          if (!isCancelled) {
            setSvgContent(svg);
            setRenderError(null);
          }
        } catch (e: unknown) {
          const errMsg = e instanceof Error ? e.message : String(e);
          if (!isCancelled) {
            setRenderError(errMsg || "Invalid Mermaid Syntax");
          }
        }
      })();
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [rawContent, isEmpty, mermaidTheme, appTheme]);

  const handleCopySvg = useCallback(async () => {
    if (!svgContent) return;
    try {
      await navigator.clipboard.writeText(svgContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback ignored
    }
  }, [svgContent]);

  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleFitToView = useCallback(() => {
    const container = canvasRef.current;
    const svgEl = svgWrapperRef.current?.querySelector("svg");
    if (!container || !svgEl) return;

    const rect = svgEl.getBoundingClientRect();
    const naturalWidth = rect.width / zoom;
    const naturalHeight = rect.height / zoom;
    if (naturalWidth <= 0 || naturalHeight <= 0) return;

    const availW = Math.max(100, container.clientWidth - 64);
    const availH = Math.max(100, container.clientHeight - 64);
    const fitScale = Math.min(availW / naturalWidth, availH / naturalHeight, 2.5);
    setZoom(Math.max(0.2, Number(fitScale.toFixed(2))));
    setPan({ x: 0, y: 0 });
  }, [zoom]);

  // Non-passive wheel listener for smooth mouse-wheel / trackpad zoom
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      setZoom((prev) =>
        Math.max(0.2, Math.min(5, Number((prev * factor).toFixed(2)))),
      );
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [svgContent, isEmpty]);

  const getPointerDistance = (
    p1: { x: number; y: number },
    p2: { x: number; y: number },
  ) => Math.hypot(p2.x - p1.x, p2.y - p1.y);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    activePointersRef.current.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY,
    });

    if (activePointersRef.current.size === 1) {
      setIsPanning(true);
      pinchStartDistRef.current = null;
    } else if (activePointersRef.current.size === 2) {
      const pts = Array.from(activePointersRef.current.values());
      pinchStartDistRef.current = getPointerDistance(pts[0], pts[1]);
      pinchStartZoomRef.current = zoom;
      setIsPanning(false);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const prevPoint = activePointersRef.current.get(e.pointerId);
    if (!prevPoint) return;

    const nextPoint = { x: e.clientX, y: e.clientY };
    activePointersRef.current.set(e.pointerId, nextPoint);

    if (activePointersRef.current.size === 1) {
      const dx = nextPoint.x - prevPoint.x;
      const dy = nextPoint.y - prevPoint.y;
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    } else if (
      activePointersRef.current.size === 2 &&
      pinchStartDistRef.current &&
      pinchStartDistRef.current > 0
    ) {
      const pts = Array.from(activePointersRef.current.values());
      const dist = getPointerDistance(pts[0], pts[1]);
      const nextZoom = Math.max(
        0.2,
        Math.min(
          5,
          Number(
            (
              pinchStartZoomRef.current *
              (dist / pinchStartDistRef.current)
            ).toFixed(2),
          ),
        ),
      );
      setZoom(nextZoom);
    }
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    activePointersRef.current.delete(e.pointerId);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (activePointersRef.current.size < 2) {
      pinchStartDistRef.current = null;
    }
    if (activePointersRef.current.size === 0) {
      setIsPanning(false);
    }
  };

  // Inject header controls into unified PreviewPanel bar
  useEffect(() => {
    if (isEmpty || !svgContent) {
      setHeaderActions?.(null);
      return;
    }

    setHeaderActions?.(
      <div className="flex items-center gap-1.5 select-none">
        <select
          value={mermaidTheme}
          onChange={(e) =>
            updateSettings({ mermaidTheme: e.target.value as MermaidTheme })
          }
          title="Mermaid Diagram Theme"
          className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-color)] text-[10px] text-[var(--text-main)] focus:outline-hidden focus:border-[var(--border-active)] cursor-pointer"
        >
          {MERMAID_THEMES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <div className="h-3.5 w-px bg-[var(--border-subtle)]" />

        <PreviewZoomControls
          zoom={zoom}
          onZoomChange={setZoom}
          onFit={handleFitToView}
          onReset={handleResetView}
        />

        <div className="h-3.5 w-px bg-[var(--border-subtle)]" />

        <button
          type="button"
          onClick={handleCopySvg}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--bg-surface)] hover:bg-[var(--bg-tab-hover)] border border-[var(--border-color)] text-[11px] text-[var(--text-main)] hover:text-[var(--text-highlight)] transition-colors cursor-pointer"
          title="Copy SVG to Clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-[var(--accent)]" />
              <span className="hidden sm:inline text-[var(--accent)] font-medium">
                Copied
              </span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span className="hidden sm:inline">Copy SVG</span>
            </>
          )}
        </button>

        <MermaidExportMenu
          svgContent={svgContent}
          baseFileName={tab.name || "diagram"}
        />
      </div>,
    );

    return () => setHeaderActions?.(null);
  }, [
    isEmpty,
    svgContent,
    setHeaderActions,
    mermaidTheme,
    updateSettings,
    zoom,
    handleFitToView,
    handleResetView,
    handleCopySvg,
    copied,
    tab.name,
  ]);

  if (isEmpty) {
    return (
      <EmptyState
        icon={<Workflow className="w-10 h-10 stroke-[1.25]" />}
        title="Empty Mermaid Diagram"
        description="Write Mermaid syntax in the editor or insert a starter template to preview your diagram."
        actions={MERMAID_STARTERS.map((starter) => (
          <button
            key={starter.label}
            type="button"
            onClick={() => updateTabContent(tab.id, starter.code)}
            className="px-2.5 py-1 rounded border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-tab-hover)] text-[11px] text-[var(--text-main)] hover:text-[var(--text-highlight)] transition-colors cursor-pointer"
          >
            + {starter.label}
          </button>
        ))}
      />
    );
  }

  if (renderError && !svgContent) {
    return (
      <EmptyState
        tone="danger"
        icon={<Workflow className="w-10 h-10 stroke-[1.25]" />}
        title="Invalid Mermaid Syntax"
        description="Fix the syntax error in the editor to render the diagram."
        detail={renderError}
      />
    );
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden relative bg-[var(--bg-preview)]">
      {/* Docked non-destructive error banner when editing breaks syntax */}
      {renderError && (
        <div className="px-3 pt-2.5 shrink-0 z-10">
          <InlineBanner
            variant="error"
            compact
            dismissible={false}
            message={renderError}
          />
        </div>
      )}

      {/* Interactive Pan & Zoom Canvas */}
      <div
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        className={`flex-1 w-full h-full overflow-hidden flex items-center justify-center bg-canvas-dots select-none touch-none ${
          isPanning ? "cursor-grabbing" : "cursor-grab"
        }`}
        title="Drag to pan • Scroll or Pinch to zoom"
      >
        <div
          ref={svgWrapperRef}
          className="transition-transform duration-75 ease-out flex items-center justify-center p-6"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
          }}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>
    </div>
  );
};
