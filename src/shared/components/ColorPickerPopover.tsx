import React, { useState, useRef, useEffect } from "react";
import { HexAlphaColorPicker } from "react-colorful";
import { Check, X } from "lucide-react";

export interface ColorPickerPopoverProps {
  value: string | undefined;
  onChange: (color: string | undefined) => void;
  label?: string;
  defaultColor?: string;
}

const PASTEL_PRESETS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
];

export const ColorPickerPopover: React.FC<ColorPickerPopoverProps> = ({
  value,
  onChange,
  label = "Color",
  defaultColor = "#3b82f680",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState(value || "");
  const [prevValue, setPrevValue] = useState(value);
  const popoverRef = useRef<HTMLDivElement>(null);

  if (prevValue !== value) {
    setPrevValue(value);
    setInputVal(value || "");
  }

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const currentColor = value || defaultColor;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputVal(val);
    if (/^#([0-9a-fA-F]{3,8})$/.test(val)) {
      onChange(val);
    }
  };

  const handleClear = () => {
    onChange(undefined);
    setInputVal("");
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      {/* Trigger Button with preview swatch */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--bg-app)] border border-[var(--border-color)] hover:border-[var(--accent)] text-xs text-[var(--text-main)] transition-colors cursor-pointer select-none"
        title={label}
      >
        <span
          className="w-3.5 h-3.5 rounded border border-black/20 dark:border-white/20 shrink-0 shadow-xs"
          style={{
            backgroundColor: value || "transparent",
            backgroundImage: !value
              ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
              : undefined,
            backgroundSize: "6px 6px",
            backgroundPosition: "0 0, 0 3px, 3px -3px, -3px 0px",
          }}
        />
        <span className="text-[11px] font-mono text-[var(--text-muted)] truncate max-w-[65px]">
          {value ? value.toUpperCase() : "None"}
        </span>
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute z-50 mt-1 left-0 p-3 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-color)] shadow-xl w-60 select-none animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-2 mb-1">
            <span className="text-xs font-semibold text-[var(--text-main)]">
              {label}
            </span>
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1 text-[10px] text-rose-500 hover:text-rose-400 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* react-colorful HexAlphaColorPicker */}
          <div className="flex justify-center mb-3">
            <HexAlphaColorPicker
              color={currentColor}
              onChange={(newColor) => {
                onChange(newColor);
                setInputVal(newColor);
              }}
              style={{ width: "100%", height: "140px" }}
            />
          </div>

          {/* Hex / Alpha Input Field */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              HEX:
            </span>
            <input
              type="text"
              value={inputVal}
              placeholder="#rrggbbaa"
              onChange={handleInputChange}
              className="flex-1 px-2 py-1 text-xs font-mono rounded bg-[var(--bg-app)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          {/* Preset Swatches */}
          <div className="space-y-1">
            <span className="text-[10px] text-[var(--text-subtle)] block">
              Presets:
            </span>
            <div className="grid grid-cols-8 gap-1.5">
              {PASTEL_PRESETS.map((hex) => {
                const isSelected = value?.toLowerCase() === hex.toLowerCase();
                return (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => {
                      onChange(hex);
                      setInputVal(hex);
                    }}
                    style={{ backgroundColor: hex }}
                    className="w-5 h-5 rounded border border-black/10 dark:border-white/20 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
                    title={hex}
                  >
                    {isSelected && (
                      <Check className="w-3 h-3 text-black dark:text-white drop-shadow-sm" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
