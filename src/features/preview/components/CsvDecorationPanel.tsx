import React, { useState } from "react";
import type {
  CsvDecorationRule,
  CsvDecorationScope,
  CsvDecorationTarget,
} from "../types/csvDecoration.types";
import { ColorPickerPopover } from "../../../shared/components/ColorPickerPopover";
import { dialog } from "../../../shared/dialog/dialogStore";
import {
  Plus,
  Trash2,
  Bold,
  Italic,
  Underline,
  GripVertical,
  Check,
  X,
  Palette,
  Eye,
  EyeOff,
  Sliders,
  Pencil,
} from "lucide-react";

export interface CsvDecorationPanelProps {
  rules: CsvDecorationRule[];
  onChangeRules: (newRules: CsvDecorationRule[]) => void;
  onClose: () => void;
  columns: string[];
}

export const CsvDecorationPanel: React.FC<CsvDecorationPanelProps> = ({
  rules,
  onChangeRules,
  onClose,
  columns,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Form draft state (used for both Add and Edit)
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

  // Drag-and-drop state for rule ordering
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
      // Editing existing rule
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
      // Adding new rule
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

  // HTML5 Drag and drop handlers
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

  return (
    <div className="border-b border-[var(--border-color)] bg-[var(--bg-surface)] text-xs text-[var(--text-main)] select-none animate-in slide-in-from-top-2 duration-150">
      {/* Panel Top Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]/60">
        <div className="flex items-center gap-2">
          <Palette className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span className="font-semibold text-xs text-[var(--text-highlight)]">
            CSV Visual Decoration Rules
          </span>
          <span className="text-[10px] text-[var(--text-muted)] font-mono">
            {rules.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
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

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-highlight)] hover:bg-[var(--bg-app)] transition cursor-pointer"
            title="Close Decoration Panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Inline Form (Add / Edit) */}
      {isFormOpen && (
        <div className="p-3 border-b border-[var(--border-subtle)] bg-[var(--bg-app)]/50 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-main)] flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[var(--accent)]" />
              {editingRuleId ? "Edit Decoration Rule" : "New Decoration Rule"}
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

            {/* Scope (All Columns vs Specific Column) */}
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
                    className="max-w-[120px] px-1.5 py-1 text-xs rounded bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)] truncate"
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

          {/* Style Controls Row */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {/* Background Color */}
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

            {/* Text Color */}
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

            {/* Font Style Toggles */}
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

            {/* Optional Label */}
            <input
              type="text"
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              placeholder="Rule label (optional)"
              className="px-2 py-1 text-xs rounded bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] flex-1 min-w-[120px] focus:outline-none focus:border-[var(--accent)]"
            />

            {/* Save Button */}
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

      {/* Rules List Container */}
      <div className="max-h-48 overflow-y-auto divide-y divide-[var(--border-subtle)]">
        {rules.length === 0 ? (
          <div className="p-4 text-center text-[var(--text-muted)]">
            <p className="text-xs">No decoration rules defined yet.</p>
            <p className="text-[11px] text-[var(--text-subtle)] mt-0.5">
              Click &quot;Add Rule&quot; to highlight cells or rows based on
              search patterns.
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
              className={`flex items-center justify-between px-3 py-1.5 hover:bg-[var(--bg-surface-elevated)]/50 transition ${
                draggedIdx === idx ? "opacity-40 bg-[var(--bg-app)]" : ""
              } ${!rule.enabled ? "opacity-50" : ""} ${
                editingRuleId === rule.id
                  ? "bg-[var(--accent)]/10 border-l-2 border-[var(--accent)]"
                  : ""
              }`}
            >
              {/* Left: Drag Handle + Enable/Disable + Priority + Label / Pattern */}
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

                {/* Pattern & Label */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="font-mono text-xs px-1.5 py-0.5 rounded bg-[var(--bg-app)] border border-[var(--border-subtle)] text-[var(--text-highlight)] truncate max-w-[140px]"
                    title={`Pattern: ${rule.pattern}`}
                  >
                    {rule.isRegex ? `/${rule.pattern}/` : `"${rule.pattern}"`}
                  </span>

                  {rule.label && (
                    <span className="text-[11px] text-[var(--text-muted)] truncate max-w-[120px]">
                      {rule.label}
                    </span>
                  )}
                </div>

                {/* Badges: Scope & Target */}
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

              {/* Right: Style Quick Adjusters + Edit + Delete */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Background Swatch */}
                <ColorPickerPopover
                  value={rule.style.background}
                  onChange={(color) =>
                    handleUpdateRuleStyle(rule.id, { background: color })
                  }
                  label="Background Color"
                  defaultColor="#fef08a80"
                />

                {/* Text Color Swatch */}
                <ColorPickerPopover
                  value={rule.style.color}
                  onChange={(color) =>
                    handleUpdateRuleStyle(rule.id, { color })
                  }
                  label="Text Color"
                  defaultColor="#ef4444"
                />

                {/* Quick Font Styles */}
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

                {/* Edit Rule Button */}
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

                {/* Delete rule */}
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
  );
};
