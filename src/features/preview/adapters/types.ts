import type React from "react";
import type { FileTab, PreviewType } from "../../../core/types/file.types";

export interface PreviewAdapterProps {
  tab: FileTab;
  setHeaderActions?: (actions: React.ReactNode) => void;
  /** Adapter can register a custom print handler. Pass null to unregister (on cleanup). */
  setPrintHandler?: (fn: (() => void) | null) => void;
}

export interface PreviewAdapter {
  type: PreviewType;
  title: string;
  badge: string;
  iconType:
    | "markdown"
    | "mermaid"
    | "svg"
    | "image"
    | "html"
    | "console"
    | "text"
    | "json"
    | "css"
    | "csv"
    | "none";
  Component: React.ComponentType<PreviewAdapterProps>;
}
