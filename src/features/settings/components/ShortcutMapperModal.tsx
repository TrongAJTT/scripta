import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, Keyboard, AlertTriangle, AlertCircle, Check, Trash2 } from 'lucide-react';
import type { CommandId, Keybinding } from '../../../core/commands/types';
import { COMMANDS, keybindingToString, checkBrowserConflict } from '../../../core/commands/registry';
import { useKeybindingStore } from '../../../core/commands/keybindingStore';
import { ModalWrapper } from '../../../shared/components/ModalWrapper';

interface ShortcutMapperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutMapperModal: React.FC<ShortcutMapperModalProps> = ({ isOpen, onClose }) => {
  const getKeybinding = useKeybindingStore((s) => s.getKeybinding);
  const setKeybinding = useKeybindingStore((s) => s.setKeybinding);
  const resetKeybinding = useKeybindingStore((s) => s.resetKeybinding);
  const resetAll = useKeybindingStore((s) => s.resetAll);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [editingCommandId, setEditingCommandId] = useState<CommandId | null>(null);
  const [capturedKeybinding, setCapturedKeybinding] = useState<Keybinding | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Capture keystrokes when editing
  useEffect(() => {
    if (!editingCommandId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Ignore pure modifier presses
      if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
        return;
      }

      // Modifier validation: require Alt or Alt+Shift / Alt+Ctrl
      const hasAlt = e.altKey;
      const isFunctionKey = /^F[1-9]|F1[0-2]$/.test(e.key);

      if (!hasAlt && !isFunctionKey) {
        setConflictWarning('⚠️ Shortcuts must include the Alt modifier (e.g. Alt+S, Alt+Shift+S) to avoid browser collisions!');
        return;
      }

      const newKb: Keybinding = {
        key: e.code,
        alt: e.altKey,
        ctrl: e.ctrlKey,
        shift: e.shiftKey,
        meta: e.metaKey,
      };

      setCapturedKeybinding(newKb);

      // Check conflict with other commands
      const conflictWith = (Object.keys(COMMANDS) as CommandId[]).find((cmdId) => {
        if (cmdId === editingCommandId) return false;
        const existing = getKeybinding(cmdId);
        if (!existing) return false;
        return (
          existing.key === newKb.key &&
          existing.alt === newKb.alt &&
          existing.ctrl === newKb.ctrl &&
          existing.shift === newKb.shift &&
          existing.meta === newKb.meta
        );
      });

      if (conflictWith) {
        setConflictWarning(`Conflicts with command "${COMMANDS[conflictWith].label}"!`);
      } else {
        const browserWarning = checkBrowserConflict(newKb);
        setConflictWarning(browserWarning);
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [editingCommandId, getKeybinding]);

  const categories = ['All', 'File', 'Edit', 'View', 'Scripts', 'Settings'];
  const allCommands = Object.values(COMMANDS);

  const filteredCommands = allCommands.filter((cmd) => {
    const matchesCategory = activeCategory === 'All' || cmd.category === activeCategory;
    const currentKb = getKeybinding(cmd.id);
    const kbStr = keybindingToString(currentKb).toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      cmd.label.toLowerCase().includes(query) ||
      cmd.id.toLowerCase().includes(query) ||
      kbStr.includes(query);
    return matchesCategory && matchesSearch;
  });

  const handleSave = (id: CommandId) => {
    if (capturedKeybinding) {
      setKeybinding(id, capturedKeybinding);
    }
    setEditingCommandId(null);
    setCapturedKeybinding(null);
    setConflictWarning(null);
  };

  const handleCancelEdit = () => {
    setEditingCommandId(null);
    setCapturedKeybinding(null);
    setConflictWarning(null);
  };

  const handleDeleteKeybinding = (id: CommandId) => {
    setKeybinding(id, null);
  };

  const handleStartEdit = (id: CommandId) => {
    setEditingCommandId(id);
    setCapturedKeybinding(getKeybinding(id));
    setConflictWarning(null);
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Shortcut Mapper"
      subtitle="Customize keyboard shortcuts. Uses Alt-based combinations by default to prevent browser conflicts."
      icon={<Keyboard className="w-5 h-5" />}
      badge={
        <span className="text-[10px] px-2 py-0.5 rounded-sm bg-[var(--accent)]/15 text-[var(--accent)] font-medium">
          Alt-based Modifier
        </span>
      }
      footer={
        <>
          <button
            onClick={resetAll}
            className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-rose-400 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All to Defaults</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-sm bg-accent text-accent-contrast font-semibold hover:opacity-95 transition-opacity"
          >
            Done
          </button>
        </>
      }
    >
      {/* Search & Filter Toolbar */}
      <div className="px-5 py-2.5 border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 bg-[var(--bg-app)]/50 shrink-0">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search actions or shortcuts (e.g. Save, Alt+S)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-sm text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent)] transition-colors"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 text-xs rounded-sm font-semibold transition-colors ${
                activeCategory === cat
                  ? 'bg-accent text-accent-contrast shadow-2xs'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-tab-hover)] hover:text-[var(--text-main)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Shortcuts Table */}
      <div className="flex-1 overflow-y-auto px-5 py-2 divide-y divide-[var(--border-subtle)]">
        {filteredCommands.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--text-muted)]">
            No matching shortcuts found
          </div>
        ) : (
          filteredCommands.map((cmd) => {
            const currentKb = getKeybinding(cmd.id);
            const isEditing = editingCommandId === cmd.id;
            const hasDefault = Boolean(cmd.defaultKeybinding);
            const isModified =
              JSON.stringify(currentKb) !== JSON.stringify(cmd.defaultKeybinding);

            return (
              <div
                key={cmd.id}
                className={`py-2 flex flex-col gap-2 transition-colors ${
                  isEditing ? 'bg-[var(--bg-tab-active)]/40 -mx-5 px-5 rounded-xs' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  {/* Command info */}
                  <div className="flex flex-col min-w-[180px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-[var(--text-main)]">
                        {cmd.label}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-xs bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                        {cmd.category}
                      </span>
                      {isModified && (
                        <span className="text-[9px] px-1 rounded-xs bg-amber-500/20 text-amber-400 font-medium">
                          Modified
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-[var(--text-subtle)]">
                      {cmd.id}
                    </span>
                  </div>

                  {/* Keybinding display or editing recorder: on mobile wraps to own full-width row */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t sm:border-0 border-[var(--border-subtle)]/40">
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto animate-fade-in">
                        <div className="flex-1 sm:flex-initial px-3 py-1 bg-[var(--bg-surface)] border-2 border-dashed border-[var(--accent)] rounded-sm text-xs font-mono text-[var(--accent)] font-semibold flex items-center gap-1.5 shadow-inner min-w-[120px] justify-center">
                          <Keyboard className="w-3.5 h-3.5 animate-pulse" />
                          {capturedKeybinding
                            ? keybindingToString(capturedKeybinding)
                            : 'Press key combination...'}
                        </div>

                        <button
                          onClick={() => handleSave(cmd.id)}
                          disabled={!capturedKeybinding}
                          className="px-2.5 py-1 text-xs rounded-sm bg-accent text-accent-contrast font-semibold hover:opacity-95 disabled:opacity-50 transition-opacity flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Save
                        </button>
                        <button
                          onClick={() => {
                            handleDeleteKeybinding(cmd.id);
                            handleCancelEdit();
                          }}
                          title="Remove shortcut"
                          className="px-2 py-1 text-xs rounded-sm border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Clear
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-2.5 py-1 text-xs rounded-sm border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-tab-hover)] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2">
                        {currentKb ? (
                          <kbd className="px-2 py-0.5 text-xs font-mono text-[var(--text-highlight)] bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xs shadow-2xs font-semibold">
                            {keybindingToString(currentKb)}
                          </kbd>
                        ) : (
                          <span className="text-[11px] text-[var(--text-subtle)] italic">
                            None
                          </span>
                        )}

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEdit(cmd.id)}
                            className="px-2.5 py-0.5 text-[11px] rounded-xs border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-highlight)] hover:bg-[var(--bg-tab-hover)] transition-colors"
                          >
                            Change
                          </button>

                          {currentKb && (
                            <button
                              onClick={() => handleDeleteKeybinding(cmd.id)}
                              title="Delete shortcut (disable)"
                              className="p-1 text-[var(--text-subtle)] hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {hasDefault && (
                            <button
                              onClick={() => resetKeybinding(cmd.id)}
                              title="Reset to default"
                              disabled={!isModified}
                              className="p-1 text-[var(--text-subtle)] hover:text-amber-400 disabled:opacity-20 transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Conflict warnings */}
                {isEditing && conflictWarning && (
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-xs mt-1 animate-fade-in">
                    {conflictWarning.includes('⚠️') ? (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>{conflictWarning}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </ModalWrapper>
  );
};
