import type {
  ScriptMetadata,
  ScriptEmbeddedFunction,
  ScriptInputDef,
  ScriptTarget,
  ScriptRunResult,
  ScriptExecutionContextTab,
  ScriptFunction,
} from "../types/script.types";
import { useScriptStore } from "../store/scriptStore";
import { executeScriptInWorker } from "../engine/scriptRunner";

export interface RawScriptSchema {
  name: string;
  description: string;
  author: string;
  version: string;
  group?: string;
  target?: ScriptTarget;
  inputs: ScriptInputDef[];
  functions: Array<{
    id: string;
    name: string;
    source: "builtin" | "custom" | "script";
    sourceScriptId?: string;
    sourceScriptName?: string;
  }>;
  sampleInput: string;
  code: string;
}

/**
 * Service encapsulating business logic for Script definitions, CRUD,
 * unused function detection, input snippet generation, test execution, and JSON conversion.
 */
export class ScriptService {
  /**
   * Retrieves all scripts from store.
   */
  static getAllScripts(): ScriptMetadata[] {
    return useScriptStore.getState().scripts;
  }

  /**
   * Finds a script by its unique ID.
   */
  static getScriptById(id: string): ScriptMetadata | undefined {
    return useScriptStore.getState().scripts.find((s) => s.id === id);
  }

  /**
   * Saves a script (creates new or updates existing).
   */
  static async saveScript(
    script: Omit<ScriptMetadata, "createdAt" | "updatedAt"> & { id?: string },
  ): Promise<ScriptMetadata> {
    return await useScriptStore.getState().saveScriptDef(script);
  }

  /**
   * Deletes a script by ID.
   */
  static async deleteScript(id: string): Promise<boolean> {
    return await useScriptStore.getState().removeScriptDef(id);
  }

  /**
   * Reorders scripts.
   */
  static async reorderScripts(
    reorderedScripts: ScriptMetadata[],
  ): Promise<void> {
    await useScriptStore.getState().reorderScripts(reorderedScripts);
  }

  /**
   * Renames a script group/folder.
   */
  static async renameGroup(
    oldGroupName: string,
    newGroupName: string,
  ): Promise<void> {
    await useScriptStore.getState().renameGroup(oldGroupName, newGroupName);
  }

  /**
   * Deletes a script group/folder.
   */
  static async deleteGroup(
    groupName: string,
    deleteScriptsInside = false,
  ): Promise<void> {
    await useScriptStore.getState().deleteGroup(groupName, deleteScriptsInside);
  }

  /**
   * Scans script source code to check which embedded helper functions are actively used or unused.
   */
  static findUnusedFunctions(
    scriptCode: string,
    embeddedFunctions: ScriptEmbeddedFunction[],
  ): { used: ScriptEmbeddedFunction[]; unused: ScriptEmbeddedFunction[] } {
    const used: ScriptEmbeddedFunction[] = [];
    const unused: ScriptEmbeddedFunction[] = [];

    for (const fn of embeddedFunctions) {
      const name = fn.name.trim();
      if (!name) continue;

      // Regex patterns:
      // 1. context.functions.<name>
      // 2. context.functions["<name>"] or context.functions['<name>']
      // 3. direct call or reference <name>(
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(
        `(?:context\\.functions\\s*\\.\\s*${escaped}\\b|context\\.functions\\s*\\[\\s*["']${escaped}["']\\s*\\]|\\b${escaped}\\s*\\()`,
      );

      if (pattern.test(scriptCode)) {
        used.push(fn);
      } else {
        unused.push(fn);
      }
    }

    return { used, unused };
  }

  /**
   * Checks if an embedded helper function is orphaned (missing implementation code both locally and across all stores).
   */
  static isOrphanedFunction(
    fn: ScriptEmbeddedFunction,
    allStandaloneFunctions: ScriptFunction[],
    allScripts: ScriptMetadata[],
  ): boolean {
    // If it has executable code embedded directly, it is NOT orphaned
    if (fn.code && fn.code.trim().length > 0) {
      return false;
    }

    // Check standalone functions (built-in or custom)
    const foundStandalone = allStandaloneFunctions.find(
      (f) => f.id === fn.id || f.name === fn.name,
    );
    if (foundStandalone && foundStandalone.code && foundStandalone.code.trim().length > 0) {
      return false;
    }

    // Check functions from other scripts
    for (const sc of allScripts) {
      const foundInScript = sc.functions?.find(
        (sfn) => (sfn.id === fn.id || sfn.name === fn.name) && sfn.code && sfn.code.trim().length > 0,
      );
      if (foundInScript) {
        return false;
      }
    }

    return true;
  }

  /**
   * Attempts to resolve and populate missing code and metadata for embedded functions from local store.
   */
  static resolveEmbeddedFunction(
    fn: ScriptEmbeddedFunction,
    allStandaloneFunctions: ScriptFunction[],
    allScripts: ScriptMetadata[],
  ): ScriptEmbeddedFunction {
    if (fn.code && fn.code.trim().length > 0) {
      return fn;
    }

    // 1. Try finding in standalone functions
    const standalone = allStandaloneFunctions.find(
      (f) => f.id === fn.id || f.name === fn.name,
    );
    if (standalone && standalone.code) {
      return {
        ...fn,
        description: fn.description || standalone.description,
        params: fn.params && fn.params.length > 0 ? fn.params : standalone.params,
        paramDefs: fn.paramDefs || standalone.paramDefs,
        code: standalone.code,
        source: standalone.isBuiltin ? "builtin" : "custom",
      };
    }

    // 2. Try finding in other workspace scripts
    for (const sc of allScripts) {
      const scriptFn = sc.functions?.find(
        (sfn) => (sfn.id === fn.id || sfn.name === fn.name) && sfn.code,
      );
      if (scriptFn) {
        return {
          ...fn,
          description: fn.description || scriptFn.description,
          params: fn.params && fn.params.length > 0 ? fn.params : scriptFn.params,
          paramDefs: fn.paramDefs || scriptFn.paramDefs,
          code: scriptFn.code,
          source: "script",
          sourceScriptId: sc.id,
          sourceScriptName: sc.name,
        };
      }
    }

    return fn;
  }

  /**
   * Generates sample input template code with type comments and descriptions for each input parameter.
   */
  static generateSampleInputTemplate(inputs: ScriptInputDef[]): string {
    if (inputs.length === 0) {
      return `// 1. No custom inputs defined for this script\nconst inputs = {};\n\n// 2. Execute script entrypoint\nreturn await run(inputs, context);`;
    }

    const inputLines = inputs.map((inp) => {
      const safeName = inp.name.trim() || "param";
      const label = inp.label.trim() || safeName;
      const type = inp.type || "string";
      const desc = inp.description
        ? ` | Description: ${inp.description.trim()}`
        : "";

      let sampleVal = '""';
      switch (type) {
        case "int":
          sampleVal =
            inp.defaultValue !== undefined ? String(inp.defaultValue) : "0";
          break;
        case "boolean":
          sampleVal =
            inp.defaultValue !== undefined ? String(inp.defaultValue) : "false";
          break;
        case "dropdown": {
          const firstOpt =
            inp.options && inp.options.length > 0 ? inp.options[0] : "";
          const optVal = inp.defaultValue ? String(inp.defaultValue) : firstOpt;
          sampleVal = JSON.stringify(optVal);
          break;
        }
        case "datetime":
          sampleVal = JSON.stringify(new Date().toISOString());
          break;
        case "tab":
          sampleVal = JSON.stringify(
            inp.defaultValue ? String(inp.defaultValue) : "Current Tab",
          );
          break;
        default:
          sampleVal = JSON.stringify(
            inp.defaultValue ? String(inp.defaultValue) : "",
          );
          break;
      }

      return `  // [${label}] Type: ${type}${desc}\n  ${safeName}: ${sampleVal},`;
    });

    return `// 1. Define sample input parameters for execution\nconst inputs = {\n${inputLines.join("\n")}\n};\n\n// 2. Execute script entrypoint\nreturn await run(inputs, context);`;
  }

  /**
   * Executes a test run for a script with sample input code and tab context.
   */
  static async executeTestRun(
    script: ScriptMetadata,
    sampleInputSnippet: string,
    openTabs: ScriptExecutionContextTab[] = [],
    activeTabId?: string | null,
  ): Promise<ScriptRunResult> {
    const trimmed = sampleInputSnippet.trim();
    let evaluatedInputs: Record<string, unknown> = {};

    // 1. Parse or evaluate sample input snippet to extract inputs object
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        evaluatedInputs = JSON.parse(trimmed);
      } catch {
        const evalFn = new Function(`return (${trimmed});`);
        evaluatedInputs = evalFn();
      }
    } else if (trimmed.length > 0) {
      try {
        const AsyncFunction = Object.getPrototypeOf(
          async function () {},
        ).constructor;
        // Evaluate snippet, extracting inputs if defined or returned
        const runnerFn = new AsyncFunction(
          "context",
          `
          let inputs = {};
          try {
            ${trimmed}
            if (typeof inputs !== 'undefined' && inputs && typeof inputs === 'object') {
              return inputs;
            }
          } catch (e) {
            // fallback
          }
          return inputs;
        `,
        );
        const evalResult = await runnerFn({});
        if (evalResult && typeof evalResult === "object") {
          evaluatedInputs = evalResult as Record<string, unknown>;
        }
      } catch {
        // Fallback: evaluate default inputs
        for (const inp of script.inputs) {
          evaluatedInputs[inp.name] = inp.defaultValue ?? "";
        }
      }
    }

    // 2. Prepare context tabs
    const currentTab =
      openTabs.find((t) => t.id === activeTabId) || openTabs[0] || null;

    // 3. Prepare helper functions list
    const functionsList =
      script.functions && script.functions.length > 0
        ? script.functions
        : useScriptStore
            .getState()
            .functions.filter((f) =>
              (script.usedFunctionIds || []).includes(f.id),
            );

    // 4. Run via Web Worker
    return await executeScriptInWorker(script, functionsList, evaluatedInputs, {
      currentTab,
      openTabs,
      target: script.target || "tab",
    });
  }

  /**
   * Converts script fields into a raw JSON string where functions list only contains references.
   */
  static toRawJsonString(data: {
    name: string;
    description: string;
    author: string;
    version: string;
    group?: string;
    target?: ScriptTarget;
    inputs: ScriptInputDef[];
    functions?: ScriptEmbeddedFunction[];
    sampleInput: string;
    code: string;
  }): string {
    const rawFunctions = (data.functions || []).map((fn) => ({
      id: fn.id,
      name: fn.name,
      source: fn.source || "builtin",
      sourceScriptId: fn.sourceScriptId,
      sourceScriptName: fn.sourceScriptName,
    }));

    const rawData: RawScriptSchema = {
      name: data.name.trim(),
      description: data.description.trim(),
      author: data.author.trim(),
      version: data.version.trim() || "1.0.0",
      group: data.group?.trim() || undefined,
      target: data.target || "tab",
      inputs: data.inputs || [],
      functions: rawFunctions,
      sampleInput: data.sampleInput.trim(),
      code: data.code,
    };

    return JSON.stringify(rawData, null, 2);
  }

  /**
   * Parses raw JSON string and validates required schema fields.
   */
  static parseRawJson(jsonText: string): RawScriptSchema {
    const parsed = JSON.parse(jsonText);

    if (typeof parsed !== "object" || parsed === null) {
      throw new Error("JSON must be a valid object.");
    }

    if (
      !parsed.name ||
      typeof parsed.name !== "string" ||
      !parsed.name.trim()
    ) {
      throw new Error(
        "Field 'name' is required and must be a non-empty string.",
      );
    }

    const functions: RawScriptSchema["functions"] = [];
    if (Array.isArray(parsed.functions)) {
      for (const item of parsed.functions) {
        if (typeof item === "object" && item !== null && "name" in item) {
          functions.push({
            id: String(item.id || item.name),
            name: String(item.name).trim(),
            source:
              item.source === "script" || item.source === "custom"
                ? item.source
                : "builtin",
            sourceScriptId: item.sourceScriptId
              ? String(item.sourceScriptId)
              : undefined,
            sourceScriptName: item.sourceScriptName
              ? String(item.sourceScriptName)
              : undefined,
          });
        }
      }
    }

    return {
      name: parsed.name.trim(),
      description:
        typeof parsed.description === "string" ? parsed.description : "",
      author: typeof parsed.author === "string" ? parsed.author : "",
      version: typeof parsed.version === "string" ? parsed.version : "1.0.0",
      group:
        typeof parsed.group === "string" && parsed.group.trim()
          ? parsed.group.trim()
          : undefined,
      target: parsed.target === "selection" ? "selection" : "tab",
      inputs: Array.isArray(parsed.inputs) ? parsed.inputs : [],
      functions,
      sampleInput:
        typeof parsed.sampleInput === "string" ? parsed.sampleInput : "",
      code: typeof parsed.code === "string" ? parsed.code : "",
    };
  }

  /**
   * Resolves raw function references from JSON into complete ScriptEmbeddedFunction objects.
   */
  static resolveEmbeddedFunctions(
    fnRefs: RawScriptSchema["functions"],
    allFunctions: ScriptFunction[],
    allScripts: ScriptMetadata[],
    currentEmbedded: ScriptEmbeddedFunction[] = [],
  ): ScriptEmbeddedFunction[] {
    const resolved: ScriptEmbeddedFunction[] = [];

    for (const ref of fnRefs) {
      // 1. Check if already exists in current embedded functions
      const existing = currentEmbedded.find(
        (e) => e.id === ref.id || e.name === ref.name,
      );
      if (existing) {
        resolved.push({ ...existing, name: ref.name, source: ref.source });
        continue;
      }

      // 2. Check standalone functions (builtin or custom)
      const foundFn = allFunctions.find(
        (f) => f.id === ref.id || f.name === ref.name,
      );
      if (foundFn) {
        resolved.push({
          id: foundFn.id,
          name: foundFn.name,
          description: foundFn.description,
          params: foundFn.params,
          paramDefs: foundFn.paramDefs,
          code: foundFn.code,
          source: foundFn.isBuiltin ? "builtin" : "custom",
        });
        continue;
      }

      // 3. Check functions from another script if specified
      if (ref.sourceScriptId) {
        const sourceScript = allScripts.find(
          (s) => s.id === ref.sourceScriptId,
        );
        const scriptFn = sourceScript?.functions?.find(
          (f) => f.id === ref.id || f.name === ref.name,
        );
        if (scriptFn && sourceScript) {
          resolved.push({
            ...scriptFn,
            source: "script",
            sourceScriptId: sourceScript.id,
            sourceScriptName: sourceScript.name,
          });
          continue;
        }
      }

      // 4. Fallback stub
      resolved.push({
        id: ref.id,
        name: ref.name,
        params: [],
        code: "return '';",
        source: ref.source,
      });
    }

    return resolved;
  }
}
