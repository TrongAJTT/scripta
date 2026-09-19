import { EditorSelection } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";

/**
 * Service providing toggling between Unicode code points and characters.
 *
 * Rules:
 * 1. If selection is non-empty:
 *    - If selection is a valid hex code (e.g. "2014", "1F600", or "U+2014"), replace with the character.
 *    - Otherwise, take the Unicode code point of the selected character and convert to uppercase hex (e.g. "2014").
 * 2. If selection is collapsed (cursor):
 *    - Look backwards from cursor up to 8 characters to find a valid hex code string (optionally preceded by "U+").
 *    - If found and valid code point (<= 0x10FFFF), replace the hex string with the decoded character.
 *    - If not a hex string, inspect the character immediately preceding cursor (handling surrogate pairs / emojis)
 *      and replace it with its uppercase hex representation (e.g. "2014", padded to at least 4 digits).
 */
export class UnicodeHexService {
  /**
   * Toggles between Unicode hex code and character at cursor or selection in CodeMirror 6.
   */
  static toggleUnicodeHex(view: EditorView): boolean {
    const { state } = view;

    const changes = state.changeByRange((range) => {
      // Case 1: Non-empty selection
      if (!range.empty) {
        const text = state.sliceDoc(range.from, range.to).trim();

        // Check if selection is hex
        const hexMatch = text.match(/^(?:U\+)?([0-9a-fA-F]{1,6})$/);
        if (hexMatch) {
          const code = parseInt(hexMatch[1], 16);
          if (code <= 0x10ffff) {
            const char = String.fromCodePoint(code);
            return {
              changes: { from: range.from, to: range.to, insert: char },
              range: EditorSelection.cursor(range.from + char.length),
            };
          }
        }

        // Otherwise, convert character(s) to hex code point
        const codePoint = text.codePointAt(0);
        if (codePoint !== undefined) {
          const hex = codePoint.toString(16).toUpperCase().padStart(4, "0");
          return {
            changes: { from: range.from, to: range.to, insert: hex },
            range: EditorSelection.cursor(range.from + hex.length),
          };
        }

        return { range };
      }

      // Case 2: Collapsed cursor
      const pos = range.head;
      if (pos === 0) return { range };

      // Look back up to 8 characters on the same line
      const line = state.doc.lineAt(pos);
      const lookbackLimit = Math.max(line.from, pos - 8);
      const textBefore = state.sliceDoc(lookbackLimit, pos);

      // Try to match a trailing hex sequence (e.g., "2014" or "U+2014")
      const hexPattern = /(?:U\+)?([0-9a-fA-F]{1,6})$/;
      const match = textBefore.match(hexPattern);

      if (match) {
        const code = parseInt(match[1], 16);
        if (code <= 0x10ffff) {
          const matchedLen = match[0].length;
          const fromPos = pos - matchedLen;
          const char = String.fromCodePoint(code);

          return {
            changes: { from: fromPos, to: pos, insert: char },
            range: EditorSelection.cursor(fromPos + char.length),
          };
        }
      }

      // If not preceding hex, inspect character directly before cursor
      // Check for surrogate pairs (emojis or high unicode astral planes)
      let fromPos = pos - 1;
      let prevText = state.sliceDoc(fromPos, pos);

      if (fromPos > line.from) {
        const prevTwo = state.sliceDoc(fromPos - 1, pos);
        // If trailing surrogate, include leading surrogate
        if (/[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(prevTwo)) {
          fromPos -= 1;
          prevText = prevTwo;
        }
      }

      const codePoint = prevText.codePointAt(0);
      if (codePoint !== undefined) {
        const hex = codePoint.toString(16).toUpperCase().padStart(4, "0");
        return {
          changes: { from: fromPos, to: pos, insert: hex },
          range: EditorSelection.cursor(fromPos + hex.length),
        };
      }

      return { range };
    });

    view.dispatch(changes);
    view.focus();
    return true;
  }
}
