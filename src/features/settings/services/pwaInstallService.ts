export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

type InstallPromptListener = (canPrompt: boolean) => void;

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<InstallPromptListener>();

// Check if running in standalone mode (already installed PWA)
export function isRunningStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      (window.navigator as unknown as { standalone: boolean }).standalone ===
        true)
  );
}

// Detect operating system / platform
export function getPlatformInfo(): {
  isIOS: boolean;
  isMac: boolean;
  isAndroid: boolean;
  isWindows: boolean;
  isMobile: boolean;
} {
  if (typeof window === "undefined") {
    return {
      isIOS: false,
      isMac: false,
      isAndroid: false,
      isWindows: false,
      isMobile: false,
    };
  }

  const ua = window.navigator.userAgent.toLowerCase();
  const isIOS =
    /iphone|ipad|ipod/.test(ua) ||
    (window.navigator.platform === "MacIntel" &&
      window.navigator.maxTouchPoints > 1);
  const isAndroid = /android/.test(ua);
  const isMac = /macintosh|mac os x/.test(ua) && !isIOS;
  const isWindows = /windows/.test(ua);
  const isMobile = isIOS || isAndroid;

  return { isIOS, isMac, isAndroid, isWindows, isMobile };
}

// Declare window global for early captured prompt
declare global {
  interface Window {
    __deferredPwaPrompt?: BeforeInstallPromptEvent | null;
  }
}

/**
 * Auto-initialize beforeinstallprompt listener immediately upon script execution.
 */
if (typeof window !== "undefined") {
  // Check if early inline script already caught the prompt
  if (window.__deferredPwaPrompt) {
    deferredPrompt = window.__deferredPwaPrompt;
  }

  window.addEventListener("beforeinstallprompt", (e: BeforeInstallPromptEvent) => {
    e.preventDefault();
    deferredPrompt = e;
    window.__deferredPwaPrompt = e;
    listeners.forEach((fn) => fn(true));
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    window.__deferredPwaPrompt = null;
    listeners.forEach((fn) => fn(false));
  });
}

/**
 * Subscribe to changes in install prompt availability.
 */
export function subscribeInstallPrompt(
  listener: InstallPromptListener,
): () => void {
  listeners.add(listener);
  // Emit current state immediately
  listener(Boolean(deferredPrompt));
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Trigger the native browser install prompt if available.
 */
export async function triggerNativeInstallPrompt(): Promise<{
  success: boolean;
  outcome: "accepted" | "dismissed" | "unavailable";
}> {
  if (!deferredPrompt) {
    return { success: false, outcome: "unavailable" };
  }

  try {
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    listeners.forEach((fn) => fn(false));

    return {
      success: choice.outcome === "accepted",
      outcome: choice.outcome,
    };
  } catch (err) {
    console.warn("[pwaInstallService] Failed to trigger prompt:", err);
    deferredPrompt = null;
    listeners.forEach((fn) => fn(false));
    return { success: false, outcome: "unavailable" };
  }
}

/**
 * Check if the prompt can currently be triggered directly.
 */
export function canTriggerNativePrompt(): boolean {
  return Boolean(deferredPrompt);
}
