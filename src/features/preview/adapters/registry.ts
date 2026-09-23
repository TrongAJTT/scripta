import type { PreviewType } from "../../../core/types/file.types";
import type { PreviewAdapter } from "./types";
import { MarkdownAdapter } from "./MarkdownAdapter";
import { MermaidAdapter } from "./MermaidAdapter";
import { SvgAdapter } from "./SvgAdapter";
import { ImageAdapter } from "./ImageAdapter";
import { HtmlAdapter } from "./HtmlAdapter";
import { ConsoleAdapter } from "./ConsoleAdapter";
import { TextAdapter } from "./TextAdapter";
import { JsonAdapter } from "./JsonAdapter";
import { CssAdapter } from "./CssAdapter";
import { CsvAdapter } from "./CsvAdapter";
import { NoneAdapter } from "./NoneAdapter";

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
