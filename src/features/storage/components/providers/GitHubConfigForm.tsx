import React from "react";
import { CheckCircle, ExternalLink, RefreshCw } from "lucide-react";
import { GITHUB_ENDPOINTS } from "../../constants/storageEndpoints";
import type { GitHubAuthData } from "../../types/storage.types";

interface GitHubConfigFormProps {
  githubAuth: GitHubAuthData | null;
  isGitHubConnected: boolean;
  isSavingGitHub: boolean;
  submitGitHubAction: (formData: FormData) => void;
  onDisconnect: () => void;
}

export const GitHubConfigForm: React.FC<GitHubConfigFormProps> = ({
  githubAuth,
  isGitHubConnected,
  isSavingGitHub,
  submitGitHubAction,
  onDisconnect,
}) => {
  return (
    <form action={submitGitHubAction} className="space-y-4">
      {/* Header & Overview */}
      <div className="space-y-1.5 pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--text-main)] flex items-center gap-1.5">
            GitHub Repository Sync
          </h3>
          <a
            href={GITHUB_ENDPOINTS.DOCS_PAT}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-[var(--accent)] hover:underline inline-flex items-center gap-1"
          >
            PAT Documentation
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Commit encrypted or raw workspace backups directly to any private or
          public repository on your GitHub account.
        </p>
      </div>

      {/* Permissions Guide & Quick Links */}
      <div className="p-2.5 rounded-lg bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Required Token Permissions
          </span>
          <div className="flex items-center gap-2">
            <a
              href={GITHUB_ENDPOINTS.CREATE_PAT_FINE_GRAINED}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[var(--accent)] hover:underline font-medium inline-flex items-center gap-1"
            >
              + Create Fine-grained Token
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <span className="text-[var(--text-muted)] text-[10px]">|</span>
            <a
              href={GITHUB_ENDPOINTS.CREATE_PAT_CLASSIC}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:underline inline-flex items-center gap-1"
            >
              Classic
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <div className="flex items-start gap-1.5 text-[11px] text-[var(--text-muted)]">
            <span
              title="Read, write & commit workspace files"
              className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-semibold shrink-0"
            >
              Contents: Read and write
            </span>
          </div>
          <div className="flex items-start gap-1.5 text-[11px] text-[var(--text-muted)]">
            <span
              title="Verify repository metadata & user access"
              className="font-mono text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 font-semibold shrink-0"
            >
              Metadata: Read-only
            </span>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-3">
        <div>
          <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
            Personal Access Token (PAT)
          </label>
          <input
            type="password"
            name="token"
            placeholder="github_pat_... or ghp_..."
            defaultValue={githubAuth?.personalAccessToken || ""}
            className="w-full px-3 py-2 text-xs bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent)] transition-colors font-mono"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
              Owner / Organization
            </label>
            <input
              type="text"
              name="owner"
              placeholder="e.g. TrongAJTT"
              defaultValue={githubAuth?.owner || ""}
              className="w-full px-3 py-2 text-xs bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent)] transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
              Repository Name
            </label>
            <input
              type="text"
              name="repo"
              placeholder="e.g. scripta-workspaces"
              defaultValue={githubAuth?.repo || ""}
              className="w-full px-3 py-2 text-xs bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent)] transition-colors"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
            Branch (Default: main)
          </label>
          <input
            type="text"
            name="branch"
            placeholder="main"
            defaultValue={githubAuth?.branch || "main"}
            className="w-full px-3 py-2 text-xs bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)] focus:outline-hidden focus:border-[var(--accent)] transition-colors"
          />
        </div>

        {isGitHubConnected && githubAuth && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-subtle)]">
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              Connected to {githubAuth.owner}/{githubAuth.repo} (
              {githubAuth.branch || "main"})
            </span>
            <button
              type="button"
              onClick={onDisconnect}
              className="text-xs text-rose-400 hover:underline cursor-pointer"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSavingGitHub}
          className="w-full py-2.5 bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 text-black rounded-lg text-xs font-semibold transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          {isSavingGitHub ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CheckCircle className="w-3.5 h-3.5" />
          )}
          <span>
            {isSavingGitHub
              ? "Verifying & Saving..."
              : "Verify & Save GitHub Configuration"}
          </span>
        </button>
      </div>
    </form>
  );
};
