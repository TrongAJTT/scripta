import React from "react";
import { Sparkles } from "lucide-react";

export interface SampleDataRunnerProps {
  sampleInput: string;
  onChangeSampleInput: (val: string) => void;
  sampleOutput: string;
  onGenerate: () => void;
  onRun: () => void;
  isRunning: boolean;
  isVerified: boolean;
  error?: string | null;
  readOnly?: boolean;
  inputPlaceholder?: string;
  outputPlaceholder?: string;
  inputLabel?: string;
  outputLabel?: string;
}

export const SampleDataRunner: React.FC<SampleDataRunnerProps> = ({
  sampleInput,
  onChangeSampleInput,
  sampleOutput,
  onGenerate,
  onRun,
  isRunning,
  isVerified,
  error,
  readOnly = false,
  inputPlaceholder = "Define inputs or arguments snippet...",
  outputPlaceholder = "Click 'Run' above to execute with sample data and capture actual output...",
  inputLabel = "Sample Input (Arguments or Execution Snippet):",
  outputLabel = "Sample Output (Computed from last successful test run):",
}) => {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        minHeight: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
            Verified Sample Data
          </div>
          <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
            Provide sample arguments/inputs, click &quot;Run&quot; to compute
            real output before saving.
          </div>
        </div>

        <button
          type="button"
          onClick={onRun}
          disabled={isRunning}
          style={{
            padding: "4px 12px",
            fontSize: "11px",
            fontWeight: 600,
            backgroundColor: "var(--accent)",
            border: "none",
            color: "var(--text-on-accent)",
            borderRadius: "4px",
            cursor: isRunning ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            opacity: isRunning ? 0.7 : 1,
          }}
        >
          <span>▶</span>
          <span>{isRunning ? "Running..." : "Run"}</span>
        </button>
      </div>

      {/* Sample Input Section - 50% remaining height */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "80px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "4px",
          }}
        >
          <label
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
            }}
          >
            {inputLabel}
          </label>
          {!readOnly && (
            <button
              type="button"
              onClick={onGenerate}
              style={{
                padding: "2px 8px",
                fontSize: "11px",
                fontWeight: 500,
                cursor: "pointer",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                color: "var(--accent-blue)",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
              title="Generate code snippet defining variables and calling function/script"
            >
              <Sparkles className="w-3 h-3 text-[var(--accent-blue)]" />
              <span>Generate</span>
            </button>
          )}
        </div>
        <textarea
          readOnly={readOnly}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          value={sampleInput}
          onChange={(e) => onChangeSampleInput(e.target.value)}
          style={{
            flex: 1,
            width: "100%",
            padding: "8px 10px",
            fontFamily: "var(--font-mono, monospace)",
            backgroundColor: "var(--bg-editor)",
            border: "1px solid var(--border-color)",
            color: "var(--text-main)",
            borderRadius: "4px",
            fontSize: "12px",
            resize: "none",
          }}
          placeholder={inputPlaceholder}
        />
      </div>

      {error && (
        <div
          style={{
            padding: "6px 10px",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "var(--accent-red)",
            borderRadius: "4px",
            fontSize: "11px",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Sample Output Section - 50% remaining height */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "80px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "4px",
          }}
        >
          <label
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
            }}
          >
            {outputLabel}
          </label>
          {isVerified && sampleOutput && (
            <span
              style={{
                fontSize: "10px",
                color: "var(--accent)",
                fontWeight: 600,
              }}
            >
              ✓ Verified Output
            </span>
          )}
        </div>
        <textarea
          readOnly
          spellCheck={false}
          value={sampleOutput}
          style={{
            flex: 1,
            width: "100%",
            padding: "8px 10px",
            fontFamily: "var(--font-mono, monospace)",
            backgroundColor: "var(--bg-editor)",
            border: "1px solid var(--border-color)",
            color: isVerified ? "var(--text-main)" : "var(--text-muted)",
            borderRadius: "4px",
            fontSize: "12px",
            resize: "none",
            opacity: 0.9,
          }}
          placeholder={outputPlaceholder}
        />
      </div>
    </div>
  );
};
