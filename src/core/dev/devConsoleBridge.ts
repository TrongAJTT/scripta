/**
 * Developer console bridge interface.
 * Exposes safe debugging & testing commands on `window.__SCRIPTA__` in development mode.
 *
 * Implements a pure network adapter interception for `/version.json`
 * so production services (e.g. `updateService.ts`) contain zero mock code or state.
 */
export interface ScriptaDevBridge {
  updates: {
    /**
     * Simulate a new application update availability.
     * @param version Target version string (default: "1.2.0")
     * @param buildTime Timestamp of build (default: now)
     */
    mock: (version?: string, buildTime?: number) => void;
    /**
     * Reset mock version and check against server version.json again.
     */
    reset: () => void;
    /**
     * Force open update modal.
     */
    openModal: () => void;
  };
}

declare global {
  interface Window {
    __SCRIPTA__?: ScriptaDevBridge;
    // Backward-compatible shortcut aliases
    __triggerAppUpdate?: (version?: string, buildTime?: number) => void;
    __resetAppUpdate?: () => void;
  }
}

/**
 * Initializes developer debugging tools on `window.__SCRIPTA__`.
 * Only active in Vite development mode (`import.meta.env.DEV`).
 */
export function initDevConsoleBridge(): void {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return;
  }

  // Intercept fetch for `/version.json` in dev mode without touching updateService
  let devMockVersion: { version: string; buildTime: number } | null = null;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const urlStr =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    if (devMockVersion && urlStr.includes("/version.json")) {
      return new Response(JSON.stringify(devMockVersion), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return originalFetch(input, init);
  };

  const devBridge: ScriptaDevBridge = {
    updates: {
      mock: (version = "1.2.0", buildTime = Date.now()) => {
        devMockVersion = { version, buildTime };
        window.dispatchEvent(new CustomEvent("open-app-update-modal"));
        console.info(
          `%c[Scripta Dev]%c Mocked update to v${version}. Please open app update modal to see the mock update.`,
          "color: #10b981; font-weight: bold",
          "color: inherit",
        );
      },
      reset: () => {
        devMockVersion = null;
        window.dispatchEvent(new CustomEvent("open-app-update-modal"));
        console.info(
          `%c[Scripta Dev]%c Reset mock update to server version.`,
          "color: #10b981; font-weight: bold",
          "color: inherit",
        );
      },
      openModal: () => {
        window.dispatchEvent(new CustomEvent("open-app-update-modal"));
      },
    },
  };

  window.__SCRIPTA__ = devBridge;

  // Convenient root aliases for quick console typing
  window.__triggerAppUpdate = devBridge.updates.mock;
  window.__resetAppUpdate = devBridge.updates.reset;

  console.info(
    `%c[Scripta Dev Tools]%c Initialized. Available commands:
- window.__SCRIPTA__.updates.mock('1.2.0')  (or __triggerAppUpdate('1.2.0'))
- window.__SCRIPTA__.updates.reset()         (or __resetAppUpdate())`,
    "color: #10b981; font-weight: bold",
    "color: #64748b",
  );
}
