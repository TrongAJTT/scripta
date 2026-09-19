import React, { useState, useEffect, useRef } from "react";
import { useDialogStore } from "./dialogStore";
import type { DialogState, DialogVariant } from "./dialogStore";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  RotateCcw,
  X,
} from "lucide-react";

import { Z_INDEX } from "../../core/constants/zIndex";

const getVariantIcon = (variant: DialogVariant = "info") => {
  switch (variant) {
    case "danger":
      return <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />;
    case "warning":
      return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
    case "success":
      return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
    case "info":
    default:
      return <Info className="w-5 h-5 text-[var(--accent)] shrink-0" />;
  }
};

const getConfirmButtonClasses = (variant: DialogVariant = "info") => {
  switch (variant) {
    case "danger":
      return "bg-red-600 hover:bg-red-700 text-white focus:ring-2 focus:ring-red-500 focus:outline-hidden";
    case "warning":
      return "bg-amber-600 hover:bg-amber-700 text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden";
    case "success":
      return "bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden";
    case "info":
    default:
      return "bg-accent text-accent-contrast hover:opacity-90 focus:ring-2 focus:ring-[var(--accent)] focus:outline-hidden";
  }
};

const DialogContent: React.FC<{ dialog: NonNullable<DialogState> }> = ({
  dialog: currentDialog,
}) => {
  const { type, options } = currentDialog;

  const initialVal =
    type === "prompt"
      ? (options.initialValue ?? options.defaultValue ?? "")
      : "";

  const [promptValue, setPromptValue] = useState(initialVal);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(
    (type === "alert" || type === "confirm") && options.checkbox
      ? Boolean(options.checkbox.defaultChecked)
      : false,
  );
  const inputRef = useRef<HTMLInputElement | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (type === "prompt") {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    } else if (type === "confirm") {
      setTimeout(() => {
        if (options.defaultFocus === "cancel" && cancelBtnRef.current) {
          cancelBtnRef.current.focus();
        } else {
          confirmBtnRef.current?.focus();
        }
      }, 50);
    } else {
      setTimeout(() => {
        confirmBtnRef.current?.focus();
      }, 50);
    }
  }, [type, options]);

  const handleCancel = () => {
    if (currentDialog.type === "alert") {
      currentDialog.resolve(isChecked);
    } else if (currentDialog.type === "confirm") {
      currentDialog.resolve({ confirmed: false, checked: isChecked });
    } else if (currentDialog.type === "prompt") {
      currentDialog.resolve(null);
    }
  };

  const handleConfirm = () => {
    if (currentDialog.type === "alert") {
      currentDialog.resolve(isChecked);
    } else if (currentDialog.type === "confirm") {
      currentDialog.resolve({ confirmed: true, checked: isChecked });
    } else if (currentDialog.type === "prompt") {
      if (currentDialog.options.validate) {
        const error = currentDialog.options.validate(promptValue);
        if (error) {
          setValidationError(error);
          return;
        }
      }
      currentDialog.resolve(promptValue);
    }
  };

  const handleReset = () => {
    setPromptValue(initialVal);
    setValidationError(null);
    inputRef.current?.focus();
  };

  // Keyboard navigation between buttons in alert/confirm dialogs
  const handleDialogKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      handleCancel();
      return;
    }

    if (type === "alert" || type === "confirm") {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const active = document.activeElement;
        if (type === "confirm") {
          if (active === confirmBtnRef.current) {
            cancelBtnRef.current?.focus();
          } else {
            confirmBtnRef.current?.focus();
          }
        }
      }
    }
  };

  const defaultTitle =
    type === "alert"
      ? "Notice"
      : type === "confirm"
        ? "Confirm Action"
        : "Input Required";

  const title = options.title || defaultTitle;
  const variant = options.variant || (type === "confirm" ? "warning" : "info");
  const confirmText =
    options.confirmText ||
    (type === "alert" ? "OK" : type === "confirm" ? "Confirm" : "Save");
  const cancelText =
    type !== "alert" && "cancelText" in options && options.cancelText
      ? options.cancelText
      : "Cancel";

  const checkboxConfig =
    (type === "alert" || type === "confirm") && options.checkbox
      ? options.checkbox
      : null;

  return (
    <div
      style={{ zIndex: Z_INDEX.GLOBAL_DIALOG }}
      className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
      onKeyDown={handleDialogKeyDown}
    >
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={handleCancel} />

      {/* Dialog Window */}
      <div
        className="relative z-10 w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-md shadow-2xl overflow-hidden flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-toolbar)]">
          <div className="flex items-center gap-2.5 min-w-0">
            {getVariantIcon(variant)}
            <h3 className="text-sm font-semibold text-[var(--text-highlight)] truncate">
              {title}
            </h3>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 rounded hover:bg-[var(--bg-tab-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-3.5 text-xs text-[var(--text-main)]">
          <p className="leading-relaxed whitespace-pre-wrap">
            {options.message}
          </p>

          {checkboxConfig && (
            <label className="flex items-center gap-2 cursor-pointer select-none mt-1 py-1 text-xs text-[var(--text-main)]">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--accent)] accent-[var(--accent)] cursor-pointer focus:ring-0"
              />
              <span>{checkboxConfig.label}</span>
            </label>
          )}

          {type === "prompt" && (
            <div className="flex flex-col gap-1.5 mt-1">
              <div className="relative flex items-center">
                <input
                  ref={inputRef}
                  type={
                    type === "prompt" && options.inputType
                      ? options.inputType
                      : "text"
                  }
                  value={promptValue}
                  placeholder={options.placeholder}
                  onChange={(e) => {
                    setPromptValue(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      // Support both Enter and Ctrl+Enter
                      e.preventDefault();
                      handleConfirm();
                    }
                  }}
                  className="w-full pl-3 pr-8 py-1.5 text-xs bg-[var(--bg-app)] border border-[var(--border-color)] rounded text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent)] transition-colors"
                />
                {promptValue !== initialVal && (
                  <button
                    type="button"
                    onClick={handleReset}
                    title="Reset to initial value"
                    className="absolute right-2 p-1 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between text-[11px]">
                {validationError ? (
                  <span className="text-red-400 font-medium">
                    {validationError}
                  </span>
                ) : (
                  <span className="text-[var(--text-muted)] opacity-75">
                    Press <kbd className="px-1 py-0.5 rounded bg-[var(--bg-app)] border border-[var(--border-color)] text-[10px]">Ctrl+Enter</kbd> or <kbd className="px-1 py-0.5 rounded bg-[var(--bg-app)] border border-[var(--border-color)] text-[10px]">Enter</kbd> to save
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--border-color)] bg-[var(--bg-toolbar)] flex items-center justify-between gap-2.5">
          {type === "prompt" && (
            <button
              type="button"
              onClick={handleReset}
              disabled={promptValue === initialVal}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded border border-[var(--border-color)] transition-colors ${
                promptValue === initialVal
                  ? "opacity-40 cursor-not-allowed text-[var(--text-muted)]"
                  : "text-[var(--text-main)] hover:bg-[var(--bg-tab-hover)] cursor-pointer"
              }`}
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          <div className="flex items-center justify-end gap-2.5 ml-auto">
            {type !== "alert" && (
              <button
                ref={cancelBtnRef}
                onClick={handleCancel}
                className="px-3 py-1.5 text-xs rounded border border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-tab-hover)] focus:ring-2 focus:ring-[var(--border-color)] focus:outline-hidden transition-colors cursor-pointer"
              >
                {cancelText}
              </button>
            )}
            <button
              ref={confirmBtnRef}
              onClick={handleConfirm}
              className={`px-4 py-1.5 text-xs font-semibold rounded transition-all shadow-xs cursor-pointer ${getConfirmButtonClasses(
                variant,
              )}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const GlobalDialogHost: React.FC = () => {
  const currentDialog = useDialogStore((s) => s.currentDialog);
  if (!currentDialog) return null;

  return (
    <DialogContent
      key={currentDialog.type + "_" + currentDialog.options.message}
      dialog={currentDialog}
    />
  );
};
