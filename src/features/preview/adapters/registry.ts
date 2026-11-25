import { lazy } from "react";
import type { PreviewType } from "../../../core/types/file.types";
import type { PreviewAdapter } from "./types";

const MarkdownAdapter = lazy(() =>
  import("./MarkdownAdapter").then((m) => ({ default: m.MarkdownAdapter })),
);
const MermaidAdapter = lazy(() =>
  import("./MermaidAdapter").then((m) => ({ default: m.MermaidAdapter })),
);
const SvgAdapter = lazy(() =>
  import("./SvgAdapter").then((m) => ({ default: m.SvgAdapter })),
);
const ImageAdapter = lazy(() =>
  import("./ImageAdapter").then((m) => ({ default: m.ImageAdapter })),
);
const HtmlAdapter = lazy(() =>
  import("./HtmlAdapter").then((m) => ({ default: m.HtmlAdapter })),
);
const ConsoleAdapter = lazy(() =>
  import("./ConsoleAdapter").then((m) => ({ default: m.ConsoleAdapter })),
);
const TextAdapter = lazy(() =>
  import("./TextAdapter").then((m) => ({ default: m.TextAdapter })),
);
const JsonAdapter = lazy(() =>
  import("./JsonAdapter").then((m) => ({ default: m.JsonAdapter })),
);
const CssAdapter = lazy(() =>
  import("./CssAdapter").then((m) => ({ default: m.CssAdapter })),
);
const CsvAdapter = lazy(() =>
  import("./CsvAdapter").then((m) => ({ default: m.CsvAdapter })),
);
const LatexAdapter = lazy(() =>
  import("./LatexAdapter").then((m) => ({ default: m.LatexAdapter })),
);
const NoneAdapter = lazy(() =>
  import("./NoneAdapter").then((m) => ({ default: m.NoneAdapter })),
);

const adapters: Record<PreviewType, PreviewAdapter> = {
  markdown: {
    type: "markdown",
    title: "Preview Panel",
    badge: "MARKDOWN",
    iconType: "markdown",
    Component: MarkdownAdapter,
  },
  mermaid: {
    type: "mermaid",
    title: "Preview Panel",
    badge: "MERMAID",
    iconType: "mermaid",
    Component: MermaidAdapter,
  },
  svg: {
    type: "svg",
    title: "Preview Panel",
    badge: "SVG",
    iconType: "svg",
    Component: SvgAdapter,
  },
  image: {
    type: "image",
    title: "Preview Panel",
    badge: "IMAGE",
    iconType: "image",
    Component: ImageAdapter,
  },
  html: {
    type: "html",
    title: "Preview Panel",
    badge: "HTML",
    iconType: "html",
    Component: HtmlAdapter,
  },
  console: {
    type: "console",
    title: "Preview Panel",
    badge: "CONSOLE",
    iconType: "console",
    Component: ConsoleAdapter,
  },
  text: {
    type: "text",
    title: "Preview Panel",
    badge: "TEXT",
    iconType: "text",
    Component: TextAdapter,
  },
  json: {
    type: "json",
    title: "Preview Panel",
    badge: "JSON",
    iconType: "json",
    Component: JsonAdapter,
  },
  css: {
    type: "css",
    title: "Preview Panel",
    badge: "CSS",
    iconType: "css",
    Component: CssAdapter,
  },
  csv: {
    type: "csv",
    title: "Preview Panel",
    badge: "CSV",
    iconType: "csv",
    Component: CsvAdapter,
  },
  latex: {
    type: "latex",
    title: "Preview Panel",
    badge: "LATEX",
    iconType: "latex",
    Component: LatexAdapter,
  },
  none: {
    type: "none",
    title: "Preview Panel",
    badge: "NONE",
    iconType: "none",
    Component: NoneAdapter,
  },
};

export function getPreviewAdapter(type?: PreviewType): PreviewAdapter {
  if (!type || !adapters[type]) {
    return adapters.none;
  }
  return adapters[type];
}
