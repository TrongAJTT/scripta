import React, { useEffect, useRef, useState, useMemo } from "react";
import { EditorState, Compartment } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
} from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {
  bracketMatching,
  foldGutter,
  syntaxHighlighting,
  defaultHighlightStyle,
} from "@codemirror/language";
import { oneDark } from "@codemirror/theme-one-dark";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { Search, Trash2, Plus, Code2, Eye } from "lucide-react";
import type {
  ScriptMetadata,
  ScriptInputDef,
  ScriptInputType,
  ScriptFunction,
  ScriptTarget,
  ScriptEmbeddedFunction,
  ScriptExecutionContextTab,
} from "../types/script.types";
import { useScriptStore } from "../store/scriptStore";
import { useEditorStore } from "../../tabs/store";
import { dialog } from "../../../shared/dialog/dialogStore";
import { SampleDataRunner } from "./common/SampleDataRunner";
import { JsonModeEditor } from "./common/JsonModeEditor";
import { ScriptService } from "../services/scriptService";
import { FunctionEditor } from "./FunctionEditor";
import { Z_INDEX } from "../../../core/constants/zIndex";

interface ScriptEditorProps {
  script?: ScriptMetadata;
  onSave: (script: ScriptMetadata) => void;
  onCancel: () => void;
}

const themeCompartment = new Compartment();
const jsonWordWrapCompartment = new Compartment();

const DEFAULT_SCRIPT_CODE = `// Entry point: runs in a background Web Worker
// Available in context:
// - context.target: 'tab' | 'selection'
// - context.targetText: content of target (full tab content or highlighted text)
// - context.selectedText: text selected by user (if any)
// - context.currentTab: { id, name, content, language, selectedText }
// - context.getTab(nameOrId): get another open tab
// - context.getAllTabs(): array of open tabs
// - context.createTab(name, content): create a new tab with results
// - context.replaceCurrentTab(content): modify current tab directly
// - context.log(...args): output messages to the execution log
// - context.functions: map of selected helper functions
// - context.fetch: async HTTP fetch

async function run(inputs, context) {
  context.log("Executing script...");
  
  // Example: Read from target text (tab content or selection)
  const text = context.targetText || (context.currentTab ? context.currentTab.content : '');
  context.log("Processing text of length:", text.length);

  // Generate output
  context.createTab("Output", text);
}
`;

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  script,
  onSave,
  onCancel,
}) => {
  const [editorTab, setEditorTab] = useState<
    "info" | "script" | "functions" | "metadata" | "json"
  >("info");

  const [currentCode, setCurrentCode] = useState(
    script?.code || DEFAULT_SCRIPT_CODE,
  );

  // Tab 1: Info & Inputs
  const [name, setName] = useState(script?.name || "");
  const [target, setTarget] = useState<ScriptTarget>(script?.target || "tab");
  const [group, setGroup] = useState(script?.group || "");
  const [description, setDescription] = useState(script?.description || "");
  const [inputs, setInputs] = useState<ScriptInputDef[]>(script?.inputs || []);
  const [rawDropdownOptions, setRawDropdownOptions] = useState<
    Record<number, string>
  >({});

  // Tab 3: Embedded Functions
  const [embeddedFunctions, setEmbeddedFunctions] = useState<
    ScriptEmbeddedFunction[]
  >(() => {
    if (script?.functions && script.functions.length > 0) {
      return script.functions;
    }
    // Fallback migration from usedFunctionIds
    if (script?.usedFunctionIds && script.usedFunctionIds.length > 0) {
      const allFns = useScriptStore.getState().functions;
      return script.usedFunctionIds
        .map((id) => allFns.find((f) => f.id === id))
        .filter((f): f is ScriptFunction => Boolean(f))
        .map((f) => ({
          id: f.id,
          name: f.name,
          description: f.description,
          params: f.params,
          paramDefs: f.paramDefs,
          code: f.code,
          source: f.isBuiltin ? ("builtin" as const) : ("custom" as const),
        }));
    }
    return [];
  });

  // Tab 4: Metadata
  const [version, setVersion] = useState(script?.version || "1.0.0");
  const [author, setAuthor] = useState(script?.author || "");
  const [sampleInput, setSampleInput] = useState(script?.sampleInput || "");
  const [sampleOutput, setSampleOutput] = useState(script?.sampleOutput || "");

  // Test Run State in Metadata Tab
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [lastExecutedSuccess, setLastExecutedSuccess] = useState(
    Boolean(script?.sampleOutput),
  );

  // Tab 5: JSON Mode State
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isCopiedJson, setIsCopiedJson] = useState(false);
  const [isAppliedJson, setIsAppliedJson] = useState(false);
  const [isWordWrap, setIsWordWrap] = useState(false);

  // Preview Function Modal State
  const [previewFunction, setPreviewFunction] =
    useState<ScriptEmbeddedFunction | null>(null);

  // Dropdowns in Script Code tab: Functions & Variables
  const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);
  const [isVarMenuOpen, setIsVarMenuOpen] = useState(false);
  const [fnSearchQuery, setFnSearchQuery] = useState("");
  const [fnSourceFilter, setFnSourceFilter] = useState("all");

  const allStandaloneFunctions = useScriptStore((state) => state.functions);
  const allWorkspaceScripts = useScriptStore((state) => state.scripts);
  const themeMode = useEditorStore((state) => state.settings.theme);
  const tabs = useEditorStore((state) => state.tabs);
  const activeTabId = useEditorStore((state) => state.activeTabId);

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);

  const jsonContainerRef = useRef<HTMLDivElement>(null);
  const jsonViewRef = useRef<EditorView | null>(null);

  // Initialize Code Editor View
  useEffect(() => {
    if (!editorContainerRef.current) return;

    const initialCode = script?.code || DEFAULT_SCRIPT_CODE;

    const baseTheme = EditorView.theme({
      "&": {
        height: "100%",
        fontSize: "13px",
        backgroundColor: "var(--bg-editor)",
      },
      ".cm-scroller": {
        overflow: "auto",
        fontFamily: "var(--font-mono, monospace)",
      },
      ".cm-content": { padding: "8px 0" },
      "&.cm-focused": { outline: "none" },
    });

    const isDark =
      themeMode === "dark" ||
      (themeMode === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    const startState = EditorState.create({
      doc: initialCode,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        foldGutter(),
        bracketMatching(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        javascript(),
        baseTheme,
        themeCompartment.of(isDark ? oneDark : []),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            setCurrentCode(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: editorContainerRef.current,
    });

    editorViewRef.current = view;

    return () => {
      view.destroy();
      editorViewRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize JSON Mode Editor View
  useEffect(() => {
    if (!jsonContainerRef.current) return;

    const baseTheme = EditorView.theme({
      "&": {
        height: "100%",
        fontSize: "13px",
        backgroundColor: "var(--bg-editor)",
      },
      ".cm-scroller": {
        overflow: "auto",
        fontFamily: "var(--font-mono, monospace)",
      },
      ".cm-content": { padding: "8px 0" },
      "&.cm-focused": { outline: "none" },
    });

    const isDark =
      themeMode === "dark" ||
      (themeMode === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    const startState = EditorState.create({
      doc: "{}",
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        foldGutter(),
        bracketMatching(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        json(),
        baseTheme,
        themeCompartment.of(isDark ? oneDark : []),
        jsonWordWrapCompartment.of([]),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: jsonContainerRef.current,
    });

    jsonViewRef.current = view;

    return () => {
      view.destroy();
      jsonViewRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Toggle Word Wrap for JSON editor
  const handleToggleWordWrap = () => {
    const nextWrap = !isWordWrap;
    setIsWordWrap(nextWrap);
    if (jsonViewRef.current) {
      jsonViewRef.current.dispatch({
        effects: jsonWordWrapCompartment.reconfigure(
          nextWrap ? EditorView.lineWrapping : [],
        ),
      });
    }
  };

  // Unused function detection based on currentCode state
  const { used: usedFunctions } = useMemo(() => {
    return ScriptService.findUnusedFunctions(currentCode, embeddedFunctions);
  }, [currentCode, embeddedFunctions]);

  // Candidate functions for Call Helper Function dropdown
  const availableCandidateFunctions = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      params: string[];
      description: string;
      source: "builtin" | "custom" | "script";
      sourceScriptName?: string;
      sourceScriptId?: string;
      code: string;
    }> = [];

    // 1. Standalone functions
    for (const fn of allStandaloneFunctions) {
      list.push({
        id: fn.id,
        name: fn.name,
        params: fn.params,
        description: fn.description,
        source: fn.isBuiltin ? "builtin" : "custom",
        code: fn.code,
      });
    }

    // 2. Functions from other scripts
    for (const sc of allWorkspaceScripts) {
      if (sc.id === script?.id) continue;
      if (sc.functions && sc.functions.length > 0) {
        for (const sfn of sc.functions) {
          if (!list.some((existing) => existing.name === sfn.name)) {
            list.push({
              id: `${sc.id}_${sfn.name}`,
              name: sfn.name,
              params: sfn.params,
              description:
                sfn.description || `Borrowed from script "${sc.name}"`,
              source: "script",
              sourceScriptName: sc.name,
              sourceScriptId: sc.id,
              code: sfn.code,
            });
          }
        }
      }
    }

    return list;
  }, [allStandaloneFunctions, allWorkspaceScripts, script?.id]);

  // Filter candidate functions by source & query
  const filteredCandidateFunctions = useMemo(() => {
    const q = fnSearchQuery.toLowerCase().trim();
    return availableCandidateFunctions.filter((fn) => {
      // Source filter
      if (fnSourceFilter === "builtin" && fn.source !== "builtin") return false;
      if (fnSourceFilter === "custom" && fn.source !== "custom") return false;
      if (
        fnSourceFilter.startsWith("script:") &&
        fn.sourceScriptId !== fnSourceFilter.replace("script:", "")
      ) {
        return false;
      }

      // Keyword query
      if (q) {
        return (
          fn.name.toLowerCase().includes(q) ||
          fn.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [availableCandidateFunctions, fnSearchQuery, fnSourceFilter]);

  // Input Parameter Handlers
  const handleAddInput = () => {
    const newInput: ScriptInputDef = {
      name: `input_${inputs.length + 1}`,
      label: `Input ${inputs.length + 1}`,
      type: "string",
      required: false,
    };
    setInputs([...inputs, newInput]);
  };

  const handleUpdateInput = (
    index: number,
    updates: Partial<ScriptInputDef>,
  ) => {
    const next = [...inputs];
    next[index] = { ...next[index], ...updates };
    setInputs(next);
  };

  const handleRemoveInput = (index: number) => {
    setInputs(inputs.filter((_, i) => i !== index));
    setRawDropdownOptions((prev) => {
      const next: Record<number, string> = {};
      Object.keys(prev).forEach((k) => {
        const keyNum = Number(k);
        if (keyNum < index) next[keyNum] = prev[keyNum];
        else if (keyNum > index) next[keyNum - 1] = prev[keyNum];
      });
      return next;
    });
  };

  // Helper: insert function snippet into CodeMirror editor at cursor & auto-add to embedded functions
  const handleInsertFunctionCode = (
    fn: (typeof availableCandidateFunctions)[0],
  ) => {
    // 1. Auto-add to embeddedFunctions if not already present
    if (!embeddedFunctions.some((e) => e.name === fn.name)) {
      const newEmbedded: ScriptEmbeddedFunction = {
        id: fn.id,
        name: fn.name,
        description: fn.description,
        params: fn.params,
        code: fn.code,
        source: fn.source,
        sourceScriptId: fn.sourceScriptId,
        sourceScriptName: fn.sourceScriptName,
      };
      setEmbeddedFunctions((prev) => [...prev, newEmbedded]);
    }

    // 2. Insert snippet at cursor
    if (editorViewRef.current) {
      const view = editorViewRef.current;
      const cursor = view.state.selection.main.head;
      const snippet = `await context.functions.${fn.name}(${fn.params.join(", ")})`;

      view.dispatch({
        changes: { from: cursor, insert: snippet },
        selection: { anchor: cursor + snippet.length },
      });
      view.focus();
    }

    setIsImportMenuOpen(false);
  };

  // Helper: insert input variable access snippet at cursor
  const handleInsertInputVariable = (inpName: string) => {
    if (editorViewRef.current) {
      const view = editorViewRef.current;
      const cursor = view.state.selection.main.head;
      const snippet = `inputs.${inpName}`;

      view.dispatch({
        changes: { from: cursor, insert: snippet },
        selection: { anchor: cursor + snippet.length },
      });
      view.focus();
    }

    setIsVarMenuOpen(false);
  };

  // Remove function from embedded list
  const handleRemoveEmbeddedFunction = (fnName: string) => {
    setEmbeddedFunctions((prev) => prev.filter((f) => f.name !== fnName));
  };

  // Generate Sample Input snippet with type comments and descriptions
  const handleGenerateSampleInput = () => {
    const template = ScriptService.generateSampleInputTemplate(inputs);
    setSampleInput(template);
    setLastExecutedSuccess(false);
    setTestError(null);
  };

  // Test Run Script with Sample Input
  const handleRunTest = async () => {
    setTestError(null);
    setIsRunningTest(true);

    const code = editorViewRef.current
      ? editorViewRef.current.state.doc.toString()
      : script?.code || DEFAULT_SCRIPT_CODE;

    const draftScript: ScriptMetadata = {
      id: script?.id || "draft_script",
      name: name.trim() || "Untitled Script",
      description: description.trim(),
      version: version.trim(),
      author: author.trim(),
      group: group.trim() || undefined,
      target,
      inputs,
      functions: embeddedFunctions,
      code,
      createdAt: script?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    const contextTabs: ScriptExecutionContextTab[] = tabs.map((t) => ({
      id: t.id,
      name: t.name,
      content: t.content,
      language: t.language,
      selectedText:
        t.id === activeTabId
          ? window.getSelection()?.toString() || ""
          : undefined,
    }));

    try {
      const res = await ScriptService.executeTestRun(
        draftScript,
        sampleInput,
        contextTabs,
        activeTabId,
      );

      if (res.success) {
        let outputDisplay = "";
        if (res.outputContent) {
          outputDisplay = res.outputContent;
        } else if (res.logs && res.logs.length > 0) {
          outputDisplay = res.logs.join("\n");
        } else {
          outputDisplay = "[Script executed successfully with no output]";
        }

        setSampleOutput(outputDisplay);
        setLastExecutedSuccess(true);
      } else {
        setTestError(res.error || "Script execution failed");
        setSampleOutput("");
        setLastExecutedSuccess(false);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestError(msg);
      setSampleOutput("");
      setLastExecutedSuccess(false);
    } finally {
      setIsRunningTest(false);
    }
  };

  // Helper to generate raw JSON string
  const generateRawJsonString = () => {
    const code = editorViewRef.current
      ? editorViewRef.current.state.doc.toString()
      : script?.code || DEFAULT_SCRIPT_CODE;

    return ScriptService.toRawJsonString({
      name,
      description,
      author,
      version,
      group: group.trim() || undefined,
      target,
      inputs,
      functions: embeddedFunctions,
      sampleInput,
      code,
    });
  };

  // Sync state to JSON CodeMirror whenever switching to JSON tab
  const handleSwitchTab = (
    tab: "info" | "script" | "functions" | "metadata" | "json",
  ) => {
    if (tab === "json" && jsonViewRef.current) {
      const jsonStr = generateRawJsonString();
      jsonViewRef.current.dispatch({
        changes: {
          from: 0,
          to: jsonViewRef.current.state.doc.length,
          insert: jsonStr,
        },
      });
      setJsonError(null);
      setIsAppliedJson(false);
    }
    setEditorTab(tab);
  };

  // Copy JSON to clipboard
  const handleCopyJson = async () => {
    const textToCopy = jsonViewRef.current
      ? jsonViewRef.current.state.doc.toString()
      : generateRawJsonString();

    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopiedJson(true);
      setTimeout(() => setIsCopiedJson(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Apply JSON edits back to Form State & Trigger Test Run if sampleInput exists
  const handleApplyJson = async () => {
    if (!jsonViewRef.current) return;
    setJsonError(null);

    const jsonText = jsonViewRef.current.state.doc.toString();
    try {
      const parsed = ScriptService.parseRawJson(jsonText);

      // Resolve embedded functions
      const resolvedFunctions = ScriptService.resolveEmbeddedFunctions(
        parsed.functions,
        allStandaloneFunctions,
        allWorkspaceScripts,
        embeddedFunctions,
      );

      // Update Form State
      setName(parsed.name);
      setDescription(parsed.description);
      setVersion(parsed.version);
      setAuthor(parsed.author);
      setGroup(parsed.group || "");
      setTarget(parsed.target || "tab");
      setInputs(parsed.inputs);
      setEmbeddedFunctions(resolvedFunctions);
      setSampleInput(parsed.sampleInput);

      // Update Code in Script Code editor
      const newCode = parsed.code || DEFAULT_SCRIPT_CODE;
      setCurrentCode(newCode);
      if (editorViewRef.current) {
        editorViewRef.current.dispatch({
          changes: {
            from: 0,
            to: editorViewRef.current.state.doc.length,
            insert: newCode,
          },
        });
      }

      // Auto-run test if sampleInput is present
      if (parsed.sampleInput.trim().length > 0) {
        setIsRunningTest(true);
        setTestError(null);

        const draftScript: ScriptMetadata = {
          id: script?.id || "draft_script",
          name: parsed.name,
          description: parsed.description,
          version: parsed.version,
          author: parsed.author,
          group: parsed.group,
          target: parsed.target,
          inputs: parsed.inputs,
          functions: resolvedFunctions,
          code: newCode,
          createdAt: script?.createdAt || Date.now(),
          updatedAt: Date.now(),
        };

        const contextTabs: ScriptExecutionContextTab[] = tabs.map((t) => ({
          id: t.id,
          name: t.name,
          content: t.content,
          language: t.language,
          selectedText:
            t.id === activeTabId
              ? window.getSelection()?.toString() || ""
              : undefined,
        }));

        try {
          const res = await ScriptService.executeTestRun(
            draftScript,
            parsed.sampleInput,
            contextTabs,
            activeTabId,
          );
          if (res.success) {
            setSampleOutput(
              res.outputContent ||
                res.logs.join("\n") ||
                "[Executed successfully]",
            );
            setLastExecutedSuccess(true);
          } else {
            setTestError(`Auto-run error: ${res.error}`);
            setSampleOutput("");
            setLastExecutedSuccess(false);
          }
        } finally {
          setIsRunningTest(false);
        }
      } else {
        setSampleOutput("");
        setLastExecutedSuccess(false);
      }

      setIsAppliedJson(true);
      setTimeout(() => setIsAppliedJson(false), 2500);
    } catch (parseErr) {
      setJsonError(
        parseErr instanceof Error ? parseErr.message : String(parseErr),
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setEditorTab("info");
      await dialog.alert({
        title: "Validation Error",
        message: "Please enter a script name in the Info & Input tab",
        variant: "warning",
      });
      return;
    }

    const code = editorViewRef.current
      ? editorViewRef.current.state.doc.toString()
      : DEFAULT_SCRIPT_CODE;

    const metadata: ScriptMetadata = {
      id:
        script?.id ||
        `script_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim(),
      description: description.trim(),
      version: version.trim(),
      author: author.trim(),
      group: group.trim() || undefined,
      target,
      inputs,
      functions: embeddedFunctions,
      usedFunctionIds: embeddedFunctions.map((f) => f.id),
      sampleInput: lastExecutedSuccess
        ? sampleInput.trim() || undefined
        : undefined,
      sampleOutput: lastExecutedSuccess ? sampleOutput || undefined : undefined,
      code,
      createdAt: script?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onSave(metadata);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        color: "var(--text-main)",
      }}
    >
      {/* 5 Sub-tabs Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          borderBottom: "1px solid var(--border-color)",
          paddingBottom: "8px",
          marginBottom: "12px",
        }}
      >
        <button
          type="button"
          onClick={() => handleSwitchTab("info")}
          style={{
            padding: "5px 14px",
            fontSize: "12px",
            borderRadius: "4px",
            cursor: "pointer",
            border: "none",
            backgroundColor:
              editorTab === "info" ? "var(--accent)" : "var(--bg-editor)",
            color:
              editorTab === "info"
                ? "var(--text-on-accent)"
                : "var(--text-muted)",
            fontWeight: editorTab === "info" ? 600 : 400,
          }}
        >
          Info & Input
        </button>

        <button
          type="button"
          onClick={() => handleSwitchTab("script")}
          style={{
            padding: "5px 14px",
            fontSize: "12px",
            borderRadius: "4px",
            cursor: "pointer",
            border: "none",
            backgroundColor:
              editorTab === "script" ? "var(--accent)" : "var(--bg-editor)",
            color:
              editorTab === "script"
                ? "var(--text-on-accent)"
                : "var(--text-muted)",
            fontWeight: editorTab === "script" ? 600 : 400,
          }}
        >
          Script Code
        </button>

        <button
          type="button"
          onClick={() => handleSwitchTab("functions")}
          style={{
            padding: "5px 14px",
            fontSize: "12px",
            borderRadius: "4px",
            cursor: "pointer",
            border: "none",
            backgroundColor:
              editorTab === "functions" ? "var(--accent)" : "var(--bg-editor)",
            color:
              editorTab === "functions"
                ? "var(--text-on-accent)"
                : "var(--text-muted)",
            fontWeight: editorTab === "functions" ? 600 : 400,
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <span>Functions</span>
          <span
            style={{
              fontSize: "10px",
              padding: "1px 5px",
              borderRadius: "10px",
              backgroundColor:
                editorTab === "functions"
                  ? "rgba(255, 255, 255, 0.25)"
                  : "var(--bg-surface)",
            }}
          >
            {embeddedFunctions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleSwitchTab("metadata")}
          style={{
            padding: "5px 14px",
            fontSize: "12px",
            borderRadius: "4px",
            cursor: "pointer",
            border: "none",
            backgroundColor:
              editorTab === "metadata" ? "var(--accent)" : "var(--bg-editor)",
            color:
              editorTab === "metadata"
                ? "var(--text-on-accent)"
                : "var(--text-muted)",
            fontWeight: editorTab === "metadata" ? 600 : 400,
          }}
        >
          Metadata
        </button>

        <button
          type="button"
          onClick={() => handleSwitchTab("json")}
          style={{
            padding: "5px 14px",
            fontSize: "12px",
            borderRadius: "4px",
            cursor: "pointer",
            border: "none",
            backgroundColor:
              editorTab === "json" ? "var(--accent)" : "var(--bg-editor)",
            color:
              editorTab === "json"
                ? "var(--text-on-accent)"
                : "var(--text-muted)",
            fontWeight: editorTab === "json" ? 600 : 400,
          }}
        >
          JSON Mode
        </button>
      </div>

      {/* Tab 1: Info & Input */}
      <div
        style={{
          display: editorTab === "info" ? "flex" : "none",
          flexDirection: "column",
          gap: "12px",
          flex: 1,
          overflowY: "auto",
          paddingRight: "4px",
        }}
      >
        {/* Script Name + Target */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2.5fr 1.2fr",
            gap: "10px",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                color: "var(--text-muted)",
                marginBottom: "4px",
              }}
            >
              Script Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "100%",
                padding: "7px 10px",
                backgroundColor: "var(--bg-editor)",
                border: "1px solid var(--border-color)",
                color: "var(--text-main)",
                borderRadius: "4px",
                fontSize: "13px",
              }}
              placeholder="e.g. Markdown Table Generator"
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                color: "var(--text-muted)",
                marginBottom: "4px",
              }}
            >
              Target Data *
            </label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as ScriptTarget)}
              style={{
                width: "100%",
                padding: "7px 10px",
                backgroundColor: "var(--bg-editor)",
                border: "1px solid var(--border-color)",
                color: "var(--text-main)",
                borderRadius: "4px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              <option value="tab">Tab Content (All)</option>
              <option value="selection">Selected Text Only</option>
            </select>
          </div>
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "11px",
              color: "var(--text-muted)",
              marginBottom: "4px",
            }}
          >
            Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 10px",
              backgroundColor: "var(--bg-editor)",
              border: "1px solid var(--border-color)",
              color: "var(--text-main)",
              borderRadius: "4px",
              fontSize: "12px",
              resize: "vertical",
            }}
            placeholder="What does this script accomplish?"
          />
        </div>

        {/* Inputs Definition Section */}
        <div
          style={{
            border: "1px solid var(--border-color)",
            borderRadius: "6px",
            padding: "12px",
            backgroundColor: "var(--bg-surface)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <span style={{ fontSize: "12px", fontWeight: 600 }}>
                Input Parameters ({inputs.length})
              </span>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: "11px",
                  color: "var(--text-muted)",
                }}
              >
                Configure the variables shown in the Run dialog when executing
                this script.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddInput}
              style={{
                fontSize: "11px",
                padding: "4px 10px",
                cursor: "pointer",
                backgroundColor: "var(--accent)",
                border: "none",
                color: "var(--text-on-accent)",
                fontWeight: 600,
                borderRadius: "4px",
              }}
            >
              + Add Input
            </button>
          </div>

          {inputs.length === 0 ? (
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                textAlign: "center",
                padding: "16px 0",
              }}
            >
              No custom inputs defined. The script can access open tabs via{" "}
              <code>context.targetText</code>, <code>context.currentTab</code>,
              or <code>context.getAllTabs()</code>.
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                maxHeight: "250px",
                overflowY: "auto",
              }}
            >
              {inputs.map((inp, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    padding: "8px",
                    backgroundColor: "var(--bg-editor)",
                    borderRadius: "4px",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.2fr 1.5fr 1fr auto",
                      gap: "6px",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Variable name"
                      value={inp.name}
                      onChange={(e) =>
                        handleUpdateInput(idx, { name: e.target.value })
                      }
                      style={{
                        padding: "4px 8px",
                        fontSize: "11px",
                        backgroundColor: "var(--bg-surface)",
                        border: "1px solid var(--border-color)",
                        color: "var(--text-main)",
                        borderRadius: "3px",
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Display label"
                      value={inp.label}
                      onChange={(e) =>
                        handleUpdateInput(idx, { label: e.target.value })
                      }
                      style={{
                        padding: "4px 8px",
                        fontSize: "11px",
                        backgroundColor: "var(--bg-surface)",
                        border: "1px solid var(--border-color)",
                        color: "var(--text-main)",
                        borderRadius: "3px",
                      }}
                    />
                    <select
                      value={inp.type}
                      onChange={(e) =>
                        handleUpdateInput(idx, {
                          type: e.target.value as ScriptInputType,
                        })
                      }
                      style={{
                        padding: "4px 6px",
                        fontSize: "11px",
                        backgroundColor: "var(--bg-surface)",
                        border: "1px solid var(--border-color)",
                        color: "var(--text-main)",
                        borderRadius: "3px",
                      }}
                    >
                      <option value="string">String</option>
                      <option value="tab">Tab Content</option>
                      <option value="dropdown">Dropdown</option>
                      <option value="int">Integer</option>
                      <option value="text">Multiline Text</option>
                      <option value="boolean">Boolean</option>
                      <option value="datetime">Datetime</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveInput(idx)}
                      style={{
                        backgroundColor: "transparent",
                        border: "none",
                        color: "#f87171",
                        cursor: "pointer",
                        fontSize: "14px",
                        padding: "0 4px",
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Sub-fields for Dropdown options */}
                  {inp.type === "dropdown" && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        paddingLeft: "2px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "10px",
                          color: "var(--text-muted)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Dropdown Options (comma separated):
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. Ascending, Descending"
                        value={
                          rawDropdownOptions[idx] !== undefined
                            ? rawDropdownOptions[idx]
                            : inp.options
                              ? inp.options.join(", ")
                              : ""
                        }
                        onChange={(e) => {
                          const text = e.target.value;
                          setRawDropdownOptions((prev) => ({
                            ...prev,
                            [idx]: text,
                          }));
                          const opts = text
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean);
                          handleUpdateInput(idx, { options: opts });
                        }}
                        style={{
                          flex: 1,
                          padding: "3px 8px",
                          fontSize: "11px",
                          backgroundColor: "var(--bg-surface)",
                          border: "1px solid var(--border-color)",
                          color: "var(--text-main)",
                          borderRadius: "3px",
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tab 2: Script Code */}
      <div
        style={{
          display: editorTab === "script" ? "flex" : "none",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "6px",
            position: "relative",
          }}
        >
          <label style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            JavaScript Entrypoint:{" "}
            <code>async function run(inputs, context) &#123; ... &#125;</code>
          </label>

          {/* Action Buttons: Insert Variable & Call Helper Function */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              position: "relative",
            }}
          >
            {/* Variables Insertion Button */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => {
                  setIsVarMenuOpen(!isVarMenuOpen);
                  setIsImportMenuOpen(false);
                }}
                style={{
                  padding: "3px 10px",
                  fontSize: "11px",
                  cursor: "pointer",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-color)",
                  color: "var(--accent-blue)",
                  fontWeight: 600,
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>+ Insert Variable</span>
                <span style={{ fontSize: "9px" }}>▼</span>
              </button>

              {isVarMenuOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: "4px",
                    width: "220px",
                    maxHeight: "200px",
                    overflowY: "auto",
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "6px",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
                    zIndex: 200,
                    padding: "4px",
                  }}
                >
                  <div
                    style={{
                      padding: "4px 8px",
                      fontSize: "10px",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    Inputs Variables
                  </div>
                  {inputs.length === 0 ? (
                    <div
                      style={{
                        padding: "8px",
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        textAlign: "center",
                      }}
                    >
                      No input variables defined yet.
                    </div>
                  ) : (
                    inputs.map((inp) => (
                      <button
                        key={inp.name}
                        type="button"
                        onClick={() => handleInsertInputVariable(inp.name)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "5px 8px",
                          fontSize: "11px",
                          backgroundColor: "transparent",
                          border: "none",
                          color: "var(--text-main)",
                          borderRadius: "4px",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "var(--bg-editor)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            color: "var(--accent-blue)",
                          }}
                        >
                          inputs.{inp.name}
                        </span>
                        <span
                          style={{
                            fontSize: "10px",
                            color: "var(--text-muted)",
                          }}
                        >
                          {inp.type}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Helper Function Searchable Picker Dropdown */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => {
                  setIsImportMenuOpen(!isImportMenuOpen);
                  setIsVarMenuOpen(false);
                }}
                style={{
                  padding: "3px 10px",
                  fontSize: "11px",
                  cursor: "pointer",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-color)",
                  color: "var(--accent)",
                  fontWeight: 600,
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>+ Call Helper Function</span>
                <span style={{ fontSize: "9px" }}>▼</span>
              </button>

              {isImportMenuOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: "4px",
                    width: "320px",
                    maxHeight: "340px",
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "6px",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
                    zIndex: 200,
                    overflow: "hidden",
                  }}
                >
                  {/* Search & Source Filter Header */}
                  <div
                    style={{
                      padding: "8px",
                      borderBottom: "1px solid var(--border-subtle)",
                      backgroundColor: "var(--bg-toolbar)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      <Search
                        style={{
                          position: "absolute",
                          left: "8px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: "12px",
                          height: "12px",
                          color: "var(--text-muted)",
                        }}
                      />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Search function or description..."
                        value={fnSearchQuery}
                        onChange={(e) => setFnSearchQuery(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "4px 8px 4px 26px",
                          fontSize: "11px",
                          backgroundColor: "var(--bg-surface)",
                          border: "1px solid var(--border-color)",
                          color: "var(--text-main)",
                          borderRadius: "4px",
                          outline: "none",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span
                        style={{ fontSize: "10px", color: "var(--text-muted)" }}
                      >
                        Source:
                      </span>
                      <select
                        value={fnSourceFilter}
                        onChange={(e) => setFnSourceFilter(e.target.value)}
                        style={{
                          flex: 1,
                          fontSize: "10px",
                          padding: "2px 4px",
                          backgroundColor: "var(--bg-surface)",
                          border: "1px solid var(--border-color)",
                          color: "var(--text-main)",
                          borderRadius: "3px",
                          cursor: "pointer",
                        }}
                      >
                        <option value="all">All Sources</option>
                        <option value="builtin">Built-in</option>
                        <option value="custom">Custom</option>
                        {allWorkspaceScripts
                          .filter(
                            (s) =>
                              s.id !== script?.id &&
                              s.functions &&
                              s.functions.length > 0,
                          )
                          .map((sc) => (
                            <option key={sc.id} value={`script:${sc.id}`}>
                              Script: {sc.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* Functions List */}
                  <div style={{ flex: 1, overflowY: "auto", padding: "4px" }}>
                    {filteredCandidateFunctions.length === 0 ? (
                      <div
                        style={{
                          padding: "16px",
                          textAlign: "center",
                          fontSize: "11px",
                          color: "var(--text-muted)",
                        }}
                      >
                        No matching functions found.
                      </div>
                    ) : (
                      filteredCandidateFunctions.map((fn) => {
                        const isAlreadyEmbedded = embeddedFunctions.some(
                          (e) => e.name === fn.name,
                        );

                        return (
                          <button
                            key={fn.id}
                            type="button"
                            onClick={() => handleInsertFunctionCode(fn)}
                            style={{
                              width: "100%",
                              textAlign: "left",
                              padding: "6px 8px",
                              fontSize: "11px",
                              backgroundColor: "transparent",
                              border: "none",
                              color: "var(--text-main)",
                              borderRadius: "4px",
                              cursor: "pointer",
                              display: "flex",
                              flexDirection: "column",
                              gap: "2px",
                              marginBottom: "2px",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "var(--bg-editor)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: 600,
                                  color: "var(--accent)",
                                  fontFamily: "var(--font-mono, monospace)",
                                }}
                              >
                                {fn.name}
                              </span>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "9px",
                                    padding: "1px 4px",
                                    borderRadius: "3px",
                                    backgroundColor:
                                      fn.source === "builtin"
                                        ? "rgba(16, 185, 129, 0.15)"
                                        : fn.source === "script"
                                          ? "rgba(168, 85, 247, 0.15)"
                                          : "rgba(59, 130, 246, 0.15)",
                                    color:
                                      fn.source === "builtin"
                                        ? "var(--accent)"
                                        : fn.source === "script"
                                          ? "var(--accent-purple)"
                                          : "var(--accent-blue)",
                                  }}
                                >
                                  {fn.source === "builtin"
                                    ? "Built-in"
                                    : fn.source === "script"
                                      ? fn.sourceScriptName
                                        ? `Script: ${fn.sourceScriptName}`
                                        : "Script"
                                      : "Custom"}
                                </span>
                                {isAlreadyEmbedded && (
                                  <span
                                    style={{
                                      fontSize: "9px",
                                      color: "var(--text-muted)",
                                    }}
                                  >
                                    (Added)
                                  </span>
                                )}
                              </div>
                            </div>
                            <span
                              style={{
                                fontSize: "10px",
                                color: "var(--text-muted)",
                                fontFamily: "var(--font-mono, monospace)",
                              }}
                            >
                              ({fn.params.join(", ")})
                            </span>
                            {fn.description && (
                              <span
                                style={{
                                  fontSize: "10px",
                                  color: "var(--text-muted)",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {fn.description}
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          ref={editorContainerRef}
          style={{
            flex: 1,
            border: "1px solid var(--border-color)",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        />
      </div>

      {/* Tab 3: Functions */}
      <div
        style={{
          display: editorTab === "functions" ? "flex" : "none",
          flexDirection: "column",
          gap: "12px",
          flex: 1,
          overflowY: "auto",
          paddingRight: "4px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-main)",
              }}
            >
              Embedded Helper Functions ({embeddedFunctions.length})
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Helper functions bundled into this script and available under{" "}
              <code>context.functions.&lt;name&gt;</code>.
            </div>
          </div>

          <button
            type="button"
            onClick={() => setEditorTab("script")}
            style={{
              padding: "4px 10px",
              fontSize: "11px",
              fontWeight: 500,
              backgroundColor: "var(--bg-editor)",
              border: "1px solid var(--border-color)",
              color: "var(--accent)",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add via Script Code</span>
          </button>
        </div>

        {embeddedFunctions.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: "12px",
              padding: "36px 16px",
              border: "1px dashed var(--border-color)",
              borderRadius: "6px",
            }}
          >
            No helper functions imported yet. In the &quot;Script Code&quot;
            tab, click &quot;+ Call Helper Function&quot; to pick and insert
            helper functions!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {embeddedFunctions.map((fn) => {
              const isUsed = usedFunctions.some((u) => u.name === fn.name);
              const isOrphaned = ScriptService.isOrphanedFunction(
                fn,
                allStandaloneFunctions,
                allWorkspaceScripts,
              );

              return (
                <div
                  key={fn.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    backgroundColor: "var(--bg-editor)",
                    border: `1px solid ${isOrphaned ? "rgba(239, 68, 68, 0.3)" : "var(--border-subtle)"}`,
                    borderRadius: "6px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Code2
                        className={`w-4 h-4 shrink-0 ${isOrphaned ? "text-red-400" : "text-[var(--accent)]"}`}
                      />
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: isOrphaned ? "#ef4444" : "var(--accent)",
                          fontFamily: "var(--font-mono, monospace)",
                        }}
                      >
                        {fn.name}
                      </span>
                      {fn.params && fn.params.length > 0 && (
                        <span
                          style={{
                            fontSize: "11px",
                            color: "var(--text-muted)",
                            fontFamily: "var(--font-mono, monospace)",
                          }}
                        >
                          ({fn.params.join(", ")})
                        </span>
                      )}

                      {/* Source Badge or Orphaned Badge */}
                      {isOrphaned ? (
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 600,
                            padding: "1px 6px",
                            borderRadius: "4px",
                            backgroundColor: "rgba(239, 68, 68, 0.15)",
                            color: "#ef4444",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                          }}
                          title="Function definition not found in script or local storage"
                        >
                          Orphaned
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: "10px",
                            padding: "1px 6px",
                            borderRadius: "4px",
                            backgroundColor:
                              fn.source === "builtin"
                                ? "rgba(16, 185, 129, 0.1)"
                                : fn.source === "script"
                                  ? "rgba(168, 85, 247, 0.1)"
                                  : "rgba(59, 130, 246, 0.1)",
                            color:
                              fn.source === "builtin"
                                ? "var(--accent)"
                                : fn.source === "script"
                                  ? "var(--accent-purple)"
                                  : "var(--accent-blue)",
                          }}
                        >
                          {fn.source === "builtin"
                            ? "Built-in"
                            : fn.source === "script"
                              ? fn.sourceScriptName
                                ? `Script: ${fn.sourceScriptName}`
                                : "Script"
                              : "Custom"}
                        </span>
                      )}
                    </div>

                    {fn.description && (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--text-muted)",
                          paddingLeft: "24px",
                        }}
                      >
                        {fn.description}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    {/* View / Preview Function button (hidden if orphaned) */}
                    {!isOrphaned && (
                      <button
                        type="button"
                        onClick={() => {
                          const resolved = ScriptService.resolveEmbeddedFunction(
                            fn,
                            allStandaloneFunctions,
                            allWorkspaceScripts,
                          );
                          setPreviewFunction(resolved);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          padding: "6px",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title="View function details and copy JSON"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}

                    {/* Delete button: visible when NOT used in script code OR when function is orphaned */}
                    {(!isUsed || isOrphaned) && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEmbeddedFunction(fn.name)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--accent-red)",
                          cursor: "pointer",
                          padding: "6px",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title={
                          isOrphaned
                            ? "Remove orphaned function from script"
                            : "Remove unused function from script"
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tab 4: Metadata */}
      <div
        style={{
          display: editorTab === "metadata" ? "flex" : "none",
          flexDirection: "column",
          gap: "10px",
          flex: 1,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr 1fr",
            gap: "10px",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                color: "var(--text-muted)",
                marginBottom: "4px",
              }}
            >
              Group / Category
            </label>
            <input
              type="text"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 8px",
                backgroundColor: "var(--bg-editor)",
                border: "1px solid var(--border-color)",
                color: "var(--text-main)",
                borderRadius: "4px",
                fontSize: "12px",
              }}
              placeholder="e.g. Text Tools, Formatting"
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                color: "var(--text-muted)",
                marginBottom: "4px",
              }}
            >
              Version
            </label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 8px",
                backgroundColor: "var(--bg-editor)",
                border: "1px solid var(--border-color)",
                color: "var(--text-main)",
                borderRadius: "4px",
                fontSize: "12px",
              }}
              placeholder="1.0.0"
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                color: "var(--text-muted)",
                marginBottom: "4px",
              }}
            >
              Author
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 8px",
                backgroundColor: "var(--bg-editor)",
                border: "1px solid var(--border-color)",
                color: "var(--text-main)",
                borderRadius: "4px",
                fontSize: "12px",
              }}
              placeholder="e.g. Trong / Contributor"
            />
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            backgroundColor: "var(--border-color)",
            margin: "2px 0",
          }}
        />

        {/* Sample Data Runner */}
        <SampleDataRunner
          sampleInput={sampleInput}
          onChangeSampleInput={(val) => {
            setSampleInput(val);
            setLastExecutedSuccess(false);
          }}
          sampleOutput={sampleOutput}
          onGenerate={handleGenerateSampleInput}
          onRun={handleRunTest}
          isRunning={isRunningTest}
          isVerified={lastExecutedSuccess && Boolean(sampleOutput)}
          error={testError}
          readOnly={false}
          inputPlaceholder="const inputs = { ... };\nreturn await run(inputs, context);"
        />
      </div>

      {/* Tab 5: JSON Mode */}
      <div
        style={{
          display: editorTab === "json" ? "flex" : "none",
          flexDirection: "column",
          gap: "8px",
          flex: 1,
          overflow: "hidden",
        }}
      >
        <JsonModeEditor
          title="Raw Script Definition (JSON)"
          subtitle="Edit raw JSON and click 'Apply' to sync back with form and auto-verify."
          readOnly={false}
          onCopy={handleCopyJson}
          isCopied={isCopiedJson}
          onApply={handleApplyJson}
          isApplying={isRunningTest}
          isApplied={isAppliedJson}
          error={jsonError}
          editorRef={jsonContainerRef}
          isWordWrap={isWordWrap}
          onToggleWordWrap={handleToggleWordWrap}
        />
      </div>

      {/* View Function Modal: Reusing standard FunctionEditor in readOnly mode */}
      {previewFunction && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: Z_INDEX.MODAL_SECONDARY,
            padding: "16px",
          }}
          onClick={() => setPreviewFunction(null)}
        >
          <div
            className="w-[920px] max-w-[95vw] h-[85vh] max-h-[85vh] bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg shadow-2xl flex flex-col overflow-hidden text-[var(--text-main)]"
            style={{
              boxShadow: "0 16px 40px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "12px 18px",
                borderBottom: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "var(--bg-app)",
                flexShrink: 0,
              }}
            >
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600 }}>
                View Function: {previewFunction.name}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewFunction(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "18px",
                  padding: "0 4px",
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Reuse FunctionEditor in readOnly mode */}
            <div
              style={{
                flex: 1,
                overflow: "hidden",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <FunctionEditor
                func={{
                  id: previewFunction.id,
                  name: previewFunction.name,
                  description: previewFunction.description || "",
                  params: previewFunction.params,
                  paramDefs: previewFunction.paramDefs,
                  code: previewFunction.code,
                  isBuiltin: previewFunction.source === "builtin",
                  createdAt: 0,
                  updatedAt: 0,
                }}
                readOnly={true}
                onCancel={() => setPreviewFunction(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Footer Action Buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "8px",
          paddingTop: "12px",
          borderTop: "1px solid var(--border-color)",
          marginTop: "12px",
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "6px 14px",
            fontSize: "12px",
            cursor: "pointer",
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-color)",
            color: "var(--text-main)",
            borderRadius: "4px",
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          style={{
            padding: "6px 16px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            backgroundColor: "var(--accent)",
            border: "none",
            color: "var(--text-on-accent)",
            borderRadius: "4px",
          }}
        >
          Save Script
        </button>
      </div>
    </form>
  );
};
