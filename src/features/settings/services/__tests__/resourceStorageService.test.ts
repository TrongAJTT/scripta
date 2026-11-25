import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  inspectResourceCaches,
  clearResourceGroup,
  clearAllOptionalResources,
} from "../resourceStorageService";

interface MockEntry {
  url: string;
  size: number;
  opaque?: boolean;
}

function createMockCacheStorage(initial: Record<string, MockEntry[]>) {
  const store = new Map<string, Map<string, MockEntry>>();
  for (const [name, entries] of Object.entries(initial)) {
    const map = new Map<string, MockEntry>();
    for (const e of entries) map.set(e.url, e);
    store.set(name, map);
  }

  return {
    keys: vi.fn(async () => Array.from(store.keys())),
    delete: vi.fn(async (name: string) => store.delete(name)),
    open: vi.fn(async (name: string) => {
      let bucket = store.get(name);
      if (!bucket) {
        bucket = new Map();
        store.set(name, bucket);
      }
      return {
        keys: vi.fn(async () =>
          Array.from(bucket!.keys()).map((url) => ({ url }) as Request),
        ),
        match: vi.fn(async (req: Request) => {
          const entry = bucket!.get(req.url);
          if (!entry) return undefined;
          return {
            type: entry.opaque ? "opaque" : "basic",
            headers: new Headers(
              entry.opaque ? {} : { "content-length": String(entry.size) },
            ),
            clone: () => ({
              blob: async () => new Blob(["x".repeat(entry.size)]),
            }),
          } as unknown as Response;
        }),
        delete: vi.fn(async (req: Request) => bucket!.delete(req.url)),
      };
    }),
  };
}

describe("resourceStorageService", () => {
  beforeEach(() => {
    const mockCaches = createMockCacheStorage({
      "pyodide-cdn-cache": [
        { url: "https://cdn.jsdelivr.net/pyodide/v0.27.2/full/pyodide.js", size: 50000 },
        { url: "https://cdn.jsdelivr.net/pyodide/v0.27.2/full/pyodide.asm.wasm", size: 0, opaque: true },
      ],
      "workbox-precache-v2": [
        { url: "https://localhost/assets/index-123.js", size: 240000 },
        { url: "https://localhost/assets/elk-abc.js", size: 1450000 },
        { url: "https://localhost/assets/katex-xyz.js", size: 258000 },
        { url: "https://localhost/assets/lang-python-111.js", size: 12000 },
      ],
    });

    Object.defineProperty(window, "caches", {
      value: mockCaches,
      configurable: true,
    });
  });

  it("groups cached entries accurately and detects opaque responses", async () => {
    const stats = await inspectResourceCaches();
    const byId = Object.fromEntries(stats.map((s) => [s.id, s]));

    expect(byId.pyodide.status).toBe("cached");
    expect(byId.pyodide.entryCount).toBe(2);
    expect(byId.pyodide.estimatedBytes).toBe(50000);
    expect(byId.pyodide.hasOpaqueEntries).toBe(true);

    expect(byId.mermaid.status).toBe("cached");
    expect(byId.mermaid.estimatedBytes).toBe(1450000);

    expect(byId.latex.status).toBe("cached");
    expect(byId.latex.estimatedBytes).toBe(258000);

    expect(byId["codemirror-langs"].status).toBe("cached");
    expect(byId["codemirror-langs"].estimatedBytes).toBe(12000);
  });

  it("selectively clears a single resource group without deleting core shell", async () => {
    const removed = await clearResourceGroup("pyodide");
    expect(removed).toBe(2);

    const stats = await inspectResourceCaches();
    const byId = Object.fromEntries(stats.map((s) => [s.id, s]));
    expect(byId.pyodide.status).toBe("not-cached");
    expect(byId.mermaid.status).toBe("cached");
    expect(byId.latex.status).toBe("cached");
  });

  it("clears all optional resources while keeping non-matching core entries", async () => {
    const totalRemoved = await clearAllOptionalResources();
    expect(totalRemoved).toBe(5);

    const stats = await inspectResourceCaches();
    expect(stats.every((s) => s.status === "not-cached")).toBe(true);

    const precache = await window.caches.open("workbox-precache-v2");
    const remainingKeys = await precache.keys();
    expect(remainingKeys.map((k) => k.url)).toEqual([
      "https://localhost/assets/index-123.js",
    ]);
  });
});
