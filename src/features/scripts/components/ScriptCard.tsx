import React from "react";
import type { ScriptMetadata } from "../types/script.types";

interface ScriptCardProps {
  script: ScriptMetadata;
  onRun: (script: ScriptMetadata) => void;
  onEdit: (script: ScriptMetadata) => void;
  onDelete: (id: string) => void;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
}

export const ScriptCard: React.FC<ScriptCardProps> = ({
  script,
  onRun,
  onEdit,
  onDelete,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}) => {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        padding: "10px 14px",
        backgroundColor: "var(--bg-editor)",
        border: "1px solid",
        borderColor: isDragging ? "var(--accent)" : "var(--border-color)",
        borderRadius: "6px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        opacity: isDragging ? 0.45 : 1,
        transition: "border-color 0.15s, opacity 0.15s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Drag Handle */}
          <span
            style={{
              cursor: "grab",
              color: "var(--text-muted)",
              fontSize: "13px",
              userSelect: "none",
              padding: "2px 4px",
              display: "inline-flex",
              alignItems: "center",
              borderRadius: "3px",
            }}
            title="Drag to reorder"
          >
            ⋮⋮
          </span>

          <span
            style={{
              fontWeight: 600,
              color: "var(--text-main)",
              fontSize: "13px",
            }}
          >
            {script.name}
          </span>
          {script.version && (
            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
              v{script.version}
            </span>
          )}
          {script.target === "selection" && (
            <span
              style={{
                fontSize: "10px",
                padding: "1px 6px",
                borderRadius: "4px",
                backgroundColor: "rgba(59, 130, 246, 0.15)",
                color: "var(--accent-blue)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
              }}
            >
              Selection Target
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            type="button"
            onClick={() => onRun(script)}
            style={{
              padding: "3px 10px",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              backgroundColor: "var(--accent)",
              border: "none",
              color: "var(--text-on-accent)",
              borderRadius: "4px",
            }}
          >
            Run
          </button>
          <button
            type="button"
            onClick={() => onEdit(script)}
            style={{
              padding: "2px 8px",
              fontSize: "11px",
              cursor: "pointer",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              color: "var(--text-main)",
              borderRadius: "4px",
            }}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(script.id)}
            style={{
              padding: "2px 8px",
              fontSize: "11px",
              cursor: "pointer",
              backgroundColor: "transparent",
              border: "1px solid var(--border-color)",
              color: "#f87171",
              borderRadius: "4px",
            }}
          >
            Delete
          </button>
        </div>
      </div>

      <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
        {script.description || "No description provided."}
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
          alignItems: "center",
        }}
      >
        {script.inputs.length > 0 && (
          <span
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              backgroundColor: "var(--bg-surface)",
              padding: "1px 6px",
              borderRadius: "4px",
              border: "1px solid var(--border-subtle)",
            }}
          >
            {script.inputs.length} input{script.inputs.length > 1 ? "s" : ""}
          </span>
        )}
        {(() => {
          const fnCount =
            script.functions?.length ?? script.usedFunctionIds?.length ?? 0;
          if (fnCount === 0) return null;
          return (
            <span
              style={{
                fontSize: "11px",
                color: "var(--accent)",
                backgroundColor: "var(--bg-surface)",
                padding: "1px 6px",
                borderRadius: "4px",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {fnCount} helper function{fnCount > 1 ? "s" : ""}
            </span>
          );
        })()}
      </div>
    </div>
  );
};
