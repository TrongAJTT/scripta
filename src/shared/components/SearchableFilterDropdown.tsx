import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Filter, ChevronDown, Search, X, Check } from 'lucide-react';

export interface SearchableFilterItem {
  id: string;
  name: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface SearchableFilterDropdownProps {
  items: SearchableFilterItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  allOptionLabel?: string;
  allCount?: number;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
}

export const SearchableFilterDropdown: React.FC<SearchableFilterDropdownProps> = ({
  items,
  selectedId,
  onSelect,
  allOptionLabel = 'All Categories',
  allCount,
  placeholder = 'Filter...',
  searchPlaceholder = 'Search category...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close menu on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [isOpen]);

  // Selected item display name
  const currentLabel = useMemo(() => {
    if (selectedId === 'All' || !selectedId) return allOptionLabel;
    const item = items.find((i) => i.id === selectedId || i.name === selectedId);
    return item ? item.name : placeholder;
  }, [selectedId, items, allOptionLabel, placeholder]);

  // Filter items in the popup menu by search query
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return items;
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, searchQuery]);

  // Check if "All" option matches search query
  const matchesAll = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return allOptionLabel.toLowerCase().includes(q) || 'all'.includes(q);
  }, [allOptionLabel, searchQuery]);

  const handleSelectItem = (id: string) => {
    onSelect(id);
    setIsOpen(false);
    setSearchQuery('');
  };

  const isAllSelected = selectedId === 'All' || !selectedId;

  return (
    <div className={`relative shrink-0 ${className}`} ref={menuRef}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-sm border transition-colors cursor-pointer select-none ${
          !isAllSelected
            ? 'bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)] font-semibold'
            : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-tab-hover)]'
        }`}
      >
        <Filter className="w-3 h-3 text-[var(--accent)]" />
        <span className="max-w-[140px] truncate">{currentLabel}</span>
        <ChevronDown className="w-3 h-3 text-[var(--text-muted)] shrink-0 ml-0.5" />
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-64 z-50 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-md shadow-2xl backdrop-blur-md animate-fade-in flex flex-col max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-[var(--border-subtle)] bg-[var(--bg-toolbar)]">
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                data-category-search="true"
                autoFocus
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-6 py-1 text-xs bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xs text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent)]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto py-1 divide-y divide-[var(--border-subtle)]/40">
            {/* 'All' Option */}
            {matchesAll && (
              <button
                type="button"
                onClick={() => handleSelectItem('All')}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors cursor-pointer select-none ${
                  isAllSelected
                    ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-semibold'
                    : 'text-[var(--text-main)] hover:bg-[var(--bg-tab-hover)]'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0 pr-2 truncate">
                  {isAllSelected && <Check className="w-3 h-3 shrink-0 text-[var(--accent)]" />}
                  <span className="truncate">{allOptionLabel}</span>
                </div>
                {allCount !== undefined && (
                  <span className="text-[10px] text-[var(--text-muted)] font-mono shrink-0">
                    {allCount}
                  </span>
                )}
              </button>
            )}

            {/* Filtered Item Options */}
            {filteredItems.map((item) => {
              const isSelected = selectedId === item.id || selectedId === item.name;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectItem(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors cursor-pointer select-none ${
                    isSelected
                      ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-semibold'
                      : 'text-[var(--text-main)] hover:bg-[var(--bg-tab-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0 pr-2 truncate">
                    {isSelected && <Check className="w-3 h-3 shrink-0 text-[var(--accent)]" />}
                    {item.icon && <span className="shrink-0">{item.icon}</span>}
                    <span className="truncate">{item.name}</span>
                  </div>
                  {item.count !== undefined && (
                    <span className="text-[10px] text-[var(--text-muted)] font-mono shrink-0">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}

            {!matchesAll && filteredItems.length === 0 && (
              <div className="py-4 text-center text-xs text-[var(--text-muted)]">
                No matching options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
