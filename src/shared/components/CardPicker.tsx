import React from "react";
import { Check } from "lucide-react";

export interface CardPickerOption<T extends string | number> {
  id: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface CardPickerProps<T extends string | number> {
  options: CardPickerOption<T>[];
  selectedId: T;
  onChange: (id: T) => void;
  columns?: 1 | 2 | 3 | 4;
}

export function CardPicker<T extends string | number>({
  options,
  selectedId,
  onChange,
  columns = 3,
}: CardPickerProps<T>) {
  const gridColClass =
    columns === 1
      ? "grid-cols-1"
      : columns === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : columns === 4
          ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
          : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3";

  return (
    <div className={`grid ${gridColClass} gap-2.5`}>
      {options.map((opt) => {
        const isSelected = opt.id === selectedId;
        return (
          <button
            key={String(opt.id)}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`p-3 rounded-md border text-left flex flex-col justify-between transition-all cursor-pointer select-none ${
              isSelected
                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text-highlight)] ring-1 ring-[var(--accent)]"
                : "border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-tab-hover)] hover:text-[var(--text-main)]"
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <div className="flex items-center gap-1.5 font-medium text-xs">
                {opt.icon}
                <span>{opt.label}</span>
              </div>
              {isSelected && (
                <Check className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
              )}
            </div>
            {opt.description && (
              <span className="text-[10px] text-[var(--text-subtle)] leading-snug">
                {opt.description}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
