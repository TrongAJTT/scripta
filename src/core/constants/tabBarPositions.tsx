import React from "react";
import { AlignJustify, PanelLeft, PanelRight } from "lucide-react";
import type { TabBarPosition } from "../types/file.types";

export interface TabBarPositionOption {
  id: TabBarPosition;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ReactNode;
}

export const TAB_BAR_POSITION_OPTIONS: readonly TabBarPositionOption[] = [
  {
    id: "top",
    label: "Top (Horizontal)",
    shortLabel: "Top",
    description: "Classic top tab strip",
    icon: <AlignJustify className="w-3.5 h-3.5" />,
  },
  {
    id: "left",
    label: "Left (Vertical)",
    shortLabel: "Left",
    description: "Sidebar tab list on the left edge",
    icon: <PanelLeft className="w-3.5 h-3.5" />,
  },
  {
    id: "right",
    label: "Right (Vertical)",
    shortLabel: "Right",
    description: "Sidebar tab list on the right edge",
    icon: <PanelRight className="w-3.5 h-3.5" />,
  },
] as const;
