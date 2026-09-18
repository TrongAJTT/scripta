import { create } from 'zustand';
import type {
  ScriptFunction,
  ScriptMetadata,
  ScriptsExportBundle,
} from '../types/script.types';
import { BUILTIN_FUNCTIONS } from '../data/builtinFunctions';
import {
  loadScriptFunctions,
  saveScriptFunction,
  deleteScriptFunction,
  loadScripts,
  saveScript,
  deleteScript,
} from '../../../core/utils/idbStorage';

interface ScriptState {
  functions: ScriptFunction[];
  scripts: ScriptMetadata[];
  isLoaded: boolean;
  isManagerOpen: boolean;
  isRunModalOpen: boolean;
  activeScriptId: string | null;

  // Actions
  initScriptStore: () => Promise<void>;
  openManager: () => void;
  closeManager: () => void;
  openRunModal: (scriptId: string) => void;
  closeRunModal: () => void;

  // Folder session state (preserved across modal opens, resets on page reload)
  collapsedGroups: Record<string, boolean>;
  toggleGroupCollapse: (groupName: string) => void;

  // Function CRUD
  saveFunction: (fn: Omit<ScriptFunction, 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<ScriptFunction>;
  removeFunction: (id: string) => Promise<boolean>;

  // Script CRUD
  saveScriptDef: (script: Omit<ScriptMetadata, 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<ScriptMetadata>;
  removeScriptDef: (id: string) => Promise<boolean>;
  reorderScripts: (reorderedScripts: ScriptMetadata[]) => Promise<void>;
  addBuiltinTemplates: (templates: ScriptMetadata[], groupName?: string) => Promise<number>;
  renameGroup: (oldGroupName: string, newGroupName: string) => Promise<void>;
  deleteGroup: (groupName: string, deleteScriptsInside?: boolean) => Promise<void>;

  // Import / Export
  exportJSON: () => string;
  importJSON: (jsonStr: string) => Promise<{ importedFunctions: number; importedScripts: number }>;
}

export const useScriptStore = create<ScriptState>((set, get) => ({
  functions: [],
  scripts: [],
  isLoaded: false,
  isManagerOpen: false,
  isRunModalOpen: false,
  activeScriptId: null,
  collapsedGroups: {},

  toggleGroupCollapse: (groupName: string) => {
    set((state) => ({
      collapsedGroups: {
        ...state.collapsedGroups,
        [groupName]: !state.collapsedGroups[groupName],
      },
    }));
  },

  initScriptStore: async () => {
    if (get().isLoaded) return;

    try {
      const storedFns = await loadScriptFunctions();
      const storedScripts = await loadScripts();

      // Merge builtin functions: make sure builtins exist
      const existingIds = new Set(storedFns.map((f) => f.id));
      const combinedFns = [...storedFns];

      for (const builtin of BUILTIN_FUNCTIONS) {
        if (!existingIds.has(builtin.id)) {
          combinedFns.push(builtin);
          await saveScriptFunction(builtin);
        }
      }

      // Default sample script if none exist
      if (storedScripts.length === 0) {
        const sampleScript: ScriptMetadata = {
          id: 'script_sample_formatter',
          name: 'Text Formatter Demo',
          description: 'Demonstrates sorting, trimming, and capitalizing lines from the current tab',
          author: 'System',
          version: '1.0.0',
          inputs: [
            {
              name: 'sourceTab',
              label: 'Source Tab',
              type: 'tab',
              required: true,
              description: 'Select tab content to transform',
            },
            {
              name: 'sortOrder',
              label: 'Sort Direction',
              type: 'dropdown',
              options: ['Ascending', 'Descending'],
              defaultValue: 'Ascending',
            },
            {
              name: 'doCapitalize',
              label: 'Capitalize Each Line',
              type: 'boolean',
              defaultValue: false,
            },
          ],
          usedFunctionIds: ['fn_trim_lines', 'fn_sort_lines', 'fn_capitalize'],
          code: `async function run(inputs, context) {
  context.log("Running Text Formatter script...");
  
  const tab = context.getTab(inputs.sourceTab);
  if (!tab) {
    throw new Error("Target tab not found!");
  }

  let text = tab.content;
  context.log("Input length:", text.length, "characters");

  // Step 1: Trim lines
  text = await context.functions.trimLines(text);

  // Step 2: Sort
  const isDesc = inputs.sortOrder === 'Descending';
  text = await context.functions.sortLines(text, isDesc, true);

  // Step 3: Optional Capitalization
  if (inputs.doCapitalize) {
    text = await context.functions.capitalize(text);
  }

  context.log("Formatting complete! Generating output tab...");
  context.createTab(tab.name + " (Formatted)", text);
}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        storedScripts.push(sampleScript);
        await saveScript(sampleScript);
      }

      set({
        functions: combinedFns,
        scripts: storedScripts,
        isLoaded: true,
      });
    } catch (err) {
      console.error('Failed to init script store:', err);
      set({ functions: BUILTIN_FUNCTIONS, scripts: [], isLoaded: true });
    }
  },

  openManager: () => set({ isManagerOpen: true }),
  closeManager: () => set({ isManagerOpen: false }),

  openRunModal: (scriptId: string) => set({ isRunModalOpen: true, activeScriptId: scriptId }),
  closeRunModal: () => set({ isRunModalOpen: false, activeScriptId: null }),

  saveFunction: async (fnInput) => {
    const now = Date.now();
    const existing = get().functions.find((f) => f.id === fnInput.id);

    const fnToSave: ScriptFunction = {
      ...fnInput,
      id: fnInput.id || `fn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    await saveScriptFunction(fnToSave);

    set((state) => {
      const idx = state.functions.findIndex((f) => f.id === fnToSave.id);
      if (idx >= 0) {
        const next = [...state.functions];
        next[idx] = fnToSave;
        return { functions: next };
      }
      return { functions: [fnToSave, ...state.functions] };
    });

    return fnToSave;
  },

  removeFunction: async (id: string) => {
    const fn = get().functions.find((f) => f.id === id);
    if (!fn || fn.isBuiltin) return false;

    await deleteScriptFunction(id);
    set((state) => ({
      functions: state.functions.filter((f) => f.id !== id),
    }));
    return true;
  },

  saveScriptDef: async (scriptInput) => {
    const now = Date.now();
    const existing = get().scripts.find((s) => s.id === scriptInput.id);

    const scriptToSave: ScriptMetadata = {
      ...scriptInput,
      id: scriptInput.id || `script_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    await saveScript(scriptToSave);

    set((state) => {
      const idx = state.scripts.findIndex((s) => s.id === scriptToSave.id);
      if (idx >= 0) {
        const next = [...state.scripts];
        next[idx] = scriptToSave;
        return { scripts: next };
      }
      return { scripts: [scriptToSave, ...state.scripts] };
    });

    return scriptToSave;
  },

  removeScriptDef: async (id: string) => {
    await deleteScript(id);
    set((state) => ({
      scripts: state.scripts.filter((s) => s.id !== id),
    }));
    return true;
  },

  reorderScripts: async (reorderedScripts: ScriptMetadata[]) => {
    set({ scripts: reorderedScripts });
    for (const sc of reorderedScripts) {
      await saveScript(sc);
    }
  },

  addBuiltinTemplates: async (templates: ScriptMetadata[], groupName?: string) => {
    let addedCount = 0;
    const now = Date.now();

    for (const tpl of templates) {
      const newScript: ScriptMetadata = {
        ...tpl,
        id: `script_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        group: groupName !== undefined ? (groupName.trim() || undefined) : tpl.group,
        createdAt: now,
        updatedAt: now,
      };

      await saveScript(newScript);
      set((state) => ({ scripts: [newScript, ...state.scripts] }));
      addedCount++;
    }

    return addedCount;
  },

  renameGroup: async (oldGroupName: string, newGroupName: string) => {
    const trimmed = newGroupName.trim();
    if (!trimmed || trimmed === oldGroupName) return;

    const nextScripts = get().scripts.map((s) => {
      if (s.group === oldGroupName) {
        return { ...s, group: trimmed, updatedAt: Date.now() };
      }
      return s;
    });

    set((state) => {
      const nextCollapsed = { ...state.collapsedGroups };
      if (oldGroupName in nextCollapsed) {
        nextCollapsed[trimmed] = nextCollapsed[oldGroupName];
        delete nextCollapsed[oldGroupName];
      }
      return { scripts: nextScripts, collapsedGroups: nextCollapsed };
    });
    for (const s of nextScripts) {
      if (s.group === trimmed) {
        await saveScript(s);
      }
    }
  },

  deleteGroup: async (groupName: string, deleteScriptsInside = false) => {
    if (deleteScriptsInside) {
      // Delete all scripts inside this group
      const scriptsToDelete = get().scripts.filter((s) => s.group === groupName);
      for (const s of scriptsToDelete) {
        await deleteScript(s.id);
      }
      set((state) => {
        const nextCollapsed = { ...state.collapsedGroups };
        delete nextCollapsed[groupName];
        return {
          scripts: state.scripts.filter((s) => s.group !== groupName),
          collapsedGroups: nextCollapsed,
        };
      });
    } else {
      // Ungroup scripts (set group to undefined)
      const nextScripts = get().scripts.map((s) => {
        if (s.group === groupName) {
          const { group: _, ...rest } = s;
          return { ...rest, updatedAt: Date.now() };
        }
        return s;
      });
      set((state) => {
        const nextCollapsed = { ...state.collapsedGroups };
        delete nextCollapsed[groupName];
        return {
          scripts: nextScripts,
          collapsedGroups: nextCollapsed,
        };
      });
      for (const s of nextScripts) {
        if (s.group === undefined) {
          await saveScript(s);
        }
      }
    }
  },

  exportJSON: () => {
    const state = get();
    // Only export custom functions and all scripts
    const bundle: ScriptsExportBundle = {
      version: '1.0.0',
      exportedAt: Date.now(),
      functions: state.functions.filter((f) => !f.isBuiltin),
      scripts: state.scripts,
    };
    return JSON.stringify(bundle, null, 2);
  },

  importJSON: async (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr) as Partial<ScriptsExportBundle>;
      let importedFunctions = 0;
      let importedScripts = 0;

      if (Array.isArray(data.functions)) {
        for (const fn of data.functions) {
          if (fn.name && fn.code) {
            await get().saveFunction(fn);
            importedFunctions++;
          }
        }
      }

      if (Array.isArray(data.scripts)) {
        for (const sc of data.scripts) {
          if (sc.name && sc.code) {
            await get().saveScriptDef(sc);
            importedScripts++;
          }
        }
      }

      return { importedFunctions, importedScripts };
    } catch (e) {
      throw new Error(`Invalid JSON import bundle: ${e instanceof Error ? e.message : String(e)}`);
    }
  },
}));
