import React, { useState } from 'react';
import type { ScriptMetadata } from '../types/script.types';
import { useEditorStore } from '../../tabs/store';
import { useScriptRunner } from '../hooks/useScriptRunner';
import { Z_INDEX } from '../../../core/constants/zIndex';

interface ScriptRunModalProps {
  script: ScriptMetadata;
  isOpen: boolean;
  onClose: () => void;
}

export const ScriptRunModal: React.FC<ScriptRunModalProps> = ({ script, isOpen, onClose }) => {
  const tabs = useEditorStore((state) => state.tabs);
  const activeTabId = useEditorStore((state) => state.activeTabId);

  // Initialize input state based on script definition
  const [formValues, setFormValues] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    for (const inp of script.inputs) {
      if (inp.type === 'tab') {
        initial[inp.name] = activeTabId || (tabs.length > 0 ? tabs[0].id : '');
      } else if (inp.type === 'boolean') {
        initial[inp.name] = inp.defaultValue ?? false;
      } else if (inp.type === 'int') {
        initial[inp.name] = inp.defaultValue ?? 0;
      } else {
        initial[inp.name] = inp.defaultValue ?? (inp.options ? inp.options[0] : '');
      }
    }
    return initial;
  });

  const { runScript, isRunning, lastResult } = useScriptRunner();

  if (!isOpen) return null;

  const handleInputChange = (name: string, value: unknown) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    await runScript(script, formValues);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: Z_INDEX.MODAL_SECONDARY,
        backdropFilter: 'blur(2px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isRunning) onClose();
      }}
    >
      <div
        style={{
          width: '580px',
          maxWidth: '90vw',
          maxHeight: '85vh',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: 'var(--text-main)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-app)',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
              Run Script: {script.name}
            </h3>
            {script.description && (
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                {script.description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isRunning}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '2px 6px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <form
          onSubmit={handleExecute}
          style={{
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            flex: 1,
          }}
        >
          {/* Dynamic Inputs Form */}
          {script.inputs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent)' }}>
                Input Parameters
              </span>

              {script.inputs.map((inp) => (
                <div key={inp.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-main)' }}>
                    {inp.label || inp.name}
                    {inp.required && <span style={{ color: '#f87171' }}> *</span>}
                  </label>

                  {inp.type === 'tab' && (
                    <select
                      value={String(formValues[inp.name] || '')}
                      onChange={(e) => handleInputChange(inp.name, e.target.value)}
                      style={{
                        padding: '6px 8px',
                        backgroundColor: 'var(--bg-editor)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-main)',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                    >
                      {tabs.map((tab) => (
                        <option key={tab.id} value={tab.id}>
                          {tab.name} {tab.id === activeTabId ? '(active)' : ''}
                        </option>
                      ))}
                    </select>
                  )}

                  {inp.type === 'dropdown' && (
                    <select
                      value={String(formValues[inp.name] || '')}
                      onChange={(e) => handleInputChange(inp.name, e.target.value)}
                      style={{
                        padding: '6px 8px',
                        backgroundColor: 'var(--bg-editor)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-main)',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                    >
                      {(inp.options || []).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}

                  {inp.type === 'string' && (
                    <input
                      type="text"
                      required={inp.required}
                      value={String(formValues[inp.name] || '')}
                      onChange={(e) => handleInputChange(inp.name, e.target.value)}
                      style={{
                        padding: '6px 8px',
                        backgroundColor: 'var(--bg-editor)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-main)',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                    />
                  )}

                  {inp.type === 'int' && (
                    <input
                      type="number"
                      required={inp.required}
                      value={Number(formValues[inp.name] || 0)}
                      onChange={(e) => handleInputChange(inp.name, parseInt(e.target.value, 10))}
                      style={{
                        padding: '6px 8px',
                        backgroundColor: 'var(--bg-editor)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-main)',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                    />
                  )}

                  {inp.type === 'text' && (
                    <textarea
                      rows={3}
                      value={String(formValues[inp.name] || '')}
                      onChange={(e) => handleInputChange(inp.name, e.target.value)}
                      style={{
                        padding: '6px 8px',
                        backgroundColor: 'var(--bg-editor)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-main)',
                        borderRadius: '4px',
                        fontSize: '12px',
                        resize: 'vertical',
                      }}
                    />
                  )}

                  {inp.type === 'boolean' && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(formValues[inp.name])}
                        onChange={(e) => handleInputChange(inp.name, e.target.checked)}
                      />
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Enable / True</span>
                    </label>
                  )}

                  {inp.type === 'datetime' && (
                    <input
                      type="datetime-local"
                      value={String(formValues[inp.name] || '')}
                      onChange={(e) => handleInputChange(inp.name, e.target.value)}
                      style={{
                        padding: '6px 8px',
                        backgroundColor: 'var(--bg-editor)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-main)',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                    />
                  )}

                  {inp.description && (
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {inp.description}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              This script doesn't require explicit inputs and will interact directly with the active editor tab.
            </div>
          )}

          {/* Execution Results & Console Logs */}
          {lastResult && (
            <div
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-editor)',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: lastResult.success ? 'var(--accent)' : '#f87171',
                  }}
                >
                  {lastResult.success ? '✓ Completed Successfully' : '✗ Execution Failed'}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {lastResult.durationMs}ms
                </span>
              </div>

              {lastResult.error && (
                <div style={{ color: '#f87171', fontSize: '11px', fontFamily: 'monospace' }}>
                  {lastResult.error}
                </div>
              )}

              {lastResult.logs.length > 0 && (
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    maxHeight: '120px',
                    overflowY: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    lineHeight: '1.4',
                    color: 'var(--text-muted)',
                  }}
                >
                  {lastResult.logs.map((l, idx) => (
                    <div key={idx}>{l}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'auto', paddingTop: '8px' }}>
            <button
              type="button"
              disabled={isRunning}
              onClick={onClose}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                cursor: 'pointer',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                borderRadius: '4px',
              }}
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isRunning}
              style={{
                padding: '6px 18px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: isRunning ? 'not-allowed' : 'pointer',
                backgroundColor: 'var(--accent)',
                border: 'none',
                color: 'var(--text-on-accent)',
                borderRadius: '4px',
                opacity: isRunning ? 0.7 : 1,
              }}
            >
              {isRunning ? 'Running...' : 'Execute Script'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
