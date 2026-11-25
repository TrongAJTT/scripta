import { CheckCircle, ExternalLink } from "lucide-react";

interface DropboxConfigViewProps {
  isDropboxConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const DropboxConfigView: React.FC<DropboxConfigViewProps> = ({
  isDropboxConnected,
  onConnect,
  onDisconnect,
}) => {
  return (
    <div className="space-y-4">
      {/* Header & Overview */}
      <div className="space-y-1 pb-3 border-b border-[var(--border-subtle)]">
        <h3 className="text-sm font-semibold text-[var(--text-main)] flex items-center gap-1.5">
          Dropbox OAuth 2.0 PKCE Setup
        </h3>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Scripta connects directly to your personal Dropbox account using
          client-side OAuth 2.0 PKCE. Your credentials remain in your browser.
        </p>
      </div>

      {/* Scopes & Folder Information */}
      <div className="p-2.5 rounded-lg bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-2">
        <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
          Sandboxed App Folder & Permissions
        </span>

        <div className="space-y-1.5 text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            Isolated target:{" "}
            <code className="text-[var(--accent)] font-mono text-[11px] bg-[var(--bg-surface)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">
              /Apps/Scripta Text Editor/workspaces/
            </code>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span
              style={{
                backgroundColor: "var(--status-info-bg)",
                borderColor: "var(--status-info-border)",
                color: "var(--status-info-text)",
              }}
              className="font-mono text-[10px] px-1.5 py-0.5 rounded border"
            >
              files.metadata.read
            </span>
            <span
              style={{
                backgroundColor: "var(--status-success-bg)",
                borderColor: "var(--status-success-border)",
                color: "var(--status-success-text)",
              }}
              className="font-mono text-[10px] px-1.5 py-0.5 rounded border"
            >
              files.content.read
            </span>
            <span
              style={{
                backgroundColor: "var(--status-success-bg)",
                borderColor: "var(--status-success-border)",
                color: "var(--status-success-text)",
              }}
              className="font-mono text-[10px] px-1.5 py-0.5 rounded border"
            >
              files.content.write
            </span>
          </div>
        </div>
      </div>

      {/* Connection Action */}
      {isDropboxConnected ? (
        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-subtle)]">
          <div
            className="text-xs flex items-center gap-2 font-medium"
            style={{ color: "var(--status-success-text)" }}
          >
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Connected to personal Dropbox account</span>
          </div>
          <button
            type="button"
            onClick={onDisconnect}
            style={{
              backgroundColor: "var(--status-danger-bg)",
              color: "var(--status-danger-text)",
            }}
            className="px-3 py-1.5 hover:brightness-110 text-xs font-medium rounded transition-all cursor-pointer"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onConnect}
          className="w-full py-2.5 bg-[var(--accent-blue)] hover:brightness-110 text-[var(--text-on-accent)] rounded text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <ExternalLink className="w-4 h-4" />
          Authenticate with Dropbox (OAuth PKCE)
        </button>
      )}
    </div>
  );
};
