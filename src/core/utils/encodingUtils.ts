/**
 * Supported encoding identifiers for text documents.
 */
export type SupportedEncoding =
  | 'UTF-8'
  | 'UTF-8-BOM'
  | 'UTF-16 LE BOM'
  | 'UTF-16 BE BOM'
  | 'ANSI'
  | 'windows-1258'
  | 'Shift_JIS'
  | 'GBK'
  | 'ISO-8859-1';

export interface EncodingOption {
  id: SupportedEncoding;
  label: string;
  category?: 'Standard' | 'Character Sets';
}

export const COMMON_ENCODINGS: EncodingOption[] = [
  { id: 'ANSI', label: 'ANSI (Windows-1252)', category: 'Standard' },
  { id: 'UTF-8', label: 'UTF-8', category: 'Standard' },
  { id: 'UTF-8-BOM', label: 'UTF-8-BOM', category: 'Standard' },
  { id: 'UTF-16 LE BOM', label: 'UTF-16 LE BOM', category: 'Standard' },
  { id: 'UTF-16 BE BOM', label: 'UTF-16 BE BOM', category: 'Standard' },
];

export const CHARACTER_SET_ENCODINGS: EncodingOption[] = [
  { id: 'windows-1258', label: 'Vietnamese (Windows-1258)', category: 'Character Sets' },
  { id: 'Shift_JIS', label: 'Japanese (Shift-JIS)', category: 'Character Sets' },
  { id: 'GBK', label: 'Chinese Simplified (GBK)', category: 'Character Sets' },
  { id: 'ISO-8859-1', label: 'Western European (ISO-8859-1)', category: 'Character Sets' },
];

/**
 * Detect encoding from raw bytes (BOM checks).
 */
export function detectEncodingFromBuffer(buffer: Uint8Array): {
  encoding: SupportedEncoding;
  hasBOM: boolean;
  bomOffset: number;
} {
  // UTF-8 BOM: EF BB BF
  if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    return { encoding: 'UTF-8-BOM', hasBOM: true, bomOffset: 3 };
  }
  // UTF-16 LE BOM: FF FE
  if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
    return { encoding: 'UTF-16 LE BOM', hasBOM: true, bomOffset: 2 };
  }
  // UTF-16 BE BOM: FE FF
  if (buffer.length >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
    return { encoding: 'UTF-16 BE BOM', hasBOM: true, bomOffset: 2 };
  }

  // Default to standard UTF-8
  return { encoding: 'UTF-8', hasBOM: false, bomOffset: 0 };
}

/**
 * Decode Uint8Array buffer according to specified encoding.
 */
export function decodeBuffer(buffer: Uint8Array, encoding: SupportedEncoding): string {
  try {
    if (encoding === 'UTF-8-BOM') {
      const offset = (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) ? 3 : 0;
      return new TextDecoder('utf-8').decode(buffer.subarray(offset));
    }
    if (encoding === 'UTF-16 LE BOM') {
      const offset = (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) ? 2 : 0;
      return new TextDecoder('utf-16le').decode(buffer.subarray(offset));
    }
    if (encoding === 'UTF-16 BE BOM') {
      const offset = (buffer.length >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) ? 2 : 0;
      return new TextDecoder('utf-16be').decode(buffer.subarray(offset));
    }
    if (encoding === 'ANSI') {
      return new TextDecoder('windows-1252').decode(buffer);
    }
    return new TextDecoder(encoding.toLowerCase()).decode(buffer);
  } catch {
    // Fallback if browser does not support specific label
    return new TextDecoder('utf-8').decode(buffer);
  }
}

/**
 * Encode string into Uint8Array buffer according to target encoding.
 */
export function encodeString(text: string, encoding: SupportedEncoding): Uint8Array {
  if (encoding === 'UTF-8-BOM') {
    const utf8Bytes = new TextEncoder().encode(text);
    const result = new Uint8Array(utf8Bytes.length + 3);
    result[0] = 0xEF;
    result[1] = 0xBB;
    result[2] = 0xBF;
    result.set(utf8Bytes, 3);
    return result;
  }

  if (encoding === 'UTF-16 LE BOM') {
    const len = text.length;
    const result = new Uint8Array(2 + len * 2);
    // BOM: FF FE
    result[0] = 0xFF;
    result[1] = 0xFE;
    const view = new DataView(result.buffer);
    for (let i = 0; i < len; i++) {
      view.setUint16(2 + i * 2, text.charCodeAt(i), true); // true = little endian
    }
    return result;
  }

  if (encoding === 'UTF-16 BE BOM') {
    const len = text.length;
    const result = new Uint8Array(2 + len * 2);
    // BOM: FE FF
    result[0] = 0xFE;
    result[1] = 0xFF;
    const view = new DataView(result.buffer);
    for (let i = 0; i < len; i++) {
      view.setUint16(2 + i * 2, text.charCodeAt(i), false); // false = big endian
    }
    return result;
  }

  // UTF-8, ANSI & others (UTF-8 standard)
  return new TextEncoder().encode(text);
}
