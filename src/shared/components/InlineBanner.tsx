import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle, AlertCircle, X } from "lucide-react";

export type InlineBannerVariant = "success" | "error" | "info" | "warning";

export interface InlineBannerProps {
  message: string | null;
  variant?: InlineBannerVariant;
  onDismiss?: () => void;
  autoDismissMs?: number; // Optional auto close timer
  className?: string;
}

export const InlineBanner: React.FC<InlineBannerProps> = ({
  message,
  variant = "info",
  onDismiss,
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

  const config = {
    success: {
      bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
      icon: <CheckCircle className="w-4 h-4 shrink-0" />,
    },
    error: {
      bg: "bg-rose-500/10 border-rose-500/20 text-rose-400",
      icon: <AlertCircle className="w-4 h-4 shrink-0" />,
    },
    warning: {
      bg: "bg-amber-500/10 border-amber-500/20 text-amber-400",
      icon: <AlertCircle className="w-4 h-4 shrink-0" />,
    },
    info: {
      bg: "bg-blue-500/10 border-blue-500/20 text-blue-400",
      icon: <CheckCircle className="w-4 h-4 shrink-0" />,
    },
  }[variant];

  return (
    <div
      role="alert"
      className={`px-3.5 py-2.5 rounded-lg border text-xs flex items-center justify-between gap-2.5 animate-fade-in transition-all ${config.bg} ${className}`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {config.icon}
        <span className="leading-snug break-words">{message}</span>
      </div>
      <button
        type="button"
        onClick={handleClose}
        className="p-1 -mr-1 rounded-md opacity-70 hover:opacity-100 hover:bg-black/10 transition-opacity cursor-pointer shrink-0"
        title="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
