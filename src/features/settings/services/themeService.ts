import { useEditorStore } from "../../tabs/store";
import type { ThemeMode } from "../../../core/types/file.types";

export interface ThemeOptionItem {
  id: ThemeMode;
  label: string;
  description: string;
}

export const THEME_OPTIONS: readonly ThemeOptionItem[] = [
  {
    id: "dark",
    label: "Dark",
    description: "Sleek dark editor palette",
  },
  {
    id: "light",
    label: "Light",
    description: "Clean bright editor style",
  },
  {
    id: "system",
    label: "System",
    description: "Synchronize with OS theme",
  },
] as const;

/**
 * Applies the selected theme class to the <html> root element.
 * Respects OS media query '(prefers-color-scheme: dark)' when theme is 'system'.
 */
export function applyThemeToDOM(theme: ThemeMode): void {
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (isDark) {
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
  } else {
    document.documentElement.classList.add("light");
    document.documentElement.classList.remove("dark");
  }
}

/**
 * Sets the theme in the global editor store, local storage, and DOM.
 */
export function setThemeMode(theme: ThemeMode): void {
  useEditorStore.getState().setTheme(theme);
}

/**
 * Cycles to the next theme in order: dark -> light -> system -> dark.
 */
export function cycleThemeMode(): void {
  const current = useEditorStore.getState().settings.theme;
  if (current === "dark") setThemeMode("light");
  else if (current === "light") setThemeMode("system");
  else setThemeMode("dark");
}

/**
 * Subscribes to OS color-scheme changes when 'system' theme is active.
 */
export function initSystemThemeListener(): () => void {
  if (typeof window === "undefined") return () => {};

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const listener = () => {
    const currentTheme = useEditorStore.getState().settings.theme;
    if (currentTheme === "system") {
      applyThemeToDOM("system");
    }
  };

  mediaQuery.addEventListener("change", listener);
  return () => mediaQuery.removeEventListener("change", listener);
}
