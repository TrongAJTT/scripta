import { useCallback } from 'react';
import { useEditorView } from '../context/useEditorView';
import { useEditorStore } from '../../tabs/store';
import * as cmd from '../../../core/utils/editorCommands';
import * as bookmarkOps from '../services/bookmarkExtension';

export function useEditorCommands() {
  const { viewRef } = useEditorView();
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const convertLineEnding = useEditorStore((s) => s.convertLineEnding);
  const insertDateTime = useEditorStore((s) => s.insertDateTime);

  const runWithView = useCallback(
    (fn: (view: import('@codemirror/view').EditorView) => boolean | void) => {
      const view = viewRef.current;
      if (!view) return;
      fn(view);
      view.focus();
    },
    [viewRef]
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

    // Document operations (Store level)
    convertLineEnding: (target: 'CRLF' | 'LF') => {
      if (activeTabId) convertLineEnding(activeTabId, target);
    },
    insertDateTime: (format: 'short' | 'long' = 'short') => {
      const now = new Date();
      const text =
        format === 'short'
          ? now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + now.toLocaleDateString()
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
  };
}
