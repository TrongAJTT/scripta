import React, { useState } from "react";
import type {
  CsvDecorationRule,
  CsvDecorationScope,
  CsvDecorationTarget,
  CsvMergeConfig,
  CsvMergeMode,
} from "../types/csvDecoration.types";
import { ModalWrapper } from "../../../shared/components/ModalWrapper";
import { ColorPickerPopover } from "../../../shared/components/ColorPickerPopover";
import {
  CardPicker,
  type CardPickerOption,
} from "../../../shared/components/CardPicker";
import { dialog } from "../../../shared/dialog/dialogStore";
import {
  Palette,
  Rows3,
  Plus,
  Trash2,
  Bold,
  Italic,
  Underline,
  GripVertical,
  Check,
  Eye,
  EyeOff,
  Sliders,
  Pencil,
  Info,
  Ban,
  ArrowDownToLine,
  GitMerge,
} from "lucide-react";

export interface CsvDecorationModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: CsvDecorationRule[];
  onChangeRules: (newRules: CsvDecorationRule[]) => void;
  mergeConfig: CsvMergeConfig;
  onChangeMerge: (newMerge: CsvMergeConfig) => void;
  columns: string[];
}

type TabType = "rules" | "merge";

export const CsvDecorationModal: React.FC<CsvDecorationModalProps> = ({
  isOpen,
  onClose,
  rules,
  onChangeRules,
  mergeConfig,
  onChangeMerge,
  columns,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("rules");

  // --- TAB 1: RULES STATE ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  const [draftLabel, setDraftLabel] = useState("");
  const [draftScope, setDraftScope] = useState<CsvDecorationScope>("all");
  const [draftScopeColumn, setDraftScopeColumn] = useState<string>(
    columns[0] || "",
  );
  const [draftPattern, setDraftPattern] = useState("");
  const [draftIsRegex, setDraftIsRegex] = useState(false);
  const [draftTarget, setDraftTarget] = useState<CsvDecorationTarget>("row");
  const [draftBgColor, setDraftBgColor] = useState<string | undefined>(
    "#fef08a80",
  );
  const [draftTextColor, setDraftTextColor] = useState<string | undefined>(
    undefined,
  );
  const [draftBold, setDraftBold] = useState(false);
  const [draftItalic, setDraftItalic] = useState(false);
  const [draftUnderline, setDraftUnderline] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const resetDraftForm = () => {
    setEditingRuleId(null);
    setDraftLabel("");
    setDraftPattern("");
    setDraftScope("all");
    setDraftScopeColumn(columns[0] || "");
    setDraftIsRegex(false);
    setDraftTarget("row");
    setDraftBgColor("#fef08a80");
    setDraftTextColor(undefined);
    setDraftBold(false);
    setDraftItalic(false);
    setDraftUnderline(false);
    setIsFormOpen(false);
  };

  const handleOpenAdd = () => {
    setEditingRuleId(null);
    setDraftLabel("");
    setDraftPattern("");
    setDraftScope("all");
    setDraftScopeColumn(columns[0] || "");
    setDraftIsRegex(false);
    setDraftTarget("row");
    setDraftBgColor("#fef08a80");
    setDraftTextColor(undefined);
    setDraftBold(false);
    setDraftItalic(false);
    setDraftUnderline(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (rule: CsvDecorationRule) => {
    setEditingRuleId(rule.id);
    setDraftLabel(rule.label || "");
    setDraftPattern(rule.pattern);
    setDraftScope(rule.scope);
    setDraftScopeColumn(rule.scopeColumn || columns[0] || "");
    setDraftIsRegex(Boolean(rule.isRegex));
    setDraftTarget(rule.target);
    setDraftBgColor(rule.style.background);
    setDraftTextColor(rule.style.color);
    setDraftBold(Boolean(rule.style.bold));
    setDraftItalic(Boolean(rule.style.italic));
    setDraftUnderline(Boolean(rule.style.underline));
    setIsFormOpen(true);
  };

  const handleToggleRule = (id: string) => {
    onChangeRules(
      rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
    );
  };

  const handleDeleteRule = async (rule: CsvDecorationRule) => {
    const patternName = rule.isRegex
      ? `/${rule.pattern}/`
      : `"${rule.pattern}"`;
    const confirmed = await dialog.confirm({
      title: "Delete Decoration Rule",
      message: `Are you sure you want to remove the rule for ${patternName}?`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });

    if (confirmed) {
      if (editingRuleId === rule.id) {
        resetDraftForm();
      }
      onChangeRules(rules.filter((r) => r.id !== rule.id));
    }
  };

  const handleUpdateRuleStyle = (
    id: string,
    updates: Partial<CsvDecorationRule["style"]>,
  ) => {
    onChangeRules(
      rules.map((r) =>
        r.id === id ? { ...r, style: { ...r.style, ...updates } } : r,
      ),
    );
  };

  const handleSaveForm = () => {
    if (!draftPattern.trim()) return;

    if (editingRuleId) {
      onChangeRules(
        rules.map((r) => {
          if (r.id !== editingRuleId) return r;
          return {
            ...r,
            label: draftLabel.trim() || undefined,
            scope: draftScope,
            scopeColumn: draftScope === "column" ? draftScopeColumn : undefined,
            pattern: draftPattern,
            isRegex: draftIsRegex,
            target: draftTarget,
            style: {
              background: draftBgColor,
              color: draftTextColor,
              bold: draftBold || undefined,
              italic: draftItalic || undefined,
              underline: draftUnderline || undefined,
            },
          };
        }),
      );
    } else {
      const newRule: CsvDecorationRule = {
        id: `dec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        enabled: true,
        label: draftLabel.trim() || undefined,
        scope: draftScope,
        scopeColumn: draftScope === "column" ? draftScopeColumn : undefined,
        pattern: draftPattern,
        isRegex: draftIsRegex,
        target: draftTarget,
        style: {
          background: draftBgColor,
          color: draftTextColor,
          bold: draftBold || undefined,
          italic: draftItalic || undefined,
          underline: draftUnderline || undefined,
        },
      };
      onChangeRules([...rules, newRule]);
    }

    resetDraftForm();
  };

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) return;

    const reordered = [...rules];
    const [moved] = reordered.splice(draggedIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    setDraggedIdx(targetIdx);
    onChangeRules(reordered);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  // --- TAB 2: MERGE LOGIC ---
  const handleMergeModeChange = (mode: CsvMergeMode) => {
    onChangeMerge({
      mode,
      idColumn:
        mode === "id" ? mergeConfig.idColumn || columns[0] || "" : undefined,
    });
  };

  const handleIdColumnChange = (idColumn: string) => {
    onChangeMerge({
      ...mergeConfig,
      mode: "id",
      idColumn,
    });
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="CSV Visual Decoration & Layout"
      icon={<Palette className="w-5 h-5 text-[var(--accent)]" />}
      subtitle="Customize row/cell highlights and automated row merging"
      maxWidthClass="max-w-3xl"
      footer={
        <div className="flex items-center justify-between w-full text-xs">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <span className="font-mono text-[11px]">
              {rules.length} {rules.length === 1 ? "rule" : "rules"} active
            </span>
            <span>•</span>
            <span className="text-[11px]">
              Merge:{" "}
              <strong className="text-[var(--text-main)] font-semibold">
                {mergeConfig.mode === "none"
                  ? "Disabled"
                  : mergeConfig.mode === "empty"
                    ? "If Empty"
                    : `By ID (${mergeConfig.idColumn || "N/A"})`}
              </strong>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md font-medium bg-[var(--accent)] text-[var(--bg-app)] hover:opacity-90 active:scale-95 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      }
    >
      <div className="p-5 flex flex-col gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-[var(--border-subtle)] pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("rules")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
              activeTab === "rules"
                ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-elevated)]"
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Highlight Rules</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[var(--bg-app)] text-[var(--text-muted)]">
              {rules.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("merge")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
              activeTab === "merge"
                ? "bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] border border-[var(--accent-blue)]/30"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-elevated)]"
            }`}
          >
            <Rows3 className="w-3.5 h-3.5" />
            <span>Auto-Merge Rows</span>
            {mergeConfig.mode !== "none" && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-[var(--accent-blue)] text-white">
                ON
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: HIGHLIGHT RULES CONTENT */}
        {activeTab === "rules" && (
          <div className="space-y-3">
            {/* Top Toolbar for Rules */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">
                Define visual styles based on pattern matching. Rules higher in
                the list take precedence.
              </span>
              {!isFormOpen && (
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-[var(--accent)] text-[var(--bg-app)] hover:opacity-90 active:scale-95 transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Rule</span>
                </button>
              )}
            </div>

            {/* Inline Add / Edit Form */}
            {isFormOpen && (
              <div className="p-3.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--text-highlight)] flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[var(--accent)]" />
                    {editingRuleId
                      ? "Edit Decoration Rule"
                      : "New Decoration Rule"}
                  </span>
                  <button
                    type="button"
                    onClick={resetDraftForm}
                    className="text-[11px] text-[var(--text-muted)] hover:text-rose-400 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
                  {/* Pattern Input */}
                  <div className="space-y-1 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                        Highlight Pattern
                      </label>
                      <label className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draftIsRegex}
                          onChange={(e) => setDraftIsRegex(e.target.checked)}
                          className="rounded border-[var(--border-color)] text-[var(--accent)]"
                        />
                        <span>Regex</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      value={draftPattern}
                      onChange={(e) => setDraftPattern(e.target.value)}
                      placeholder="e.g. 'FAILED' or '^[0-9]+$'"
                      className="w-full px-2 py-1 text-xs font-mono rounded bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>

                  {/* Scope */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                      Scan Scope
                    </label>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={draftScope}
                        onChange={(e) =>
                          setDraftScope(e.target.value as CsvDecorationScope)
                        }
                        className="px-2 py-1 text-xs rounded bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)] flex-1"
                      >
                        <option value="all">All Columns</option>
                        <option value="column">Specific Column</option>
                      </select>
                      {draftScope === "column" && (
                        <select
                          value={draftScopeColumn}
                          onChange={(e) => setDraftScopeColumn(e.target.value)}
                          className="max-w-[110px] px-1.5 py-1 text-xs rounded bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)] truncate"
                          title="Select column to scan"
                        >
                          {columns.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Target */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                      Apply Target
                    </label>
                    <select
                      value={draftTarget}
                      onChange={(e) =>
                        setDraftTarget(e.target.value as CsvDecorationTarget)
                      }
                      className="w-full px-2 py-1 text-xs rounded bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)]"
                    >
                      <option value="row">Entire Row</option>
                      <option value="cell">Matching Cell(s)</option>
                      <option value="index">Row Number Cell (#)</option>
                    </select>
                  </div>
                </div>

                {/* Style Row */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[var(--text-muted)]">
                      Background:
                    </span>
                    <ColorPickerPopover
                      value={draftBgColor}
                      onChange={setDraftBgColor}
                      label="Row/Cell Background"
                      defaultColor="#fef08a80"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[var(--text-muted)]">
                      Text:
                    </span>
                    <ColorPickerPopover
                      value={draftTextColor}
                      onChange={setDraftTextColor}
                      label="Font Color"
                      defaultColor="#ef4444"
                    />
                  </div>

                  <div className="flex items-center gap-1 border border-[var(--border-color)] rounded p-0.5 bg-[var(--bg-surface)]">
                    <button
                      type="button"
                      onClick={() => setDraftBold((v) => !v)}
                      className={`p-1 rounded cursor-pointer transition ${draftBold ? "bg-[var(--accent)] text-[var(--bg-app)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
                      title="Bold"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraftItalic((v) => !v)}
                      className={`p-1 rounded cursor-pointer transition ${draftItalic ? "bg-[var(--accent)] text-[var(--bg-app)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
                      title="Italic"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraftUnderline((v) => !v)}
                      className={`p-1 rounded cursor-pointer transition ${draftUnderline ? "bg-[var(--accent)] text-[var(--bg-app)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
                      title="Underline"
                    >
                      <Underline className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={draftLabel}
                    onChange={(e) => setDraftLabel(e.target.value)}
                    placeholder="Rule label (optional)"
                    className="px-2 py-1 text-xs rounded bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] flex-1 min-w-[120px] focus:outline-none focus:border-[var(--accent)]"
                  />

                  <button
                    type="button"
                    disabled={!draftPattern.trim()}
                    onClick={handleSaveForm}
                    className="flex items-center gap-1 px-3 py-1 rounded bg-[var(--accent)] text-[var(--bg-app)] text-xs font-semibold hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{editingRuleId ? "Update Rule" : "Save Rule"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* List of Rules */}
            <div className="max-h-[300px] overflow-y-auto rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] divide-y divide-[var(--border-subtle)]">
              {rules.length === 0 ? (
                <div className="p-8 text-center text-[var(--text-muted)]">
                  <Palette className="w-8 h-8 stroke-[1.2] text-[var(--text-subtle)] mx-auto mb-2" />
                  <p className="text-xs font-medium text-[var(--text-main)]">
                    No Decoration Rules Defined
                  </p>
                  <p className="text-[11px] text-[var(--text-subtle)] mt-1">
                    Click &quot;Add Rule&quot; to highlight cells or rows based
                    on pattern matching.
                  </p>
                </div>
              ) : (
                rules.map((rule, idx) => (
                  <div
                    key={rule.id}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center justify-between px-3 py-2 hover:bg-[var(--bg-surface-elevated)]/50 transition ${
                      draggedIdx === idx ? "opacity-40 bg-[var(--bg-app)]" : ""
                    } ${!rule.enabled ? "opacity-50" : ""} ${
                      editingRuleId === rule.id
                        ? "bg-[var(--accent)]/10 border-l-2 border-[var(--accent)]"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="cursor-grab active:cursor-grabbing text-[var(--text-subtle)] hover:text-[var(--text-main)]"
                        title="Drag to reorder rule priority"
                      >
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleRule(rule.id)}
                        className="text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                        title={rule.enabled ? "Disable rule" : "Enable rule"}
                      >
                        {rule.enabled ? (
                          <Eye className="w-3.5 h-3.5 text-[var(--accent)]" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-[var(--text-subtle)]" />
                        )}
                      </button>

                      <span className="text-[10px] font-mono text-[var(--text-subtle)]">
                        #{idx + 1}
                      </span>

                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="font-mono text-xs px-1.5 py-0.5 rounded bg-[var(--bg-app)] border border-[var(--border-subtle)] text-[var(--text-highlight)] truncate max-w-[140px]"
                          title={`Pattern: ${rule.pattern}`}
                        >
                          {rule.isRegex
                            ? `/${rule.pattern}/`
                            : `"${rule.pattern}"`}
                        </span>

                        {rule.label && (
                          <span className="text-[11px] text-[var(--text-muted)] truncate max-w-[120px]">
                            {rule.label}
                          </span>
                        )}
                      </div>

                      <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-[var(--bg-app)] border border-[var(--border-subtle)] text-[var(--text-muted)] truncate max-w-[90px]">
                        {rule.scope === "all"
                          ? "All"
                          : rule.scopeColumn || "Column"}
                      </span>

                      <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-[var(--bg-app)] border border-[var(--border-subtle)] text-[var(--accent)]">
                        {rule.target === "row"
                          ? "Row"
                          : rule.target === "cell"
                            ? "Cell"
                            : "Index (#)"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <ColorPickerPopover
                        value={rule.style.background}
                        onChange={(color) =>
                          handleUpdateRuleStyle(rule.id, { background: color })
                        }
                        label="Background Color"
                        defaultColor="#fef08a80"
                      />

                      <ColorPickerPopover
                        value={rule.style.color}
                        onChange={(color) =>
                          handleUpdateRuleStyle(rule.id, { color })
                        }
                        label="Text Color"
                        defaultColor="#ef4444"
                      />

                      <div className="flex items-center gap-0.5 border border-[var(--border-subtle)] rounded p-0.5 bg-[var(--bg-app)]">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateRuleStyle(rule.id, {
                              bold: !rule.style.bold,
                            })
                          }
                          className={`p-0.5 rounded cursor-pointer ${
                            rule.style.bold
                              ? "bg-[var(--accent)] text-[var(--bg-app)]"
                              : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                          }`}
                          title="Bold"
                        >
                          <Bold className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateRuleStyle(rule.id, {
                              italic: !rule.style.italic,
                            })
                          }
                          className={`p-0.5 rounded cursor-pointer ${
                            rule.style.italic
                              ? "bg-[var(--accent)] text-[var(--bg-app)]"
                              : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                          }`}
                          title="Italic"
                        >
                          <Italic className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateRuleStyle(rule.id, {
                              underline: !rule.style.underline,
                            })
                          }
                          className={`p-0.5 rounded cursor-pointer ${
                            rule.style.underline
                              ? "bg-[var(--accent)] text-[var(--bg-app)]"
                              : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                          }`}
                          title="Underline"
                        >
                          <Underline className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(rule)}
                        className={`p-1 rounded transition cursor-pointer ${
                          editingRuleId === rule.id
                            ? "text-[var(--accent)] bg-[var(--accent)]/15"
                            : "text-[var(--text-subtle)] hover:text-[var(--accent)] hover:bg-[var(--bg-app)]"
                        }`}
                        title="Edit rule parameters"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteRule(rule)}
                        className="p-1 rounded text-[var(--text-subtle)] hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                        title="Delete rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: AUTO-MERGE ROWS CONTENT */}
        {activeTab === "merge" && (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/40 text-xs">
              <Info className="w-4 h-4 text-[var(--accent-blue)] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-[var(--text-main)]">
                  About Auto-Merge Rows
                </p>
                <p className="text-[var(--text-muted)] leading-relaxed">
                  By default, the table operates in standard editing mode (no
                  cells are merged). When you activate{" "}
                  <strong>Merged View</strong> via the button at the table
                  footer, rows will be visually consolidated and locked in
                  read-only mode. Visual decoration rules will naturally cover
                  the topmost cell of each merged block.
                </p>
              </div>
            </div>

            {/* Merge Mode Options with CardPicker */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-[var(--text-highlight)] uppercase tracking-wider block">
                Select Merge Mode
              </label>

              {(() => {
                const mergeOptions: CardPickerOption<CsvMergeMode>[] = [
                  {
                    id: "none",
                    label: "Disabled (Default)",
                    description:
                      "Normal flat table structure. Inline cell editing and row operations remain fully enabled.",
                    icon: <Ban className="w-3.5 h-3.5" />,
                  },
                  {
                    id: "empty",
                    label: "Merge if Empty",
                    description:
                      "Automatically spans downward cells in the same column as long as they are blank or empty. Eliminates empty gaps without requiring a reference column, but column rowspans may be asymmetric.",
                    icon: <ArrowDownToLine className="w-3.5 h-3.5" />,
                  },
                  {
                    id: "id",
                    label: "Merge by ID Reference Column",
                    description:
                      "Merges consecutive rows sharing the exact same identifier value into balanced groups. For other columns, only downward blank cells are merged.",
                    icon: <GitMerge className="w-3.5 h-3.5" />,
                  },
                ];

                return (
                  <CardPicker
                    options={mergeOptions}
                    selectedId={mergeConfig.mode}
                    onChange={(mode) => handleMergeModeChange(mode)}
                    columns={1}
                  />
                );
              })()}

              {/* Reference Column Selector when mode is 'id' */}
              {mergeConfig.mode === "id" && (
                <div className="flex items-center gap-2.5 p-3 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/5 animate-fade-in">
                  <GitMerge className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-[var(--text-main)]">
                      Reference Column:
                    </span>
                    <select
                      value={mergeConfig.idColumn || columns[0] || ""}
                      onChange={(e) => handleIdColumnChange(e.target.value)}
                      className="px-2.5 py-1 text-xs rounded bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-highlight)] font-semibold focus:outline-none focus:border-[var(--accent)]"
                    >
                      {columns.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      (Rows with identical values in this column will be grouped
                      together)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
};
