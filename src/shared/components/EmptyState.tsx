import React from "react";

export type EmptyStateTone = "neutral" | "danger" | "warning";

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  tone?: EmptyStateTone;
  detail?: string;
  actions?: React.ReactNode;
  className?: string;
}

const TONE_ICON_COLORS: Record<EmptyStateTone, string> = {
  neutral: "text-[var(--text-subtle)]",
  danger: "text-[var(--status-danger-text)]",
  warning: "text-[var(--status-warning-text)]",
};

/**
 * Unified flat, cardless empty & blocking-diagnostic state for workbench canvases.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  tone = "neutral",
  detail,
  actions,
  className = "",
}) => {
  return (
    <div
      className={`h-full w-full flex flex-col items-center justify-center p-8 text-center select-none ${className}`}
    >
      <div className={`mb-3 shrink-0 ${TONE_ICON_COLORS[tone]}`}>{icon}</div>

      <h3 className="text-xs font-semibold text-[var(--text-highlight)] tracking-tight">
        {title}
      </h3>

      {description && (
        <p className="text-[11px] text-[var(--text-muted)] mt-1.5 max-w-sm leading-relaxed">
          {description}
        </p>
      )}

      {detail && (
        <pre
          className="mt-3 px-3 py-2 rounded-lg border text-[11px] font-mono max-w-md w-full overflow-x-auto whitespace-pre-wrap break-words text-left select-text"
          style={{
            backgroundColor: "var(--status-danger-bg)",
            borderColor: "var(--status-danger-border)",
            color: "var(--status-danger-text)",
          }}
        >
          {detail}
        </pre>
      )}

      {actions && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
};
