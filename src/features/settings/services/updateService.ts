import { APP_VERSION } from "../../../core/constants/app";
import { useEditorStore } from "../../tabs/store";

export interface RemoteVersionInfo {
  version: string;
  buildTime: number;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  buildTime?: number;
  error?: string;
}

const LAST_CHECK_KEY = "scripta-last-update-check";

/**
 * Fetches the version.json file from the server bypassing cache.
 */
export async function fetchRemoteVersion(): Promise<RemoteVersionInfo | null> {
  try {
    const response = await fetch(`/version.json?_t=${Date.now()}`, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as RemoteVersionInfo;
    return data;
  } catch (err) {
    console.warn("[updateService] Failed to fetch remote version:", err);
    return null;
  }
}

/**
 * Compares two semantic version strings (e.g. "1.0.0" vs "1.0.1").
 * Returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal.
 */
export function compareSemver(v1: string, v2: string): number {
  const parts1 = v1.split(".").map((n) => parseInt(n, 10) || 0);
  const parts2 = v2.split(".").map((n) => parseInt(n, 10) || 0);
  const maxLen = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] ?? 0;
    const num2 = parts2[i] ?? 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

/**
 * Checks for updates by comparing local APP_VERSION with remote version.json
 * and triggers Service Worker check if available.
 */
export async function checkForUpdates(): Promise<UpdateCheckResult> {
  // Update last checked timestamp
  localStorage.setItem(LAST_CHECK_KEY, Date.now().toString());

  // 1. Also tell Service Worker to check for updates in background
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
      }
    } catch (err) {
      console.warn("[updateService] SW update check failed:", err);
    }
  }

  // 2. Fetch remote version.json
  const remote = await fetchRemoteVersion();
  if (!remote) {
    return {
      hasUpdate: false,
      currentVersion: APP_VERSION,
      latestVersion: APP_VERSION,
      error: "Could not reach server to check for updates.",
    };
  }

  const cmp = compareSemver(remote.version, APP_VERSION);
  const hasUpdate = cmp > 0;

  return {
    hasUpdate,
    currentVersion: APP_VERSION,
    latestVersion: remote.version,
    buildTime: remote.buildTime,
  };
}

/**
 * Gets the total number and names of active Cache Storage caches.
 */
export async function getCacheStorageInfo(): Promise<{ names: string[]; count: number }> {
  if (!("caches" in window)) {
    return { names: [], count: 0 };
  }
  try {
    const names = await caches.keys();
    return { names, count: names.length };
  } catch {
    return { names: [], count: 0 };
  }
}

/**
 * Forces a complete cache clear and reloads the application.
 * Unregisters all Service Workers, deletes all Cache Storage caches,
 * and forces a hard reload.
 * NOTE: User tab contents and workspaces stored in IndexedDB are completely safe.
 */
export async function forceClearCacheAndReload(): Promise<void> {
  // 1. Unregister all service workers
  if ("serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
    } catch (err) {
      console.warn("[updateService] Failed to unregister SW:", err);
    }
  }

  // 2. Delete all Cache Storage instances
  if ("caches" in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    } catch (err) {
      console.warn("[updateService] Failed to delete caches:", err);
    }
  }

  // 3. Force reload bypass cache
  window.location.reload();
}

/**
 * Evaluates whether an automated update check should be performed
 * based on user settings and last check timestamp (fixed 3 hours interval).
 */
export function shouldPerformAutoCheck(): boolean {
  const settings = useEditorStore.getState().settings;
  if (settings.autoCheckUpdates === false) return false;

  const intervalHours = 3; // Fixed 3-hour interval

  const lastCheckedStr = localStorage.getItem(LAST_CHECK_KEY);
  if (!lastCheckedStr) return true;

  const lastChecked = parseInt(lastCheckedStr, 10);
  if (isNaN(lastChecked)) return true;

  const diffMs = Date.now() - lastChecked;
  const intervalMs = intervalHours * 60 * 60 * 1000;
  return diffMs >= intervalMs;
}
