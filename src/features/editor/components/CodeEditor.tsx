import React, { useEffect, useRef } from "react";
import { EditorState, Compartment } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightWhitespace,
  highlightTrailingWhitespace,
} from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {
  bracketMatching,
  foldGutter,
  syntaxHighlighting,
  defaultHighlightStyle,
} from "@codemirror/language";
import { oneDark } from "@codemirror/theme-one-dark";
import { javascript } from "@codemirror/lang-javascript";
import { markdown } from "@codemirror/lang-markdown";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";
import { python } from "@codemirror/lang-python";

import type { SupportedLanguage } from "../../../core/types/file.types";
import { useEditorStore } from "../../tabs/store";
import { useEditorView } from "../context/useEditorView";
import * as cmd from "../../../core/utils/editorCommands";
import { searchMarksField } from "../services/searchService";
import {
  bookmarkStateField,
  bookmarkGutter,
  setBookmarksEffect,
  toggleBookmarkEffect,
  clearBookmarksEffect,
  getBookmarkLineNumbers,
} from "../services/bookmarkExtension";

interface CodeEditorProps {
  tabId: string;
  initialContent: string;
  content?: string;
  language: SupportedLanguage;
}

const languageCompartment = new Compartment();
const themeCompartment = new Compartment();
const fontSizeCompartment = new Compartment();
const wrappingCompartment = new Compartment();
const lineNumbersCompartment = new Compartment();
const whitespaceCompartment = new Compartment();
const editableCompartment = new Compartment();

export const CodeEditor: React.FC<CodeEditorProps> = ({
  tabId,
  initialContent,
  content,
  language,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const syncContentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncedContentRef = useRef<string>(initialContent);
  const { setView } = useEditorView();

  const flushDoc = () => {
    if (syncContentTimeoutRef.current) {
      clearTimeout(syncContentTimeoutRef.current);
      syncContentTimeoutRef.current = null;
    }
    if (viewRef.current) {
      const currentDoc = viewRef.current.state.doc.toString();
      if (currentDoc !== lastSyncedContentRef.current) {
        lastSyncedContentRef.current = currentDoc;
        updateTabContent(tabId, currentDoc);
      }
    }
  };

  const activeTab = useEditorStore((s) => s.tabs.find((t) => t.id === tabId));
  const isLocked = Boolean(activeTab?.isLocked);

  const updateTabContent = useEditorStore((s) => s.updateTabContent);
  const updateCursorPos = useEditorStore((s) => s.updateCursorPos);
  const updateTabBookmarks = useEditorStore((s) => s.updateTabBookmarks);
  const saveCurrentTab = useEditorStore((s) => s.saveCurrentTab);
  const openFileAction = useEditorStore((s) => s.openFileAction);
  const toggleSearch = useEditorStore((s) => s.toggleSearch);
  const createTab = useEditorStore((s) => s.createTab);

  const themeMode = useEditorStore((s) => s.settings.theme);
  const fontSize = useEditorStore((s) => s.settings.fontSize);
  const lineWrapping = useEditorStore((s) => s.settings.lineWrapping);
  const showLineNumbers = useEditorStore((s) => s.settings.showLineNumbers);
  const showWhitespace = useEditorStore((s) => s.settings.showWhitespace);

  // Helper to get language extension
  const getLanguageExtension = (lang: SupportedLanguage) => {
    switch (lang) {
      case "javascript":
        return javascript({ jsx: true, typescript: false });
      case "typescript":
        return javascript({ jsx: true, typescript: true });
      case "markdown":
        return markdown();
      case "html":
      case "svg":
      case "xml":
        return html();
      case "css":
        return css();
      case "json":
        return json();
      case "python":
        return python();
      default:
        return [];
    }
  };

  const isDarkMode =
    themeMode === "dark" ||
    (themeMode === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  useEffect(() => {
    if (!containerRef.current) return;

    // Custom hotkey listener in editor
    const customShortcuts = keymap.of([
      {
        key: "Mod-s",
        run: () => {
          flushDoc();
          saveCurrentTab();
          return true;
        },
      },
      {
        key: "Mod-o",
        run: () => {
          openFileAction();
          return true;
        },
      },
      {
        key: "Mod-f",
        run: () => {
          toggleSearch(true);
          return true;
        },
      },
      {
        key: "Mod-n",
        run: () => {
          createTab();
          return true;
        },
      },
      { key: "Alt-d", run: cmd.duplicateLine },
      { key: "Alt-Shift-l", run: cmd.deleteLine },
      { key: "Alt-ArrowUp", run: cmd.cmMoveLineUp },
      { key: "Alt-ArrowDown", run: cmd.cmMoveLineDown },
      { key: "Alt-j", run: cmd.joinLines },
      { key: "Alt-/", run: cmd.cmToggleComment },
      { key: "Alt-Shift-/", run: cmd.cmToggleBlockComment },
      { key: "Alt-Shift-u", run: cmd.toUpperCase },
      { key: "Alt-u", run: cmd.toLowerCase },
      indentWithTab,
    ]);

    // Listener to update content, cursor, and bookmarks
    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        if (syncContentTimeoutRef.current) {
          clearTimeout(syncContentTimeoutRef.current);
        }
        syncContentTimeoutRef.current = setTimeout(() => {
          syncContentTimeoutRef.current = null;
          flushDoc();
        }, 300);
      }

      if (update.selectionSet || update.docChanged) {
        const pos = update.state.selection.main.head;
        const line = update.state.doc.lineAt(pos);
        const col = pos - line.from + 1;
        const selectedChars = Math.abs(
          update.state.selection.main.to - update.state.selection.main.from,
        );
        updateCursorPos(tabId, {
          line: line.number,
          col,
          selectedChars,
          linesCount: update.state.doc.lines,
          charsCount: update.state.doc.length,
        });
      }

      // Sync bookmarks to store when there is an effect or when the document changes
      const hasBookmarkEffects = update.transactions.some((tr) =>
        tr.effects.some(
          (e) =>
            e.is(toggleBookmarkEffect) ||
            e.is(clearBookmarksEffect) ||
            e.is(setBookmarksEffect),
        ),
      );

      if (
        hasBookmarkEffects ||
        (update.docChanged &&
          update.state.field(bookmarkStateField, false)?.size)
      ) {
        const currentBookmarkLines = getBookmarkLineNumbers(update.state);
        updateTabBookmarks(tabId, currentBookmarkLines);
      }
    });

    const baseTheme = EditorView.theme({
      "&": {
        height: "100%",
        fontSize: `${fontSize}px`,
      },
      ".cm-scroller": {
        fontFamily: "var(--font-mono)",
      },
      ".cm-content": {
        fontSize: `${fontSize}px`,
      },
      ".cm-gutters": {
        fontSize: `${fontSize}px`,
      },
    });

    const startState = EditorState.create({
      doc: initialContent,
      extensions: [
        lineNumbersCompartment.of(
          showLineNumbers
            ? [bookmarkGutter, lineNumbers(), highlightActiveLineGutter()]
            : [bookmarkGutter],
        ),
        highlightActiveLine(),
        history(),
        foldGutter(),
        bracketMatching(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        customShortcuts,
        keymap.of([...defaultKeymap, ...historyKeymap]),
        languageCompartment.of(getLanguageExtension(language)),
        themeCompartment.of(isDarkMode ? oneDark : []),
        fontSizeCompartment.of(baseTheme),
        wrappingCompartment.of(lineWrapping ? EditorView.lineWrapping : []),
        whitespaceCompartment.of(
          showWhitespace
            ? [highlightWhitespace(), highlightTrailingWhitespace()]
            : [],
        ),
        editableCompartment.of(EditorView.editable.of(!isLocked)),
        searchMarksField,
        bookmarkStateField,
        updateListener,
        EditorView.domEventHandlers({
          drop(event) {
            // If dropping files from OS, do not let CodeMirror insert raw text at cursor automatically
            if (
              event.dataTransfer &&
              event.dataTransfer.types.includes("Files")
            ) {
              event.preventDefault();
              return true;
            }
            return false;
          },
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: containerRef.current,
    });

    // Restore bookmarks if tab has bookmarks from session
    if (activeTab?.bookmarks && activeTab.bookmarks.length > 0) {
      view.dispatch({
        effects: setBookmarksEffect.of(activeTab.bookmarks),
      });
    }

    viewRef.current = view;
    setView(view);
    useEditorStore.setState({ flushCurrentTabContent: flushDoc });

    return () => {
      useEditorStore.setState({ flushCurrentTabContent: undefined });
      flushDoc();
      view.destroy();
      viewRef.current = null;
      setView(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabId]); // Re-create view only when active tab changes

  // Sync isLocked read-only state dynamically
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: editableCompartment.reconfigure(
          EditorView.editable.of(!isLocked),
        ),
      });
    }
  }, [isLocked]);

  // Sync external content changes (e.g. Find & Replace, external reloads, direct store updates)
  useEffect(() => {
    if (content !== undefined && viewRef.current) {
      if (content !== lastSyncedContentRef.current) {
        lastSyncedContentRef.current = content;
        const currentDoc = viewRef.current.state.doc.toString();
        if (content !== currentDoc) {
          viewRef.current.dispatch({
            changes: { from: 0, to: currentDoc.length, insert: content },
          });
        }
      }
    }
  }, [content]);

  // Update language dynamically without recreating state
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: languageCompartment.reconfigure(
          getLanguageExtension(language),
        ),
      });
    }
  }, [language]);

  // Update theme dynamically
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: themeCompartment.reconfigure(isDarkMode ? oneDark : []),
      });
    }
  }, [isDarkMode]);

  // Update font size dynamically
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: fontSizeCompartment.reconfigure(
          EditorView.theme({
            "&": { height: "100%", fontSize: `${fontSize}px` },
            ".cm-scroller": { fontFamily: "var(--font-mono)" },
            ".cm-content": { fontSize: `${fontSize}px` },
            ".cm-gutters": { fontSize: `${fontSize}px` },
          }),
        ),
      });
    }
  }, [fontSize]);

  // Update line wrapping dynamically
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: wrappingCompartment.reconfigure(
          lineWrapping ? EditorView.lineWrapping : [],
        ),
      });
    }
  }, [lineWrapping]);

  // Update line numbers dynamically
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: lineNumbersCompartment.reconfigure(
          showLineNumbers
            ? [bookmarkGutter, lineNumbers(), highlightActiveLineGutter()]
            : [bookmarkGutter],
        ),
      });
    }
  }, [showLineNumbers]);

  // Update whitespace highlighting dynamically
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: whitespaceCompartment.reconfigure(
          showWhitespace
            ? [highlightWhitespace(), highlightTrailingWhitespace()]
            : [],
        ),
      });
    }
  }, [showWhitespace]);

  return (
    <div
      ref={containerRef}
      style={{ fontSize: `${fontSize}px` }}
      className="h-full w-full overflow-hidden"
    />
  );
};
