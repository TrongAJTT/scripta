import { describe, it, expect } from "vitest";
import {
  getActivePreviewThreshold,
  checkPreviewThreshold,
  formatBytes,
} from "../previewLimits";

describe("previewLimits", () => {
  it("scales thresholds according to performance preset", () => {
    const eco = getActivePreviewThreshold("mermaid", "eco");
    const balanced = getActivePreviewThreshold("mermaid", "balanced");
    const perf = getActivePreviewThreshold("mermaid", "performance");
    const unlimited = getActivePreviewThreshold("mermaid", "unlimited");

    expect(eco.maxLines).toBe(Math.round(balanced.maxLines * 0.5));
    expect(perf.maxLines).toBe(Math.round(balanced.maxLines * 2.5));
    expect(unlimited.maxLines).toBe(Infinity);
    expect(unlimited.maxBytes).toBe(Infinity);
  });

  it("detects when line or byte limits are exceeded", () => {
    const small = checkPreviewThreshold("graph TD\nA-->B", "mermaid", "balanced");
    expect(small.exceeds).toBe(false);

    const manyLines = Array.from({ length: 450 }, () => "A-->B").join("\n");
    const lineExceeded = checkPreviewThreshold(
      manyLines,
      "mermaid",
      "balanced",
    );
    expect(lineExceeded.exceeds).toBe(true);
    expect(lineExceeded.reason).toBe("lines");

    const alwaysAllowed = checkPreviewThreshold(
      manyLines,
      "mermaid",
      "unlimited",
    );
    expect(alwaysAllowed.exceeds).toBe(false);
  });

  it("formats bytes into readable strings", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(Infinity)).toBe("Unlimited");
    expect(formatBytes(1536)).toBe("1.5 KB");
  });
});
