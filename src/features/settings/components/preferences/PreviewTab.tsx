import React, { useEffect, useState, useRef } from "react";
import mermaid from "mermaid";
import { Moon, Sun, Laptop, Palette, Eye, RefreshCw } from "lucide-react";
import { useEditorStore } from "../../../tabs/store";
import type { MermaidTheme, JsonTheme } from "../../../../core/types/file.types";
import {
  CardPicker,
  type CardPickerOption,
} from "../../../../shared/components/CardPicker";
import { applyMermaidTheme } from "../../../preview/services/mermaidExportService";
import { JSON_THEMES } from "../../../../core/constants/jsonThemes";
import { APP_NAME } from "../../../../core/constants/app";

const SAMPLE_MERMAID = `graph LR
  Client[💻 App UI] -->|Query| API[⚡ Backend]
  API --> DB[(🗄️ Database)]
  API -.-> Cache([Redis])
`;

const mermaidThemeOptions: CardPickerOption<MermaidTheme>[] = [
  {
    id: "auto",
    label: "Auto",
    description: "Match active app theme",
    icon: <Laptop className="w-3.5 h-3.5" />,
  },
  {
    id: "dark",
    label: "Dark",
    description: "Deep sleek contrast",
    icon: <Moon className="w-3.5 h-3.5" />,
  },
  {
    id: "default",
    label: "Default (Light)",
    description: "Classic light background",
    icon: <Sun className="w-3.5 h-3.5" />,
  },
  {
    id: "forest",
    label: "Forest",
    description: "Calm green hues",
    icon: <Palette className="w-3.5 h-3.5" />,
  },
  {
    id: "neutral",
    label: "Neutral",
    description: "Minimal monochrome lines",
    icon: <Eye className="w-3.5 h-3.5" />,
  },
];

const jsonThemeOptions: CardPickerOption<JsonTheme>[] = [
  {
    id: "default",
    label: "Catppuccin",
    description: "Cyan & emerald hues",
    icon: <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block" />,
  },
  {
    id: "onedark",
    label: "One Dark",
    description: "Warm coral & green",
    icon: <span className="w-3 h-3 rounded-full bg-[#e06c75] inline-block" />,
  },
  {
    id: "dracula",
    label: "Dracula",
    description: "Vibrant pink & neon",
    icon: <span className="w-3 h-3 rounded-full bg-[#ff79c6] inline-block" />,
  },
  {
    id: "monokai",
    label: "Monokai Pro",
    description: "Vivid magenta & yellow",
    icon: <span className="w-3 h-3 rounded-full bg-[#f92672] inline-block" />,
  },
  {
    id: "nord",
    label: "Nord",
    description: "Arctic frost & calm sage",
    icon: <span className="w-3 h-3 rounded-full bg-[#88c0d0] inline-block" />,
  },
];

export const PreviewTab: React.FC = () => {
  const settings = useEditorStore((s) => s.settings);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const appTheme = settings.theme;
  const currentMermaidTheme = settings.mermaidTheme || "auto";
  const currentJsonTheme = settings.jsonTheme || "default";

  const [previewSvg, setPreviewSvg] = useState<string>("");
  const [renderError, setRenderError] = useState<string | null>(null);
  const renderSeqRef = useRef<number>(0);

  useEffect(() => {
    let isCancelled = false;
    const currentSeq = ++renderSeqRef.current;

    async function renderSampleDiagram() {
      setRenderError(null);
      try {
        applyMermaidTheme(currentMermaidTheme, appTheme);
        const uniqueId = `mermaid-pref-preview-${currentSeq}`;
        const { svg } = await mermaid.render(uniqueId, SAMPLE_MERMAID);
        if (!isCancelled && currentSeq === renderSeqRef.current) {
          setPreviewSvg(svg);
        }
      } catch (err: unknown) {
        if (!isCancelled && currentSeq === renderSeqRef.current) {
          setRenderError(
            err instanceof Error ? err.message : "Failed to render preview",
          );
        }
      }
    }

    renderSampleDiagram();

    return () => {
      isCancelled = true;
    };
  }, [currentMermaidTheme, appTheme]);

  const jsonColors = JSON_THEMES[currentJsonTheme] || JSON_THEMES.default;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Theme Picker for Mermaid */}
      <div>
        <h3 className="text-xs font-semibold text-[var(--text-highlight)] uppercase tracking-wider mb-1.5">
          Mermaid Diagram Theme
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-3">
          Choose the rendering color theme for standalone and embedded Mermaid
          flowcharts and diagrams.
        </p>

        <CardPicker
          options={mermaidThemeOptions}
          selectedId={currentMermaidTheme}
          onChange={(mermaidTheme: MermaidTheme) =>
            updateSettings({ mermaidTheme })
          }
        />

        {/* Live Preview Box */}
        <div className="mt-3 p-4 rounded-md border border-[var(--border-color)] bg-[var(--bg-editor)] flex items-center justify-center min-h-[160px] overflow-hidden transition-colors shadow-inner">
          {renderError ? (
            <div className="text-xs text-red-400 p-2 text-center">
              {renderError}
            </div>
          ) : previewSvg ? (
            <div
              className="w-full flex justify-center [&>svg]:max-h-[160px] [&>svg]:w-auto"
              dangerouslySetInnerHTML={{ __html: previewSvg }}
            />
          ) : (
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <RefreshCw className="w-4 h-4 animate-spin text-[var(--accent)]" />
              <span>Rendering preview...</span>
            </div>
          )}
        </div>
      </div>

      {/* Theme Picker for JSON Tree */}
      <div className="pt-2 border-t border-[var(--border-subtle)]">
        <h3 className="text-xs font-semibold text-[var(--text-highlight)] uppercase tracking-wider mb-1.5">
          JSON Tree Viewer Theme
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-3">
          Select syntax highlighting colors for interactive JSON preview panels and nodes.
        </p>

        <CardPicker
          options={jsonThemeOptions}
          selectedId={currentJsonTheme}
          onChange={(jsonTheme: JsonTheme) =>
            updateSettings({ jsonTheme })
          }
        />

        {/* Live JSON Sample Preview Box */}
        <div className="mt-3 p-4 rounded-md border border-[var(--border-color)] bg-[var(--bg-editor)] font-mono text-xs shadow-inner space-y-1 select-none">
          <div style={{ color: jsonColors.bracket }} className="font-bold">{"{"}</div>
          <div className="pl-4 flex items-center gap-1.5">
            <span style={{ color: jsonColors.key }}>"appName":</span>
            <span style={{ color: jsonColors.string }}>"{APP_NAME}"</span>
            <span style={{ color: jsonColors.bracket }}>,</span>
          </div>
          <div className="pl-4 flex items-center gap-1.5">
            <span style={{ color: jsonColors.key }}>"version":</span>
            <span style={{ color: jsonColors.number }}>1.2</span>
            <span style={{ color: jsonColors.bracket }}>,</span>
          </div>
          <div className="pl-4 flex items-center gap-1.5">
            <span style={{ color: jsonColors.key }}>"pwaEnabled":</span>
            <span style={{ color: jsonColors.boolean }} className="font-bold">true</span>
            <span style={{ color: jsonColors.bracket }}>,</span>
          </div>
          <div className="pl-4 flex items-center gap-1.5">
            <span style={{ color: jsonColors.key }}>"metadata":</span>
            <span style={{ color: jsonColors.nullValue }} className="font-semibold italic">null</span>
            <span style={{ color: jsonColors.bracket }}>,</span>
          </div>
          <div className="pl-4 flex items-center gap-1.5">
            <span style={{ color: jsonColors.key }}>"tags":</span>
            <span style={{ color: jsonColors.bracket }} className="font-bold">[</span>
            <span
              style={{
                backgroundColor: jsonColors.countBadgeBg,
                color: jsonColors.countBadgeText,
                borderColor: jsonColors.countBadgeBorder,
              }}
              className="px-1.5 py-0.2 rounded border text-[10px] font-semibold"
            >
              2 items
            </span>
            <span style={{ color: jsonColors.bracket }} className="font-bold">]</span>
          </div>
          <div style={{ color: jsonColors.bracket }} className="font-bold">{"}"}</div>
        </div>
      </div>
    </div>
  );
};
