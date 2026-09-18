import React from 'react';
import type { CommandId } from '../../../core/commands/types';
import { keybindingToString } from '../../../core/commands/registry';
import { useKeybindingStore } from '../../../core/commands/keybindingStore';

interface KeybindingHintProps {
  commandId: CommandId;
  className?: string;
}

export const KeybindingHint: React.FC<KeybindingHintProps> = ({ commandId, className }) => {
  const getKeybinding = useKeybindingStore((s) => s.getKeybinding);
  const kb = getKeybinding(commandId);

  if (!kb) return null;

  return (
    <kbd className={className ?? 'text-[10px] text-[var(--text-subtle)] bg-[var(--bg-surface)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)] font-mono ml-auto'}>
      {keybindingToString(kb)}
    </kbd>
  );
};
