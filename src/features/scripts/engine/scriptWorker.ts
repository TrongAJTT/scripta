import type { ScriptWorkerPayload, ScriptWorkerResponse } from '../types/script.types';

self.onmessage = async (e: MessageEvent<ScriptWorkerPayload>) => {
  const startTime = performance.now();
  const logs: string[] = [];

  const logCapture = (...args: unknown[]) => {
    logs.push(
      args
        .map((arg) => {
          if (typeof arg === 'object' && arg !== null) {
            try {
              return JSON.stringify(arg, null, 2);
            } catch {
              return String(arg);
            }
          }
          return String(arg);
        })
        .join(' ')
    );
  };

  try {
    const { code, usedFunctions, inputsBuffer, contextBuffer } = e.data;

    // Decode inputs and context from ArrayBuffer
    const decoder = new TextDecoder();
    const inputs = JSON.parse(decoder.decode(inputsBuffer));
    const contextRaw = JSON.parse(decoder.decode(contextBuffer));

    let tabOutputName = '';
    let tabOutputContent = '';
    let isReplaceCurrent = false;

    // Construct callable helper functions map
    const fnMap: Record<string, (...args: unknown[]) => unknown> = {};
    for (const fn of usedFunctions) {
      try {
        const AsyncFn = Object.getPrototypeOf(async function () {}).constructor;
        // Dynamically instantiate function with its param names
        fnMap[fn.name] = new AsyncFn(...fn.params, fn.code);
      } catch (compileErr) {
        logCapture(`[Warn] Failed to compile helper function "${fn.name}":`, compileErr);
      }
    }

    // Determine target content (whole content vs selection)
    const targetMode = contextRaw.target || 'tab';
    const activeSelectedText = contextRaw.currentTab?.selectedText || '';
    const activeContent = contextRaw.currentTab?.content || '';
    const targetText = targetMode === 'selection' ? activeSelectedText : activeContent;

    // Build execution context object
    const context = {
      target: targetMode,
      targetText,
      selectedText: activeSelectedText,
      currentTab: contextRaw.currentTab,
      getTab: (nameOrId: string) => {
        return (
          contextRaw.openTabs?.find(
            (t: { id: string; name: string }) => t.id === nameOrId || t.name === nameOrId
          ) || null
        );
      },
      getAllTabs: () => contextRaw.openTabs || [],
      createTab: (name: string, content: string) => {
        tabOutputName = name;
        tabOutputContent = content;
      },
      replaceCurrentTab: (content?: string) => {
        isReplaceCurrent = true;
        if (content !== undefined) {
          tabOutputContent = content;
        }
      },
      log: logCapture,
      functions: fnMap,
      fetch: self.fetch.bind(self),
    };

    // User script entrypoint wrapper
    // Code should contain async function run(inputs, context) { ... }
    const runnerCode = `
      ${code}
      if (typeof run !== 'function') {
        throw new Error('Script must define an "async function run(inputs, context) { ... }"');
      }
      return await run(inputs, context);
    `;

    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const scriptFn = new AsyncFunction('inputs', 'context', runnerCode);

    const scriptReturn = await scriptFn(inputs, context);

    // If script returned string/data and didn't explicitly call createTab or replaceCurrentTab,
    // default to creating tab with return value
    if (!tabOutputContent && scriptReturn !== undefined && scriptReturn !== null) {
      if (typeof scriptReturn === 'string') {
        tabOutputContent = scriptReturn;
      } else {
        tabOutputContent = JSON.stringify(scriptReturn, null, 2);
      }
    }

    if (!tabOutputName) {
      tabOutputName = 'Script Output';
    }

    const durationMs = Math.round(performance.now() - startTime);

    const response: ScriptWorkerResponse = {
      success: true,
      logs,
      outputTabName: tabOutputName,
      outputContent: tabOutputContent,
      replaceCurrentTab: isReplaceCurrent,
      durationMs,
    };

    self.postMessage(response);
  } catch (err: unknown) {
    const durationMs = Math.round(performance.now() - startTime);
    const errorMessage = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    logCapture('[Error]', errorMessage);

    const response: ScriptWorkerResponse = {
      success: false,
      logs,
      error: errorMessage,
      durationMs,
    };

    self.postMessage(response);
  }
};
