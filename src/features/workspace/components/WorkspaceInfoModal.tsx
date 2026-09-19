import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Folder,
  FolderOpen,
  FolderX,
  Cloud,
  CloudOff,
  Edit3,
  Check,
  Layers,
  Calendar,
  RefreshCw,
  HardDrive,
  Save,
  FolderDown,
  Link2Off,
} from "lucide-react";
import { useWorkspaceStore } from "../store/workspaceStore";
import { workspaceFolderService } from "../services/workspaceFolderService";
import { dialog } from "../../../shared/dialog/dialogStore";
import type { WorkspaceSession } from "../../../core/types/workspace.types";
import { formatDateTime } from "../../../core/utils/dateUtils";
import { Z_INDEX } from "../../../core/constants/zIndex";

export interface WorkspaceInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCloudSync: () => void;
}

export const WorkspaceInfoModal: React.FC<WorkspaceInfoModalProps> = ({
  isOpen,
  onClose,
  onOpenCloudSync,
}) => {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);

  const workspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  if (!isOpen || !workspace) return null;

  // Re-key on workspace.id so the inner component re-mounts (and resets state)
  // whenever the user switches workspaces while the modal is open.
  return createPortal(
    <WorkspaceInfoContent
      key={workspace.id}
      workspace={workspace}
      onClose={onClose}
      onOpenCloudSync={onOpenCloudSync}
    />,
    document.body,
  );
};

interface WorkspaceInfoContentProps {
  workspace: WorkspaceSession;
  onClose: () => void;
  onOpenCloudSync: () => void;
}

const WorkspaceInfoContent: React.FC<WorkspaceInfoContentProps> = ({
  workspace,
  onClose,
  onOpenCloudSync,
}) => {
  const updateWorkspaceInfo = useWorkspaceStore((s) => s.updateWorkspaceInfo);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(workspace.name);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editedDesc, setEditedDesc] = useState(workspace.description ?? "");
  const [isSavingFolder, setIsSavingFolder] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);

  const isLinked = Boolean(workspace.folderLinkedAt && workspace.folderName);
  const isFSASupported = "showDirectoryPicker" in window;

  const handleSaveName = async () => {
    const trimmed = editedName.trim();
    if (trimmed && trimmed !== workspace.name) {
      await updateWorkspaceInfo(workspace.id, { name: trimmed });
    }
    setIsEditingName(false);
  };

  const handleSaveDesc = async () => {
    if (editedDesc !== (workspace.description ?? "")) {
      await updateWorkspaceInfo(workspace.id, { description: editedDesc });
    }
    setIsEditingDesc(false);
  };

  const handleSaveToFolder = async () => {
    setIsSavingFolder(true);
    try {
      if (isLinked) {
        const result = await workspaceFolderService.saveWorkspace(workspace.id);
        if (result === "no-folder") {
          await workspaceFolderService.saveWorkspaceToFolder(workspace);
        } else if (result === "permission-denied") {
          await dialog.alert({
            title: "Permission Denied",
            message:
              "Scripta was denied write access to the linked folder. Please try again or re-link the folder.",
            variant: "warning",
          });
        } else if (result === "zip-fallback") {
          // ZIP was already downloaded by the service — nothing extra needed
        }
      } else {
        await workspaceFolderService.saveWorkspaceToFolder(workspace);
      }
    } finally {
      setIsSavingFolder(false);
    }
  };

  const handleLinkFolder = async () => {
    const success = await workspaceFolderService.linkFolderToWorkspace(
      workspace.id,
    );
    if (!success && !isFSASupported) {
      await dialog.alert({
        title: "Not Supported",
        message:
          "Linking a local folder requires a Chromium-based browser (Chrome, Edge). Please use Save Workspace as Folder to export a ZIP instead.",
        variant: "info",
      });
    }
  };

  const handleUnlinkFolder = async () => {
    const confirmed = await dialog.confirm({
      title: "Unlink Folder",
      message: `Unlink folder "${workspace.folderName}" from workspace "${workspace.name}"?\n\nFiles on disk will not be deleted. You can re-link at any time.`,
      confirmText: "Unlink",
      cancelText: "Cancel",
      variant: "warning",
    });
    if (!confirmed) return;
    setIsUnlinking(true);
    try {
      await workspaceFolderService.unlinkFolder(workspace.id);
    } finally {
      setIsUnlinking(false);
    }
  };

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
      <div className="relative w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-sm font-semibold text-[var(--text-highlight)]">
              Workspace Information
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--bg-tab-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)]">
              Name
            </label>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleSaveName();
                    if (e.key === "Escape") {
                      setEditedName(workspace.name);
                      setIsEditingName(false);
                    }
                  }}
                  className="flex-1 px-3 py-1.5 text-sm bg-[var(--bg-editor)] border border-[var(--accent)] rounded-lg text-[var(--text-main)] outline-none"
                />
                <button
                  onClick={() => void handleSaveName()}
                  className="p-1.5 rounded-lg bg-[var(--accent)] text-[var(--bg-app)] hover:opacity-90 transition-opacity"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setEditedName(workspace.name);
                    setIsEditingName(false);
                  }}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-tab-hover)] text-[var(--text-muted)] transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <span className="text-sm font-semibold text-[var(--text-highlight)] flex-1">
                  {workspace.name}
                </span>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1 rounded hover:bg-[var(--bg-tab-hover)] text-[var(--text-muted)] transition-all"
                  title="Edit name"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)]">
              Description
            </label>
            {isEditingDesc ? (
              <div className="space-y-2">
                <textarea
                  autoFocus
                  rows={3}
                  value={editedDesc}
                  onChange={(e) => setEditedDesc(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setEditedDesc(workspace.description ?? "");
                      setIsEditingDesc(false);
                    }
                  }}
                  placeholder="Add a description..."
                  className="w-full px-3 py-2 text-sm bg-[var(--bg-editor)] border border-[var(--accent)] rounded-lg text-[var(--text-main)] outline-none resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setEditedDesc(workspace.description ?? "");
                      setIsEditingDesc(false);
                    }}
                    className="px-3 py-1 text-xs rounded-lg hover:bg-[var(--bg-tab-hover)] text-[var(--text-muted)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => void handleSaveDesc()}
                    className="px-3 py-1 text-xs rounded-lg bg-[var(--accent)] text-[var(--bg-app)] hover:opacity-90 transition-opacity"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 group">
                <p className="text-sm text-[var(--text-main)] flex-1 min-h-[1.5rem]">
                  {workspace.description || (
                    <span className="text-[var(--text-muted)] italic">
                      No description
                    </span>
                  )}
                </p>
                <button
                  onClick={() => setIsEditingDesc(true)}
                  className="p-1 mt-0.5 rounded hover:bg-[var(--bg-tab-hover)] text-[var(--text-muted)] transition-all shrink-0"
                  title="Edit description"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Tabs list */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)]">
              Tabs ({workspace.tabs.length})
            </label>
            <div className="max-h-36 overflow-y-auto rounded-lg border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
              {workspace.tabs.length === 0 ? (
                <div className="px-3 py-2 text-xs text-[var(--text-muted)] italic">
                  No tabs in this workspace
                </div>
              ) : (
                workspace.tabs.map((tab) => (
                  <div
                    key={tab.id}
                    className="flex items-center justify-between px-3 py-1.5 text-xs hover:bg-[var(--bg-tab-hover)] transition-colors"
                  >
                    <span
                      className={`font-mono truncate max-w-[70%] ${
                        tab.isModified
                          ? "text-[var(--accent-yellow)]"
                          : "text-[var(--text-main)]"
                      }`}
                    >
                      {tab.name}
                      {tab.isModified && (
                        <span className="ml-1 text-[var(--accent-yellow)]">
                          •
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-[var(--bg-app)] text-[var(--text-muted)] font-mono">
                        {tab.language}
                      </span>
                      {tab.isPinned && (
                        <span className="text-[var(--accent-yellow)] text-[9px]">
                          📌
                        </span>
                      )}
                      {tab.isLocked && (
                        <span className="text-amber-400 text-[9px]">🔒</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Linked Folder */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)]">
              Linked Folder
            </label>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-app)]">
              {isLinked ? (
                <>
                  <FolderOpen className="w-4 h-4 text-[var(--accent-yellow)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-main)] truncate">
                      {workspace.folderName}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      Linked{" "}
                      {workspace.folderLinkedAt
                        ? formatDateTime(workspace.folderLinkedAt)
                        : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => void handleUnlinkFolder()}
                    disabled={isUnlinking}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] rounded-lg hover:bg-red-500/10 text-red-400 border border-red-500/20 transition-colors shrink-0"
                    title="Unlink folder"
                  >
                    {isUnlinking ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Link2Off className="w-3 h-3" />
                    )}
                    Unlink
                  </button>
                </>
              ) : (
                <>
                  <FolderX className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                  <span className="text-sm text-[var(--text-muted)] italic flex-1">
                    Not linked to a folder
                  </span>
                  {isFSASupported && (
                    <button
                      onClick={() => void handleLinkFolder()}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] rounded-lg hover:bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 transition-colors shrink-0"
                    >
                      <Folder className="w-3 h-3" />
                      Link...
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-0.5">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Created
              </label>
              <p className="text-xs text-[var(--text-main)]">
                {formatDateTime(workspace.createdAt)}
              </p>
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                Last Modified
              </label>
              <p className="text-xs text-[var(--text-main)]">
                {formatDateTime(workspace.updatedAt)}
              </p>
            </div>
            {workspace.lastSyncedAt && (
              <div className="col-span-2 space-y-0.5">
                <label className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] flex items-center gap-1">
                  <Cloud className="w-3 h-3 text-[var(--accent-blue)]" />
                  Last Cloud Sync
                </label>
                <p className="text-xs text-[var(--text-main)]">
                  {formatDateTime(workspace.lastSyncedAt)}
                  {workspace.lastSyncedProvider && (
                    <span className="ml-1.5 text-[10px] text-[var(--accent-blue)]">
                      via{" "}
                      {workspace.lastSyncedProvider === "dropbox"
                        ? "Dropbox"
                        : "GitHub"}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 px-5 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-app)]">
          <button
            onClick={() => void handleSaveToFolder()}
            disabled={isSavingFolder}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-[var(--accent)] text-[var(--bg-app)] hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
          >
            {isSavingFolder ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : isLinked ? (
              <Save className="w-3.5 h-3.5" />
            ) : isFSASupported ? (
              <FolderDown className="w-3.5 h-3.5" />
            ) : (
              <HardDrive className="w-3.5 h-3.5" />
            )}
            {isLinked
              ? "Save to Folder"
              : isFSASupported
                ? "Save as Folder..."
                : "Download as ZIP"}
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenCloudSync();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-tab-hover)] text-[var(--text-main)] transition-colors"
          >
            {workspace.lastSyncedAt ? (
              <Cloud className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
            ) : (
              <CloudOff className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            )}
            Cloud Sync...
          </button>

          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs rounded-lg hover:bg-[var(--bg-tab-hover)] text-[var(--text-muted)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
