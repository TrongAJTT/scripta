export type ResourceGroupId =
  | "pyodide"
  | "mermaid"
  | "latex"
  | "codemirror-langs";

export interface ResourceGroupStats {
  id: ResourceGroupId;
  name: string;
  description: string;
  status: "cached" | "not-cached";
  entryCount: number;
  estimatedBytes: number;
  hasOpaqueEntries: boolean;
}

export interface StorageQuotaSummary {
  usage: number | null;
  quota: number | null;
}

const PYODIDE_CACHE_NAME = "pyodide-cdn-cache";

interface ResourceDefinition {
  id: ResourceGroupId;
  name: string;
  description: string;
  matches: (cacheName: string, url: string) => boolean;
}

const RESOURCE_DEFINITIONS: ResourceDefinition[] = [
  {
    id: "pyodide",
    name: "Python WASM (Pyodide)",
    description:
      "In-browser Python runtime & standard library cached from CDN for offline execution.",
    matches: (cacheName, url) =>
      cacheName === PYODIDE_CACHE_NAME ||
      url.includes("cdn.jsdelivr.net/pyodide"),
  },
  {
    id: "mermaid",
    name: "Mermaid & Diagram Engines",
    description:
      "Diagram parser, ELK, Dagre, and Cytoscape layout engines for flowcharts & graphs.",
    matches: (_cacheName, url) =>
      /(?:mermaid|elk-|cytoscape|dagre|cose-bilkent|diagram)/i.test(url),
  },
  {
    id: "latex",
    name: "LaTeX & KaTeX Fonts",
    description:
      "KaTeX math typesetting engine and academic font files (.woff2, .woff, .ttf).",
    matches: (_cacheName, url) => /(?:katex|latexadapter)/i.test(url),
  },
  {
    id: "codemirror-langs",
    name: "CodeMirror Language Packs",
    description:
      "On-demand syntax highlighters (Python, LaTeX, JS/TS, HTML, CSS, JSON, Markdown).",
    matches: (_cacheName, url) =>
      /(?:@codemirror\/lang-|codemirror\/lang-|\/lang-[a-z]+-|legacy-modes|stex)/i.test(
        url,
      ),
  },
];

async function estimateResponseBytes(
  response: Response | undefined,
): Promise<{ bytes: number; isOpaque: boolean }> {
  if (!response) return { bytes: 0, isOpaque: false };
  if (response.type === "opaque") {
    return { bytes: 0, isOpaque: true };
  }

  const contentLength = response.headers?.get("content-length");
  if (contentLength) {
    const parsed = Number(contentLength);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      return { bytes: parsed, isOpaque: false };
    }
  }

  try {
    const blob = await response.clone().blob();
    return { bytes: blob.size, isOpaque: false };
  } catch {
    return { bytes: 0, isOpaque: false };
  }
}

export async function getStorageQuotaSummary(): Promise<StorageQuotaSummary> {
  if (
    typeof navigator === "undefined" ||
    !navigator.storage ||
    typeof navigator.storage.estimate !== "function"
  ) {
    return { usage: null, quota: null };
  }
  try {
    const estimate = await navigator.storage.estimate();
    return {
      usage: typeof estimate.usage === "number" ? estimate.usage : null,
      quota: typeof estimate.quota === "number" ? estimate.quota : null,
    };
  } catch {
    return { usage: null, quota: null };
  }
}

export async function inspectResourceCaches(): Promise<ResourceGroupStats[]> {
  const statsMap = new Map<ResourceGroupId, ResourceGroupStats>();
  for (const def of RESOURCE_DEFINITIONS) {
    statsMap.set(def.id, {
      id: def.id,
      name: def.name,
      description: def.description,
      status: "not-cached",
      entryCount: 0,
      estimatedBytes: 0,
      hasOpaqueEntries: false,
    });
  }

  if (typeof window === "undefined" || !("caches" in window)) {
    return Array.from(statsMap.values());
  }

  try {
    const cacheNames = await window.caches.keys();
    for (const cacheName of cacheNames) {
      const cache = await window.caches.open(cacheName);
      const requests = await cache.keys();

      for (const req of requests) {
        const matchedDef = RESOURCE_DEFINITIONS.find((def) =>
          def.matches(cacheName, req.url),
        );
        if (!matchedDef) continue;

        const entry = statsMap.get(matchedDef.id);
        if (!entry) continue;

        entry.entryCount += 1;
        entry.status = "cached";

        const res = await cache.match(req);
        const { bytes, isOpaque } = await estimateResponseBytes(res);
        entry.estimatedBytes += bytes;
        if (isOpaque) {
          entry.hasOpaqueEntries = true;
        }
      }
    }
  } catch (err) {
    console.warn("[resourceStorageService] Failed to inspect caches:", err);
  }

  return Array.from(statsMap.values());
}

export async function clearResourceGroup(
  groupId: ResourceGroupId,
): Promise<number> {
  if (typeof window === "undefined" || !("caches" in window)) {
    return 0;
  }

  const def = RESOURCE_DEFINITIONS.find((d) => d.id === groupId);
  if (!def) return 0;

  let removedCount = 0;

  if (groupId === "pyodide") {
    try {
      const cache = await window.caches.open(PYODIDE_CACHE_NAME);
      const keys = await cache.keys();
      removedCount += keys.length;
      await window.caches.delete(PYODIDE_CACHE_NAME);
    } catch {
      // Ignore if cache doesn't exist
    }
  }

  try {
    const cacheNames = await window.caches.keys();
    for (const cacheName of cacheNames) {
      if (groupId === "pyodide" && cacheName === PYODIDE_CACHE_NAME) {
        continue;
      }
      const cache = await window.caches.open(cacheName);
      const requests = await cache.keys();
      for (const req of requests) {
        if (def.matches(cacheName, req.url)) {
          const deleted = await cache.delete(req);
          if (deleted) removedCount += 1;
        }
      }
    }
  } catch (err) {
    console.warn(
      `[resourceStorageService] Failed to clear group "${groupId}":`,
      err,
    );
  }

  return removedCount;
}

export async function clearAllOptionalResources(): Promise<number> {
  let total = 0;
  for (const def of RESOURCE_DEFINITIONS) {
    total += await clearResourceGroup(def.id);
  }
  return total;
}

export async function preloadPyodideResource(): Promise<void> {
  const { getPyodide } = await import(
    "../../preview/services/pyodideService"
  );
  await getPyodide();
}
