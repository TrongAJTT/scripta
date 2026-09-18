import { EditorView, gutter, GutterMarker } from "@codemirror/view";
import { StateField, StateEffect, RangeSet } from "@codemirror/state";

// ---------------------------------------------------------------------------
// 1. Effects & Marker Definitions
// ---------------------------------------------------------------------------

export const toggleBookmarkEffect = StateEffect.define<number>(); // line number (1-based)
export const clearBookmarksEffect = StateEffect.define<void>();
export const setBookmarksEffect = StateEffect.define<number[]>(); // line numbers array

class BookmarkGutterMarker extends GutterMarker {
  override toDOM() {
    const span = document.createElement("span");
    span.className = "cm-bookmark-gutter-icon";
    span.title = "Bookmarked line (Click to remove)";
    span.style.display = "inline-flex";
    span.style.alignItems = "center";
    span.style.justifyContent = "center";
    span.style.width = "100%";
    span.style.height = "100%";
    span.style.color = "var(--accent)";
    span.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
    return span;
  }
}

const bookmarkMarker = new BookmarkGutterMarker();

// ---------------------------------------------------------------------------
// 2. StateField for Bookmarks (Stores start positions of lines)
// ---------------------------------------------------------------------------

export const bookmarkStateField = StateField.define<RangeSet<GutterMarker>>({
  create() {
    return RangeSet.empty;
  },
  update(bookmarks, tr) {
    // Map existing positions automatically when document changes (Position Mapping)
    bookmarks = bookmarks.map(tr.changes);

    for (const e of tr.effects) {
      if (e.is(clearBookmarksEffect)) {
        bookmarks = RangeSet.empty;
      } else if (e.is(setBookmarksEffect)) {
        const doc = tr.state.doc;
        const ranges: Array<{ from: number; to: number; value: GutterMarker }> = [];
        const seenLines = new Set<number>();
        for (const lineNum of e.value) {
          if (lineNum >= 1 && lineNum <= doc.lines && !seenLines.has(lineNum)) {
            seenLines.add(lineNum);
            const line = doc.line(lineNum);
            ranges.push({ from: line.from, to: line.from, value: bookmarkMarker });
          }
        }
        ranges.sort((a, b) => a.from - b.from);
        bookmarks = RangeSet.of(ranges.map((r) => r.value.range(r.from)));
      } else if (e.is(toggleBookmarkEffect)) {
        const lineNum = e.value;
        if (lineNum >= 1 && lineNum <= tr.state.doc.lines) {
          const line = tr.state.doc.line(lineNum);
          let exists = false;
          const iter = bookmarks.iter(line.from);
          if (iter.value && iter.from === line.from) {
            exists = true;
          }

          if (exists) {
            // Remove bookmark at this line
            const nextRanges: Array<{ from: number; value: GutterMarker }> = [];
            const allIter = bookmarks.iter();
            while (allIter.value) {
              if (allIter.from !== line.from) {
                nextRanges.push({ from: allIter.from, value: allIter.value });
              }
              allIter.next();
            }
            bookmarks = RangeSet.of(nextRanges.map((r) => r.value.range(r.from)));
          } else {
            // Add bookmark at this line
            const nextRanges: Array<{ from: number; value: GutterMarker }> = [];
            const allIter = bookmarks.iter();
            while (allIter.value) {
              nextRanges.push({ from: allIter.from, value: allIter.value });
              allIter.next();
            }
            nextRanges.push({ from: line.from, value: bookmarkMarker });
            nextRanges.sort((a, b) => a.from - b.from);
            bookmarks = RangeSet.of(nextRanges.map((r) => r.value.range(r.from)));
          }
        }
      }
    }

    return bookmarks;
  },
});

// ---------------------------------------------------------------------------
// 3. Bookmark Gutter Definition & Interaction
// ---------------------------------------------------------------------------

export const bookmarkGutter = gutter({
  class: "cm-bookmark-gutter",
  markers: (view) => view.state.field(bookmarkStateField),
  initialSpacer: () => bookmarkMarker,
  domEventHandlers: {
    mousedown(view, line) {
      const lineNum = view.state.doc.lineAt(line.from).number;
      view.dispatch({
        effects: toggleBookmarkEffect.of(lineNum),
      });
      return true;
    },
  },
});

// ---------------------------------------------------------------------------
// 5. Public Helper Functions
// ---------------------------------------------------------------------------

export interface BookmarkItem {
  line: number;
  text: string;
  fullText: string;
  pos: number;
}

/**
 * Toggle bookmark at cursor line or specified line number
 */
export function toggleBookmarkAtCursor(view: EditorView, targetLine?: number): void {
  const lineNum =
    targetLine ?? view.state.doc.lineAt(view.state.selection.main.head).number;
  view.dispatch({
    effects: toggleBookmarkEffect.of(lineNum),
  });
}

/**
 * Jump to next bookmark forward from cursor position (wraps around)
 */
export function jumpToNextBookmark(view: EditorView): boolean {
  const bookmarks = view.state.field(bookmarkStateField, false);
  if (!bookmarks) return false;

  const doc = view.state.doc;
  const currentPos = view.state.selection.main.head;
  const positions: number[] = [];

  const iter = bookmarks.iter();
  while (iter.value) {
    positions.push(iter.from);
    iter.next();
  }

  if (positions.length === 0) return false;

  // Find first bookmark after current position
  const nextPos = positions.find((p) => p > currentPos);
  const targetPos = nextPos !== undefined ? nextPos : positions[0];

  const line = doc.lineAt(targetPos);
  view.dispatch({
    selection: { anchor: line.from },
    scrollIntoView: true,
  });
  view.focus();
  return true;
}

/**
 * Jump to previous bookmark backwards from cursor position (wraps around)
 */
export function jumpToPrevBookmark(view: EditorView): boolean {
  const bookmarks = view.state.field(bookmarkStateField, false);
  if (!bookmarks) return false;

  const doc = view.state.doc;
  const currentPos = view.state.selection.main.head;
  const positions: number[] = [];

  const iter = bookmarks.iter();
  while (iter.value) {
    positions.push(iter.from);
    iter.next();
  }

  if (positions.length === 0) return false;

  // Find last bookmark before current position
  const prevPos = [...positions].reverse().find((p) => p < currentPos);
  const targetPos = prevPos !== undefined ? prevPos : positions[positions.length - 1];

  const line = doc.lineAt(targetPos);
  view.dispatch({
    selection: { anchor: line.from },
    scrollIntoView: true,
  });
  view.focus();
  return true;
}

/**
 * Jump directly to a specific line number
 */
export function jumpToLine(view: EditorView, lineNum: number): void {
  if (lineNum < 1 || lineNum > view.state.doc.lines) return;
  const line = view.state.doc.line(lineNum);
  view.dispatch({
    selection: { anchor: line.from },
    scrollIntoView: true,
  });
  view.focus();
}

/**
 * Clear all bookmarks in current document
 */
export function clearAllBookmarks(view: EditorView): void {
  view.dispatch({
    effects: clearBookmarksEffect.of(),
  });
}

/**
 * Retrieve list of all bookmarked lines with text snippets
 */
export function getBookmarkedLines(view: EditorView): BookmarkItem[] {
  const bookmarks = view.state.field(bookmarkStateField, false);
  if (!bookmarks) return [];

  const doc = view.state.doc;
  const results: BookmarkItem[] = [];

  const iter = bookmarks.iter();
  while (iter.value) {
    const line = doc.lineAt(iter.from);
    const rawText = line.text.trim();
    const truncatedText =
      rawText.length > 22 ? `${rawText.slice(0, 22)}...` : rawText || "(empty line)";

    results.push({
      line: line.number,
      text: truncatedText,
      fullText: rawText || "(empty line)",
      pos: line.from,
    });
    iter.next();
  }

  return results;
}

/**
 * Get line numbers (1-based) of all active bookmarks
 */
export function getBookmarkLineNumbers(state: { field: <T>(field: StateField<T>, require?: boolean) => T; doc: { lineAt: (pos: number) => { number: number } } }): number[] {
  const bookmarks = state.field(bookmarkStateField, false);
  if (!bookmarks) return [];

  const lines: number[] = [];
  const iter = bookmarks.iter();
  while (iter.value) {
    lines.push(state.doc.lineAt(iter.from).number);
    iter.next();
  }
  return lines;
}
