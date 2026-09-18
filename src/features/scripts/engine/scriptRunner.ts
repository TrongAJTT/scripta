import type {
  ScriptMetadata,
  ScriptFunction,
  ScriptEmbeddedFunction,
  ScriptRunResult,
  ScriptWorkerPayload,
  ScriptWorkerResponse,
  ScriptExecutionContextTab,
} from "../types/script.types";

export interface RunScriptContextOptions {
  currentTab: ScriptExecutionContextTab | null;
  openTabs: ScriptExecutionContextTab[];
  target?: "tab" | "selection";
}

export async function executeScriptInWorker(
  script: ScriptMetadata,
  usedFunctionsList: (ScriptFunction | ScriptEmbeddedFunction)[],
  inputs: Record<string, unknown>,
  contextOptions: RunScriptContextOptions,
): Promise<ScriptRunResult> {
  const encoder = new TextEncoder();
  const inputsBuffer = encoder.encode(JSON.stringify(inputs)).buffer;
  const contextBuffer = encoder.encode(JSON.stringify(contextOptions)).buffer;

  const usedFunctions = usedFunctionsList.map((fn) => ({
    name: fn.name,
    params: fn.params,
    code: fn.code,
  }));

  const payload: ScriptWorkerPayload = {
    code: script.code,
    usedFunctions,
    inputsBuffer,
    contextBuffer,
  };

  return new Promise((resolve) => {
    let isSettled = false;
    let worker: Worker | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (worker) {
        worker.terminate();
        worker = null;
      }
    };

    try {
      worker = new Worker(new URL("./scriptWorker.ts", import.meta.url), {
        type: "module",
      });

      timer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          cleanup();
          resolve({
            success: false,
            logs: ["[Timeout] Script execution exceeded 30-second time limit."],
            error: "Execution timed out (30s limit)",
            durationMs: 30000,
          });
        }
      }, 30000);

      worker.onmessage = (event: MessageEvent<ScriptWorkerResponse>) => {
        if (!isSettled) {
          isSettled = true;
          cleanup();
          resolve(event.data);
        }
      };

      worker.onerror = (err: ErrorEvent) => {
        if (!isSettled) {
          isSettled = true;
          cleanup();
          resolve({
            success: false,
            logs: [`[Worker Error] ${err.message}`],
            error: err.message,
            durationMs: 0,
          });
        }
      };

      // Transfer ArrayBuffers to avoid copying overhead
      worker.postMessage(payload, [inputsBuffer, contextBuffer]);
    } catch (err: unknown) {
      if (!isSettled) {
        isSettled = true;
        cleanup();
        const msg = err instanceof Error ? err.message : String(err);
        resolve({
          success: false,
          logs: [`[Runner Error] Failed to initialize worker: ${msg}`],
          error: msg,
          durationMs: 0,
        });
      }
    }
  });
}
