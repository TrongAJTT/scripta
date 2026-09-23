import { useCallback } from "react";
import { useEditorView } from "../context/useEditorView";
import { useEditorStore } from "../../tabs/store";
import * as cmd from "../../../core/utils/editorCommands";
import * as bookmarkOps from "../services/bookmarkExtension";

export function useEditorCommands() {
  const { viewRef } = useEditorView();
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const convertLineEnding = useEditorStore((s) => s.convertLineEnding);
  const insertDateTime = useEditorStore((s) => s.insertDateTime);

  const runWithView = useCallback(
    (fn: (view: import("@codemirror/view").EditorView) => boolean | void) => {
      const view = viewRef.current;
      if (!view) return;
      fn(view);
      view.focus();
    },
    [viewRef],
  );

  return {
    // History
    undo: () => runWithView(cmd.cmUndo),
    redo: () => runWithView(cmd.cmRedo),

    // Line operations
    duplicateLine: () => runWithView(cmd.duplicateLine),
    deleteLine: () => runWithView(cmd.deleteLine),
    moveLineUp: () => runWithView(cmd.cmMoveLineUp),
    moveLineDown: () => runWithView(cmd.cmMoveLineDown),
    joinLines: () => runWithView(cmd.joinLines),

    // Comments
    toggleComment: () => runWithView(cmd.cmToggleComment),
    toggleBlockComment: () => runWithView(cmd.cmToggleBlockComment),

    // Case conversions
    toUpperCase: () => runWithView(cmd.toUpperCase),
    toLowerCase: () => runWithView(cmd.toLowerCase),
    toProperCase: () => runWithView(cmd.toProperCase),
    toTitleCase: () => runWithView(cmd.toTitleCase),
    invertCase: () => runWithView(cmd.invertCase),

    // Sorting
    sortLinesAscending: () => runWithView(cmd.sortLinesAscending),
    sortLinesDescending: () => runWithView(cmd.sortLinesDescending),
    sortLinesIntegerAsc: () => runWithView(cmd.sortLinesIntegerAsc),
    sortLinesIntegerDesc: () => runWithView(cmd.sortLinesIntegerDesc),

    // Blank operations
    trimTrailing: () => runWithView(cmd.trimTrailing),
    trimLeading: () => runWithView(cmd.trimLeading),
    trimBoth: () => runWithView(cmd.trimBoth),
    eolToSpace: () => runWithView(cmd.eolToSpace),
    removeEmptyLines: () => runWithView(cmd.removeEmptyLines),
    removeDuplicateLines: () => runWithView(cmd.removeDuplicateLines),

    // Unicode conversions
    toggleUnicodeHex: () => runWithView(cmd.toggleUnicodeHex),

    // Document operations (Store level)
    convertLineEnding: (target: "CRLF" | "LF") => {
      if (activeTabId) convertLineEnding(activeTabId, target);
    },
    insertDateTime: (format: "short" | "long" = "short") => {
      const now = new Date();
      const text =
        format === "short"
          ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
            " " +
            now.toLocaleDateString()
          : now.toLocaleString();

      if (viewRef.current) {
        runWithView((v) => cmd.insertTextAtCursor(v, text));
      } else if (activeTabId) {
        insertDateTime(activeTabId, format);
      }
    },
    insertText: (text: string) => {
      if (viewRef.current) {
        runWithView((v) => cmd.insertTextAtCursor(v, text));
      } else if (activeTabId) {
        // Fallback if editor view not mounted
        const { tabs, updateTabContent } = useEditorStore.getState();
        const tab = tabs.find((t) => t.id === activeTabId);
        if (tab) updateTabContent(activeTabId, tab.content + text);
      }
    },

    // Code Folding
    foldAll: () => runWithView(cmd.cmFoldAll),
    unfoldAll: () => runWithView(cmd.cmUnfoldAll),

    // Line Bookmarking
    toggleBookmark: (line?: number) => {
      runWithView((v) => bookmarkOps.toggleBookmarkAtCursor(v, line));
    },
    nextBookmark: () => {
      runWithView((v) => bookmarkOps.jumpToNextBookmark(v));
    },
    prevBookmark: () => {
      runWithView((v) => bookmarkOps.jumpToPrevBookmark(v));
    },
    clearBookmarks: () => {
      runWithView((v) => bookmarkOps.clearAllBookmarks(v));
    },
    jumpToBookmark: (line: number) => {
      runWithView((v) => bookmarkOps.jumpToLine(v, line));
    },
    getBookmarks: () => {
      if (!viewRef.current) return [];
      return bookmarkOps.getBookmarkedLines(viewRef.current);
    },
    // Navigation / Go to
    goToLine: (lineNum: number, col = 1) => {
      runWithView((v) => {
        const doc = v.state.doc;
        const targetLineNum = Math.max(1, Math.min(lineNum, doc.lines));
        const line = doc.line(targetLineNum);
        const targetCol = Math.max(1, col);
        const colOffset = Math.min(targetCol - 1, line.length);
        const targetPos = line.from + colOffset;

        v.dispatch({
          selection: { anchor: targetPos },
          scrollIntoView: true,
        });
      });
    },
    goToOffset: (offset: number) => {
      runWithView((v) => {
        const doc = v.state.doc;
        const targetOffset = Math.max(0, Math.min(offset, doc.length));
        v.dispatch({
          selection: { anchor: targetOffset },
          scrollIntoView: true,
        });
      });
    },
    getCurrentPosition: () => {
      const v = viewRef.current;
      if (!v) {
        return {
          line: 1,
          col: 1,
          maxLines: 1,
          offset: 0,
          maxOffset: 0,
        };
      }
      const head = v.state.selection.main.head;
      const lineObj = v.state.doc.lineAt(head);
      return {
        line: lineObj.number,
        col: head - lineObj.from + 1,
        maxLines: v.state.doc.lines,
        offset: head,
        maxOffset: v.state.doc.length,
      };
    },
  };
}
