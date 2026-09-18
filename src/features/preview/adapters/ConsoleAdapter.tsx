import React, { useState, useEffect, useCallback } from 'react';
import type { PreviewAdapterProps } from './types';
import { Play, Trash2 } from 'lucide-react';
import { getPyodide } from '../services/pyodideService';

export const ConsoleAdapter: React.FC<PreviewAdapterProps> = ({ tab, setHeaderActions }) => {
  const [logs, setLogs] = useState<string[]>([
    `[System] Code Runner Console initialized for ${tab.name} (${tab.language.toUpperCase()})`,
  ]);
  const [isRunning, setIsRunning] = useState(false);

  const { content, language } = tab;

  const handleRunCode = useCallback(async () => {
    setIsRunning(true);
    const timestamp = new Date().toLocaleTimeString();

    if (language === 'javascript' || language === 'typescript') {
      try {
        const capturedLogs: string[] = [];
        const originalLog = console.log;
        console.log = (...args: unknown[]) => {
          capturedLogs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
          originalLog(...args);
        };

        // Transpile TypeScript by stripping type annotations if language is typescript
        let runnableCode = content;
        if (language === 'typescript') {
          runnableCode = stripTypeScriptAnnotations(content);
        }

        // Execute via safe Function constructor
        const result = new Function(runnableCode)();
        console.log = originalLog;

        const outputMsg = capturedLogs.length > 0 
          ? capturedLogs.join('\n') 
          : result !== undefined ? String(result) : 'Execution completed (undefined)';

        setLogs((prev) => [...prev, `[${timestamp}] OUTPUT:\n${outputMsg}`]);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setLogs((prev) => [...prev, `[${timestamp}] ERROR: ${errMsg}`]);
      }
    } else if (language === 'python') {
      try {
        setLogs((prev) => [...prev, `[${timestamp}] [Pyodide] Initializing WebAssembly Python runtime...`]);
        const pyodide = await getPyodide();

        const capturedOutput: string[] = [];
        pyodide.setStdout({
          batched: (msg: string) => {
            capturedOutput.push(msg);
          },
        });
        pyodide.setStderr({
          batched: (msg: string) => {
            capturedOutput.push(`[stderr] ${msg}`);
          },
        });

        // Execute Python code asynchronously
        const evalResult = await pyodide.runPythonAsync(content);
        const outText = capturedOutput.length > 0
          ? capturedOutput.join('\n')
          : evalResult !== undefined ? String(evalResult) : 'Python execution completed.';

        setLogs((prev) => [...prev, `[${timestamp}] OUTPUT:\n${outText}`]);
      } catch (pyErr: unknown) {
        const errMsg = pyErr instanceof Error ? pyErr.message : String(pyErr);
        setLogs((prev) => [...prev, `[${timestamp}] PYTHON ERROR:\n${errMsg}`]);
      }
    } else {
      setLogs((prev) => [
        ...prev,
        `[${timestamp}] Running ${language.toUpperCase()} in browser engine is ready.`,
      ]);
    }

    setIsRunning(false);
  }, [content, language]);

  const handleClear = useCallback(() => {
    setLogs([`[Console cleared]`]);
  }, []);

  // Inject trailing actions into unified PreviewPanel header
  useEffect(() => {
    setHeaderActions?.(
      <div className="flex items-center gap-1.5 select-none">
        <button
          onClick={handleRunCode}
          disabled={isRunning}
          className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-[var(--accent)] text-slate-950 font-bold hover:brightness-110 transition-all text-[10px] shadow-xs disabled:opacity-50"
          title="Run Code"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Run</span>
        </button>
        <button
          onClick={handleClear}
          className="p-1 text-[var(--text-muted)] hover:text-[var(--text-highlight)] transition-colors rounded hover:bg-[var(--bg-surface-elevated)]"
          title="Clear console"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );

    return () => setHeaderActions?.(null);
  }, [setHeaderActions, handleRunCode, handleClear, isRunning]);

  return (
    <div className="h-full w-full flex flex-col bg-[#0b0e14] text-[#c5cdd9] font-mono text-xs overflow-hidden select-none">
      {/* Output Stream */}
      <div className="flex-1 p-4 overflow-auto space-y-2 select-text leading-relaxed">
        {logs.map((log, idx) => (
          <pre
            key={idx}
            className={`whitespace-pre-wrap ${
              log.includes('ERROR:') ? 'text-red-400' : log.includes('OUTPUT:') ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            {log}
          </pre>
        ))}
      </div>
    </div>
  );
};

/**
 * Lightweight browser-safe TypeScript syntax stripper
 * Removes type declarations, interfaces, generics and type assertions
 */
function stripTypeScriptAnnotations(code: string): string {
  return code
    // Remove interface declarations (both multi-line and single-line with or without trailing semicolon)
    .replace(/(?:export\s+)?interface\s+[A-Za-z0-9_<>,\s]+(?:extends\s+[A-Za-z0-9_<>,.\s]+)?\s*\{[\s\S]*?\}(?:;)?/g, '')
    // Remove type alias declarations
    .replace(/(?:export\s+)?type\s+[A-Za-z0-9_<>,\s]+=\s*[\s\S]*?;/g, '')
    // Remove 'as Type' type assertions
    .replace(/\s+as\s+[A-Za-z0-9_<>[\]|&\s]+/g, '')
    // Remove return type annotations on functions: '): string {' or '): void =>'
    .replace(/\):\s*[A-Za-z0-9_<>[\],|\s&'"]+(?=\s*(=>|\{))/g, ') ')
    // Remove parameter and variable type annotations: ': string', ': number', etc. (not in object literals)
    .replace(/:\s*[A-Za-z0-9_<>[\],|\s&'"]+(?=[=,)])/g, '')
    // Remove generic parameters: '<T>'
    .replace(/<[A-Za-z0-9_,\s]+>(?=\s*[(/{])/g, '');
}

