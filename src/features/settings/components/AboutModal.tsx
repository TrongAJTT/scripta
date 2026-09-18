import React from "react";
import {
  Info,
  ExternalLink,
  FileCode2,
  Layers,
  Cpu,
  Sparkles,
} from "lucide-react";
import { ModalWrapper } from "../../../shared/components/ModalWrapper";
import {
  APP_NAME,
  APP_VERSION,
  APP_REPOSITORY,
  LEGAL_LINKS,
  DONATE_LINKS,
} from "../../../core/constants/app";
import { isRunningStandalone } from "../services/pwaInstallService";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUpdateModal?: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  onOpenUpdateModal,
}) => {
  const isStandalone = isRunningStandalone();

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={`About ${APP_NAME}`}
      icon={<Info className="w-4 h-4 text-[var(--accent)]" />}
      maxWidthClass="max-w-xl"
      badge={
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30">
          v{APP_VERSION}
        </span>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] text-[var(--text-muted)]">
            © {new Date().getFullYear()} TrongAJTT. Open Source under Apache 2.0
            License.
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
      <div className="p-6 space-y-5 text-xs text-[var(--text-main)]">
        {/* App Header Section */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-[var(--border-color)]">
          <img
            src="/icon.svg"
            alt={APP_NAME}
            className="w-12 h-12 object-contain shrink-0"
          />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[var(--text-highlight)]">
                {APP_NAME}
              </h3>
              <span className="text-xs font-mono text-[var(--text-muted)]">
                v{APP_VERSION}
              </span>
              {isStandalone && (
                <span className="text-[10px] text-emerald-400 font-medium">
                  (Installed App)
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              High-performance hybrid text editor & live document viewer.
            </p>
          </div>
        </div>

        {/* Core Capabilities - Clean typography list without card boxes */}
        <div className="space-y-2.5">
          <div className="text-[11px] font-semibold text-[var(--text-highlight)] uppercase tracking-wider">
            Features & Technologies
          </div>

          <ul className="space-y-2.5 text-xs leading-relaxed text-[var(--text-muted)]">
            <li className="flex items-start gap-2.5">
              <FileCode2 className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[var(--text-main)] font-medium">
                  CodeMirror 6 Core:
                </strong>{" "}
                Dynamic Compartments lifecycle, multi-language syntaxes,
                configurable word wrap and code folding.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Layers className="w-4 h-4 text-[var(--accent-blue)] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[var(--text-main)] font-medium">
                  Live Document Viewers:
                </strong>{" "}
                Instant Markdown rendering with KaTeX Math, Mermaid graphs, SVG
                diagrams, and HTML sandbox.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Cpu className="w-4 h-4 text-[var(--accent-yellow)] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[var(--text-main)] font-medium">
                  Native File System Access:
                </strong>{" "}
                Direct disk read/write with legacy file picker fallback and
                IndexedDB auto-save session safety.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[var(--accent-purple)] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[var(--text-main)] font-medium">
                  Scripting Engine & Shortcuts:
                </strong>{" "}
                Built-in script execution engine and fully customizable
                keybinding mapper.
              </span>
            </li>
          </ul>
        </div>

        {/* Open Source Libraries & Technologies */}
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-[var(--text-highlight)] uppercase tracking-wider">
            Open Source Libraries
          </div>
          <div className="text-xs text-[var(--text-muted)] leading-relaxed flex flex-wrap gap-x-3 gap-y-1">
            <span>CodeMirror 6</span>
            <span className="text-[var(--border-color)]">•</span>
            <span>React 19</span>
            <span className="text-[var(--border-color)]">•</span>
            <span>Zustand</span>
            <span className="text-[var(--border-color)]">•</span>
            <span>Marked</span>
            <span className="text-[var(--border-color)]">•</span>
            <span>KaTeX</span>
            <span className="text-[var(--border-color)]">•</span>
            <span>Mermaid</span>
            <span className="text-[var(--border-color)]">•</span>
            <span>DOMPurify</span>
            <span className="text-[var(--border-color)]">•</span>
            <span>dnd-kit</span>
            <span className="text-[var(--border-color)]">•</span>
            <span>Tailwind CSS</span>
            <span className="text-[var(--border-color)]">•</span>
            <span>Lucide Icons</span>
            <span className="text-[var(--border-color)]">•</span>
            <span>idb</span>
          </div>
        </div>

        {/* Links & Community */}
        <div className="pt-2 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <a
              href={APP_REPOSITORY}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-highlight)] transition-colors"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
            </a>

            <a
              href={LEGAL_LINKS.TERMS}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-highlight)] transition-colors"
            >
              <span>Terms</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
            </a>

            <a
              href={LEGAL_LINKS.PRIVACY}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-highlight)] transition-colors"
            >
              <span>Privacy</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
            </a>

            <a
              href={DONATE_LINKS.AUTHOR_DONATE}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-rose-400 transition-colors"
            >
              <span>Donate</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
            </a>
          </div>

          {onOpenUpdateModal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenUpdateModal();
              }}
              className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Check for updates</span>
              <span>→</span>
            </button>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
};
