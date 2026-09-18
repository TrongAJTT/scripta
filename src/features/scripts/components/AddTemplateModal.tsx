import React, { useState, useMemo } from 'react';
import type { ScriptMetadata } from '../types/script.types';
import { BUILTIN_TEMPLATES } from '../data/builtinTemplates';
import { MODAL_LAYOUT } from '../../../shared/constants/modal';
import { Z_INDEX } from '../../../core/constants/zIndex';
import { Folder, X, CheckSquare, Square } from 'lucide-react';

interface AddTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTemplates: (selectedTemplates: ScriptMetadata[], groupName?: string) => void;
}

export const AddTemplateModal: React.FC<AddTemplateModalProps> = ({
  isOpen,
  onClose,
  onAddTemplates,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mode, setMode] = useState<'individual' | 'same_group' | 'custom_group' | 'ungrouped'>('individual');
  const [customGroupName, setCustomGroupName] = useState('');

  // Group templates by their group name
  const groupedTemplates = useMemo(() => {
    const map: Record<string, ScriptMetadata[]> = {};
    for (const tpl of BUILTIN_TEMPLATES) {
      const grp = tpl.group?.trim() || 'Other';
      if (!map[grp]) map[grp] = [];
      map[grp].push(tpl);
    }
    return map;
  }, []);

  const groupNames = useMemo(() => Object.keys(groupedTemplates), [groupedTemplates]);

  // Determine groups of currently selected templates
  const selectedTemplates = useMemo(
    () => BUILTIN_TEMPLATES.filter((t) => selectedIds.includes(t.id)),
    [selectedIds]
  );

  const selectedGroups = useMemo(() => {
    return Array.from(
      new Set(selectedTemplates.map((t) => t.group?.trim()).filter(Boolean) as string[])
    );
  }, [selectedTemplates]);

  const isSingleGroup = selectedGroups.length === 1;
  const singleGroupName = isSingleGroup ? selectedGroups[0] : null;

  if (!isOpen) return null;

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleToggleGroup = (groupName: string) => {
    const groupItems = groupedTemplates[groupName] || [];
    const groupItemIds = groupItems.map((t) => t.id);
    const allInGroupSelected = groupItemIds.every((id) => selectedIds.includes(id));

    if (allInGroupSelected) {
      setSelectedIds(selectedIds.filter((id) => !groupItemIds.includes(id)));
    } else {
      setSelectedIds(Array.from(new Set([...selectedIds, ...groupItemIds])));
      // When a single group is toggled on, conveniently set mode to same_group
      setMode('same_group');
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === BUILTIN_TEMPLATES.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(BUILTIN_TEMPLATES.map((t) => t.id));
      if (mode === 'same_group') {
        setMode('individual');
      }
    }
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;

    let groupToApply: string | undefined = undefined;

    if (mode === 'same_group' && singleGroupName) {
      groupToApply = singleGroupName;
    } else if (mode === 'custom_group') {
      groupToApply = customGroupName.trim() || 'Built-in Templates';
    } else if (mode === 'ungrouped') {
      groupToApply = ''; // Explicitly ungrouped
    } else {
      // 'individual': keeps each template's predefined group
      groupToApply = undefined;
    }

    onAddTemplates(selectedTemplates, groupToApply);
    onClose();
  };

  return (
    <div
      style={{ zIndex: Z_INDEX.MODAL_SECONDARY }}
      className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 md:p-6 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-[660px] max-w-[95vw] ${MODAL_LAYOUT.CONTAINER_HEIGHT_CLASSES} bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg shadow-2xl flex flex-col overflow-hidden text-[var(--text-main)]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-toolbar)] shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-highlight)] flex items-center gap-2">
              Add Built-in Template Scripts
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Select pre-made automated scripts and organize them into workspace folders
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--bg-tab-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleConfirm} className="flex-1 min-h-0 flex flex-col overflow-hidden p-4 gap-3">
          {/* Import Mode Options Box */}
          <div className="p-3 bg-[var(--bg-editor)] border border-[var(--border-color)] rounded-md shrink-0 flex flex-col gap-2">
            <span className="text-[11px] font-semibold text-[var(--accent)] uppercase tracking-wider">
              Import & Grouping Options
            </span>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
              {/* Special option: if exactly 1 group is selected */}
              {isSingleGroup && singleGroupName && (
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-[var(--accent)]">
                  <input
                    type="radio"
                    name="importMode"
                    checked={mode === 'same_group'}
                    onChange={() => setMode('same_group')}
                    className="accent-[var(--accent)] cursor-pointer"
                  />
                  <span className="flex items-center gap-1">
                    <Folder className="w-3.5 h-3.5" />
                    Import as Group: <span className="underline font-semibold">"{singleGroupName}"</span>
                  </span>
                </label>
              )}

              <label className="flex items-center gap-1.5 cursor-pointer text-[var(--text-main)]">
                <input
                  type="radio"
                  name="importMode"
                  checked={mode === 'individual'}
                  onChange={() => setMode('individual')}
                  className="accent-[var(--accent)] cursor-pointer"
                />
                <span>Individual (keep template groups)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-[var(--text-main)]">
                <input
                  type="radio"
                  name="importMode"
                  checked={mode === 'custom_group'}
                  onChange={() => setMode('custom_group')}
                  className="accent-[var(--accent)] cursor-pointer"
                />
                <span>Custom Group Name</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-main)]">
                <input
                  type="radio"
                  name="importMode"
                  checked={mode === 'ungrouped'}
                  onChange={() => setMode('ungrouped')}
                  className="accent-[var(--accent)] cursor-pointer"
                />
                <span>Standalone (No Group)</span>
              </label>
            </div>

            {mode === 'custom_group' && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-[var(--text-muted)] whitespace-nowrap">
                  Folder / Group Name:
                </span>
                <input
                  type="text"
                  value={customGroupName}
                  onChange={(e) => setCustomGroupName(e.target.value)}
                  placeholder="e.g. My Text Utilities, Automation..."
                  className="flex-1 px-2.5 py-1 text-xs bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] rounded focus:border-[var(--accent)] outline-none"
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* List Toolbar */}
          <div className="flex justify-between items-center shrink-0 px-1">
            <span className="text-xs font-semibold text-[var(--text-main)]">
              Available Templates ({selectedIds.length}/{BUILTIN_TEMPLATES.length} selected)
            </span>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-[11px] px-2.5 py-1 bg-[var(--bg-editor)] hover:bg-[var(--bg-tab-hover)] border border-[var(--border-color)] text-[var(--text-main)] rounded transition-colors"
            >
              {selectedIds.length === BUILTIN_TEMPLATES.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {/* Grouped Templates Scrollable Area */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
            {groupNames.map((grpName) => {
              const items = groupedTemplates[grpName] || [];
              const selectedInGroup = items.filter((t) => selectedIds.includes(t.id)).length;
              const isGroupAllSelected = selectedInGroup === items.length && items.length > 0;

              return (
                <div
                  key={grpName}
                  className="border border-[var(--border-color)] bg-[var(--bg-editor)]/40 rounded-lg overflow-hidden"
                >
                  {/* Group Header */}
                  <div
                    onClick={() => handleToggleGroup(grpName)}
                    className="px-3 py-2 bg-[var(--bg-toolbar)] border-b border-[var(--border-color)] flex items-center justify-between cursor-pointer hover:bg-[var(--bg-tab-hover)] transition-colors select-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--accent)] flex items-center">
                        {isGroupAllSelected ? (
                          <CheckSquare className="w-4 h-4 text-[var(--accent)]" />
                        ) : (
                          <Square className="w-4 h-4 text-[var(--text-muted)]" />
                        )}
                      </span>
                      <Folder className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span className="text-xs font-semibold text-[var(--text-main)]">
                        {grpName}
                      </span>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                      {selectedInGroup}/{items.length} selected
                    </span>
                  </div>

                  {/* Group Template Cards */}
                  <div className="p-2 space-y-1.5">
                    {items.map((tpl) => {
                      const isChecked = selectedIds.includes(tpl.id);
                      return (
                        <div
                          key={tpl.id}
                          onClick={() => handleToggle(tpl.id)}
                          className={`p-2.5 rounded-md border cursor-pointer transition-all flex items-start gap-2.5 ${
                            isChecked
                              ? 'bg-[var(--accent)]/10 border-[var(--accent)]'
                              : 'bg-[var(--bg-surface)] border-[var(--border-color)] hover:border-[var(--border-highlight)]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggle(tpl.id)}
                            className="mt-0.5 accent-[var(--accent)] cursor-pointer"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-semibold text-[var(--text-main)]">
                                {tpl.name}
                              </span>
                              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[var(--bg-app)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                                Target: {tpl.target === 'selection' ? 'Selection' : 'Tab'}
                              </span>
                              {tpl.usedFunctionIds && tpl.usedFunctionIds.length > 0 && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--bg-app)] text-[var(--accent)] border border-[var(--accent)]/30">
                                  {tpl.usedFunctionIds.length} helper {tpl.usedFunctionIds.length === 1 ? 'fn' : 'fns'}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[var(--text-muted)] mt-0.5 line-clamp-2">
                              {tpl.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between shrink-0">
            <div className="text-[11px] text-[var(--text-muted)]">
              {selectedIds.length > 0 ? (
                <span>
                  {selectedIds.length} script{selectedIds.length > 1 ? 's' : ''} selected
                  {mode === 'same_group' && singleGroupName && ` • Folder: "${singleGroupName}"`}
                  {mode === 'custom_group' && customGroupName.trim() && ` • Folder: "${customGroupName.trim()}"`}
                  {mode === 'ungrouped' && ' • Standalone'}
                </span>
              ) : (
                'No scripts selected'
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs bg-[var(--bg-surface)] hover:bg-[var(--bg-tab-hover)] border border-[var(--border-color)] text-[var(--text-main)] rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={selectedIds.length === 0}
                className="px-4 py-1.5 text-xs font-semibold rounded bg-[var(--accent)] text-[var(--text-on-accent)] disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-95 transition-opacity"
              >
                Add Selected ({selectedIds.length})
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
