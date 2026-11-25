import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type InlineBannerVariant = "success" | "error" | "info" | "warning";

export interface InlineBannerProps {
  message: string | null;
  variant?: InlineBannerVariant;
  onDismiss?: () => void;
  dismissible?: boolean;
  compact?: boolean;
  autoDismissMs?: number;
  className?: string;
}

const VARIANT_CONFIG: Record<
  InlineBannerVariant,
  {
    style: React.CSSProperties;
    icon: React.ReactNode;
  }
> = {
  success: {
    style: {
      backgroundColor: "var(--status-success-bg)",
      borderColor: "var(--status-success-border)",
      color: "var(--status-success-text)",
    },
    icon: <CheckCircle className="w-3.5 h-3.5 shrink-0" />,
  },
  error: {
    style: {
      backgroundColor: "var(--status-danger-bg)",
      borderColor: "var(--status-danger-border)",
      color: "var(--status-danger-text)",
    },
    icon: <AlertCircle className="w-3.5 h-3.5 shrink-0" />,
  },
  warning: {
    style: {
      backgroundColor: "var(--status-warning-bg)",
      borderColor: "var(--status-warning-border)",
      color: "var(--status-warning-text)",
    },
    icon: <AlertTriangle className="w-3.5 h-3.5 shrink-0" />,
  },
  info: {
    style: {
      backgroundColor: "var(--status-info-bg)",
      borderColor: "var(--status-info-border)",
      color: "var(--status-info-text)",
    },
    icon: <Info className="w-3.5 h-3.5 shrink-0" />,
  },
};

export const InlineBanner: React.FC<InlineBannerProps> = ({
  message,
  variant = "info",
  onDismiss,
  dismissible = true,
  compact = false,
  autoDismissMs,
  className = "",
}) => {
  // Track last seen message so dismiss only applies to that specific message instance
  const [dismissedMessage, setDismissedMessage] = useState<string | null>(null);

  const isVisible = Boolean(message) && message !== dismissedMessage;

  const handleClose = useCallback(() => {
    if (message) {
      setDismissedMessage(message);
    }
    onDismiss?.();
  }, [message, onDismiss]);

  useEffect(() => {
    if (!isVisible || !autoDismissMs || !message) return;
    const timer = setTimeout(() => {
      handleClose();
    }, autoDismissMs);
    return () => clearTimeout(timer);
  }, [isVisible, autoDismissMs, message, handleClose]);

  if (!isVisible || !message) return null;

  const config = VARIANT_CONFIG[variant];

  return (
    <div
      role="alert"
      style={config.style}
      className={`${
        compact ? "px-3 py-1.5 rounded" : "px-3.5 py-2.5 rounded-lg"
      } border text-xs flex items-center justify-between gap-2.5 animate-fade-in transition-all ${className}`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {config.icon}
        <span className="leading-snug break-words">{message}</span>
      </div>
      {dismissible && (
        <button
          type="button"
          onClick={handleClose}
          className="p-1 -mr-1 rounded opacity-70 hover:opacity-100 hover:bg-black/10 transition-opacity cursor-pointer shrink-0"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
