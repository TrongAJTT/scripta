import React from 'react';

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}

export const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}) => {
  return (
    <div className="space-y-1.5 py-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--text-main)]">
          {label}
        </span>
        <span className="text-xs font-mono font-bold text-[var(--accent)] bg-[var(--bg-tab-hover)] px-2 py-0.5 rounded-sm border border-[var(--border-subtle)]">
          {value}{unit}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-[var(--bg-tab-hover)] rounded-xs appearance-none cursor-pointer accent-[var(--accent)]"
      />
    </div>
  );
};
