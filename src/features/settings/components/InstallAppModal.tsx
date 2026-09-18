import React, { useState, useEffect } from "react";
import {
  Download,
  CheckCircle2,
  Share,
  PlusSquare,
  ArrowRight,
  Monitor,
  WifiOff,
  Zap,
  HardDrive,
} from "lucide-react";
import { ModalWrapper } from "../../../shared/components/ModalWrapper";
import { APP_NAME } from "../../../core/constants/app";
import {
  isRunningStandalone,
  getPlatformInfo,
  canTriggerNativePrompt,
  triggerNativeInstallPrompt,
  subscribeInstallPrompt,
} from "../services/pwaInstallService";

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [canPrompt, setCanPrompt] = useState(canTriggerNativePrompt());
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [showManualGuide, setShowManualGuide] = useState(false);
  const isStandalone = isRunningStandalone();
  const platform = getPlatformInfo();

  useEffect(() => {
    const unsub = subscribeInstallPrompt((can) => {
      setCanPrompt(can);
    });
    return unsub;
  }, []);

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      const result = await triggerNativeInstallPrompt();
      if (result.success) {
        setInstallSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else if (result.outcome === "unavailable") {
        // If native prompt is blocked by browser policy (or Safari), show the manual tip immediately
        setShowManualGuide(true);
      }
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={`Install ${APP_NAME} App`}
      icon={<Download className="w-4 h-4 text-[var(--accent)]" />}
      maxWidthClass="max-w-lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] text-[var(--text-muted)]">
            Progressive Web App (PWA)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded text-xs font-medium bg-[var(--bg-surface)] hover:bg-[var(--bg-tab-hover)] border border-[var(--border-color)] text-[var(--text-main)] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="p-6 space-y-6 text-xs text-[var(--text-main)]">
        {/* Status / Action Bar */}
        {isStandalone || installSuccess ? (
          <div className="flex items-center gap-2 text-emerald-400 font-medium text-xs pb-3 border-b border-[var(--border-color)]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{APP_NAME} is already installed on this device (running in standalone mode).</span>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
            <div>
              <div className="font-semibold text-sm text-[var(--text-highlight)]">
                Install {APP_NAME} Desktop App
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">
                Run as a dedicated, lightweight window with full offline support.
              </div>
            </div>

            <button
              type="button"
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="px-4 py-2 rounded-md font-medium text-xs bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isInstalling ? "Installing..." : "Install Now"}</span>
            </button>
          </div>
        )}

        {/* Benefits - Clean List with distinctive colored icons */}
        <div className="space-y-2.5">
          <div className="text-[11px] font-semibold text-[var(--text-highlight)] uppercase tracking-wider">
            Key Advantages
          </div>

          <ul className="space-y-2.5 text-xs leading-relaxed text-[var(--text-muted)]">
            <li className="flex items-start gap-2.5">
              <Monitor className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[var(--text-main)] font-medium">Distraction-Free Window:</strong>{" "}
                Runs in its own clean window without browser tabs, URL bars, or extra browser chrome.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <WifiOff className="w-4 h-4 text-[var(--accent-blue)] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[var(--text-main)] font-medium">100% Offline Capability:</strong>{" "}
                Every editor feature, syntax parser, Markdown & Mermaid preview works without internet.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-[var(--accent-yellow)] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[var(--text-main)] font-medium">Instant Startup:</strong>{" "}
                Cached Service Worker assets and IndexedDB storage guarantee instant boot time.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <HardDrive className="w-4 h-4 text-[var(--accent-purple)] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[var(--text-main)] font-medium">Native System Integration:</strong>{" "}
                Direct disk read/write access and native desktop window management.
              </span>
            </li>
          </ul>
        </div>

        {/* Manual Instruction Guide when browser prompt is unavailable or user clicks button */}
        {!isStandalone && !installSuccess && (showManualGuide || (!canPrompt && platform.isIOS)) && (
          <div className="p-3.5 rounded-md bg-[var(--bg-app)] border border-[var(--border-color)] space-y-2">
            <div className="font-medium text-[var(--text-highlight)] text-[11px]">
              {platform.isIOS ? "How to install on iOS Safari:" : "Browser installation steps:"}
            </div>

            {platform.isIOS ? (
              <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-[var(--text-muted)] leading-relaxed">
                <li className="flex items-center gap-1.5">
                  <span>1. Tap the</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] font-medium">
                    <Share className="w-3 h-3 text-[var(--accent)]" /> Share
                  </span>
                  <span>button in Safari toolbar.</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span>2. Scroll down and tap</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] font-medium">
                    <PlusSquare className="w-3 h-3 text-[var(--accent)]" /> Add to Home Screen
                  </span>
                </li>
                <li>3. Confirm by tapping <strong>Add</strong> in the top right.</li>
              </ol>
            ) : (
              <ol className="space-y-1.5 text-[11px] text-[var(--text-muted)] leading-relaxed">
                <li className="flex items-center gap-1.5">
                  <ArrowRight className="w-3 h-3 text-[var(--accent)] shrink-0" />
                  <span>
                    Look for the <strong>Install</strong> icon (computer with down arrow) on the right side of your browser's address bar.
                  </span>
                </li>
                <li className="flex items-center gap-1.5">
                  <ArrowRight className="w-3 h-3 text-[var(--accent)] shrink-0" />
                  <span>
                    Or open browser menu (<strong>⋮</strong>) &rarr; Select <strong>Install {APP_NAME}...</strong> or <strong>Save and share</strong> &rarr; <strong>Install page as app</strong>.
                  </span>
                </li>
              </ol>
            )}
          </div>
        )}
      </div>
    </ModalWrapper>
  );
};
