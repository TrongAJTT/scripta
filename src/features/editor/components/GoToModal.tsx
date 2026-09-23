import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  CornerDownRight,
  Bookmark,
  Hash,
  Navigation,
  HelpCircle,
} from "lucide-react";
import { ModalWrapper } from "../../../shared/components/ModalWrapper";
import { dialog } from "../../../shared/dialog/dialogStore";
import type { useEditorCommands } from "../hooks/useEditorCommands";

export type GoToTab = "line" | "offset" | "bookmark";

interface GoToModalProps {
  isOpen: boolean;
  onClose: () => void;
  editorCmds: ReturnType<typeof useEditorCommands>;
}

export const GoToModal: React.FC<GoToModalProps> = ({
  isOpen,
  onClose,
  editorCmds,
}) => {
  const [activeTab, setActiveTab] = useState<GoToTab>("line");
  const [lineInput, setLineInput] = useState("");
  const [offsetInput, setOffsetInput] = useState("");
  const [selectedBookmarkIndex, setSelectedBookmarkIndex] = useState(0);

  const lineInputRef = useRef<HTMLInputElement>(null);
  const offsetInputRef = useRef<HTMLInputElement>(null);
  const bookmarkListRef = useRef<HTMLDivElement>(null);

  // Position snapshot when modal opens
  const [positionInfo, setPositionInfo] = useState({
    line: 1,
    col: 1,
    maxLines: 1,
    offset: 0,
    maxOffset: 0,
  });

  const bookmarks = useMemo(() => {
    if (!isOpen) return [];
    return editorCmds.getBookmarks();
  }, [isOpen, editorCmds]);

  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true);
    const pos = editorCmds.getCurrentPosition();
    setPositionInfo(pos);
    setLineInput(String(pos.line));
    setOffsetInput(String(pos.offset));
    setSelectedBookmarkIndex(0);
    setActiveTab("line");
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

  // Focus input when tab changes or opens
  useEffect(() => {
    if (!isOpen) return;

    // Small delay to ensure modal DOM mounting
    const timer = setTimeout(() => {
      if (activeTab === "line") {
        lineInputRef.current?.focus();
        lineInputRef.current?.select();
      } else if (activeTab === "offset") {
        offsetInputRef.current?.focus();
        offsetInputRef.current?.select();
      } else if (activeTab === "bookmark") {
        bookmarkListRef.current?.focus();
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen, activeTab]);

  // Help dialog using global host
  const handleShowHelp = useCallback(() => {
    void dialog.alert({
      title: "Go to... Navigation Guide",
      variant: "info",
      confirmText: "Got it",
      message:
        "• Line Tab (Alt+1): Jump to line number within the document.\n\n" +
        "• Offset Tab (Alt+2): Jump directly to a character offset (0-indexed position within the document).\n\n" +
        "• Bookmark Tab (Alt+3): View and jump to any saved bookmark in the file.\n\n" +
        "Keyboard Shortcuts:\n" +
        "- Enter: Confirm & Jump to target\n" +
        "- Esc: Cancel & return to editor\n" +
        "- Up / Down: Navigate bookmark items",
    });
  }, []);

  // Execution Handlers
  const handleGoLine = useCallback(() => {
    const trimmed = lineInput.trim();
    if (!trimmed) return;

    if (trimmed.includes(":")) {
      const [lineStr, colStr] = trimmed.split(":");
      const targetLine = parseInt(lineStr, 10);
      const targetCol = parseInt(colStr, 10);
      if (!Number.isNaN(targetLine)) {
        editorCmds.goToLine(
          targetLine,
          Number.isNaN(targetCol) ? 1 : targetCol,
        );
        onClose();
      }
    } else {
      const targetLine = parseInt(trimmed, 10);
      if (!Number.isNaN(targetLine)) {
        editorCmds.goToLine(targetLine, 1);
        onClose();
      }
    }
  }, [lineInput, editorCmds, onClose]);

  const handleGoOffset = useCallback(() => {
    const trimmed = offsetInput.trim();
    if (!trimmed) return;
    const targetOffset = parseInt(trimmed, 10);
    if (!Number.isNaN(targetOffset)) {
      editorCmds.goToOffset(targetOffset);
      onClose();
    }
  }, [offsetInput, editorCmds, onClose]);

  const handleGoBookmark = useCallback(
    (line: number) => {
      editorCmds.jumpToBookmark(line);
      onClose();
    },
    [editorCmds, onClose],
  );

  // Global keydown within modal for tab switching (Alt+1, Alt+2, Alt+3)
  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.altKey && e.key === "1") {
      e.preventDefault();
      setActiveTab("line");
    } else if (e.altKey && e.key === "2") {
      e.preventDefault();
      setActiveTab("offset");
    } else if (e.altKey && e.key === "3") {
      e.preventDefault();
      setActiveTab("bookmark");
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Go To..."
      icon={<CornerDownRight className="w-4 h-4 text-[var(--accent)]" />}
      maxWidthClass="max-w-md"
      containerHeightClass="h-auto max-h-[85vh]"
      headerTrailing={
        <button
          onClick={handleShowHelp}
          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-highlight)] hover:bg-[var(--bg-tab-hover)] transition-colors"
          title="Go To Help & Shortcuts"
          aria-label="Help"
        >
          <HelpCircle className="w-4 h-4 text-[var(--accent-blue)]" />
        </button>
      }
    >
      <div
        className="flex flex-col p-4 gap-4 text-xs select-none"
        onKeyDown={handleModalKeyDown}
      >
        {/* Navigation Tabs (Line, Offset, Bookmark) */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[var(--bg-toolbar)] border border-[var(--border-color)]">
          <button
            type="button"
            onClick={() => setActiveTab("line")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === "line"
                ? "bg-[var(--bg-surface)] text-[var(--text-highlight)] shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            <Hash className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Line</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("offset")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === "offset"
                ? "bg-[var(--bg-surface)] text-[var(--text-highlight)] shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            <Navigation className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
            <span>Offset</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("bookmark")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === "bookmark"
                ? "bg-[var(--bg-surface)] text-[var(--text-highlight)] shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-[var(--accent-yellow)]" />
            <span>Bookmark</span>
            {bookmarks.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[var(--bg-surface-elevated)] border border-[var(--border-color)] text-[var(--accent-yellow)] font-semibold">
                {bookmarks.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Line Navigation */}
        {activeTab === "line" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGoLine();
            }}
            className="flex flex-col gap-3.5"
          >
            <div className="grid grid-cols-[130px_1fr] items-center gap-2">
              <span className="text-[var(--text-muted)]">You are here:</span>
              <span className="px-2 py-1 rounded bg-[var(--bg-toolbar)] border border-[var(--border-color)] font-mono text-[var(--text-main)] font-semibold">
                {positionInfo.line}
                {positionInfo.col > 1 ? ` : ${positionInfo.col}` : ""}
              </span>

              <label
                htmlFor="goto-line-input"
                className="text-[var(--text-muted)] font-medium"
              >
                You want to go to:
              </label>
              <input
                id="goto-line-input"
                ref={lineInputRef}
                type="number"
                min={1}
                max={positionInfo.maxLines}
                value={lineInput}
                onChange={(e) => setLineInput(e.target.value)}
                placeholder={`1 - ${positionInfo.maxLines}`}
                className="w-full px-2 py-1 rounded bg-[var(--bg-app)] border border-[var(--border-color)] focus:border-[var(--accent)] text-[var(--text-highlight)] font-mono outline-none transition-colors"
              />

              <span className="text-[var(--text-muted)]">
                You can't go further than:
              </span>
              <span className="px-2 py-1 rounded bg-[var(--bg-toolbar)] border border-[var(--border-color)] font-mono text-[var(--text-muted)]">
                {positionInfo.maxLines}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-tab-hover)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
              >
                I'm going nowhere
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-[var(--accent)] hover:opacity-90 text-white font-medium shadow-xs transition-opacity cursor-pointer"
              >
                Go
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Offset Navigation */}
        {activeTab === "offset" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGoOffset();
            }}
            className="flex flex-col gap-3.5"
          >
            <div className="grid grid-cols-[130px_1fr] items-center gap-2">
              <span className="text-[var(--text-muted)]">You are here:</span>
              <span className="px-2 py-1 rounded bg-[var(--bg-toolbar)] border border-[var(--border-color)] font-mono text-[var(--text-main)] font-semibold">
                {positionInfo.offset}
              </span>

              <label
                htmlFor="goto-offset-input"
                className="text-[var(--text-muted)] font-medium"
              >
                You want to go to:
              </label>
              <input
                id="goto-offset-input"
                ref={offsetInputRef}
                type="number"
                min={0}
                max={positionInfo.maxOffset}
                value={offsetInput}
                onChange={(e) => setOffsetInput(e.target.value)}
                placeholder={`0 - ${positionInfo.maxOffset}`}
                className="w-full px-2 py-1 rounded bg-[var(--bg-app)] border border-[var(--border-color)] focus:border-[var(--accent)] text-[var(--text-highlight)] font-mono outline-none transition-colors"
              />

              <span className="text-[var(--text-muted)]">
                You can't go further than:
              </span>
              <span className="px-2 py-1 rounded bg-[var(--bg-toolbar)] border border-[var(--border-color)] font-mono text-[var(--text-muted)]">
                {positionInfo.maxOffset}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-tab-hover)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
              >
                I'm going nowhere
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-[var(--accent)] hover:opacity-90 text-white font-medium shadow-xs transition-opacity cursor-pointer"
              >
                Go
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Bookmark Navigation */}
        {activeTab === "bookmark" && (
          <div className="flex flex-col gap-3">
            {bookmarks.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center text-[var(--text-muted)] gap-2">
                <Bookmark className="w-8 h-8 text-[var(--text-subtle)] stroke-[1.5]" />
                <span className="font-medium text-[var(--text-main)]">
                  No Bookmarks Found
                </span>
                <span className="text-[11px] max-w-xs text-[var(--text-muted)]">
                  Use <b>Ctrl+F2</b> in the editor to toggle bookmarks on any
                  line.
                </span>
              </div>
            ) : (
              <div
                ref={bookmarkListRef}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSelectedBookmarkIndex((prev) =>
                      Math.min(bookmarks.length - 1, prev + 1),
                    );
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSelectedBookmarkIndex((prev) => Math.max(0, prev - 1));
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    const bm = bookmarks[selectedBookmarkIndex];
                    if (bm) handleGoBookmark(bm.line);
                  }
                }}
                className="flex flex-col gap-1 max-h-48 overflow-y-auto p-1 rounded-md bg-[var(--bg-app)] border border-[var(--border-color)] outline-none focus:border-[var(--accent)]"
              >
                {bookmarks.map((bm, index) => {
                  const isSelected = index === selectedBookmarkIndex;
                  return (
                    <div
                      key={`${bm.line}-${bm.pos}`}
                      onClick={() => {
                        setSelectedBookmarkIndex(index);
                        handleGoBookmark(bm.line);
                      }}
                      className={`flex items-center justify-between gap-3 px-2.5 py-1.5 rounded cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[var(--accent)] text-white"
                          : "hover:bg-[var(--bg-surface)] text-[var(--text-main)]"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Bookmark
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isSelected
                              ? "text-white fill-white"
                              : "text-[var(--accent-yellow)]"
                          }`}
                        />
                        <span className="font-mono font-semibold shrink-0">
                          Line {bm.line}:
                        </span>
                        <span className="truncate text-[11px] opacity-90">
                          {bm.text}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
              <span className="text-[11px] text-[var(--text-subtle)]">
                Press <b>Enter</b> to jump
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-tab-hover)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
};
