import React, { useState, useMemo, useEffect, useRef } from "react";
import { Search, Sparkles, Copy, Check, CornerDownLeft } from "lucide-react";
import { ModalWrapper } from "../../../shared/components/ModalWrapper";
import { SearchableFilterDropdown } from "../../../shared/components/SearchableFilterDropdown";
import type { SearchableFilterItem } from "../../../shared/components/SearchableFilterDropdown";
import {
  SPECIAL_CHARACTERS,
  getUniqueCategories,
} from "../../../core/data/specialCharacters";
import type { SpecialCharacterItem } from "../../../core/data/specialCharacters";

interface InsertCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (char: string) => void;
}

export const InsertCharacterModal: React.FC<InsertCharacterModalProps> = ({
  isOpen,
  onClose,
  onInsert,
}) => {
  const categories = useMemo(() => getUniqueCategories(), []);
  const firstCategoryName = categories[0]?.name ?? "All";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<string>(firstCategoryName);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedChar, setSelectedChar] = useState<SpecialCharacterItem | null>(
    null,
  );
  const [displayLimit, setDisplayLimit] = useState<number>(60);

  const selectedRowRef = useRef<HTMLTableRowElement | null>(null);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  // Reset to the first category and reset state whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setSelectedCategory(firstCategoryName);
      setSearchQuery("");
      setDisplayLimit(60);
    }
  }, [isOpen, firstCategoryName]);

  // Convert categories list to SearchableFilterItem format for the reusable dropdown
  const categoryFilterItems: SearchableFilterItem[] = useMemo(() => {
    return categories.map((c) => ({
      id: c.name,
      name: c.name,
      count: c.count,
    }));
  }, [categories]);

  // Filter characters based on search query and selected category
  const filteredCharacters = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return SPECIAL_CHARACTERS.filter((item) => {
      const matchCat =
        selectedCategory === "All" || item.category === selectedCategory;
      if (!matchCat) return false;

      if (!q) return true;

      return (
        item.unicode.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.html.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedCategory]);

  // Reset display limit and scroll position when filter changes
  useEffect(() => {
    setDisplayLimit(60);
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  }, [searchQuery, selectedCategory]);

  // Slice characters for rendering (lazy rendering / infinite scrolling)
  const visibleCharacters = useMemo(() => {
    return filteredCharacters.slice(0, displayLimit);
  }, [filteredCharacters, displayLimit]);

  // Handle scroll to load more items when reaching bottom
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const nearBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - 150;
    if (nearBottom && displayLimit < filteredCharacters.length) {
      setDisplayLimit((prev) => Math.min(prev + 60, filteredCharacters.length));
    }
  };

  // Automatically keep selectedChar valid when list changes
  useEffect(() => {
    if (filteredCharacters.length > 0) {
      if (
        !selectedChar ||
        !filteredCharacters.some((c) => c.unicode === selectedChar.unicode)
      ) {
        setSelectedChar(filteredCharacters[0]);
      }
    } else {
      setSelectedChar(null);
    }
  }, [filteredCharacters, selectedChar]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  const handleSelectAndInsert = React.useCallback(
    (item: SpecialCharacterItem) => {
      onInsert(item.char);
      onClose();
    },
    [onInsert, onClose],
  );

  // Keyboard navigation & Enter key handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is searching inside category dropdown, ignore modal-level table navigation
      const activeEl = document.activeElement;
      if (
        activeEl &&
        activeEl.getAttribute("data-category-search") === "true"
      ) {
        return;
      }

      if (e.key === "Enter") {
        if (selectedChar) {
          e.preventDefault();
          e.stopPropagation();
          handleSelectAndInsert(selectedChar);
        }
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const currentIdx = filteredCharacters.findIndex(
          (c) => c.unicode === selectedChar?.unicode,
        );
        const nextIdx =
          currentIdx < filteredCharacters.length - 1 ? currentIdx + 1 : 0;
        if (filteredCharacters[nextIdx]) {
          setSelectedChar(filteredCharacters[nextIdx]);
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const currentIdx = filteredCharacters.findIndex(
          (c) => c.unicode === selectedChar?.unicode,
        );
        const prevIdx =
          currentIdx > 0 ? currentIdx - 1 : filteredCharacters.length - 1;
        if (filteredCharacters[prevIdx]) {
          setSelectedChar(filteredCharacters[prevIdx]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    selectedChar,
    filteredCharacters,
    onInsert,
    onClose,
    handleSelectAndInsert,
  ]);

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Insert Character"
      subtitle="Select and insert invisible, zero-width, bidirectional, variation selectors and special Unicode characters. Press Enter to insert."
      icon={<Sparkles className="w-5 h-5 text-[var(--accent)]" />}
      maxWidthClass="max-w-4xl"
      badge={
        <span className="text-[10px] px-2 py-0.5 rounded-sm bg-[var(--accent)]/15 text-[var(--accent)] font-medium">
          {SPECIAL_CHARACTERS.length} Characters
        </span>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-[var(--text-muted)] truncate mr-2">
            {selectedChar ? (
              <span className="font-mono">
                <strong className="text-[var(--accent)] font-bold">
                  {selectedChar.unicode}
                </strong>
                : {selectedChar.description} ({selectedChar.html})
                <span className="ml-2 text-[10px] text-[var(--text-muted)] font-sans">
                  [{selectedChar.category}]
                </span>
              </span>
            ) : (
              "Click any character to select"
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-sm border border-[var(--border-color)] text-xs text-[var(--text-main)] hover:bg-[var(--bg-tab-hover)] transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              disabled={!selectedChar}
              onClick={() =>
                selectedChar && handleSelectAndInsert(selectedChar)
              }
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-sm bg-accent text-accent-contrast text-xs font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
            >
              <CornerDownLeft className="w-3.5 h-3.5" />
              <span>Insert (Enter)</span>
            </button>
          </div>
        </div>
      }
    >
      {/* Search Bar & Reusable Category Filter Dropdown */}
      <div className="px-5 py-2.5 border-b border-[var(--border-subtle)] flex items-center gap-2.5 bg-[var(--bg-app)]/50 shrink-0">
        {/* Main Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by Unicode (U+200B), description, HTML (&#8203;)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-sm text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent)] transition-colors"
          />
        </div>

        {/* Reusable Searchable Category Filter Dropdown */}
        <SearchableFilterDropdown
          items={categoryFilterItems}
          selectedId={selectedCategory}
          onSelect={(catId) => setSelectedCategory(catId)}
          allOptionLabel="All Categories"
          allCount={SPECIAL_CHARACTERS.length}
          searchPlaceholder="Search category..."
        />
      </div>

      {/* Main Table / Grid */}
      <div
        ref={tableContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto min-h-0 divide-y divide-[var(--border-subtle)]"
      >
        {filteredCharacters.length === 0 ? (
          <div className="py-16 text-center text-xs text-[var(--text-muted)]">
            No special characters found matching your search.
          </div>
        ) : (
          <>
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[var(--bg-toolbar)] text-[var(--text-muted)] sticky top-0 z-10 border-b border-[var(--border-color)] shadow-2xs">
                <tr>
                  <th className="py-2 px-3 font-semibold w-24">Unicode</th>
                  <th className="py-2 px-3 font-semibold">Description</th>
                  <th className="py-2 px-3 font-semibold w-36">Category</th>
                  <th className="py-2 px-3 font-semibold w-28">HTML Code</th>
                  <th className="py-2 px-3 font-semibold w-24 text-center">
                    Example
                  </th>
                  <th className="py-2 px-3 font-semibold w-24 text-center">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {visibleCharacters.map((item) => {
                  const isSelected = selectedChar?.unicode === item.unicode;
                  return (
                    <tr
                      key={item.unicode + item.description}
                      ref={isSelected ? selectedRowRef : undefined}
                      onClick={() => setSelectedChar(item)}
                      onDoubleClick={() => handleSelectAndInsert(item)}
                      className={`transition-colors cursor-pointer group ${
                        isSelected
                          ? "bg-[var(--accent)]/10 text-[var(--text-highlight)] font-medium"
                          : "hover:bg-[var(--bg-tab-hover)] text-[var(--text-main)]"
                      }`}
                    >
                      <td className="py-2 px-3 font-mono font-semibold text-[var(--accent)]">
                        {item.unicode}
                      </td>
                      <td className="py-2 px-3 font-medium text-[var(--text-highlight)]">
                        {item.description}
                      </td>
                      <td className="py-2 px-3 text-[11px] text-[var(--text-muted)]">
                        <span className="px-1.5 py-0.5 rounded-xs bg-[var(--bg-app)] border border-[var(--border-subtle)] inline-block">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-[var(--text-muted)]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(item.html, item.unicode + "-html");
                          }}
                          title="Copy HTML code"
                          className="flex items-center gap-1 hover:text-[var(--text-main)] hover:underline"
                        >
                          <span>{item.html}</span>
                          {copiedCode === item.unicode + "-html" ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="font-mono px-2 py-0.5 rounded bg-[var(--bg-app)] border border-[var(--border-color)] text-[var(--text-main)] font-bold inline-block">
                          {item.example}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAndInsert(item);
                          }}
                          className={`px-2.5 py-1 text-[11px] rounded transition-colors font-medium cursor-pointer ${
                            isSelected
                              ? "bg-[var(--accent)] text-black font-semibold"
                              : "bg-[var(--bg-surface)] hover:bg-[var(--accent)] hover:text-black border border-[var(--border-color)]"
                          }`}
                        >
                          Insert
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Showing status / load more indicator */}
            {visibleCharacters.length < filteredCharacters.length && (
              <div className="py-3 text-center text-[11px] text-[var(--text-muted)] bg-[var(--bg-surface)]/50">
                Showing {visibleCharacters.length} of{" "}
                {filteredCharacters.length} characters (scroll down to load
                more)
              </div>
            )}
          </>
        )}
      </div>
    </ModalWrapper>
  );
};
