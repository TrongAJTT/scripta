import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Search,
  Replace,
  FolderSearch,
  Bookmark,
  X,
  GripHorizontal,
} from "lucide-react";
import { useEditorStore } from "../../tabs/store";
import { useEditorView } from "../context/useEditorView";
import { Z_INDEX } from "../../../core/constants/zIndex";
import type {
  SearchTabType,
  SearchOptions,
  WorkspaceMatchResult,
} from "../services/searchService";
import {
  findInEditor,
  replaceInEditor,
  replaceAllInEditor,
  findAllMatchesInText,
  markAllInEditor,
  clearAllMarksInEditor,
} from "../services/searchService";
import { FindTab } from "./search/FindTab";
import { ReplaceTab } from "./search/ReplaceTab";
import { WorkspaceSearchTab } from "./search/WorkspaceSearchTab";
import { MarkTab } from "./search/MarkTab";

const DEFAULT_OPTIONS: SearchOptions = {
  findText: "",
  replaceText: "",
  matchCase: false,
  matchWholeWord: false,
  wrapAround: true,
  searchMode: "normal",
  inSelection: false,
  tabFilters: "",
};

export const FindReplaceModal: React.FC = () => {
  const isSearching = useEditorStore((s) => s.isSearching);
  const toggleSearch = useEditorStore((s) => s.toggleSearch);
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);
  const updateTabContent = useEditorStore((s) => s.updateTabContent);
  const { viewRef } = useEditorView();

  const [activeTab, setActiveTabType] = useState<SearchTabType>("find");
  const [options, setOptions] = useState<SearchOptions>(DEFAULT_OPTIONS);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [markedLines, setMarkedLines] = useState<string[]>([]);
  const [markedCount, setMarkedCount] = useState<number>(0);
  const [workspaceResults, setWorkspaceResults] = useState<
    WorkspaceMatchResult[]
  >([]);

  // Draggable positioning state
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: 80,
    y: 80,
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const modalRef = useRef<HTMLDivElement>(null);

  // Focus and select input on open
  useEffect(() => {
    if (isSearching) {
      queueMicrotask(() => {
        setStatusMessage("");
        // Preload selected text from editor if any
        if (viewRef.current) {
          const sel = viewRef.current.state.selection.main;
          if (!sel.empty) {
            const selText = viewRef.current.state.sliceDoc(sel.from, sel.to);
            if (selText && selText.length <= 100 && !selText.includes("\n")) {
              setOptions((prev) => ({ ...prev, findText: selText }));
            }
          }
        }
      });
    }
  }, [isSearching, viewRef]);

  // Drag listeners
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag on title bar
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const newX = Math.max(
        10,
        Math.min(window.innerWidth - 380, e.clientX - dragOffset.x),
      );
      const newY = Math.max(
        40,
        Math.min(window.innerHeight - 200, e.clientY - dragOffset.y),
      );
      setPosition({ x: newX, y: newY });
    },
    [isDragging, dragOffset],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isSearching) return null;

  // ---------------------------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------------------------

  const handleFindNext = () => {
    if (!viewRef.current || !options.findText) return;
    const res = findInEditor(viewRef.current, options.findText, {
      ...options,
      backward: false,
    });
    if (res.found) {
      setStatusMessage(`Match ${res.index} of ${res.total}`);
    } else {
      setStatusMessage("No matches found.");
    }
  };

  const handleFindPrev = () => {
    if (!viewRef.current || !options.findText) return;
    const res = findInEditor(viewRef.current, options.findText, {
      ...options,
      backward: true,
    });
    if (res.found) {
      setStatusMessage(`Match ${res.index} of ${res.total}`);
    } else {
      setStatusMessage("No matches found.");
    }
  };

  const handleCount = () => {
    if (!viewRef.current || !options.findText) return;
    const doc = viewRef.current.state.doc.toString();
    const matches = findAllMatchesInText(doc, options.findText, options);
    setStatusMessage(`Found ${matches.length} occurrence(s).`);
  };

  const handleFindAllInCurrent = () => {
    if (!viewRef.current || !options.findText) return;
    const doc = viewRef.current.state.doc.toString();
    const matches = findAllMatchesInText(doc, options.findText, options);
    const currTab = tabs.find((t) => t.id === activeTabId);
    if (currTab) {
      setWorkspaceResults([
        {
          tabId: currTab.id,
          tabName: currTab.name,
          matches,
        },
      ]);
      setActiveTabType("workspace");
      setStatusMessage(`Found ${matches.length} matches in current file.`);
    }
  };

  const handleFindAllInOpen = () => {
    if (!options.findText) return;
    const results: WorkspaceMatchResult[] = [];
    let total = 0;

    for (const t of tabs) {
      const matches = findAllMatchesInText(t.content, options.findText, options);
      if (matches.length > 0) {
        results.push({
          tabId: t.id,
          tabName: t.name,
          matches,
        });
        total += matches.length;
      }
    }

    setWorkspaceResults(results);
    setActiveTabType("workspace");
    setStatusMessage(`Found ${total} match(es) across ${results.length} tab(s).`);
  };

  const handleReplaceOnce = () => {
    if (!viewRef.current || !options.findText) return;
    const success = replaceInEditor(
      viewRef.current,
      options.findText,
      options.replaceText,
      options,
    );
    if (success) {
      setStatusMessage("Replaced 1 occurrence.");
    } else {
      setStatusMessage("No match to replace.");
    }
  };

  const handleReplaceAll = () => {
    if (!viewRef.current || !options.findText) return;
    const count = replaceAllInEditor(
      viewRef.current,
      options.findText,
      options.replaceText,
      options,
    );
    setStatusMessage(
      count > 0 ? `Replaced ${count} occurrences.` : "No matches found.",
    );
  };

  const handleReplaceAllInOpenDocs = () => {
    if (!options.findText) return;
    let totalReplaced = 0;
    let docsModified = 0;

    for (const t of tabs) {
      const matches = findAllMatchesInText(t.content, options.findText, options);
      if (matches.length > 0) {
        let newContent = t.content;
        const regex = new RegExp(
          options.searchMode === "regex"
            ? options.findText
            : options.findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          options.matchCase ? "g" : "gi",
        );
        newContent = newContent.replace(regex, options.replaceText);
        updateTabContent(t.id, newContent);
        totalReplaced += matches.length;
        docsModified++;
      }
    }

    setStatusMessage(
      `Replaced ${totalReplaced} occurrence(s) across ${docsModified} document(s).`,
    );
  };

  const handleMarkAll = () => {
    if (!viewRef.current || !options.findText) return;
    const result = markAllInEditor(viewRef.current, options.findText, options);
    setMarkedCount(result.count);
    setMarkedLines(result.matchedLines);
    setStatusMessage(`Marked ${result.count} occurrence(s).`);
  };

  const handleClearMarks = () => {
    if (viewRef.current) {
      clearAllMarksInEditor(viewRef.current);
    }
    setMarkedCount(0);
    setMarkedLines([]);
    setStatusMessage("All marks cleared.");
  };

  const handleCopyMarkedText = () => {
    if (markedLines.length === 0) {
      setStatusMessage("No marked text to copy.");
      return;
    }
    navigator.clipboard.writeText(markedLines.join("\n"));
    setStatusMessage(`Copied ${markedLines.length} marked lines to clipboard.`);
  };

  const handleSelectWorkspaceResult = (
    tabId: string,
    _line: number,
    from: number,
    to: number,
  ) => {
    setActiveTab(tabId);
    setTimeout(() => {
      if (viewRef.current) {
        viewRef.current.dispatch({
          selection: { anchor: from, head: to },
          scrollIntoView: true,
        });
        viewRef.current.focus();
      }
    }, 50);
  };

  return (
    <div
      ref={modalRef}
      style={{
        zIndex: Z_INDEX.WORKSPACE_FLOATING,
        top: `${position.y}px`,
        left: `${position.x}px`,
        pointerEvents: "auto",
      }}
      className="fixed w-[92vw] max-w-[560px] bg-[var(--bg-surface-elevated)] border border-[var(--border-color)] rounded-lg shadow-2xl overflow-hidden animate-fade-in text-xs select-none"
    >
      {/* 1. Draggable Window Titlebar */}
      <div
        onMouseDown={handleMouseDown}
        className="px-3 py-2 bg-[var(--bg-surface)] border-b border-[var(--border-color)] flex items-center justify-between cursor-move text-xs select-none"
      >
        <div className="flex items-center gap-2 font-semibold text-[var(--text-highlight)]">
          <GripHorizontal className="w-4 h-4 text-[var(--text-muted)]" />
          <span>Find &amp; Replace</span>
        </div>
        <button
          onClick={() => toggleSearch(false)}
          className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors p-0.5 rounded cursor-pointer"
          title="Close (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Top Tabs (Find, Replace, Find in Workspace, Mark) */}
      <div className="flex items-center px-2 pt-2 border-b border-[var(--border-color)] bg-[var(--bg-toolbar)] gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => {
            setActiveTabType("find");
            setStatusMessage("");
          }}
          className={`px-3 py-1.5 rounded-t-sm text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
            activeTab === "find"
              ? "border-[var(--accent)] text-[var(--text-highlight)] bg-[var(--bg-surface)]"
              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]"
          }`}
        >
          <Search className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>Find</span>
        </button>

        <button
          onClick={() => {
            setActiveTabType("replace");
            setStatusMessage("");
          }}
          className={`px-3 py-1.5 rounded-t-sm text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
            activeTab === "replace"
              ? "border-[var(--accent-blue)] text-[var(--text-highlight)] bg-[var(--bg-surface)]"
              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]"
          }`}
        >
          <Replace className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
          <span>Replace</span>
        </button>

        <button
          onClick={() => {
            setActiveTabType("workspace");
            setStatusMessage("");
          }}
          className={`px-3 py-1.5 rounded-t-sm text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
            activeTab === "workspace"
              ? "border-[var(--accent-purple)] text-[var(--text-highlight)] bg-[var(--bg-surface)]"
              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]"
          }`}
        >
          <FolderSearch className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
          <span>Find in Workspace</span>
        </button>

        <button
          onClick={() => {
            setActiveTabType("mark");
            setStatusMessage("");
          }}
          className={`px-3 py-1.5 rounded-t-sm text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
            activeTab === "mark"
              ? "border-cyan-400 text-[var(--text-highlight)] bg-[var(--bg-surface)]"
              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]"
          }`}
        >
          <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
          <span>Mark</span>
        </button>
      </div>

      {/* 3. Tab Body Container */}
      <div className="p-4 space-y-3 bg-[var(--bg-surface-elevated)] max-h-[75vh] overflow-y-auto">
        {activeTab === "find" && (
          <FindTab
            options={options}
            onChangeOptions={setOptions}
            onFindNext={handleFindNext}
            onFindPrev={handleFindPrev}
            onCount={handleCount}
            onFindAllInCurrent={handleFindAllInCurrent}
            onFindAllInOpen={handleFindAllInOpen}
            onClose={() => toggleSearch(false)}
          />
        )}

        {activeTab === "replace" && (
          <ReplaceTab
            options={options}
            onChangeOptions={setOptions}
            onFindNext={handleFindNext}
            onReplaceOnce={handleReplaceOnce}
            onReplaceAll={handleReplaceAll}
            onReplaceAllInOpenDocs={handleReplaceAllInOpenDocs}
            onClose={() => toggleSearch(false)}
          />
        )}

        {activeTab === "workspace" && (
          <WorkspaceSearchTab
            options={options}
            onChangeOptions={setOptions}
            onSearchWorkspace={handleFindAllInOpen}
            results={workspaceResults}
            onSelectResult={handleSelectWorkspaceResult}
            onClose={() => toggleSearch(false)}
          />
        )}

        {activeTab === "mark" && (
          <MarkTab
            options={options}
            onChangeOptions={setOptions}
            onMarkAll={handleMarkAll}
            onClearMarks={handleClearMarks}
            onCopyMarkedText={handleCopyMarkedText}
            onClose={() => toggleSearch(false)}
            markedCount={markedCount}
          />
        )}

        {/* 4. Status Bar Message */}
        {statusMessage && (
          <div className="pt-2 border-t border-[var(--border-subtle)] text-[11px] font-mono text-[var(--accent-yellow)] text-center">
            {statusMessage}
          </div>
        )}
      </div>
    </div>
  );
};
