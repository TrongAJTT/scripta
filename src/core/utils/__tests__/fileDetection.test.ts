import { describe, it, expect } from "vitest";
import {
  detectLanguageFromFilename,
  getDefaultExtensionForLanguage,
  replaceFileExtension,
  getPreviewTypeForLanguage,
  formatByteSize,
  detectLineEnding,
  detectLanguageFromContent,
} from "../fileDetection";

describe("fileDetection", () => {
  describe("detectLanguageFromFilename", () => {
    it("detects common code, document, and diagram extensions", () => {
      expect(detectLanguageFromFilename("notes.md")).toEqual({
        language: "markdown",
        previewType: "markdown",
      });
      expect(detectLanguageFromFilename("diagram.mmd")).toEqual({
        language: "mermaid",
        previewType: "mermaid",
      });
      expect(detectLanguageFromFilename("app.tsx")).toEqual({
        language: "typescript",
        previewType: "console",
      });
      expect(detectLanguageFromFilename("script.py")).toEqual({
        language: "python",
        previewType: "console",
      });
      expect(detectLanguageFromFilename("data.csv")).toEqual({
        language: "csv",
        previewType: "csv",
      });
      expect(detectLanguageFromFilename("paper.tex")).toEqual({
        language: "latex",
        previewType: "latex",
      });
      expect(detectLanguageFromFilename("photo.PNG")).toEqual({
        language: "plaintext",
        previewType: "image",
      });
    });

    it("falls back to plaintext/text when there is no extension and other/none for unknown extensions", () => {
      expect(detectLanguageFromFilename("README")).toEqual({
        language: "plaintext",
        previewType: "text",
      });
      expect(detectLanguageFromFilename("archive.xyz")).toEqual({
        language: "other",
        previewType: "none",
      });
    });
  });

  describe("extension helpers", () => {
    it("returns default extensions and replaces file extensions", () => {
      expect(getDefaultExtensionForLanguage("typescript")).toBe("ts");
      expect(getDefaultExtensionForLanguage("mermaid")).toBe("mmd");
      expect(getDefaultExtensionForLanguage("latex")).toBe("tex");
      expect(replaceFileExtension("notes.md", "html")).toBe("notes.html");
      expect(replaceFileExtension("untitled", "txt")).toBe("untitled.txt");
    });

    it("maps language to preview type", () => {
      expect(getPreviewTypeForLanguage("markdown")).toBe("markdown");
      expect(getPreviewTypeForLanguage("javascript")).toBe("console");
      expect(getPreviewTypeForLanguage("json")).toBe("json");
      expect(getPreviewTypeForLanguage("yaml")).toBe("none");
    });
  });

  describe("formatByteSize & detectLineEnding", () => {
    it("formats bytes, KB, and MB", () => {
      expect(formatByteSize(512)).toBe("512 B");
      expect(formatByteSize(2048)).toBe("2.0 KB");
      expect(formatByteSize(2 * 1024 * 1024)).toBe("2.00 MB");
    });

    it("detects CRLF vs LF", () => {
      expect(detectLineEnding("a\r\nb")).toBe("CRLF");
      expect(detectLineEnding("a\nb")).toBe("LF");
    });
  });

  describe("detectLanguageFromContent", () => {
    it("detects JSON, HTML, SVG, Python, TypeScript, Mermaid, CSV, and LaTeX", () => {
      expect(detectLanguageFromContent('{"name":"Scripta","v":1}')).toBe(
        "json",
      );
      expect(detectLanguageFromContent("<!DOCTYPE html><html></html>")).toBe(
        "html",
      );
      expect(
        detectLanguageFromContent('<svg xmlns="http://www.w3.org/2000/svg"/>'),
      ).toBe("svg");
      expect(detectLanguageFromContent("def greet(name):\n  print(name)")).toBe(
        "python",
      );
      expect(
        detectLanguageFromContent(
          'import { useState } from "react";\ninterface Props { id: string; }',
        ),
      ).toBe("typescript");
      expect(detectLanguageFromContent("flowchart TD\n  A --> B")).toBe(
        "mermaid",
      );
      expect(
        detectLanguageFromContent("name,age,city\nAlice,30,Hanoi\nBob,25,DN"),
      ).toBe("csv");
      expect(
        detectLanguageFromContent(
          "\\documentclass{article}\n\\begin{document}\nHello\n\\end{document}",
        ),
      ).toBe("latex");
    });

    it("returns null for short content", () => {
      expect(detectLanguageFromContent("hi")).toBeNull();
    });
  });
});
