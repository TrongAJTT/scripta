import React from 'react';
import type { ScriptFunction } from '../types/script.types';

interface FunctionCardProps {
  func: ScriptFunction;
  onEdit: (func: ScriptFunction) => void;
  onDelete: (id: string) => void;
}

export const FunctionCard: React.FC<FunctionCardProps> = ({ func, onEdit, onDelete }) => {
  return (
    <div
      style={{
        padding: '12px 14px',
        backgroundColor: 'var(--bg-editor)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 600, color: 'var(--accent)', fontSize: '13px' }}>
            {func.name}
          </span>
          {func.isBuiltin && (
            <span
              style={{
                fontSize: '10px',
                padding: '1px 6px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                color: 'var(--text-muted)',
              }}
            >
              Builtin
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => onEdit(func)}
            style={{
              padding: '2px 8px',
              fontSize: '11px',
              cursor: 'pointer',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              borderRadius: '4px',
            }}
          >
            {func.isBuiltin ? 'View' : 'Edit'}
          </button>
          {!func.isBuiltin && (
            <button
              type="button"
              onClick={() => onDelete(func.id)}
              style={{
                padding: '2px 8px',
                fontSize: '11px',
                cursor: 'pointer',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-color)',
                color: '#f87171',
                borderRadius: '4px',
              }}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
        {func.description || 'No description provided.'}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-highlight)', fontFamily: 'monospace' }}>
        <span>params: ({func.params.join(', ')})</span>
        {func.sampleOutput && (
          <span
            style={{
              fontSize: '10px',
              padding: '1px 6px',
              borderRadius: '4px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--accent)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontFamily: 'sans-serif',
            }}
            title={`Sample Output: ${func.sampleOutput}`}
          >
            ✓ Verified Sample
          </span>
        )}
      </div>
    </div>
  );
};
