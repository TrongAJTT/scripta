import { EditorView } from "@codemirror/view";
import { StateField, StateEffect } from "@codemirror/state";
import { Decoration, type DecorationSet } from "@codemirror/view";

export type SearchTabType = "find" | "replace" | "workspace" | "mark";

export type SearchMode = "normal" | "extended" | "regex";

export interface SearchOptions {
  findText: string;
  replaceText: string;
  matchCase: boolean;
  matchWholeWord: boolean;
  wrapAround: boolean;
  searchMode: SearchMode;
  inSelection: boolean;
  tabFilters?: string; // for workspace search, e.g. *.md, *.ts
}

export interface SearchMatch {
  from: number;
  to: number;
  line: number;
  lineText: string;
  matchText: string;
}

export interface WorkspaceMatchResult {
  tabId: string;
  tabName: string;
  matches: SearchMatch[];
}

// ---------------------------------------------------------------------------
// CodeMirror 6 Decoration Effects & StateFields for Visual Marks
// ---------------------------------------------------------------------------

export const setMarksEffect = StateEffect.define<DecorationSet>();
export const clearMarksEffect = StateEffect.define<void>();

const markDeco = Decoration.mark({
  class:
    "cm-search-mark bg-cyan-500/35 border-b border-cyan-400 font-semibold rounded-xs",
});

export const searchMarksField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(marks, tr) {
    marks = marks.map(tr.changes);
    for (const e of tr.effects) {
      if (e.is(setMarksEffect)) {
        marks = e.value;
      } else if (e.is(clearMarksEffect)) {
        marks = Decoration.none;
      }
    }
    return marks;
  },
  provide: (f) => EditorView.decorations.from(f),
});

// ---------------------------------------------------------------------------
// Core Search Helpers
// ---------------------------------------------------------------------------

/**
 * Parses extended escape sequences (\n, \r, \t, \0, \\) into literal characters.
 */
export function unescapeExtended(text: string): string {
  return text
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\0/g, "\0")
    .replace(/\\\\/g, "\\");
}

/**
 * Builds a RegExp instance based on search mode, case sensitivity, and whole word settings.
 */
export function buildSearchRegex(
  findText: string,
  options: {
    matchCase: boolean;
    matchWholeWord: boolean;
    searchMode: SearchMode;
    global?: boolean;
  },
): RegExp | null {
  if (!findText) return null;

  let pattern = findText;

  if (options.searchMode === "extended") {
    const unescaped = unescapeExtended(findText);
    pattern = unescaped.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  } else if (options.searchMode === "normal") {
    pattern = findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  if (options.matchWholeWord) {
    pattern = `\\b(?:${pattern})\\b`;
  }

  const flags = `${options.global !== false ? "g" : ""}${options.matchCase ? "" : "i"}`;
  try {
    return new RegExp(pattern, flags);
  } catch (err) {
    console.warn("Invalid search regex:", err);
    return null;
  }
}

/**
 * Finds all matches of pattern within a text string.
 */
export function findAllMatchesInText(
  text: string,
  findText: string,
  options: {
    matchCase: boolean;
    matchWholeWord: boolean;
    searchMode: SearchMode;
  },
): SearchMatch[] {
  const regex = buildSearchRegex(findText, { ...options, global: true });
  if (!regex) return [];

  const matches: SearchMatch[] = [];
  let match: RegExpExecArray | null;

  // Track line offsets for fast line number and line text calculation
  const lines = text.split("\n");
  const lineOffsets: number[] = [0];
  for (let i = 0; i < lines.length; i++) {
    lineOffsets.push(lineOffsets[i] + lines[i].length + 1); // +1 for \n
  }

  const getLineInfo = (pos: number) => {
    let lineIdx = 0;
    for (let i = 0; i < lineOffsets.length - 1; i++) {
      if (pos >= lineOffsets[i] && pos < lineOffsets[i + 1]) {
        lineIdx = i;
        break;
      }
    }
    return {
      line: lineIdx + 1,
      lineText: lines[lineIdx] || "",
    };
  };

  while ((match = regex.exec(text)) !== null) {
    if (match[0].length === 0) {
      regex.lastIndex++;
      continue;
    }
    const from = match.index;
    const to = from + match[0].length;
    const { line, lineText } = getLineInfo(from);

    matches.push({
      from,
      to,
      line,
      lineText: lineText.trim(),
      matchText: match[0],
    });
  }

  return matches;
}

/**
 * Executes Find Next or Previous in an EditorView.
 */
export function findInEditor(
  view: EditorView,
  findText: string,
  options: {
    matchCase: boolean;
    matchWholeWord: boolean;
    wrapAround: boolean;
    searchMode: SearchMode;
    backward?: boolean;
  },
): { found: boolean; index: number; total: number } {
  const doc = view.state.doc.toString();
  const matches = findAllMatchesInText(doc, findText, options);

  if (matches.length === 0) {
    return { found: false, index: 0, total: 0 };
  }

  const currentPos = options.backward
    ? view.state.selection.main.from
    : view.state.selection.main.to;

  let targetMatch: SearchMatch | null = null;
  let targetIndex = -1;

  if (options.backward) {
    // Look for previous match before currentPos
    for (let i = matches.length - 1; i >= 0; i--) {
      if (matches[i].to <= currentPos) {
        targetMatch = matches[i];
        targetIndex = i;
        break;
      }
    }
    if (!targetMatch && options.wrapAround) {
      targetMatch = matches[matches.length - 1];
      targetIndex = matches.length - 1;
    }
  } else {
    // Look for next match after currentPos
    for (let i = 0; i < matches.length; i++) {
      if (matches[i].from >= currentPos) {
        targetMatch = matches[i];
        targetIndex = i;
        break;
      }
    }
    if (!targetMatch && options.wrapAround) {
      targetMatch = matches[0];
      targetIndex = 0;
    }
  }

  if (targetMatch) {
    view.dispatch({
      selection: { anchor: targetMatch.from, head: targetMatch.to },
      scrollIntoView: true,
    });
    view.focus();
    return { found: true, index: targetIndex + 1, total: matches.length };
  }

  return { found: false, index: 0, total: matches.length };
}

/**
 * Replaces the currently selected match, or finds the next match and replaces it.
 */
export function replaceInEditor(
  view: EditorView,
  findText: string,
  replaceText: string,
  options: {
    matchCase: boolean;
    matchWholeWord: boolean;
    wrapAround: boolean;
    searchMode: SearchMode;
  },
): boolean {
  const sel = view.state.selection.main;
  const selectedText = view.state.sliceDoc(sel.from, sel.to);

  const finalReplacement =
    options.searchMode === "extended"
      ? unescapeExtended(replaceText)
      : replaceText;

  // Check if current selection matches find criteria
  let isCurrentMatch = false;
  if (!sel.empty) {
    const regex = buildSearchRegex(findText, { ...options, global: false });
    if (
      regex &&
      regex.test(selectedText) &&
      selectedText.length === (selectedText.match(regex)?.[0].length ?? -1)
    ) {
      isCurrentMatch = true;
    }
  }

  if (isCurrentMatch) {
    view.dispatch({
      changes: { from: sel.from, to: sel.to, insert: finalReplacement },
      selection: { anchor: sel.from + finalReplacement.length },
    });
    // Move to next match
    findInEditor(view, findText, options);
    return true;
  }

  // Not currently on a match: find next match first
  const result = findInEditor(view, findText, options);
  if (result.found) {
    const newSel = view.state.selection.main;
    view.dispatch({
      changes: { from: newSel.from, to: newSel.to, insert: finalReplacement },
      selection: { anchor: newSel.from + finalReplacement.length },
    });
    findInEditor(view, findText, options);
    return true;
  }

  return false;
}

/**
 * Replaces all matches in the EditorView.
 */
export function replaceAllInEditor(
  view: EditorView,
  findText: string,
  replaceText: string,
  options: {
    matchCase: boolean;
    matchWholeWord: boolean;
    searchMode: SearchMode;
  },
): number {
  const doc = view.state.doc.toString();
  const regex = buildSearchRegex(findText, { ...options, global: true });
  if (!regex) return 0;

  const matches = doc.match(regex);
  if (!matches || matches.length === 0) return 0;

  const finalReplacement =
    options.searchMode === "extended"
      ? unescapeExtended(replaceText)
      : replaceText;

  const newDoc = doc.replace(regex, finalReplacement);
  view.dispatch({
    changes: { from: 0, to: doc.length, insert: newDoc },
  });

  return matches.length;
}

/**
 * Applies visual highlight marks to all matches in EditorView.
 */
export function markAllInEditor(
  view: EditorView,
  findText: string,
  options: {
    matchCase: boolean;
    matchWholeWord: boolean;
    searchMode: SearchMode;
  },
): { count: number; matchedLines: string[] } {
  const doc = view.state.doc.toString();
  const matches = findAllMatchesInText(doc, findText, options);

  if (matches.length === 0) {
    clearAllMarksInEditor(view);
    return { count: 0, matchedLines: [] };
  }

  const builder: any[] = [];
  const matchedLinesSet = new Set<string>();

  for (const m of matches) {
    builder.push(markDeco.range(m.from, m.to));
    matchedLinesSet.add(m.lineText);
  }

  const decoSet = Decoration.set(builder, true);
  view.dispatch({
    effects: setMarksEffect.of(decoSet),
  });

  return {
    count: matches.length,
    matchedLines: Array.from(matchedLinesSet),
  };
}

/**
 * Clears all visual highlight marks in EditorView.
 */
export function clearAllMarksInEditor(view: EditorView): void {
  view.dispatch({
    effects: clearMarksEffect.of(),
  });
}
