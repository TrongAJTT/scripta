import React, { useState, useRef, useMemo } from "react";
import { useScriptStore } from "../store/scriptStore";
import type { ScriptMetadata, ScriptFunction } from "../types/script.types";
import { ScriptCard } from "./ScriptCard";
import { FunctionCard } from "./FunctionCard";
import { ScriptEditor } from "./ScriptEditor";
import { FunctionEditor } from "./FunctionEditor";
import { AddTemplateModal } from "./AddTemplateModal";
import { MODAL_LAYOUT } from "../../../shared/constants/modal";
import { Z_INDEX } from "../../../core/constants/zIndex";
import { dialog } from "../../../shared/dialog/dialogStore";
import {
  SearchableFilterDropdown,
  type SearchableFilterItem,
} from "../../../shared/components/SearchableFilterDropdown";
import { FunctionService } from "../services/functionService";
import { ScriptService } from "../services/scriptService";

interface ScriptManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunScript: (script: ScriptMetadata) => void;
}

export const ScriptManagerModal: React.FC<ScriptManagerModalProps> = ({
  isOpen,
  onClose,
  onRunScript,
}) => {
  const [activeTab, setActiveTab] = useState<"scripts" | "functions">(
    "scripts",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [fnSourceFilter, setFnSourceFilter] = useState("All");
  const [editingScript, setEditingScript] = useState<
    ScriptMetadata | null | "new"
  >(null);
  const [editingFunction, setEditingFunction] = useState<
    ScriptFunction | null | "new"
  >(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Drag & Drop reordering state (mouse + touch)
  const [draggedScriptId, setDraggedScriptId] = useState<string | null>(null);
  const touchStartY = useRef<number>(0);
  const touchScriptId = useRef<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const scripts = useScriptStore((state) => state.scripts);
  const functions = useScriptStore((state) => state.functions);
  const removeScriptDef = useScriptStore((state) => state.removeScriptDef);
  const reorderScripts = useScriptStore((state) => state.reorderScripts);
  const addBuiltinTemplates = useScriptStore(
    (state) => state.addBuiltinTemplates,
  );
  const renameGroup = useScriptStore((state) => state.renameGroup);
  const deleteGroup = useScriptStore((state) => state.deleteGroup);
  const collapsedGroups = useScriptStore((state) => state.collapsedGroups);
  const toggleGroupCollapse = useScriptStore(
    (state) => state.toggleGroupCollapse,
  );

  // Group rename action using global dialog input
  const handleRenameGroupClick = async (oldName: string) => {
    const newName = await dialog.prompt({
      title: "Rename Script Folder",
      message: `Enter new name for folder "${oldName}":`,
      initialValue: oldName,
      placeholder: "Folder name...",
      confirmText: "Save",
      validate: (val) => {
        const trimmed = val.trim();
        if (!trimmed) return "Folder name cannot be empty";
        return null;
      },
    });

    if (newName && newName.trim() && newName.trim() !== oldName) {
      await renameGroup(oldName, newName.trim());
    }
  };
  const exportJSON = useScriptStore((state) => state.exportJSON);
  const importJSON = useScriptStore((state) => state.importJSON);

  const handleClose = () => {
    setEditingScript(null);
    setEditingFunction(null);
    setIsTemplateModalOpen(false);
    setDraggedScriptId(null);
    onClose();
  };

  // Filter items
  const filteredScripts = scripts.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.group && s.group.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  // Available sources for functions filter dropdown
  const functionSourceFilterItems = useMemo<SearchableFilterItem[]>(() => {
    return [
      {
        id: "builtin",
        name: "Built-in Functions",
        count: functions.filter((f) => f.isBuiltin).length,
      },
      {
        id: "custom",
        name: "Custom Functions",
        count: functions.filter((f) => !f.isBuiltin).length,
      },
      ...scripts
        .filter((s) => s.functions && s.functions.length > 0)
        .map((s) => ({
          id: `script:${s.id}`,
          name: `Script: ${s.name}`,
          count: s.functions!.length,
        })),
    ];
  }, [functions, scripts]);

  // Compute filtered functions based on search and source filter
  const filteredFunctions = useMemo(() => {
    let sourceFns: ScriptFunction[] = [];
    if (fnSourceFilter === "All" || !fnSourceFilter) {
      sourceFns = functions;
    } else if (fnSourceFilter === "builtin") {
      sourceFns = functions.filter((f) => f.isBuiltin);
    } else if (fnSourceFilter === "custom") {
      sourceFns = functions.filter((f) => !f.isBuiltin);
    } else if (fnSourceFilter.startsWith("script:")) {
      const scriptId = fnSourceFilter.replace("script:", "");
      const targetScript = scripts.find((s) => s.id === scriptId);
      sourceFns = (targetScript?.functions || []).map((sfn) => ({
        id: sfn.id,
        name: sfn.name,
        description:
          sfn.description || `Function in script "${targetScript?.name}"`,
        params: sfn.params,
        paramDefs: sfn.paramDefs,
        code: sfn.code,
        isBuiltin: sfn.source === "builtin",
        createdAt: targetScript?.createdAt || 0,
        updatedAt: targetScript?.updatedAt || 0,
      }));
    } else {
      sourceFns = functions;
    }

    return FunctionService.filterFunctions(sourceFns, searchQuery);
  }, [functions, scripts, fnSourceFilter, searchQuery]);

  // Group scripts by group name
  const groupedScripts: Record<string, ScriptMetadata[]> = {};
  const ungroupedScripts: ScriptMetadata[] = [];

  for (const sc of filteredScripts) {
    if (sc.group && sc.group.trim()) {
      const grp = sc.group.trim();
      if (!groupedScripts[grp]) groupedScripts[grp] = [];
      groupedScripts[grp].push(sc);
    } else {
      ungroupedScripts.push(sc);
    }
  }

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedScriptId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropOnScript = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedScriptId || draggedScriptId === targetId) {
      setDraggedScriptId(null);
      return;
    }

    const fromIndex = scripts.findIndex((s) => s.id === draggedScriptId);
    const toIndex = scripts.findIndex((s) => s.id === targetId);
    if (fromIndex < 0 || toIndex < 0) {
      setDraggedScriptId(null);
      return;
    }

    const next = [...scripts];
    const [moved] = next.splice(fromIndex, 1);

    // If target script is in a group, automatically adopt target group
    const targetScript = scripts[toIndex];
    const updatedMoved = { ...moved, group: targetScript.group };

    next.splice(toIndex, 0, updatedMoved);
    setDraggedScriptId(null);
    await reorderScripts(next);
  };

  // Mobile Touch Drag Handlers
  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    touchStartY.current = e.touches[0].clientY;
    touchScriptId.current = id;
    setDraggedScriptId(id);
  };

  const handleTouchEnd = async (e: React.TouchEvent) => {
    if (!touchScriptId.current) return;
    const endY = e.changedTouches[0].clientY;
    const diffY = endY - touchStartY.current;

    // If dragged noticeably vertically (> 40px), move by 1 position
    if (Math.abs(diffY) > 40) {
      const fromIndex = scripts.findIndex(
        (s) => s.id === touchScriptId.current,
      );
      if (fromIndex >= 0) {
        const toIndex = diffY > 0 ? fromIndex + 1 : fromIndex - 1;
        if (toIndex >= 0 && toIndex < scripts.length) {
          const next = [...scripts];
          const [moved] = next.splice(fromIndex, 1);
          next.splice(toIndex, 0, moved);
          await reorderScripts(next);
        }
      }
    }

    touchScriptId.current = null;
    setDraggedScriptId(null);
  };

  // Delete Group Action
  const handleDeleteGroupClick = async (grpName: string) => {
    const confirmDelete = await dialog.confirm({
      title: "Delete Folder",
      message: `Do you want to delete the folder "${grpName}" and all scripts inside it?\n\n• Confirm to delete folder & scripts\n• Cancel to choose whether to keep scripts`,
      confirmText: "Delete Folder & Scripts",
      variant: "danger",
    });
    if (confirmDelete) {
      await deleteGroup(grpName, true);
    } else {
      // Prompt if user wants to dissolve folder without deleting scripts
      const confirmDissolve = await dialog.confirm({
        title: "Dissolve Folder",
        message: `Would you like to remove the folder "${grpName}" and keep its scripts as ungrouped?`,
        confirmText: "Remove Folder Only",
        variant: "info",
      });
      if (confirmDissolve) {
        await deleteGroup(grpName, false);
      }
    }
  };

  const handleExport = () => {
    const jsonStr = exportJSON();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `texteditor_scripts_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const res = await importJSON(text);
      await dialog.alert({
        title: "Import Successful",
        message: `Imported ${res.importedScripts} scripts and ${res.importedFunctions} functions successfully!`,
        variant: "success",
      });
    } catch (err) {
      await dialog.alert({
        title: "Import Failed",
        message: `Failed to import scripts: ${err instanceof Error ? err.message : String(err)}`,
        variant: "danger",
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.55)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: Z_INDEX.MODAL_BASE,
          backdropFilter: "blur(2px)",
        }}
      >
        <div
          className={`w-[920px] max-w-[95vw] ${MODAL_LAYOUT.CONTAINER_HEIGHT_CLASSES} bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg shadow-2xl flex flex-col overflow-hidden text-[var(--text-main)]`}
          style={{
            boxShadow: "0 12px 36px rgba(0, 0, 0, 0.45)",
          }}
        >
          {/* Header */}
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
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600 }}>
                {editingScript
                  ? editingScript === "new"
                    ? "New Script"
                    : `Edit Script: ${editingScript.name}`
                  : editingFunction
                    ? editingFunction === "new"
                      ? "New Helper Function"
                      : `Edit Function: ${editingFunction.name}`
                    : "Script Manager"}
              </h3>

              {!editingScript && !editingFunction && (
                <div
                  style={{
                    display: "flex",
                    gap: "4px",
                    backgroundColor: "var(--bg-editor)",
                    padding: "2px",
                    borderRadius: "6px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveTab("scripts")}
                    style={{
                      padding: "3px 12px",
                      fontSize: "12px",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      backgroundColor:
                        activeTab === "scripts"
                          ? "var(--accent)"
                          : "transparent",
                      color:
                        activeTab === "scripts"
                          ? "var(--text-on-accent)"
                          : "var(--text-muted)",
                      fontWeight: activeTab === "scripts" ? 600 : 400,
                    }}
                  >
                    Scripts ({scripts.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("functions")}
                    style={{
                      padding: "3px 12px",
                      fontSize: "12px",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      backgroundColor:
                        activeTab === "functions"
                          ? "var(--accent)"
                          : "transparent",
                      color:
                        activeTab === "functions"
                          ? "var(--text-on-accent)"
                          : "var(--text-muted)",
                      fontWeight: activeTab === "functions" ? 600 : 400,
                    }}
                  >
                    Functions ({functions.length})
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {!editingScript && !editingFunction && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: "4px 10px",
                      fontSize: "11px",
                      cursor: "pointer",
                      backgroundColor: "var(--bg-surface)",
                      border: "1px solid var(--border-color)",
                      color: "var(--text-main)",
                      borderRadius: "4px",
                    }}
                  >
                    Import JSON
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportFile}
                    accept=".json"
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    onClick={handleExport}
                    style={{
                      padding: "4px 10px",
                      fontSize: "11px",
                      cursor: "pointer",
                      backgroundColor: "var(--bg-surface)",
                      border: "1px solid var(--border-color)",
                      color: "var(--text-main)",
                      borderRadius: "4px",
                    }}
                  >
                    Export JSON
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={handleClose}
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
          </div>

          {/* Content Area */}
          <div
            style={{
              flex: 1,
              overflow: "hidden",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {editingScript ? (
              <ScriptEditor
                script={editingScript === "new" ? undefined : editingScript}
                onSave={async (saved) => {
                  await ScriptService.saveScript(saved);
                  setEditingScript(null);
                }}
                onCancel={() => setEditingScript(null)}
              />
            ) : editingFunction ? (
              <FunctionEditor
                func={editingFunction === "new" ? undefined : editingFunction}
                onSave={async (saved) => {
                  await FunctionService.saveFunction(saved);
                  setEditingFunction(null);
                }}
                onCancel={() => setEditingFunction(null)}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  gap: "12px",
                }}
              >
                {/* Toolbar: Search + Source Filter Dropdown + Add Template + New button */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "8px",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flex: 1,
                      maxWidth: "540px",
                    }}
                  >
                    <input
                      type="text"
                      placeholder={`Search ${activeTab} or folders...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        flex: 1,
                        maxWidth: "300px",
                        padding: "6px 10px",
                        fontSize: "12px",
                        backgroundColor: "var(--bg-editor)",
                        border: "1px solid var(--border-color)",
                        color: "var(--text-main)",
                        borderRadius: "4px",
                      }}
                    />

                    {activeTab === "functions" && (
                      <SearchableFilterDropdown
                        items={functionSourceFilterItems}
                        selectedId={fnSourceFilter}
                        onSelect={(id) => setFnSourceFilter(id)}
                        allOptionLabel="All Sources"
                        allCount={functions.length}
                        placeholder="Filter by Source..."
                        searchPlaceholder="Search source or script..."
                      />
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {activeTab === "scripts" && (
                      <button
                        type="button"
                        onClick={() => setIsTemplateModalOpen(true)}
                        style={{
                          padding: "6px 12px",
                          fontSize: "12px",
                          fontWeight: 500,
                          cursor: "pointer",
                          backgroundColor: "var(--bg-editor)",
                          border: "1px solid var(--border-color)",
                          color: "var(--accent)",
                          borderRadius: "4px",
                        }}
                      >
                        + Add Built-in Template
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (activeTab === "scripts") setEditingScript("new");
                        else setEditingFunction("new");
                      }}
                      style={{
                        padding: "6px 14px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        backgroundColor: "var(--accent)",
                        border: "none",
                        color: "var(--text-on-accent)",
                        borderRadius: "4px",
                      }}
                    >
                      + New {activeTab === "scripts" ? "Script" : "Function"}
                    </button>
                  </div>
                </div>

                {/* Items List */}
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                    paddingRight: "4px",
                  }}
                >
                  {activeTab === "scripts" ? (
                    filteredScripts.length > 0 ? (
                      <>
                        {/* 1. Only Display Real Folders / Groups */}
                        {Object.keys(groupedScripts).map((grpName) => {
                          const isCollapsed = !!collapsedGroups[grpName];
                          return (
                            <div
                              key={grpName}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
                              }}
                            >
                              {/* Folder Header with Expand/Collapse, Rename and Delete */}
                              <div
                                onClick={() => toggleGroupCollapse(grpName)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  paddingBottom: "4px",
                                  borderBottom:
                                    "1px solid var(--border-subtle)",
                                  cursor: "pointer",
                                  userSelect: "none",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                  }}
                                >
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      width: "14px",
                                      height: "14px",
                                      fontSize: "9px",
                                      color: "var(--text-muted)",
                                      transition: "transform 0.15s ease",
                                      transform: isCollapsed
                                        ? "rotate(-90deg)"
                                        : "rotate(0deg)",
                                    }}
                                  >
                                    ▼
                                  </span>
                                  <span style={{ fontSize: "13px" }}>
                                    {isCollapsed ? "📁" : "📂"}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "11px",
                                      fontWeight: 600,
                                      color: "var(--text-muted)",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.05em",
                                    }}
                                  >
                                    {grpName} ({groupedScripts[grpName].length})
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      void handleRenameGroupClick(grpName);
                                    }}
                                    title="Rename folder"
                                    style={{
                                      background: "none",
                                      border: "none",
                                      color: "var(--text-muted)",
                                      cursor: "pointer",
                                      fontSize: "11px",
                                      padding: "0 4px",
                                    }}
                                  >
                                    ✎
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      void handleDeleteGroupClick(grpName);
                                    }}
                                    title="Delete folder"
                                    style={{
                                      background: "none",
                                      border: "none",
                                      color: "#f87171",
                                      cursor: "pointer",
                                      fontSize: "11px",
                                      padding: "0 4px",
                                    }}
                                  >
                                    🗑
                                  </button>
                                </div>
                              </div>

                              {/* Scripts inside folder with Drag & Drop */}
                              {!isCollapsed && (
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "6px",
                                  }}
                                >
                                  {groupedScripts[grpName].map((s) => (
                                    <ScriptCard
                                      key={s.id}
                                      script={s}
                                      isDragging={draggedScriptId === s.id}
                                      onDragStart={(e) =>
                                        handleDragStart(e, s.id)
                                      }
                                      onDragOver={handleDragOver}
                                      onDrop={(e) =>
                                        handleDropOnScript(e, s.id)
                                      }
                                      onTouchStart={(e) =>
                                        handleTouchStart(e, s.id)
                                      }
                                      onTouchEnd={handleTouchEnd}
                                      onRun={(selected) =>
                                        onRunScript(selected)
                                      }
                                      onEdit={(selected) =>
                                        setEditingScript(selected)
                                      }
                                      onDelete={async (id) => {
                                        const confirmed = await dialog.confirm({
                                          title: "Delete Script",
                                          message:
                                            "Are you sure you want to delete this script?",
                                          confirmText: "Delete",
                                          variant: "danger",
                                        });
                                        if (confirmed) {
                                          removeScriptDef(id);
                                        }
                                      }}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* 2. Standalone Ungrouped Scripts (NO FOLDER HEADER) */}
                        {ungroupedScripts.length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "6px",
                              marginTop:
                                Object.keys(groupedScripts).length > 0
                                  ? "6px"
                                  : 0,
                            }}
                          >
                            {ungroupedScripts.map((s) => (
                              <ScriptCard
                                key={s.id}
                                script={s}
                                isDragging={draggedScriptId === s.id}
                                onDragStart={(e) => handleDragStart(e, s.id)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDropOnScript(e, s.id)}
                                onTouchStart={(e) => handleTouchStart(e, s.id)}
                                onTouchEnd={handleTouchEnd}
                                onRun={(selected) => onRunScript(selected)}
                                onEdit={(selected) =>
                                  setEditingScript(selected)
                                }
                                onDelete={async (id) => {
                                  const confirmed = await dialog.confirm({
                                    title: "Delete Script",
                                    message:
                                      "Are you sure you want to delete this script?",
                                    confirmText: "Delete",
                                    variant: "danger",
                                  });
                                  if (confirmed) {
                                    removeScriptDef(id);
                                  }
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div
                        style={{
                          textAlign: "center",
                          color: "var(--text-muted)",
                          marginTop: "40px",
                        }}
                      >
                        No scripts found. Click "+ Add Built-in Template" or "+
                        New Script" to get started.
                      </div>
                    )
                  ) : filteredFunctions.length > 0 ? (
                    filteredFunctions.map((f) => (
                      <FunctionCard
                        key={f.id}
                        func={f}
                        onEdit={(selected) => setEditingFunction(selected)}
                        onDelete={async (id) => {
                          const confirmed = await dialog.confirm({
                            title: "Delete Function",
                            message:
                              "Are you sure you want to delete this helper function?",
                            confirmText: "Delete",
                            variant: "danger",
                          });
                          if (confirmed) {
                            if (fnSourceFilter.startsWith("script:")) {
                              const scriptId = fnSourceFilter.replace(
                                "script:",
                                "",
                              );
                              const targetScript = scripts.find(
                                (s) => s.id === scriptId,
                              );
                              if (targetScript && targetScript.functions) {
                                const updated = {
                                  ...targetScript,
                                  functions: targetScript.functions.filter(
                                    (fn) => fn.id !== id,
                                  ),
                                  updatedAt: Date.now(),
                                };
                                await ScriptService.saveScript(updated);
                              }
                            } else {
                              await FunctionService.deleteFunction(id);
                            }
                          }
                        }}
                      />
                    ))
                  ) : (
                    <div
                      style={{
                        textAlign: "center",
                        color: "var(--text-muted)",
                        marginTop: "40px",
                      }}
                    >
                      No functions found.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Built-in Template Modal */}
      <AddTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onAddTemplates={async (selectedTemplates, groupName) => {
          const count = await addBuiltinTemplates(selectedTemplates, groupName);
          await dialog.alert({
            title: "Templates Added",
            message: `Added ${count} template script${count > 1 ? "s" : ""} successfully!`,
            variant: "success",
          });
        }}
      />
    </>
  );
};
