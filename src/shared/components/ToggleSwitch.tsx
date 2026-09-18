import React from 'react';

interface ToggleSwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <div
      onClick={() => !disabled && onChange(!checked)}
      className={`flex items-center justify-between py-2.5 px-1 cursor-pointer select-none group transition-opacity ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <div className="flex flex-col pr-4">
        <span className="text-xs font-medium text-[var(--text-main)] group-hover:text-[var(--text-highlight)] transition-colors">
          {label}
        </span>
        {description && (
          <span className="text-[11px] text-[var(--text-muted)] leading-normal mt-0.5">
            {description}
          </span>
        )}
      </div>

      {/* Modern Sleek Switch pill */}
      <div
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out border ${
          checked
            ? 'bg-[var(--accent)] border-[var(--accent)]'
            : 'bg-[var(--bg-tab-hover)] border-[var(--border-color)]'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform duration-200 ease-in-out ${
            checked ? 'translate-x-4.5' : 'translate-x-0.5'
          }`}
        />
      </div>
    </div>
  );
};
