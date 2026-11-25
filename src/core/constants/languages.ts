import type { SupportedLanguage } from "../types/file.types";

export interface LanguageOption {
  id: SupportedLanguage;
  label: string;
}

export type SampleLanguage = Exclude<SupportedLanguage, "other">;

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { id: "markdown", label: "MARKDOWN" },
  { id: "csv", label: "CSV / TSV" },
  { id: "html", label: "HTML" },
  { id: "javascript", label: "JAVASCRIPT" },
  { id: "typescript", label: "TYPESCRIPT" },
  { id: "css", label: "CSS" },
  { id: "json", label: "JSON" },
  { id: "python", label: "PYTHON" },
  { id: "svg", label: "SVG" },
  { id: "mermaid", label: "MERMAID" },
  { id: "latex", label: "LATEX" },
  { id: "plaintext", label: "PLAIN TEXT" },
  { id: "other", label: "OTHER..." },
];

export const SAMPLE_LANGUAGE_OPTIONS: { id: SampleLanguage; label: string }[] =
  LANGUAGE_OPTIONS.filter(
    (opt): opt is { id: SampleLanguage; label: string } => opt.id !== "other",
  );
