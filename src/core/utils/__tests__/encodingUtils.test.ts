import { describe, it, expect } from "vitest";
import {
  detectEncodingFromBuffer,
  decodeBuffer,
  encodeString,
} from "../encodingUtils";

describe("encodingUtils", () => {
  it("detects UTF-8-BOM, UTF-16 LE BOM, UTF-16 BE BOM, and defaults to UTF-8", () => {
    expect(
      detectEncodingFromBuffer(new Uint8Array([0xef, 0xbb, 0xbf, 0x41])),
    ).toEqual({
      encoding: "UTF-8-BOM",
      hasBOM: true,
      bomOffset: 3,
    });

    expect(
      detectEncodingFromBuffer(new Uint8Array([0xff, 0xfe, 0x41, 0x00])),
    ).toEqual({
      encoding: "UTF-16 LE BOM",
      hasBOM: true,
      bomOffset: 2,
    });

    expect(
      detectEncodingFromBuffer(new Uint8Array([0xfe, 0xff, 0x00, 0x41])),
    ).toEqual({
      encoding: "UTF-16 BE BOM",
      hasBOM: true,
      bomOffset: 2,
    });

    expect(detectEncodingFromBuffer(new Uint8Array([0x41, 0x42]))).toEqual({
      encoding: "UTF-8",
      hasBOM: false,
      bomOffset: 0,
    });
  });

  it("roundtrips encodeString and decodeBuffer for UTF-8 and BOM encodings", () => {
    const sample = "Xin chào Scripta ✨";

    const utf8 = encodeString(sample, "UTF-8");
    expect(decodeBuffer(utf8, "UTF-8")).toBe(sample);

    const utf8Bom = encodeString(sample, "UTF-8-BOM");
    expect(Array.from(utf8Bom.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
    expect(decodeBuffer(utf8Bom, "UTF-8-BOM")).toBe(sample);

    const utf16Le = encodeString(sample, "UTF-16 LE BOM");
    expect(Array.from(utf16Le.slice(0, 2))).toEqual([0xff, 0xfe]);
    expect(decodeBuffer(utf16Le, "UTF-16 LE BOM")).toBe(sample);

    const utf16Be = encodeString(sample, "UTF-16 BE BOM");
    expect(Array.from(utf16Be.slice(0, 2))).toEqual([0xfe, 0xff]);
    expect(decodeBuffer(utf16Be, "UTF-16 BE BOM")).toBe(sample);
  });
});
