import React, { useState } from "react";
import { Sliders, Layout, Type, RotateCcw, Settings, Eye } from "lucide-react";
import { useEditorStore } from "../../tabs/store";
import { ModalWrapper } from "../../../shared/components/ModalWrapper";
import {
  ContinuousSectionModalLayout,
  type ContinuousSectionItem,
} from "../../../shared/components/ContinuousSectionModalLayout";
import { GeneralTab, LayoutTab, PreviewTab, EditorTab } from "./preferences";

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenShortcutMapper?: () => void;
  onOpenUpdateModal?: () => void;
}

type SettingsCategory = "general" | "layout" | "preview" | "editor";

export const PreferencesModal: React.FC<PreferencesModalProps> = ({
  isOpen,
  onClose,
  onOpenUpdateModal,
}) => {
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const [activeCategory, setActiveCategory] =
    useState<SettingsCategory>("general");

  const handleReset = () => {
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
            onClick={handleReset}
            className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-amber-400 transition-colors cursor-pointer"
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
