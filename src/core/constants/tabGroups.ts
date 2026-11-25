import type { TabGroupColor } from "../types/file.types";

export interface TabGroupColorConfig {
  id: TabGroupColor;
  label: string;
  cssVar: string;
}

export const TAB_GROUP_COLORS: TabGroupColorConfig[] = [
  { id: "emerald", label: "Emerald", cssVar: "var(--accent)" },
  { id: "blue", label: "Blue", cssVar: "var(--accent-blue)" },
  { id: "purple", label: "Purple", cssVar: "var(--accent-purple)" },
  { id: "amber", label: "Amber", cssVar: "var(--accent-yellow)" },
  { id: "rose", label: "Rose", cssVar: "var(--accent-red)" },
  { id: "slate", label: "Slate", cssVar: "var(--text-muted)" },
];

export const TAB_GROUP_COLOR_MAP: Record<TabGroupColor, string> = {
  emerald: "var(--accent)",
  blue: "var(--accent-blue)",
  purple: "var(--accent-purple)",
  amber: "var(--accent-yellow)",
  rose: "var(--accent-red)",
  slate: "var(--text-muted)",
};
