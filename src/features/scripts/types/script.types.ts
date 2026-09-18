export type ScriptInputType =
  | "tab"
  | "dropdown"
  | "int"
  | "string"
  | "text"
  | "boolean"
  | "datetime";

export interface ScriptInputDef {
  name: string;
  label: string;
  type: ScriptInputType;
  required?: boolean;
  defaultValue?: string | number | boolean;
  options?: string[]; // for dropdown
  description?: string;
}

export interface ScriptFunctionParamDef {
  name: string;
  description?: string;
}

export interface ScriptFunction {
  id: string;
  name: string;
  description: string;
  params: string[]; // param names, e.g. ['str', 'delimiter']
  paramDefs?: ScriptFunctionParamDef[]; // param names + description
  author?: string;
  version?: string;
  sampleInput?: string; // sample call or argument values, e.g. JSON array or invocation expression
  sampleOutput?: string; // real executed result verified via test run
  code: string; // function body: e.g. "return str.split(delimiter);"
  isBuiltin?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ScriptEmbeddedFunction {
  id: string;
  name: string;
  description?: string;
  params: string[];
  paramDefs?: ScriptFunctionParamDef[];
  code: string;
  source: "builtin" | "custom" | "script";
  sourceScriptId?: string;
  sourceScriptName?: string;
}

export type ScriptTarget = "tab" | "selection";

export interface ScriptMetadata {
  id: string;
  name: string;
  description: string;
  author?: string;
  version?: string;
  group?: string; // Group / category for grouping scripts
  target?: ScriptTarget; // 'tab' (default) or 'selection' (selected text only)
  inputs: ScriptInputDef[];
  functions?: ScriptEmbeddedFunction[]; // Functions bundled with/used in this script
  usedFunctionIds?: string[]; // Kept for backward compatibility
  sampleInput?: string;
  sampleOutput?: string;
  code: string; // async function run(inputs, context) { ... }
  createdAt: number;
  updatedAt: number;
}

export interface ScriptRunResult {
  success: boolean;
  logs: string[];
  outputTabName?: string;
  outputContent?: string;
  replaceCurrentTab?: boolean;
  error?: string;
  durationMs: number;
}

export interface ScriptExecutionContextTab {
  id: string;
  name: string;
  content: string;
  language: string;
  selectedText?: string;
}

export interface ScriptWorkerPayload {
  code: string;
  usedFunctions: { name: string; params: string[]; code: string }[];
  inputsBuffer: ArrayBuffer;
  contextBuffer: ArrayBuffer;
}

export interface ScriptWorkerResponse {
  success: boolean;
  logs: string[];
  outputTabName?: string;
  outputContent?: string;
  replaceCurrentTab?: boolean;
  error?: string;
  durationMs: number;
}

export interface ScriptsExportBundle {
  version: string;
  exportedAt: number;
  functions: ScriptFunction[];
  scripts: ScriptMetadata[];
}
