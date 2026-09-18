import { create } from 'zustand';
import type { CommandId, Keybinding } from './types';
import { COMMANDS } from './registry';

const STORAGE_KEY = 'scripta_keybindings_overrides';

interface KeybindingState {
  overrides: Partial<Record<CommandId, Keybinding | null>>;
  getKeybinding: (id: CommandId) => Keybinding | null;
  setKeybinding: (id: CommandId, kb: Keybinding | null) => void;
  resetKeybinding: (id: CommandId) => void;
  resetAll: () => void;
}

function loadOverrides(): Partial<Record<CommandId, Keybinding | null>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<Record<CommandId, Keybinding | null>>;
  } catch {
    return {};
  }
}

function saveOverrides(overrides: Partial<Record<CommandId, Keybinding | null>>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // Ignore localStorage write error
  }
}

export const useKeybindingStore = create<KeybindingState>((set, get) => ({
  overrides: loadOverrides(),

  getKeybinding: (id: CommandId) => {
    const { overrides } = get();
    if (Object.prototype.hasOwnProperty.call(overrides, id)) {
      return overrides[id] ?? null;
    }
    return COMMANDS[id]?.defaultKeybinding ?? null;
  },

  setKeybinding: (id: CommandId, kb: Keybinding | null) => {
    set((state) => {
      const nextOverrides = { ...state.overrides, [id]: kb };
      saveOverrides(nextOverrides);
      return { overrides: nextOverrides };
    });
  },

  resetKeybinding: (id: CommandId) => {
    set((state) => {
      const nextOverrides = { ...state.overrides };
      delete nextOverrides[id];
      saveOverrides(nextOverrides);
      return { overrides: nextOverrides };
    });
  },

  resetAll: () => {
    saveOverrides({});
    set({ overrides: {} });
  },
}));
