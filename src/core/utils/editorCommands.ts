import { EditorSelection } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import {
  toggleComment as cmToggleComment,
  toggleBlockComment as cmToggleBlockComment,
  moveLineUp as cmMoveLineUp,
  moveLineDown as cmMoveLineDown,
  undo as cmUndo,
  redo as cmRedo,
} from '@codemirror/commands';
import { foldAll as cmFoldAll, unfoldAll as cmUnfoldAll } from '@codemirror/language';

// Re-export CM6 native commands
export {
  cmToggleComment,
  cmToggleBlockComment,
  cmMoveLineUp,
  cmMoveLineDown,
  cmUndo,
  cmRedo,
  cmFoldAll,
  cmUnfoldAll,
};

/**
 * Duplicate the current line or selection.
 * If there is a multi-line selection, duplicate that text.
 * Otherwise duplicate the entire line containing the cursor below it.
 */
export function duplicateLine(view: EditorView): boolean {
  const { state } = view;
  const changes = state.changeByRange((range) => {
    if (!range.empty) {
      const text = state.sliceDoc(range.from, range.to);
      return {
        changes: { from: range.to, insert: text },
        range: EditorSelection.range(range.to, range.to + text.length),
      };
    }
    const line = state.doc.lineAt(range.head);
    return {
      changes: { from: line.to, insert: '\n' + line.text },
      range: EditorSelection.cursor(range.head + line.length + 1),
    };
  });
  view.dispatch(changes);
  return true;
}

/**
 * Delete the entire line(s) covered by selection.
 */
export function deleteLine(view: EditorView): boolean {
  const { state } = view;
  const changes = state.changeByRange((range) => {
    const startLine = state.doc.lineAt(range.from);
    const endLine = state.doc.lineAt(range.to);
    // Include the newline after the line, or before if at the end of doc
    let from = startLine.from;
    let to = endLine.to;
    if (to < state.doc.length) {
      to += 1; // remove trailing newline
    } else if (from > 0) {
      from -= 1; // remove preceding newline
    }
    return {
      changes: { from, to },
      range: EditorSelection.cursor(from),
    };
  });
  view.dispatch(changes);
  return true;
}

/**
 * Join selected lines into a single line, or join current line with the next.
 */
export function joinLines(view: EditorView): boolean {
  const { state } = view;
  const sel = state.selection.main;
  const startLine = state.doc.lineAt(sel.from);
  const endLine = state.doc.lineAt(sel.empty ? Math.min(sel.to + 1, state.doc.length) : sel.to);

  if (startLine.number === endLine.number) {
    if (startLine.number >= state.doc.lines) return false;
    const nextLine = state.doc.line(startLine.number + 1);
    const joined = startLine.text.trimEnd() + ' ' + nextLine.text.trimStart();
    view.dispatch({
      changes: { from: startLine.from, to: nextLine.to, insert: joined },
      selection: EditorSelection.cursor(startLine.from + joined.length),
    });
    return true;
  }

  // Multi-line selection join
  const lines: string[] = [];
  for (let i = startLine.number; i <= endLine.number; i++) {
    lines.push(state.doc.line(i).text.trim());
  }
  const joined = lines.join(' ');
  view.dispatch({
    changes: { from: startLine.from, to: endLine.to, insert: joined },
    selection: EditorSelection.cursor(startLine.from + joined.length),
  });
  return true;
}

/**
 * Helper to transform text in selection or the current word/line.
 */
function transformSelection(view: EditorView, fn: (text: string) => string): boolean {
  const { state } = view;
  const changes = state.changeByRange((range) => {
    let from = range.from;
    let to = range.to;
    if (range.empty) {
      // If no selection, transform current word or current line
      const line = state.doc.lineAt(range.head);
      from = line.from;
      to = line.to;
    }
    const original = state.sliceDoc(from, to);
    const transformed = fn(original);
    return {
      changes: { from, to, insert: transformed },
      range: EditorSelection.range(from, from + transformed.length),
    };
  });
  view.dispatch(changes);
  return true;
}

export function toUpperCase(view: EditorView): boolean {
  return transformSelection(view, (t) => t.toUpperCase());
}

export function toLowerCase(view: EditorView): boolean {
  return transformSelection(view, (t) => t.toLowerCase());
}

export function toTitleCase(view: EditorView): boolean {
  return transformSelection(view, (t) =>
    t.replace(/\b\w+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
  );
}

export function toProperCase(view: EditorView): boolean {
  return transformSelection(view, (t) =>
    t.replace(/(^\s*|\.\s+)(\w)/g, (_, prefix: string, char: string) => prefix + char.toUpperCase())
  );
}

export function invertCase(view: EditorView): boolean {
  return transformSelection(view, (t) =>
    t
      .split('')
      .map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()))
      .join('')
  );
}

/**
 * Helper to transform lines covered by selection or entire document.
 */
function transformLines(view: EditorView, fn: (lines: string[]) => string[]): boolean {
  const { state } = view;
  const sel = state.selection.main;
  let startLineNum = 1;
  let endLineNum = state.doc.lines;

  if (!sel.empty) {
    startLineNum = state.doc.lineAt(sel.from).number;
    endLineNum = state.doc.lineAt(sel.to).number;
  }

  const startLine = state.doc.line(startLineNum);
  const endLine = state.doc.line(endLineNum);

  const lines: string[] = [];
  for (let i = startLineNum; i <= endLineNum; i++) {
    lines.push(state.doc.line(i).text);
  }

  const newLines = fn(lines);
  const insertText = newLines.join('\n');

  view.dispatch({
    changes: { from: startLine.from, to: endLine.to, insert: insertText },
    selection: EditorSelection.range(startLine.from, startLine.from + insertText.length),
  });
  return true;
}

export function sortLinesAscending(view: EditorView): boolean {
  return transformLines(view, (lines) => [...lines].sort((a, b) => a.localeCompare(b)));
}

export function sortLinesDescending(view: EditorView): boolean {
  return transformLines(view, (lines) => [...lines].sort((a, b) => b.localeCompare(a)));
}

export function sortLinesIntegerAsc(view: EditorView): boolean {
  return transformLines(view, (lines) =>
    [...lines].sort((a, b) => {
      const numA = parseFloat(a.match(/-?\d+(\.\d+)?/)?.[0] ?? '0');
      const numB = parseFloat(b.match(/-?\d+(\.\d+)?/)?.[0] ?? '0');
      return numA - numB;
    })
  );
}

export function sortLinesIntegerDesc(view: EditorView): boolean {
  return transformLines(view, (lines) =>
    [...lines].sort((a, b) => {
      const numA = parseFloat(a.match(/-?\d+(\.\d+)?/)?.[0] ?? '0');
      const numB = parseFloat(b.match(/-?\d+(\.\d+)?/)?.[0] ?? '0');
      return numB - numA;
    })
  );
}

export function trimTrailing(view: EditorView): boolean {
  return transformLines(view, (lines) => lines.map((l) => l.trimEnd()));
}

export function trimLeading(view: EditorView): boolean {
  return transformLines(view, (lines) => lines.map((l) => l.trimStart()));
}

export function trimBoth(view: EditorView): boolean {
  return transformLines(view, (lines) => lines.map((l) => l.trim()));
}

export function eolToSpace(view: EditorView): boolean {
  return transformLines(view, (lines) => [lines.join(' ')]);
}

export function removeEmptyLines(view: EditorView): boolean {
  return transformLines(view, (lines) => lines.filter((l) => l.trim() !== ''));
}

export function removeDuplicateLines(view: EditorView): boolean {
  return transformLines(view, (lines) => Array.from(new Set(lines)));
}

/**
 * Insert a string at the current cursor position or replace current selection(s).
 */
export function insertTextAtCursor(view: EditorView, text: string): boolean {
  const { state } = view;
  const changes = state.changeByRange((range) => {
    return {
      changes: { from: range.from, to: range.to, insert: text },
      range: EditorSelection.cursor(range.from + text.length),
    };
  });
  view.dispatch(changes);
  view.focus();
  return true;
}
