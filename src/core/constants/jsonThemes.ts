import type { JsonTheme } from "../types/file.types";

export interface JsonThemeColors {
  name: string;
  key: string;
  string: string;
  number: string;
  boolean: string;
  nullValue: string;
  bracket: string;
  countBadgeBg: string;
  countBadgeText: string;
  countBadgeBorder: string;
}

export const JSON_THEMES: Record<JsonTheme, JsonThemeColors> = {
  default: {
    name: "Catppuccin / Scripta",
    key: "#22d3ee", // cyan-400
    string: "#34d399", // emerald-400
    number: "#fbbf24", // amber-400
    boolean: "#c084fc", // purple-400
    nullValue: "#fb7185", // rose-400
    bracket: "var(--text-subtle)",
    countBadgeBg: "var(--bg-surface-elevated)",
    countBadgeText: "var(--accent)",
    countBadgeBorder: "var(--border-subtle)",
  },
  onedark: {
    name: "One Dark",
    key: "#e06c75", // coral / red
    string: "#98c379", // soft green
    number: "#d19a66", // warm orange
    boolean: "#56b6c2", // cyan
    nullValue: "#be5046", // dark red / brick
    bracket: "#abb2bf",
    countBadgeBg: "rgba(224, 108, 117, 0.12)",
    countBadgeText: "#e06c75",
    countBadgeBorder: "rgba(224, 108, 117, 0.25)",
  },
  dracula: {
    name: "Dracula",
    key: "#ff79c6", // vibrant pink
    string: "#f1fa8c", // pastel yellow
    number: "#bd93f9", // purple
    boolean: "#50fa7b", // neon green
    nullValue: "#ff5555", // red
    bracket: "#f8f8f2",
    countBadgeBg: "rgba(255, 121, 198, 0.12)",
    countBadgeText: "#ff79c6",
    countBadgeBorder: "rgba(255, 121, 198, 0.25)",
  },
  monokai: {
    name: "Monokai Pro",
    key: "#f92672", // vivid magenta
    string: "#e6db74", // yellow
    number: "#ae81ff", // lavender
    boolean: "#66d9ef", // bright blue
    nullValue: "#fd971f", // orange
    bracket: "#f8f8f2",
    countBadgeBg: "rgba(249, 38, 114, 0.12)",
    countBadgeText: "#f92672",
    countBadgeBorder: "rgba(249, 38, 114, 0.25)",
  },
  nord: {
    name: "Nord",
    key: "#88c0d0", // frost blue
    string: "#a3be8c", // calm green
    number: "#b48ead", // muted magenta
    boolean: "#81a1c1", // ice blue
    nullValue: "#bf616a", // aurora red
    bracket: "#d8dee9",
    countBadgeBg: "rgba(136, 192, 208, 0.12)",
    countBadgeText: "#88c0d0",
    countBadgeBorder: "rgba(136, 192, 208, 0.25)",
  },
};
