import { useState, useCallback } from "react";
import { useEditorStore } from "../../tabs/store";
import { useScriptStore } from "../store/scriptStore";
import { executeScriptInWorker } from "../engine/scriptRunner";
import type {
  ScriptMetadata,
  ScriptRunResult,
  ScriptExecutionContextTab,
} from "../types/script.types";

export function useScriptRunner() {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<ScriptRunResult | null>(null);

  const tabs = useEditorStore((state) => state.tabs);
  const activeTabId = useEditorStore((state) => state.activeTabId);
  const createTab = useEditorStore((state) => state.createTab);
  const updateTabContent = useEditorStore((state) => state.updateTabContent);
  const functions = useScriptStore((state) => state.functions);

  const runScript = useCallback(
    async (
      script: ScriptMetadata,
      inputs: Record<string, unknown>,
    ): Promise<ScriptRunResult> => {
      setIsRunning(true);
      setLastResult(null);

      // Extract any selected text from active editor if available
      let selectedText = "";
      try {
        const selection = window.getSelection()?.toString() || "";
        selectedText = selection;
      } catch {
        selectedText = "";
      }

      // Prepare context tabs
      const contextTabs: ScriptExecutionContextTab[] = tabs.map((t) => ({
        id: t.id,
        name: t.name,
        content: t.content,
        language: t.language,
        selectedText: t.id === activeTabId ? selectedText : undefined,
      }));

      const activeTab = contextTabs.find((t) => t.id === activeTabId) || null;

      // Filter used functions: prioritize script.functions, fallback to usedFunctionIds
      const usedFunctionsList =
        script.functions && script.functions.length > 0
          ? script.functions
          : functions.filter((f) =>
              (script.usedFunctionIds || []).includes(f.id),
            );

      const result = await executeScriptInWorker(
        script,
        usedFunctionsList,
        inputs,
        {
          currentTab: activeTab,
          openTabs: contextTabs,
          target: script.target || "tab",
        },
      );

      setIsRunning(false);
      setLastResult(result);

      if (result.success) {
        if (result.replaceCurrentTab && activeTabId) {
          if (result.outputContent !== undefined) {
            updateTabContent(activeTabId, result.outputContent);
          }
        } else if (
          result.outputContent !== undefined &&
          result.outputContent !== ""
        ) {
          createTab(
            result.outputTabName || `${script.name} Output`,
            result.outputContent,
          );
        }
      }

      return result;
    },
    [tabs, activeTabId, functions, createTab, updateTabContent],
  );

  return {
    runScript,
    isRunning,
    lastResult,
  };
}
