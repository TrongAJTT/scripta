import React, { useState } from "react";
import {
  Sliders,
  Layout,
  Type,
  RotateCcw,
  Settings,
  Eye,
  HardDrive,
} from "lucide-react";
import { useEditorStore } from "../../tabs/store";
import { ModalWrapper } from "../../../shared/components/ModalWrapper";
import { dialog } from "../../../shared/dialog/dialogStore";
import {
  ContinuousSectionModalLayout,
  type ContinuousSectionItem,
} from "../../../shared/components/ContinuousSectionModalLayout";
import {
  GeneralTab,
  LayoutTab,
  PreviewTab,
  EditorTab,
  ResourcesTab,
} from "./preferences";

export type SettingsCategory =
  | "general"
  | "layout"
  | "preview"
  | "editor"
  | "resources";

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenShortcutMapper?: () => void;
  onOpenUpdateModal?: () => void;
  initialCategory?: SettingsCategory;
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({
  isOpen,
  onClose,
  onOpenUpdateModal,
  initialCategory,
}) => {
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>(
    initialCategory || "general",
  );
  const [prevInitialCategory, setPrevInitialCategory] =
    useState(initialCategory);

  if (initialCategory !== prevInitialCategory) {
    setPrevInitialCategory(initialCategory);
    setActiveCategory(initialCategory || "general");
  }

  const handleReset = async () => {
    const confirmed = await dialog.confirm({
      title: "Reset Settings to Defaults",
      message:
        "Are you sure you want to restore all preferences (theme, layout, preview, and editor settings) back to their default values?",
      confirmText: "Reset to Defaults",
      cancelText: "Cancel",
      variant: "warning",
      defaultFocus: "cancel",
    });
    if (!confirmed) return;

    updateSettings({
      theme: "dark",
      fontSize: 14,
      tabSize: 2,
      lineWrapping: true,
      minimap: false,
      autoSave: false,
      tabBarPosition: "top",
      showToolbar: true,
      showStatusBar: true,
      mermaidTheme: "auto",
      previewPerfPreset: "balanced",
    });
  };

  const sections: ContinuousSectionItem<SettingsCategory>[] = [
    {
      id: "general",
      label: "General",
      desc: "Theme palette, updates, and application preferences",
      icon: <Settings className="w-4 h-4" />,
      content: (
        <GeneralTab
          onOpenUpdateModal={onOpenUpdateModal}
          onClosePreferences={onClose}
        />
      ),
    },
    {
      id: "layout",
      label: "Layout",
      desc: "Tab bar position and workspace interface elements",
      icon: <Layout className="w-4 h-4" />,
      content: <LayoutTab />,
    },
    {
      id: "preview",
      label: "Preview",
      desc: "Document rendering and Mermaid diagram themes",
      icon: <Eye className="w-4 h-4" />,
      content: <PreviewTab />,
    },
    {
      id: "editor",
      label: "Editor & Fonts",
      desc: "Font size, indentation, word wrap, and auto-save",
      icon: <Type className="w-4 h-4" />,
      content: <EditorTab />,
    },
    {
      id: "resources",
      label: "Resources & Storage",
      desc: "Inspect and manage cached optional runtimes (Python, Mermaid, LaTeX)",
      icon: <HardDrive className="w-4 h-4" />,
      content: <ResourcesTab />,
    },
  ];

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Preferences"
      subtitle="Customize themes, workspace layout, preview rendering, and editor configurations."
      icon={<Sliders className="w-5 h-5" />}
      maxWidthClass="max-w-3xl"
      footer={
        <>
          <button
            type="button"
            onClick={() => void handleReset()}
            className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--status-warning-text)] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Settings to Defaults</span>
            <span className="sm:hidden">Reset</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-sm bg-accent text-accent-contrast font-semibold hover:opacity-95 transition-opacity cursor-pointer"
          >
            Close
          </button>
        </>
      }
    >
      <ContinuousSectionModalLayout<SettingsCategory>
        sections={sections}
        activeDesktopId={activeCategory}
        onSelectDesktopId={setActiveCategory}
      />
    </ModalWrapper>
  );
};
