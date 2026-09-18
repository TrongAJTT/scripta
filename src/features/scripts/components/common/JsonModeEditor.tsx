import React from "react";
import { Copy, Check, Sparkles, WrapText } from "lucide-react";

export interface JsonModeEditorProps {
  title?: string;
  subtitle?: string;
  readOnly?: boolean;
  onCopy: () => void;
  isCopied: boolean;
  onApply?: () => void;
  isApplying?: boolean;
  isApplied?: boolean;
  error?: string | null;
  editorRef: React.RefObject<HTMLDivElement | null>;
  isWordWrap?: boolean;
  onToggleWordWrap?: () => void;
}

export const JsonModeEditor: React.FC<JsonModeEditorProps> = ({
  title = "Raw Definition (JSON)",
  subtitle = "Edit raw JSON and click 'Apply' to sync back with form.",
  readOnly = false,
  onCopy,
  isCopied,
  onApply,
  isApplying = false,
  isApplied = false,
  error,
  editorRef,
  isWordWrap = false,
  onToggleWordWrap,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        flex: 1,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "4px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text-highlight)",
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            {readOnly ? "View-only raw JSON schema." : subtitle}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            type="button"
            onClick={onCopy}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "4px 8px",
              fontSize: "11px",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: "4px",
              color: isCopied ? "var(--accent)" : "var(--text-main)",
              cursor: "pointer",
            }}
            title="Copy JSON to clipboard"
          >
            {isCopied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{isCopied ? "Copied!" : "Copy"}</span>
          </button>

          {!readOnly && onApply && (
            <button
              type="button"
              onClick={onApply}
              disabled={isApplying}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "4px 10px",
                fontSize: "11px",
                fontWeight: 600,
                backgroundColor: "var(--accent)",
                border: "none",
                borderRadius: "4px",
                color: "var(--text-on-accent)",
                cursor: isApplying ? "not-allowed" : "pointer",
                opacity: isApplying ? 0.7 : 1,
              }}
              title="Parse JSON, update form and run test if sample input is present"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isApplying ? "Applying..." : "Apply"}</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "6px 10px",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "4px",
            color: "#ef4444",
            fontSize: "11px",
          }}
        >
          <strong>JSON Error:</strong> {error}
        </div>
      )}

      {isApplied && (
        <div
          style={{
            padding: "6px 10px",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: "4px",
            color: "var(--accent)",
            fontSize: "11px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Check className="w-3.5 h-3.5" />
          <span>
            Applied JSON successfully! Synced with editor tabs and verified.
          </span>
        </div>
      )}

      <div
        style={{
          position: "relative",
          flex: 1,
          border: "1px solid var(--border-color)",
          borderRadius: "4px",
          overflow: "hidden",
          backgroundColor: "var(--bg-editor)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {onToggleWordWrap && (
          <button
            type="button"
            onClick={onToggleWordWrap}
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              zIndex: 10,
              padding: "4px 7px",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "11px",
              fontWeight: 500,
              backgroundColor: isWordWrap
                ? "var(--accent)"
                : "var(--bg-surface)",
              color: isWordWrap
                ? "var(--text-on-accent)"
                : "var(--text-muted)",
              border: isWordWrap
                ? "1px solid var(--accent)"
                : "1px solid var(--border-color)",
              borderRadius: "4px",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.25)",
              opacity: 0.9,
              transition: "all 0.15s ease",
            }}
            title={isWordWrap ? "Disable Word Wrap" : "Enable Word Wrap"}
          >
            <WrapText className="w-3.5 h-3.5" />
            <span style={{ fontSize: "10px" }}>Wrap</span>
          </button>
        )}

        <div
          ref={editorRef}
          style={{
            flex: 1,
            width: "100%",
            height: "100%",
            overflow: "hidden",
          }}
        />
      </div>
    </div>
  );
};
