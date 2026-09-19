import React from "react";
import {
  X,
  FileText,
  Code2,
  Globe,
  AlignLeft,
  MapPin,
  Clock,
  HardDrive,
  Bookmark,
  Pin,
  Lock,
  Edit3,
  Image as ImageIcon,
} from "lucide-react";
import type { FileTab } from "../../../core/types/file.types";
import { formatDateTime } from "../../../core/utils/dateUtils";
import { Z_INDEX } from "../../../core/constants/zIndex";

export interface TabInfoModalProps {
  isOpen: boolean;
  tab: FileTab | null;
  onClose: () => void;
}

/** Formats bytes to human-readable size */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-[var(--border-subtle)] last:border-0">
    <span className="text-[var(--text-muted)] mt-0.5 shrink-0">{icon}</span>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-0.5">
        {label}
      </p>
      <div className="text-sm text-[var(--text-main)] break-all">{value}</div>
    </div>
  </div>
);

export const TabInfoModal: React.FC<TabInfoModalProps> = ({
  isOpen,
  tab,
  onClose,
}) => {
  if (!isOpen || !tab) return null;

  const isImage = Boolean(tab.imageDataUrl);
  const contentSizeBytes = isImage
    ? (tab.imageDataUrl?.length ?? 0) * 0.75 // approximate base64 → bytes
    : new TextEncoder().encode(tab.content).byteLength;

  const lineCount = isImage ? 0 : tab.content.split("\n").length;
  const charCount = isImage ? 0 : tab.content.length;

  const statusBadges: string[] = [];
  if (tab.isPinned) statusBadges.push("Pinned");
  if (tab.isLocked) statusBadges.push("Locked (Read-Only)");
  if (tab.isModified) statusBadges.push("Modified");

  return (
    <div
      style={{ zIndex: Z_INDEX.MODAL_BASE }}
      className="fixed inset-0 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 min-w-0">
            {isImage ? (
              <ImageIcon className="w-4 h-4 text-[var(--accent-purple)] shrink-0" />
            ) : (
              <FileText className="w-4 h-4 text-[var(--accent)] shrink-0" />
            )}
            <h2 className="text-sm font-semibold text-[var(--text-highlight)] truncate">
              {tab.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 ml-2 shrink-0 rounded hover:bg-[var(--bg-tab-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Rows */}
        <div className="px-5 max-h-[65vh] overflow-y-auto">
          {/* File Path */}
          <InfoRow
            icon={<HardDrive className="w-3.5 h-3.5" />}
            label="File Path"
            value={
              tab.fileHandle ? (
                <span className="font-mono text-xs text-[var(--accent)]">
                  {tab.fileHandle.name}
                  <span className="ml-2 text-[10px] text-[var(--accent)]/60 font-sans">(linked)</span>
                </span>
              ) : (
                <span className="italic text-[var(--text-muted)] text-xs">
                  Unsaved — in memory only
                </span>
              )
            }
          />

          {/* Language */}
          {!isImage && (
            <InfoRow
              icon={<Code2 className="w-3.5 h-3.5" />}
              label="Language"
              value={
                <span className="px-2 py-0.5 rounded bg-[var(--bg-app)] font-mono text-xs">
                  {tab.language}
                </span>
              }
            />
          )}

          {/* Encoding */}
          {!isImage && (
            <InfoRow
              icon={<Globe className="w-3.5 h-3.5" />}
              label="Encoding"
              value={<span className="font-mono text-xs">{tab.encoding}</span>}
            />
          )}

          {/* Line Ending */}
          {!isImage && (
            <InfoRow
              icon={<AlignLeft className="w-3.5 h-3.5" />}
              label="Line Ending"
              value={
                <span className="font-mono text-xs">
                  {tab.lineEnding}{" "}
                  <span className="text-[var(--text-muted)] font-sans">
                    ({tab.lineEnding === "CRLF" ? "Windows" : "Unix"})
                  </span>
                </span>
              }
            />
          )}

          {/* Size */}
          <InfoRow
            icon={<HardDrive className="w-3.5 h-3.5" />}
            label="Size"
            value={
              <span className="font-mono text-xs">
                {formatBytes(contentSizeBytes)}
                {!isImage && (
                  <span className="ml-2 text-[var(--text-muted)] font-sans text-xs">
                    {lineCount.toLocaleString()} lines · {charCount.toLocaleString()} chars
                  </span>
                )}
              </span>
            }
          />

          {/* Cursor Position */}
          {!isImage && tab.cursorPos && (
            <InfoRow
              icon={<MapPin className="w-3.5 h-3.5" />}
              label="Cursor Position"
              value={
                <span className="font-mono text-xs">
                  Ln {tab.cursorPos.line}, Col {tab.cursorPos.col}
                  {tab.cursorPos.selectedChars > 0 && (
                    <span className="ml-2 text-[var(--accent)] text-xs">
                      ({tab.cursorPos.selectedChars} selected)
                    </span>
                  )}
                </span>
              }
            />
          )}

          {/* Bookmarks */}
          {!isImage && (
            <InfoRow
              icon={<Bookmark className="w-3.5 h-3.5" />}
              label="Bookmarks"
              value={
                tab.bookmarks && tab.bookmarks.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {tab.bookmarks.map((line) => (
                      <span
                        key={line}
                        className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[var(--accent)]/15 text-[var(--accent)]"
                      >
                        Ln {line}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[var(--text-muted)] italic text-xs">None</span>
                )
              }
            />
          )}

          {/* Last Saved */}
          <InfoRow
            icon={<Clock className="w-3.5 h-3.5" />}
            label="Last Saved"
            value={
              tab.lastSavedAt ? (
                <span className="text-xs">{formatDateTime(tab.lastSavedAt)}</span>
              ) : (
                <span className="text-[var(--text-muted)] italic text-xs">Never saved</span>
              )
            }
          />

          {/* Status */}
          <InfoRow
            icon={<Edit3 className="w-3.5 h-3.5" />}
            label="Status"
            value={
              statusBadges.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {tab.isPinned && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-[var(--accent-yellow)]/15 text-[var(--accent-yellow)]">
                      <Pin className="w-2.5 h-2.5" />
                      Pinned
                    </span>
                  )}
                  {tab.isLocked && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-400/15 text-amber-400">
                      <Lock className="w-2.5 h-2.5" />
                      Locked
                    </span>
                  )}
                  {tab.isModified && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-[var(--accent-yellow)]/15 text-[var(--accent-yellow)]">
                      <Edit3 className="w-2.5 h-2.5" />
                      Modified
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-[var(--text-muted)]">No special status</span>
              )
            }
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end px-5 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-app)]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs rounded-lg hover:bg-[var(--bg-tab-hover)] text-[var(--text-muted)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
