export interface PyodideInterface {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (options: { batched: (msg: string) => void }) => void;
  setStderr: (options: { batched: (msg: string) => void }) => void;
  setStdin: (options: { stdin: () => string | null }) => void;
}

declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<PyodideInterface>;
    pyodideInstance?: PyodideInterface;
  }
}

let pyodidePromise: Promise<PyodideInterface> | null = null;

export async function getPyodide(): Promise<PyodideInterface> {
  if (window.pyodideInstance) {
    return window.pyodideInstance;
  }

  if (pyodidePromise) {
    return pyodidePromise;
  }

  pyodidePromise = (async () => {
    // 1. Ensure pyodide.js script tag is in document
    if (!window.loadPyodide) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.27.2/full/pyodide.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Pyodide WebAssembly script from CDN'));
        document.head.appendChild(script);
      });
    }

    // 2. Load and initialize Pyodide
    if (window.loadPyodide) {
      const pyodide = await window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.2/full/',
      });
      window.pyodideInstance = pyodide;
      return pyodide;
    }

    throw new Error('Pyodide loader not found on window');
  })();

  return pyodidePromise;
}
