import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Cpu,
  Clock,
  ArrowRight,
} from "lucide-react";
import { ModalWrapper } from "../../../shared/components/ModalWrapper";
import { APP_NAME, APP_VERSION } from "../../../core/constants/app";
import {
  checkForUpdates,
  forceClearCacheAndReload,
  getCacheStorageInfo,
  type UpdateCheckResult,
} from "../services/updateService";

interface AppUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [checking, setChecking] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [result, setResult] = useState<UpdateCheckResult | null>(null);
  const [cacheCount, setCacheCount] = useState<number>(0);
  const [cacheNames, setCacheNames] = useState<string[]>([]);

  const runCheck = useCallback(async () => {
    setChecking(true);
    try {
      const res = await checkForUpdates();
      setResult(res);
      const cacheInfo = await getCacheStorageInfo();
      setCacheCount(cacheInfo.count);
      setCacheNames(cacheInfo.names);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      void runCheck();
    }, 0);
    return () => clearTimeout(timer);
  }, [isOpen, runCheck]);

  const handleForceUpdate = async () => {
    setClearing(true);
    await forceClearCacheAndReload();
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="App Updates & Cache Control"
      subtitle="Check for newer application versions, manage service workers, and purge obsolete asset caches."
      icon={<Sparkles className="w-5 h-5 text-[var(--accent)]" />}
      maxWidthClass="max-w-lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            onClick={() => void runCheck()}
            disabled={checking || clearing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-[var(--border-color)] text-xs text-[var(--text-main)] hover:bg-[var(--bg-tab-hover)] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${checking ? "animate-spin text-[var(--accent)]" : ""}`}
            />
            <span>{checking ? "Checking..." : "Check Again"}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-sm bg-[var(--bg-tab-hover)] hover:bg-[var(--border-color)] text-xs font-semibold text-[var(--text-main)] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="p-5 space-y-4">
        {/* Version Comparison Card */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)] font-medium">
              Version Status
            </span>
            {checking ? (
              <span className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Connecting to server...
              </span>
            ) : result?.hasUpdate ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                New Update Available!
              </span>
            ) : result?.error ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Offline / Server Unreachable
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Up to Date
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-2.5 rounded bg-[var(--bg-app)] border border-[var(--border-subtle)]">
              <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] block mb-0.5">
                Current Version
              </span>
              <span className="text-sm font-bold font-mono text-[var(--text-highlight)]">
                v{APP_VERSION}
              </span>
            </div>

            <div className="p-2.5 rounded bg-[var(--bg-app)] border border-[var(--border-subtle)]">
              <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] block mb-0.5">
                Latest Release
              </span>
              <span
                className={`text-sm font-bold font-mono ${
                  result?.hasUpdate
                    ? "text-[var(--accent)]"
                    : "text-[var(--text-highlight)]"
                }`}
              >
                {result?.latestVersion ? `v${result.latestVersion}` : "---"}
              </span>
            </div>
          </div>

          {result?.buildTime && (
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] pt-1">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Server build time: {new Date(result.buildTime).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Update Action Prompt if update available */}
        {result?.hasUpdate && (
          <div className="pt-4 border-t border-[var(--accent)]/40 bg-[var(--accent)]/10 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-semibold text-[var(--text-highlight)]">
                Version {result.latestVersion} is ready to install
              </h4>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Purge current bundle cache and restart {APP_NAME} with new
                updates.
              </p>
            </div>
            <button
              onClick={() => void handleForceUpdate()}
              disabled={clearing}
              className="px-3 py-1.5 rounded-sm bg-[var(--accent)] text-black font-semibold text-xs shrink-0 flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {clearing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
              <span>{clearing ? "Updating..." : "Update Now"}</span>
            </button>
          </div>
        )}

        {/* Cache Storage Diagnosis & Force Purge */}
        <div className="pt-4 border-t border-[var(--border-color)] bg-[var(--bg-surface)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)] font-medium flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5" />
              <span>Offline Cache Storage</span>
            </span>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              {cacheCount} active {cacheCount === 1 ? "bucket" : "buckets"}
            </span>
          </div>

          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            If you suspect the app is stuck displaying stale cached scripts or
            not picking up newly deployed assets, you can force-clear all
            Service Worker caches.
          </p>

          {cacheNames.length > 0 && (
            <div className="p-2 rounded bg-[var(--bg-app)] border border-[var(--border-subtle)] max-h-24 overflow-y-auto space-y-1">
              {cacheNames.map((name) => (
                <div
                  key={name}
                  className="text-[11px] font-mono text-[var(--text-muted)] truncate flex items-center gap-1.5"
                >
                  <Cpu className="w-3 h-3 text-[var(--accent-blue)] shrink-0" />
                  <span>{name}</span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 flex items-center justify-between border-t border-[var(--border-subtle)]">
            <span className="text-[11px] text-[var(--text-muted)]">
              ✓ Preserves your files & workspaces safely in IndexedDB
            </span>
            <button
              onClick={() => void handleForceUpdate()}
              disabled={clearing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{clearing ? "Clearing..." : "Purge Cache & Reload"}</span>
            </button>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};
