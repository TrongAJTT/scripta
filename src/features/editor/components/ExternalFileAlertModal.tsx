import React from "react";
import { AlertTriangle, FileX, RefreshCw, FileEdit } from "lucide-react";
import { ModalWrapper } from "../../../shared/components/ModalWrapper";

export interface ExternalAlertData {
  tabId: string;
  filename: string;
  type: "DELETED" | "MODIFIED_EXTERNALLY";
  newContent?: string;
  diskLastModified?: number;
}

interface ExternalFileAlertModalProps {
  alert: ExternalAlertData | null;
  onClose: () => void;
  onKeepContent: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onReloadDisk: (
    tabId: string,
    newContent: string,
    diskLastModified: number,
  ) => void;
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

  const isDeleted = alert.type === "DELETED";

  return (
    <ModalWrapper
      isOpen={Boolean(alert)}
      onClose={onClose}
      maxWidthClass="max-w-md"
      containerHeightClass="h-auto"
      icon={
        isDeleted ? (
          <FileX
            className="w-4 h-4"
            style={{ color: "var(--status-danger-text)" }}
          />
        ) : (
          <AlertTriangle
            className="w-4 h-4"
            style={{ color: "var(--status-warning-text)" }}
          />
        )
      }
      title={
        isDeleted
          ? "File Deleted or Moved on Disk"
          : "File Modified by Another Program"
      }
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          {isDeleted ? (
            <>
              <button
                type="button"
                onClick={() => onCloseTab(alert.tabId)}
                className="px-3.5 py-1.5 rounded bg-[var(--bg-surface)] hover:bg-[var(--bg-tab-hover)] border border-[var(--border-color)] text-xs text-[var(--text-main)] transition-colors cursor-pointer"
              >
                Close Tab
              </button>
              <button
                type="button"
                onClick={() => onKeepContent(alert.tabId)}
                className="px-4 py-1.5 rounded bg-[var(--accent)] text-[var(--text-on-accent)] font-semibold hover:brightness-110 text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FileEdit className="w-3.5 h-3.5" />
                Keep in Editor
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onKeepMyChanges(alert.tabId)}
                className="px-3.5 py-1.5 rounded bg-[var(--bg-surface)] hover:bg-[var(--bg-tab-hover)] border border-[var(--border-color)] text-xs text-[var(--text-main)] transition-colors cursor-pointer"
              >
                Keep My Changes
              </button>
              <button
                type="button"
                onClick={() => {
                  if (
                    alert.newContent !== undefined &&
                    alert.diskLastModified !== undefined
                  ) {
                    onReloadDisk(
                      alert.tabId,
                      alert.newContent,
                      alert.diskLastModified,
                    );
                  }
                }}
                className="px-4 py-1.5 rounded bg-[var(--accent-blue)] text-[var(--text-on-accent)] font-semibold hover:brightness-110 text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload from Disk
              </button>
            </>
          )}
        </div>
      }
    >
      <div className="p-5 text-xs text-[var(--text-muted)] leading-relaxed">
        {isDeleted ? (
          <>
            The file{" "}
            <strong className="text-[var(--text-main)] font-mono">
              {alert.filename}
            </strong>{" "}
            no longer exists at its original disk location. Would you like to
            keep the current content in your editor or close this tab?
          </>
        ) : (
          <>
            The file{" "}
            <strong className="text-[var(--text-main)] font-mono">
              {alert.filename}
            </strong>{" "}
            has been modified outside of the editor. Do you want to reload the
            latest version from disk?
          </>
        )}
      </div>
    </ModalWrapper>
  );
};
