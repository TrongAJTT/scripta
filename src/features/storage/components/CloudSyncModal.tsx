import React, {
  useState,
  useEffect,
  useMemo,
  useTransition,
  useActionState,
} from "react";
import {
  Cloud,
  Lock,
  Unlock,
  Upload,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  X,
  Info,
  ChevronDown,
  CloudOff,
  UploadCloud,
} from "lucide-react";
import { useCloudStorageStore } from "../store/cloudStorageStore";
import { dropboxAdapter } from "../adapters/dropboxAdapter";
import { githubAdapter } from "../adapters/githubAdapter";
import {
  workspaceSyncService,
  type SyncedWorkspaceFileInfo,
} from "../services/workspaceSyncService";
import { useWorkspaceStore } from "../../workspace/store/workspaceStore";
import {
  type StorageProviderId,
  type CloudStorageAdapter,
  CLOUD_PROVIDER_NAMES,
} from "../types/storage.types";
import { MODAL_LAYOUT } from "../../../shared/constants/modal";
import { Z_INDEX } from "../../../core/constants/zIndex";
import { dialog } from "../../../shared/dialog/dialogStore";
import { DropdownMenu } from "../../../shared/components/DropdownMenu";
import { InlineBanner } from "../../../shared/components/InlineBanner";
import { GitHubConfigForm } from "./providers/GitHubConfigForm";
import { DropboxConfigView } from "./providers/DropboxConfigView";
import { formatDateTime } from "../../../core/utils/dateUtils";

const CLOUD_ADAPTERS: Record<StorageProviderId, CloudStorageAdapter> = {
  dropbox: dropboxAdapter,
  github: githubAdapter,
};

const getCloudAdapter = (id: StorageProviderId): CloudStorageAdapter =>
  CLOUD_ADAPTERS[id];

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedProvider, setSelectedProvider] =
    useState<StorageProviderId>("dropbox");
  const [activeTab, setActiveTab] = useState<"sync" | "restore" | "settings">(
    "sync",
  );

  // Store bindings
  const isDropboxConnected = useCloudStorageStore((s) => s.isDropboxConnected);
  const isGitHubConnected = useCloudStorageStore((s) => s.isGitHubConnected);
  const githubAuth = useCloudStorageStore((s) => s.githubAuth);
  const disconnectProvider = useCloudStorageStore((s) => s.disconnectProvider);
  const initCloudStatus = useCloudStorageStore((s) => s.initCloudStatus);

  // Workspaces
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const markWorkspaceSynced = useWorkspaceStore((s) => s.markWorkspaceSynced);
  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  // Upload/Sync State
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [masterPassword, setMasterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUploading, startUploadTransition] = useTransition();
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [syncErrorMsg, setSyncErrorMsg] = useState<string | null>(null);

  // Remote List & Restore State
  const [remoteFiles, setRemoteFiles] = useState<SyncedWorkspaceFileInfo[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [restoringFile, setRestoringFile] = useState<string | null>(null);

  // Centralized current adapter
  const currentAdapter = getCloudAdapter(selectedProvider);
  const currentProviderName = CLOUD_PROVIDER_NAMES[selectedProvider];

  const isCurrentProviderConnected =
    selectedProvider === "dropbox" ? isDropboxConnected : isGitHubConnected;

  // React 19 useActionState for GitHub Form configuration
  const [, submitGitHubAction, isSavingGitHub] = useActionState(
    async (_prevState: unknown, formData: FormData) => {
      const token = (formData.get("token") as string)?.trim();
      const owner = (formData.get("owner") as string)?.trim();
      const repo = (formData.get("repo") as string)?.trim();
      const branch = (formData.get("branch") as string)?.trim() || "main";

      setSyncErrorMsg(null);
      setSyncSuccessMsg(null);

      if (!token || !owner || !repo) {
        setSyncErrorMsg(
          "Please fill in GitHub Token, Owner/Username, and Repo.",
        );
        return null;
      }

      try {
        await githubAdapter.configure(token, owner, repo, branch);
        await initCloudStatus();
        setSyncSuccessMsg("GitHub connected and verified successfully!");
        setActiveTab("sync");
        return { success: true };
      } catch (err: unknown) {
        setSyncErrorMsg(
          err instanceof Error ? err.message : "GitHub configuration failed.",
        );
        return { error: true };
      }
    },
    null,
  );

  const loadRemoteList = async () => {
    if (!isCurrentProviderConnected) {
      setRemoteFiles([]);
      return;
    }
    setIsLoadingList(true);
    setSyncErrorMsg(null);
    try {
      const list =
        await workspaceSyncService.listRemoteWorkspaces(currentAdapter);
      setRemoteFiles(list);
    } catch (err: unknown) {
      setSyncErrorMsg(
        err instanceof Error
          ? err.message
          : "Failed to list remote workspaces.",
      );
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      initCloudStatus();
      setSyncSuccessMsg(null);
      setSyncErrorMsg(null);
    }
  }, [isOpen, initCloudStatus]);

  // Load remote list when modal is opened or provider changes, so badge status is always up to date
  useEffect(() => {
    if (isOpen && isCurrentProviderConnected) {
      loadRemoteList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedProvider, isCurrentProviderConnected]);

  // Lightweight O(1) computation for the 4 Badge states
  const workspaceSyncState = useMemo<{
    state: "not-connected" | "new" | "modified" | "synced";
    label: string;
    description: string;
  }>(() => {
    if (!isCurrentProviderConnected) {
      return {
        state: "not-connected",
        label: "Not Connected",
        description: "Connect this provider to enable cloud synchronization.",
      };
    }

    if (!activeWorkspace) {
      return {
        state: "new",
        label: "Ready",
        description: "No workspace loaded.",
      };
    }

    // Check if cloud has a file for active workspace ID
    const matchingRemote = remoteFiles.find(
      (f) => f.workspaceId === activeWorkspace.id,
    );

    if (!matchingRemote) {
      return {
        state: "new",
        label: "New",
        description:
          "This workspace has never been uploaded to this cloud account.",
      };
    }

    // Compare timestamps O(1)
    const lastSynced =
      activeWorkspace.lastSyncedAt || matchingRemote.updatedAt || 0;
    if (activeWorkspace.updatedAt > lastSynced) {
      return {
        state: "modified",
        label: "Modified",
        description: "Workspace has local edits since the last cloud sync.",
      };
    }

    return {
      state: "synced",
      label: "Synced",
      description: "Local workspace is completely in sync with cloud storage.",
    };
  }, [isCurrentProviderConnected, activeWorkspace, remoteFiles]);

  const handleDropboxConnect = async () => {
    try {
      await dropboxAdapter.startAuthFlow();
    } catch (err: unknown) {
      setSyncErrorMsg(
        err instanceof Error
          ? err.message
          : "Failed to initiate Dropbox login.",
      );
    }
  };

  const handleUpload = () => {
    if (!activeWorkspace) return;
    setSyncSuccessMsg(null);
    setSyncErrorMsg(null);

    if (isEncrypted) {
      if (!masterPassword || masterPassword.length < 6) {
        setSyncErrorMsg("Master Password must be at least 6 characters long.");
        return;
      }
      if (masterPassword !== confirmPassword) {
        setSyncErrorMsg("Passwords do not match. Please verify.");
        return;
      }
    }

    startUploadTransition(async () => {
      try {
        const syncTime = Date.now();
        await workspaceSyncService.uploadWorkspace(
          currentAdapter,
          activeWorkspace,
          {
            isEncrypted,
            password: isEncrypted ? masterPassword : undefined,
          },
          syncTime,
        );

        await markWorkspaceSynced(
          activeWorkspace.id,
          selectedProvider,
          syncTime,
        );

        // Optimistically update remote file in state so badge and list update immediately
        const sanitizedName = activeWorkspace.name
          .trim()
          .replace(/[^a-zA-Z0-9_\-\s]/g, "")
          .replace(/\s+/g, "_");
        const ext = isEncrypted ? "enc" : "json";
        const newFilePath = `workspaces/${sanitizedName || "workspace"}__${activeWorkspace.tabs.length}tabs__${syncTime}__${activeWorkspace.id}.${ext}`;

        setRemoteFiles((prev) => {
          const filtered = prev.filter(
            (f) => f.workspaceId !== activeWorkspace.id,
          );
          return [
            {
              name: activeWorkspace.name,
              fileName: newFilePath.split("/").pop() || "",
              workspaceId: activeWorkspace.id,
              tabCount: activeWorkspace.tabs.length,
              path: newFilePath,
              isEncrypted,
              updatedAt: syncTime,
            },
            ...filtered,
          ];
        });

        // Background reload to reconcile
        loadRemoteList();

        setSyncSuccessMsg(
          `Workspace "${activeWorkspace.name}" synced successfully to ${currentAdapter.name}!`,
        );
        setMasterPassword("");
        setConfirmPassword("");
      } catch (err: unknown) {
        setSyncErrorMsg(
          err instanceof Error
            ? err.message
            : "Failed to sync workspace to cloud.",
        );
      }
    });
  };

  const handleRestore = async (file: SyncedWorkspaceFileInfo) => {
    setSyncSuccessMsg(null);
    setSyncErrorMsg(null);

    let pwd: string | undefined;

    if (file.isEncrypted) {
      const input = await dialog.prompt({
        title: "Decrypt & Restore Workspace",
        message: `Enter the Master Password to unlock "${file.name}":`,
        placeholder: "Master password...",
        inputType: "password",
        confirmText: "Decrypt & Restore",
        cancelText: "Cancel",
        validate: (v) => (!v || !v.trim() ? "Password is required" : null),
      });

      if (!input) return;
      pwd = input;
    }

    setRestoringFile(file.path);

    try {
      const restored = await workspaceSyncService.restoreWorkspace(
        currentAdapter,
        file.path,
        pwd,
      );

      if (!restored) {
        // User cancelled in confirmation dialog
        return;
      }

      setSyncSuccessMsg(
        `Workspace "${restored.name}" restored successfully and activated!`,
      );
      onClose();
    } catch (err: unknown) {
      setSyncErrorMsg(
        err instanceof Error ? err.message : "Failed to restore workspace.",
      );
    } finally {
      setRestoringFile(null);
    }
  };

  const handleDeleteRemote = async (file: SyncedWorkspaceFileInfo) => {
    const confirmed = await dialog.confirm({
      title: "Delete Cloud Workspace",
      message: `Are you sure you want to delete "${file.name}" from ${currentProviderName}? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await workspaceSyncService.deleteRemoteWorkspace(
        currentAdapter,
        file.path,
      );
      setRemoteFiles((prev) => prev.filter((f) => f.path !== file.path));
    } catch (err: unknown) {
      setSyncErrorMsg(
        err instanceof Error
          ? err.message
          : "Failed to delete remote workspace.",
      );
    }
  };

  const handleShowServiceInfo = async (
    e: React.MouseEvent,
    provider: StorageProviderId,
  ) => {
    e.stopPropagation();
    if (provider === "dropbox") {
      await dialog.alert({
        title: "Dropbox Storage Details",
        message:
          "Dropbox connects via OAuth 2.0 PKCE directly from your browser.\n\n• Dedicated Folder: Files are stored strictly inside your private App Folder at '/Apps/Scripta Text Editor/workspaces/'.\n• Privacy: Scripta cannot view, access, or modify any other files in your Dropbox.\n• Mode: Supports both transparent Raw JSON and Zero-Knowledge AES-GCM Encrypted files.",
        variant: "info",
      });
    } else {
      await dialog.alert({
        title: "GitHub Storage Details",
        message:
          "GitHub connects using your Personal Access Token (PAT) directly from the client.\n\n• Target Repository: Workspaces are committed directly to the repository and branch of your choice (e.g. 'owner/repo').\n• Security: Your token is stored locally in your browser's IndexedDB and never sent to any intermediary server.\n• Mode: Workspaces can be committed as Raw JSON or AES-GCM Encrypted files.",
        variant: "info",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{ zIndex: Z_INDEX.MODAL_BASE }}
      className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 animate-fade-in"
    >
      <div
        className={`bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col ${MODAL_LAYOUT.CONTAINER_HEIGHT_CLASSES}`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[var(--border-color)] bg-[var(--bg-app)] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="mr-1 text-[var(--accent)]">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--text-main)]">
                Cloud Workspace Sync
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Sync workspaces to your personal cloud
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1.5 rounded-lg hover:bg-[var(--bg-surface)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Control Bars: 2 Distinct Rows for visual breathing room */}
        <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-2.5 shrink-0">
          {/* Row 1: Cloud Service Provider Selection */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Storage Provider
            </span>
            <div className="flex items-center gap-2">
              {/* Provider Dropdown Menu */}
              <DropdownMenu
                align="right"
                trigger={
                  <button
                    type="button"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-app)] hover:bg-[var(--bg-app)]/80 border border-[var(--border-color)] text-[var(--text-main)] transition-colors"
                  >
                    <span>
                      {selectedProvider === "dropbox" ? "Dropbox" : "GitHub"}
                    </span>
                    {((selectedProvider === "dropbox" && isDropboxConnected) ||
                      (selectedProvider === "github" && isGitHubConnected)) && (
                      <span
                        className="w-2 h-2 rounded-full bg-emerald-500"
                        title="Connected"
                      />
                    )}
                    <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  </button>
                }
              >
                <DropdownMenu.Item
                  label={
                    <div className="flex items-center justify-between w-full">
                      <span>Dropbox</span>
                      {isDropboxConnected && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 ml-2" />
                      )}
                    </div>
                  }
                  checked={selectedProvider === "dropbox"}
                  onSelect={() => setSelectedProvider("dropbox")}
                />
                <DropdownMenu.Item
                  label={
                    <div className="flex items-center justify-between w-full">
                      <span>GitHub</span>
                      {isGitHubConnected && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 ml-2" />
                      )}
                    </div>
                  }
                  checked={selectedProvider === "github"}
                  onSelect={() => setSelectedProvider("github")}
                />
              </DropdownMenu>

              {/* Standalone About Button */}
              <button
                type="button"
                onClick={(e) => void handleShowServiceInfo(e, selectedProvider)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)] border border-[var(--border-subtle)] transition-colors"
                title={`About ${selectedProvider === "dropbox" ? "Dropbox" : "GitHub"} integration`}
              >
                <Info className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                <span>About</span>
              </button>
            </div>
          </div>

          {/* Row 2: Segmented Action Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-[var(--bg-app)] p-1 rounded-lg border border-[var(--border-subtle)]">
            <button
              onClick={() => setActiveTab("sync")}
              className={`py-1.5 rounded-md text-xs font-medium transition-all text-center ${
                activeTab === "sync"
                  ? "bg-[var(--bg-surface)] text-[var(--accent)] font-semibold shadow-xs"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              Sync Current
            </button>
            <button
              onClick={() => setActiveTab("restore")}
              className={`py-1.5 rounded-md text-xs font-medium transition-all text-center ${
                activeTab === "restore"
                  ? "bg-[var(--bg-surface)] text-[var(--accent)] font-semibold shadow-xs"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              Cloud List
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`py-1.5 rounded-md text-xs font-medium transition-all text-center ${
                activeTab === "settings"
                  ? "bg-[var(--bg-surface)] text-[var(--accent)] font-semibold shadow-xs"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              Connection
            </button>
          </div>
        </div>

        {/* Notifications (Dismissible with internal state & auto-dismiss) */}
        {syncSuccessMsg && (
          <div className="mx-4 mt-4">
            <InlineBanner
              message={syncSuccessMsg}
              variant="success"
              onDismiss={() => setSyncSuccessMsg(null)}
              autoDismissMs={6000}
            />
          </div>
        )}
        {syncErrorMsg && (
          <div className="mx-4 mt-4">
            <InlineBanner
              message={syncErrorMsg}
              variant="error"
              onDismiss={() => setSyncErrorMsg(null)}
            />
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: SYNC CURRENT WORKSPACE */}
          {activeTab === "sync" && (
            <div>
              {!isCurrentProviderConnected ? (
                <div className="text-center py-8 px-4 border border-dashed border-[var(--border-color)] rounded-xl">
                  <Cloud className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-2 opacity-50" />
                  <h3 className="text-sm font-semibold text-[var(--text-main)] mb-1">
                    {selectedProvider === "dropbox"
                      ? "Dropbox is not connected"
                      : "GitHub repository not configured"}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mb-4 max-w-sm mx-auto">
                    {selectedProvider === "dropbox"
                      ? "Connect your Dropbox account via OAuth 2.0 PKCE to sync directly to your personal App folder."
                      : "Configure your GitHub Personal Access Token to commit workspaces to your private repository."}
                  </p>
                  {selectedProvider === "dropbox" ? (
                    <button
                      onClick={handleDropboxConnect}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      Connect Dropbox (PKCE)
                    </button>
                  ) : (
                    <button
                      onClick={() => setActiveTab("settings")}
                      className="px-4 py-2 bg-[var(--accent)] hover:opacity-90 text-black rounded-lg text-xs font-medium transition-opacity"
                    >
                      Configure GitHub Credentials
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6 pt-1">
                  {/* Active Workspace Status Banner (Seamless & Clean) */}
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
                    <div className="space-y-1">
                      <div className="text-[11px] font-medium tracking-wide uppercase text-[var(--text-muted)]">
                        Active Workspace
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-base font-semibold text-[var(--text-main)]">
                          {activeWorkspace?.name || "Workspace"}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--bg-app)] border border-[var(--border-subtle)] text-[var(--text-muted)] font-mono">
                          {activeWorkspace?.tabs.length || 0} tabs
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">
                        {workspaceSyncState.description}
                      </p>
                    </div>

                    <div className="shrink-0 pt-0.5">
                      {workspaceSyncState.state === "not-connected" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-500/10 border border-zinc-500/20 text-zinc-400 text-xs font-medium">
                          <CloudOff className="w-3.5 h-3.5" />
                          <span>{workspaceSyncState.label}</span>
                        </span>
                      )}
                      {workspaceSyncState.state === "new" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-medium">
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>{workspaceSyncState.label}</span>
                        </span>
                      )}
                      {workspaceSyncState.state === "modified" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{workspaceSyncState.label}</span>
                        </span>
                      )}
                      {workspaceSyncState.state === "synced" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{workspaceSyncState.label}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Encryption Section (Seamless Row) */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 text-[var(--text-main)] shrink-0 mt-0.5">
                          {isEncrypted ? (
                            <Lock className="w-4 h-4 text-[var(--accent)]" />
                          ) : (
                            <Unlock className="w-4 h-4 text-[var(--text-muted)]" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[var(--text-main)]">
                            Client-Side Encryption (Zero-Knowledge)
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                            Your data is encrypted before leaving your browser.
                          </div>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={isEncrypted}
                          onChange={(e) => setIsEncrypted(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[var(--border-color)] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--accent)]"></div>
                      </label>
                    </div>

                    {isEncrypted && (
                      <div className="pt-1 space-y-3 animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                              Master Password
                            </label>
                            <input
                              type="password"
                              placeholder="Enter encryption password..."
                              value={masterPassword}
                              onChange={(e) =>
                                setMasterPassword(e.target.value)
                              }
                              className="w-full px-3 py-2 text-xs bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent)] transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                              Confirm Master Password
                            </label>
                            <input
                              type="password"
                              placeholder="Confirm password..."
                              value={confirmPassword}
                              onChange={(e) =>
                                setConfirmPassword(e.target.value)
                              }
                              className="w-full px-3 py-2 text-xs bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent)] transition-colors"
                            />
                          </div>
                        </div>
                        <div className="flex items-start gap-1.5 text-[11px] text-amber-500/90 leading-relaxed bg-amber-500/5 border border-amber-500/15 p-2.5 rounded-lg">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                          <span>
                            We do not store your password. If you lose this
                            password, your encrypted cloud workspace cannot be
                            recovered.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Action */}
                  <div className="pt-2">
                    <button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 text-black rounded-lg text-xs font-semibold transition-opacity cursor-pointer shadow-xs"
                    >
                      {isUploading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span>
                        {isUploading
                          ? "Syncing to Cloud..."
                          : workspaceSyncState.state === "new"
                            ? `Upload "${activeWorkspace?.name}" to ${currentProviderName}`
                            : `Update "${activeWorkspace?.name}" on ${currentProviderName}`}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RESTORE / REMOTE WORKSPACES */}
          {activeTab === "restore" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[var(--text-muted)]">
                  Available Workspaces in {currentProviderName}
                </span>
                <button
                  onClick={loadRemoteList}
                  disabled={isLoadingList}
                  className="flex items-center gap-1.5 text-[11px] text-[var(--accent)] hover:underline cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${isLoadingList ? "animate-spin" : ""}`}
                  />
                  Refresh List
                </button>
              </div>

              {remoteFiles.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-[var(--border-color)] rounded-xl text-xs text-[var(--text-muted)]">
                  {isLoadingList
                    ? "Scanning remote storage..."
                    : `No workspaces found in ${currentProviderName}.`}
                </div>
              ) : (
                <div className="divide-y-2 divide-[var(--border-subtle)] max-h-[360px] overflow-y-auto pr-1">
                  {remoteFiles.map((file) => (
                    <div
                      key={file.path}
                      className="py-3 px-1 first:pt-1 last:pb-1 space-y-2.5 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="shrink-0">
                            {file.isEncrypted ? (
                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Cloud className="w-4 h-4 text-blue-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-[var(--text-main)] flex items-center gap-2 flex-wrap">
                              <span className="truncate">{file.name}</span>
                              {typeof file.tabCount === "number" && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--bg-app)] border border-[var(--border-subtle)] text-[var(--text-muted)] font-mono">
                                  {file.tabCount}{" "}
                                  {file.tabCount === 1 ? "tab" : "tabs"}
                                </span>
                              )}
                              {file.size && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--bg-app)] border border-[var(--border-subtle)] text-[var(--text-muted)] font-mono">
                                  {(file.size / 1024).toFixed(1)} KB
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)] flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono mt-0.5">
                              <span>
                                {file.isEncrypted ? "Encrypted" : "Raw"}
                              </span>
                              {file.updatedAt && (
                                <span>• {formatDateTime(file.updatedAt)}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleRestore(file)}
                            disabled={restoringFile === file.path}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 text-black text-xs font-semibold rounded-lg transition-opacity cursor-pointer shadow-xs"
                            title="Restore workspace"
                          >
                            {restoringFile === file.path ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            <span>Restore</span>
                          </button>

                          <button
                            onClick={() => handleDeleteRemote(file)}
                            title="Delete from cloud"
                            className="p-1.5 text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CONNECTION SETTINGS */}
          {activeTab === "settings" && (
            <div className="pt-1">
              {selectedProvider === "dropbox" ? (
                <DropboxConfigView
                  isDropboxConnected={isDropboxConnected}
                  onConnect={handleDropboxConnect}
                  onDisconnect={() => disconnectProvider("dropbox")}
                />
              ) : (
                <GitHubConfigForm
                  githubAuth={githubAuth}
                  isGitHubConnected={isGitHubConnected}
                  isSavingGitHub={isSavingGitHub}
                  submitGitHubAction={submitGitHubAction}
                  onDisconnect={() => disconnectProvider("github")}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
