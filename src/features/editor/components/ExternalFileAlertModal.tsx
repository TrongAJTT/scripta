import React from 'react';
import { AlertTriangle, FileX, RefreshCw, X, FileEdit } from 'lucide-react';
import { Z_INDEX } from '../../../core/constants/zIndex';

export interface ExternalAlertData {
  tabId: string;
  filename: string;
  type: 'DELETED' | 'MODIFIED_EXTERNALLY';
  newContent?: string;
  diskLastModified?: number;
}

interface ExternalFileAlertModalProps {
  alert: ExternalAlertData | null;
  onClose: () => void;
  onKeepContent: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onReloadDisk: (tabId: string, newContent: string, diskLastModified: number) => void;
  onKeepMyChanges: (tabId: string) => void;
}

export const ExternalFileAlertModal: React.FC<ExternalFileAlertModalProps> = ({
  alert,
  onClose,
  onKeepContent,
  onCloseTab,
  onReloadDisk,
  onKeepMyChanges,
}) => {
  if (!alert) return null;

  return (
    <div
      style={{ zIndex: Z_INDEX.MODAL_BASE }}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none"
    >
      <div className="w-full max-w-md bg-[var(--bg-surface-elevated)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {alert.type === 'DELETED' ? (
          <div>
            <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-[var(--accent-red)] mb-4">
              <FileX className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-[var(--text-highlight)] mb-1">
              File Deleted or Moved on Disk
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-6">
              The file <strong className="text-[var(--text-main)] font-mono">{alert.filename}</strong> no longer exists at its original disk location. Would you like to keep the current content in your editor or close this tab?
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => onCloseTab(alert.tabId)}
                className="px-4 py-2 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-tab-hover)] border border-[var(--border-color)] text-xs text-[var(--text-main)] transition-colors"
              >
                Close Tab
              </button>
              <button
                onClick={() => onKeepContent(alert.tabId)}
                className="px-4 py-2 rounded-lg bg-[var(--accent)] text-slate-950 font-bold hover:brightness-110 text-xs transition-all flex items-center gap-1.5 shadow-xs"
              >
                <FileEdit className="w-3.5 h-3.5" />
                Keep in Editor
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[var(--accent-yellow)] mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-[var(--text-highlight)] mb-1">
              File Modified by Another Program
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-6">
              The file <strong className="text-[var(--text-main)] font-mono">{alert.filename}</strong> has been modified outside of the editor. Do you want to reload the latest version from disk?
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => onKeepMyChanges(alert.tabId)}
                className="px-4 py-2 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-tab-hover)] border border-[var(--border-color)] text-xs text-[var(--text-main)] transition-colors"
              >
                Keep My Changes
              </button>
              <button
                onClick={() => {
                  if (alert.newContent !== undefined && alert.diskLastModified !== undefined) {
                    onReloadDisk(alert.tabId, alert.newContent, alert.diskLastModified);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-[var(--accent-blue)] text-slate-950 font-bold hover:brightness-110 text-xs transition-all flex items-center gap-1.5 shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload from Disk
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
