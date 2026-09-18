import type {
  ScriptFunction,
  ScriptFunctionParamDef,
} from "../types/script.types";
import { useScriptStore } from "../store/scriptStore";

export interface TestFunctionResult {
  success: boolean;
  output: string;
  error: string | null;
}

export interface RawFunctionSchema {
  name: string;
  description: string;
  version: string;
  author: string;
  paramDefs: ScriptFunctionParamDef[];
  sampleInput: string;
  code: string;
}

/**
 * Service encapsulating business logic for ScriptFunction execution,
 * parameter parsing, testing, and JSON schema conversions.
 */
export class FunctionService {
  /**
   * Cleans and validates parameters list.
   */
  static sanitizeParamDefs(
    paramDefs: ScriptFunctionParamDef[],
  ): ScriptFunctionParamDef[] {
    return paramDefs
      .map((p) => ({
        name: p.name.trim(),
        description: p.description?.trim() || "",
      }))
      .filter((p) => p.name.length > 0);
  }

  /**
   * Generates sample input snippet template based on function name & parameter definitions.
   */
  static generateSampleInputTemplate(
    fnName: string,
    paramDefs: ScriptFunctionParamDef[],
  ): string {
    const safeName = fnName.trim() || "myFunction";
    const cleanParams = paramDefs.map((p) => p.name.trim()).filter(Boolean);

    if (cleanParams.length === 0) {
      return `// Define input parameters & call function\nreturn ${safeName}();`;
    }

    const declarations = cleanParams.map((p) => `const ${p} = "";`).join("\n");
    const argsList = cleanParams.join(", ");
    return `// 1. Define input arguments\n${declarations}\n\n// 2. Call function\nreturn ${safeName}(${argsList});`;
  }

  /**
   * Tests and executes a function with sample arguments or sample runner snippet.
   */
  static async executeTestRun(
    name: string,
    code: string,
    paramDefs: ScriptFunctionParamDef[],
    sampleInput: string,
  ): Promise<TestFunctionResult> {
    const fnName = name.trim() || "func";
    const cleanParams = this.sanitizeParamDefs(paramDefs);
    const paramNames = cleanParams.map((p) => p.name);
    const trimmedInput = sampleInput.trim();

    try {
      const AsyncFunction = Object.getPrototypeOf(
        async function () {},
      ).constructor;
      const targetFn = new AsyncFunction(...paramNames, code);

      let result: unknown;
      const isSnippet =
        trimmedInput.includes("return") ||
        trimmedInput.includes("const ") ||
        trimmedInput.includes("let ") ||
        trimmedInput.includes("var ") ||
        trimmedInput.includes(`${fnName}(`);

      if (isSnippet) {
        const runnerFn = new AsyncFunction(fnName, trimmedInput);
        result = await runnerFn(targetFn);
      } else {
        let parsedArgs: unknown[] = [];
        if (trimmedInput.startsWith("[") && trimmedInput.endsWith("]")) {
          try {
            parsedArgs = JSON.parse(trimmedInput);
          } catch {
            const evalFn = new Function(`return (${trimmedInput});`);
            parsedArgs = evalFn();
          }
        } else if (trimmedInput.length > 0) {
          const evalFn = new Function(`return [${trimmedInput}];`);
          parsedArgs = evalFn();
        }

        if (!Array.isArray(parsedArgs)) {
          parsedArgs = [parsedArgs];
        }

        result = await targetFn(...parsedArgs);
      }

      let formattedOutput = "";
      if (typeof result === "object" && result !== null) {
        try {
          formattedOutput = JSON.stringify(result, null, 2);
        } catch {
          formattedOutput = String(result);
        }
      } else {
        formattedOutput = String(result ?? "");
      }

      return {
        success: true,
        output: formattedOutput,
        error: null,
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        output: "",
        error: errMsg,
      };
    }
  }

  /**
   * Converts function fields into a clean raw JSON string (excluding sampleOutput).
   */
  static toRawJsonString(data: {
    name: string;
    description: string;
    version: string;
    author: string;
    paramDefs: ScriptFunctionParamDef[];
    sampleInput: string;
    code: string;
  }): string {
    const rawData: RawFunctionSchema = {
      name: data.name.trim(),
      description: data.description.trim(),
      version: data.version.trim() || "1.0.0",
      author: data.author.trim() || "",
      paramDefs: this.sanitizeParamDefs(data.paramDefs),
      sampleInput: data.sampleInput.trim(),
      code: data.code,
    };

    return JSON.stringify(rawData, null, 2);
  }

  /**
   * Parses raw JSON string and validates required schema fields.
   */
  static parseRawJson(jsonText: string): RawFunctionSchema {
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

    let newParams: ScriptFunctionParamDef[] = [];
    if (Array.isArray(parsed.paramDefs)) {
      newParams = parsed.paramDefs.map((p: unknown) => {
        if (typeof p === "object" && p !== null && "name" in p) {
          return {
            name: String((p as { name: string }).name).trim(),
            description: String(
              (p as { description?: string }).description || "",
            ).trim(),
          };
        }
        return { name: String(p).trim(), description: "" };
      });
    } else if (Array.isArray(parsed.params)) {
      newParams = parsed.params.map((p: unknown) => ({
        name: String(p).trim(),
        description: "",
      }));
    }

    return {
      name: parsed.name.trim(),
      description:
        typeof parsed.description === "string" ? parsed.description : "",
      version: typeof parsed.version === "string" ? parsed.version : "1.0.0",
      author: typeof parsed.author === "string" ? parsed.author : "",
      paramDefs: this.sanitizeParamDefs(newParams),
      sampleInput:
        typeof parsed.sampleInput === "string" ? parsed.sampleInput : "",
      code: typeof parsed.code === "string" ? parsed.code : "",
    };
  }

  /**
   * Updates and saves a ScriptFunction directly with verified sample output.
   */
  static async saveFunctionVerifiedSample(
    func: ScriptFunction,
    sampleInput: string,
    sampleOutput: string,
  ): Promise<ScriptFunction> {
    const cleanParams = this.sanitizeParamDefs(func.paramDefs || []);
    const updated: ScriptFunction = {
      ...func,
      paramDefs: cleanParams,
      params: cleanParams.map((p) => p.name),
      sampleInput: sampleInput.trim() || undefined,
      sampleOutput: sampleOutput || undefined,
      updatedAt: Date.now(),
    };

    return await useScriptStore.getState().saveFunction(updated);
  }

  /**
   * Retrieves all functions from the script store.
   */
  static getAllFunctions(): ScriptFunction[] {
    return useScriptStore.getState().functions;
  }

  /**
   * Finds a function by its unique ID.
   */
  static getFunctionById(id: string): ScriptFunction | undefined {
    return useScriptStore.getState().functions.find((f) => f.id === id);
  }

  /**
   * Saves a function (creates new or updates existing) via scriptStore.
   */
  static async saveFunction(
    func: Omit<ScriptFunction, "createdAt" | "updatedAt"> & { id?: string },
  ): Promise<ScriptFunction> {
    return await useScriptStore.getState().saveFunction(func);
  }

  /**
   * Deletes a helper function by ID.
   */
  static async deleteFunction(id: string): Promise<boolean> {
    return await useScriptStore.getState().removeFunction(id);
  }

  /**
   * Filters a list of functions by search keyword and source filter.
   * sourceFilter can be 'all', 'builtin', 'custom', or a specific script id 'script:<id>'.
   */
  static filterFunctions(
    functionsList: ScriptFunction[],
    searchQuery: string,
    sourceFilter: string = "All",
  ): ScriptFunction[] {
    const q = searchQuery.toLowerCase().trim();

    return functionsList.filter((f) => {
      // 1. Text Search query
      const matchesSearch =
        !q ||
        f.name.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // 2. Source filter
      if (sourceFilter === "All" || !sourceFilter) return true;
      if (sourceFilter === "builtin") return Boolean(f.isBuiltin);
      if (sourceFilter === "custom") return !f.isBuiltin;

      return true;
    });
  }
}
