import React, { useCallback, useEffect, useState } from "react";
import {
  Download,
  HardDrive,
  RefreshCw,
  Trash2,
  CheckCircle2,
  CloudOff,
} from "lucide-react";
import {
  clearAllOptionalResources,
  clearResourceGroup,
  getStorageQuotaSummary,
  inspectResourceCaches,
  preloadPyodideResource,
  type ResourceGroupId,
  type ResourceGroupStats,
  type StorageQuotaSummary,
} from "../../services/resourceStorageService";
import { formatBytes } from "../../../../core/constants/previewLimits";
import { InlineBanner } from "../../../../shared/components/InlineBanner";

export const ResourcesTab: React.FC = () => {
  const [resources, setResources] = useState<ResourceGroupStats[]>([]);
  const [quota, setQuota] = useState<StorageQuotaSummary>({
    usage: null,
    quota: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<ResourceGroupId | "all" | null>(null);
  const [preloadingPyodide, setPreloadingPyodide] = useState(false);
  const [banner, setBanner] = useState<{
    variant: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const refreshStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const [nextResources, nextQuota] = await Promise.all([
        inspectResourceCaches(),
        getStorageQuotaSummary(),
      ]);
      setResources(nextResources);
      setQuota(nextQuota);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;
    void Promise.all([inspectResourceCaches(), getStorageQuotaSummary()])
      .then(([nextResources, nextQuota]) => {
        if (!isCancelled) {
          setResources(nextResources);
          setQuota(nextQuota);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });
    return () => {
      isCancelled = true;
    };
  }, []);

  const handleClearGroup = async (item: ResourceGroupStats) => {
    setBusyId(item.id);
    setBanner(null);
    try {
      const removed = await clearResourceGroup(item.id);
      await refreshStats();
      setBanner({
        variant: "success",
        message:
          removed > 0
            ? `Cleared ${item.name} (${removed} cached ${removed === 1 ? "entry" : "entries"}).`
            : `${item.name} cache is already empty.`,
      });
    } catch (err) {
      setBanner({
        variant: "error",
        message:
          err instanceof Error ? err.message : "Failed to clear resource cache.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleClearAllOptional = async () => {
    setBusyId("all");
    setBanner(null);
    try {
      const removed = await clearAllOptionalResources();
      await refreshStats();
      setBanner({
        variant: "success",
        message:
          removed > 0
            ? `Cleared ${removed} optional cached resource ${removed === 1 ? "entry" : "entries"}.`
            : "No optional cached resources found to clear.",
      });
    } catch (err) {
      setBanner({
        variant: "error",
        message:
          err instanceof Error
            ? err.message
            : "Failed to clear optional caches.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handlePreloadPyodide = async () => {
    setPreloadingPyodide(true);
    setBanner(null);
    try {
      await preloadPyodideResource();
      await refreshStats();
      setBanner({
        variant: "success",
        message:
          "Python WASM (Pyodide) loaded and ready. In installed PWA builds, it is cached for offline execution.",
      });
    } catch (err) {
      setBanner({
        variant: "error",
        message:
          err instanceof Error
            ? err.message
            : "Failed to download Python WASM runtime.",
      });
    } finally {
      setPreloadingPyodide(false);
    }
  };

  const hasAnyCached = resources.some((r) => r.status === "cached");
  const usagePct =
    quota.usage !== null && quota.quota !== null && quota.quota > 0
      ? Math.min(100, Math.round((quota.usage / quota.quota) * 100))
      : null;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Storage Overview */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <div>
            <h3 className="text-xs font-semibold text-[var(--text-highlight)] uppercase tracking-wider flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Browser Storage &amp; Optional Runtimes</span>
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Inspect and selectively remove cached heavy engines (Python WASM,
              Mermaid, LaTeX) to free disk space.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void refreshStats()}
            disabled={isLoading || busyId !== null}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-tab-hover)] text-[11px] text-[var(--text-main)] transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
          >
            <RefreshCw
              className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
        </div>

        <div className="p-3 rounded bg-[var(--bg-app)] border border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--text-muted)]">
              Origin Storage Used
            </span>
            <span className="font-mono text-[var(--text-main)] font-medium">
              {quota.usage !== null ? formatBytes(quota.usage) : "Unavailable"}
              {quota.quota !== null ? ` / ${formatBytes(quota.quota)}` : ""}
              {usagePct !== null ? ` (${usagePct}%)` : ""}
            </span>
          </div>
          {usagePct !== null && (
            <div className="h-1.5 w-full rounded-full bg-[var(--bg-surface-elevated)] overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] transition-all duration-300"
                style={{ width: `${Math.max(usagePct, 1)}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {banner && (
        <InlineBanner
          variant={banner.variant}
          compact
          message={banner.message}
          onDismiss={() => setBanner(null)}
        />
      )}

      {/* Resource Groups List */}
      <div className="pt-2 border-t border-[var(--border-subtle)]">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-[var(--text-highlight)] uppercase tracking-wider">
            Cached Resource Groups
          </h4>
          {hasAnyCached && (
            <button
              type="button"
              onClick={() => void handleClearAllOptional()}
              disabled={busyId !== null}
              style={{ color: "var(--status-danger-text)" }}
              className="text-[11px] hover:underline disabled:opacity-50 cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear All Optional</span>
            </button>
          )}
        </div>

        <div className="divide-y divide-[var(--border-subtle)] border border-[var(--border-subtle)] rounded bg-[var(--bg-app)]/60">
          {resources.map((item) => {
            const isBusy = busyId === item.id || busyId === "all";
            const isCached = item.status === "cached";

            return (
              <div
                key={item.id}
                className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-[var(--text-main)]">
                      {item.name}
                    </span>

                    {isCached ? (
                      <span
                        style={{
                          backgroundColor: "var(--status-success-bg)",
                          borderColor: "var(--status-success-border)",
                          color: "var(--status-success-text)",
                        }}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border"
                      >
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Cached</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                        <CloudOff className="w-2.5 h-2.5" />
                        <span>Not Cached</span>
                      </span>
                    )}

                    {isCached && (
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">
                        {item.entryCount}{" "}
                        {item.entryCount === 1 ? "file" : "files"}
                        {item.estimatedBytes > 0
                          ? ` • ${formatBytes(item.estimatedBytes)}`
                          : item.hasOpaqueEntries
                            ? " • CDN opaque"
                            : ""}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-[var(--text-muted)] leading-snug">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.id === "pyodide" && !isCached && (
                    <button
                      type="button"
                      onClick={() => void handlePreloadPyodide()}
                      disabled={preloadingPyodide || busyId !== null}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-tab-hover)] text-[11px] text-[var(--text-main)] transition-colors disabled:opacity-50 cursor-pointer"
                      title="Download Python WASM runtime now for offline use"
                    >
                      {preloadingPyodide ? (
                        <RefreshCw className="w-3 h-3 animate-spin text-[var(--accent)]" />
                      ) : (
                        <Download className="w-3 h-3 text-[var(--accent)]" />
                      )}
                      <span>
                        {preloadingPyodide ? "Loading..." : "Preload"}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => void handleClearGroup(item)}
                    disabled={!isCached || isBusy}
                    style={
                      isCached
                        ? {
                            borderColor: "var(--status-danger-border)",
                            color: "var(--status-danger-text)",
                          }
                        : undefined
                    }
                    className="flex items-center gap-1 px-2.5 py-1 rounded border border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] hover:bg-[var(--status-danger-bg)] disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title={
                      isCached
                        ? `Remove cached ${item.name}`
                        : "Nothing cached to clear"
                    }
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <InlineBanner
        variant="info"
        compact
        dismissible={false}
        message="Clearing cached runtimes never deletes your open tabs, workspaces, or scripts stored in IndexedDB. Removed engines re-download automatically when needed online."
      />
    </div>
  );
};
