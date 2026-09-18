import React, { useEffect, useRef, useState } from "react";
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
import type {
  ScriptFunction,
  ScriptFunctionParamDef,
} from "../types/script.types";
import { useEditorStore } from "../../tabs/store";
import { useScriptStore } from "../store/scriptStore";
import { dialog } from "../../../shared/dialog/dialogStore";
import { FunctionService } from "../services/functionService";
import { SampleDataRunner } from "./common/SampleDataRunner";
import { JsonModeEditor } from "./common/JsonModeEditor";

interface FunctionEditorProps {
  func?: ScriptFunction;
  onSave?: (func: ScriptFunction) => void;
  onCancel: () => void;
  readOnly?: boolean;
}

const themeCompartment = new Compartment();
const jsonWordWrapCompartment = new Compartment();

export const FunctionEditor: React.FC<FunctionEditorProps> = ({
  func,
  onSave,
  onCancel,
  readOnly = false,
}) => {
  const isViewOnly = readOnly || Boolean(func?.isBuiltin);
  const [editorTab, setEditorTab] = useState<
    "info" | "script" | "metadata" | "json"
  >("info");

  // Tab 1: Info & Input
  const [name, setName] = useState(func?.name || "");
  const [description, setDescription] = useState(func?.description || "");
  const [paramDefs, setParamDefs] = useState<ScriptFunctionParamDef[]>(() => {
    if (func?.paramDefs && func.paramDefs.length > 0) {
      return func.paramDefs;
    }
    if (func?.params && func.params.length > 0) {
      return func.params.map((p) => ({ name: p, description: "" }));
    }
    return [];
  });

  // Tab 3: Metadata
  const [version, setVersion] = useState(func?.version || "1.0.0");
  const [author, setAuthor] = useState(func?.author || "");
  const [sampleInput, setSampleInput] = useState(func?.sampleInput || "");
  const [sampleOutput, setSampleOutput] = useState(func?.sampleOutput || "");

  // Test Run State in Metadata Tab
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [lastExecutedSuccess, setLastExecutedSuccess] = useState(
    Boolean(func?.sampleOutput),
  );

  // Tab 4: JSON Mode State
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isCopiedJson, setIsCopiedJson] = useState(false);
  const [isAppliedJson, setIsAppliedJson] = useState(false);
  const [isWordWrap, setIsWordWrap] = useState(false);

  // Variable Menu in Script Code Tab
  const [isVarMenuOpen, setIsVarMenuOpen] = useState(false);

  const themeMode = useEditorStore((state) => state.settings.theme);
  const saveFunction = useScriptStore((state) => state.saveFunction);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);

  const jsonContainerRef = useRef<HTMLDivElement>(null);
  const jsonViewRef = useRef<EditorView | null>(null);

  const defaultCode = `// Function body: write logic returning the processed result
// e.g.: return text.trim().toLowerCase();
return '';
`;

  useEffect(() => {
    if (!editorContainerRef.current) return;

    const initialCode = func?.code || defaultCode;

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
        EditorView.editable.of(!isViewOnly),
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

  // Setup JSON Mode EditorView
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
        EditorView.editable.of(!isViewOnly),
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

  // Parameter Management
  const handleAddParam = () => {
    const newName = `param_${paramDefs.length + 1}`;
    setParamDefs([...paramDefs, { name: newName, description: "" }]);
  };

  const handleUpdateParam = (
    index: number,
    updates: Partial<ScriptFunctionParamDef>,
  ) => {
    const next = [...paramDefs];
    next[index] = { ...next[index], ...updates };
    setParamDefs(next);
  };

  const handleRemoveParam = (index: number) => {
    setParamDefs(paramDefs.filter((_, i) => i !== index));
  };

  // Insert Variable into Code Editor
  const handleInsertVariable = (varName: string) => {
    if (!editorViewRef.current) return;
    const view = editorViewRef.current;
    const { from, to } = view.state.selection.main;
    view.dispatch({
      changes: { from, to, insert: varName },
      selection: { anchor: from + varName.length },
    });
    view.focus();
    setIsVarMenuOpen(false);
  };

  // Generate Template for Sample Input
  const handleGenerateTemplate = () => {
    const snippet = FunctionService.generateSampleInputTemplate(
      name,
      paramDefs,
    );
    setSampleInput(snippet);
    setLastExecutedSuccess(false);
    setTestError(null);
  };

  // Test Run Function with Sample Input
  const handleRunTest = async () => {
    setTestError(null);
    setIsRunningTest(true);

    const fnName = name.trim() || "func";
    const code = editorViewRef.current
      ? editorViewRef.current.state.doc.toString()
      : func?.code || defaultCode;

    try {
      const res = await FunctionService.executeTestRun(
        fnName,
        code,
        paramDefs,
        sampleInput,
      );

      if (res.success) {
        setSampleOutput(res.output);
        setLastExecutedSuccess(true);

        // Lock-in sample input & output immediately into function metadata
        if (func?.id) {
          const cleanParams = FunctionService.sanitizeParamDefs(paramDefs);
          const updatedFunc: ScriptFunction = {
            ...func,
            name: name.trim() || func.name,
            description: description.trim() || func.description,
            params: cleanParams.map((p) => p.name),
            paramDefs: cleanParams,
            sampleInput: sampleInput.trim(),
            sampleOutput: res.output,
            code,
            updatedAt: Date.now(),
          };

          // Persist directly to store & IndexedDB
          await saveFunction(updatedFunc);
        }
      } else {
        setTestError(res.error || "Execution failed");
        setSampleOutput("");
        setLastExecutedSuccess(false);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setTestError(errMsg);
      setSampleOutput("");
      setLastExecutedSuccess(false);
    } finally {
      setIsRunningTest(false);
    }
  };

  // Helper to generate raw JSON data without sampleOutput
  const generateRawJsonString = () => {
    const code = editorViewRef.current
      ? editorViewRef.current.state.doc.toString()
      : func?.code || defaultCode;

    return FunctionService.toRawJsonString({
      name,
      description,
      version,
      author,
      paramDefs,
      sampleInput,
      code,
    });
  };

  // Sync state to JSON CodeMirror whenever switching to JSON tab
  const handleSwitchTab = (tab: "info" | "script" | "metadata" | "json") => {
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
      const parsed = FunctionService.parseRawJson(jsonText);

      // Update basic fields
      setName(parsed.name);
      setDescription(parsed.description);
      setVersion(parsed.version);
      setAuthor(parsed.author);
      setParamDefs(parsed.paramDefs);

      // Update Code in Script Code editor
      const newCode = parsed.code || defaultCode;
      if (editorViewRef.current) {
        editorViewRef.current.dispatch({
          changes: {
            from: 0,
            to: editorViewRef.current.state.doc.length,
            insert: newCode,
          },
        });
      }

      // Update Sample Input
      setSampleInput(parsed.sampleInput);

      // Trigger automatic Test Run if sampleInput is present
      if (parsed.sampleInput.trim().length > 0) {
        setIsRunningTest(true);
        setTestError(null);

        try {
          const res = await FunctionService.executeTestRun(
            parsed.name,
            newCode,
            parsed.paramDefs,
            parsed.sampleInput,
          );

          if (res.success) {
            setSampleOutput(res.output);
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
    if (isViewOnly) {
      onCancel();
      return;
    }

    if (!name.trim()) {
      await dialog.alert({
        title: "Validation Error",
        message: "Please enter a function name",
        variant: "warning",
      });
      return;
    }

    const cleanParams = FunctionService.sanitizeParamDefs(paramDefs);
    const paramNames = cleanParams.map((p) => p.name);

    const code = editorViewRef.current
      ? editorViewRef.current.state.doc.toString()
      : defaultCode;

    const functionData: ScriptFunction = {
      id:
        func?.id ||
        `fn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim(),
      description: description.trim(),
      params: paramNames,
      paramDefs: cleanParams,
      version: version.trim() || undefined,
      author: author.trim() || undefined,
      sampleInput: lastExecutedSuccess
        ? sampleInput.trim() || undefined
        : undefined,
      sampleOutput: lastExecutedSuccess ? sampleOutput || undefined : undefined,
      code,
      isBuiltin: func?.isBuiltin || false,
      createdAt: func?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onSave?.(functionData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: "12px",
        color: "var(--text-main)",
      }}
    >
      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid var(--border-color)",
          paddingBottom: "8px",
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
        <div>
          <label
            style={{
              display: "block",
              fontSize: "11px",
              color: "var(--text-muted)",
              marginBottom: "4px",
            }}
          >
            Function Name *
          </label>
          <input
            type="text"
            required
            disabled={isViewOnly}
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
            placeholder="e.g. reverseString, formatSlug"
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
            Description
          </label>
          <textarea
            rows={2}
            disabled={isViewOnly}
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
            placeholder="Brief summary of function behavior"
          />
        </div>

        {/* Input Parameters Section */}
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
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--text-main)",
                }}
              >
                Input Parameters ({paramDefs.length})
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                Define parameter names and descriptions for this helper
                function.
              </div>
            </div>

            {!isViewOnly && (
              <button
                type="button"
                onClick={handleAddParam}
                style={{
                  padding: "3px 8px",
                  fontSize: "11px",
                  fontWeight: 600,
                  backgroundColor: "var(--accent)",
                  border: "none",
                  color: "var(--text-on-accent)",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                + Add Parameter
              </button>
            )}
          </div>

          {paramDefs.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: "11px",
                padding: "16px 0",
              }}
            >
              No parameters configured. Click &quot;+ Add Parameter&quot; to
              define arguments (e.g. str, delimiter).
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                maxHeight: "220px",
                overflowY: "auto",
              }}
            >
              {paramDefs.map((param, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 2fr auto",
                    gap: "8px",
                    alignItems: "center",
                    padding: "8px",
                    backgroundColor: "var(--bg-editor)",
                    borderRadius: "4px",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <input
                    type="text"
                    disabled={isViewOnly}
                    placeholder="Parameter name"
                    value={param.name}
                    onChange={(e) =>
                      handleUpdateParam(idx, { name: e.target.value })
                    }
                    style={{
                      padding: "5px 8px",
                      fontSize: "12px",
                      fontFamily: "var(--font-mono, monospace)",
                      backgroundColor: "var(--bg-surface)",
                      border: "1px solid var(--border-color)",
                      color: "var(--text-main)",
                      borderRadius: "3px",
                    }}
                  />
                  <input
                    type="text"
                    disabled={isViewOnly}
                    placeholder="Description (e.g. Input string to format)"
                    value={param.description || ""}
                    onChange={(e) =>
                      handleUpdateParam(idx, { description: e.target.value })
                    }
                    style={{
                      padding: "5px 8px",
                      fontSize: "12px",
                      backgroundColor: "var(--bg-surface)",
                      border: "1px solid var(--border-color)",
                      color: "var(--text-main)",
                      borderRadius: "3px",
                    }}
                  />
                  {!isViewOnly && (
                    <button
                      type="button"
                      onClick={() => handleRemoveParam(idx)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--accent-red)",
                        cursor: "pointer",
                        fontSize: "14px",
                        padding: "4px",
                      }}
                      title="Remove Parameter"
                    >
                      ✕
                    </button>
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
          gap: "8px",
          flex: 1,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <label style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Function Body (Async/Sync): <code>return &lt;result&gt;;</code>
          </label>

          {/* Action Button: Insert Variable */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              disabled={isViewOnly}
              onClick={() => setIsVarMenuOpen(!isVarMenuOpen)}
              style={{
                padding: "3px 10px",
                fontSize: "11px",
                cursor: isViewOnly ? "default" : "pointer",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                color: "var(--accent-blue)",
                fontWeight: 600,
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                opacity: isViewOnly ? 0.5 : 1,
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
                  width: "200px",
                  maxHeight: "180px",
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
                  Parameters
                </div>
                {paramDefs.length === 0 ? (
                  <div
                    style={{
                      padding: "8px",
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      textAlign: "center",
                    }}
                  >
                    No parameters defined
                  </div>
                ) : (
                  paramDefs.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleInsertVariable(p.name)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "5px 8px",
                        fontSize: "11px",
                        fontFamily: "var(--font-mono, monospace)",
                        backgroundColor: "transparent",
                        border: "none",
                        color: "var(--text-main)",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--bg-editor)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {p.name}
                    </button>
                  ))
                )}
              </div>
            )}
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

      {/* Tab 3: Metadata & Live Testing */}
      <div
        style={{
          display: editorTab === "metadata" ? "flex" : "none",
          flexDirection: "column",
          gap: "10px",
          flex: 1,
          overflow: "hidden",
        }}
      >
        {/* Version & Author row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr",
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
              Version
            </label>
            <input
              type="text"
              disabled={isViewOnly}
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
              disabled={isViewOnly}
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

        {/* Real Sample Input & Verified Sample Output - via SampleDataRunner */}
        <SampleDataRunner
          sampleInput={sampleInput}
          onChangeSampleInput={(val) => {
            setSampleInput(val);
            setLastExecutedSuccess(false);
          }}
          sampleOutput={sampleOutput}
          onGenerate={handleGenerateTemplate}
          onRun={handleRunTest}
          isRunning={isRunningTest}
          isVerified={lastExecutedSuccess && Boolean(sampleOutput)}
          error={testError}
          readOnly={isViewOnly}
          inputPlaceholder='["example text", "-"]'
        />
      </div>

      {/* Tab 4: JSON Mode - via JsonModeEditor */}
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
          title="Raw Function Definition (JSON)"
          subtitle="Edit raw JSON and click 'Apply' to sync back with form and auto-verify."
          readOnly={isViewOnly}
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

      {/* Footer Buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "8px",
          paddingTop: "8px",
          borderTop: "1px solid var(--border-color)",
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
          {isViewOnly ? "Close" : "Cancel"}
        </button>
        {!isViewOnly && (
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
            Save Function
          </button>
        )}
      </div>
    </form>
  );
};
