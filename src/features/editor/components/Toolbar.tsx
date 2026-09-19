import React, { useState } from "react";
import {
  FilePlus,
  FolderOpen,
  Save,
  FileDown,
  Search,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Columns2,
  FileCode,
  Eye,
  Sun,
  Moon,
  Laptop,
  Sparkles,
  X,
  MoreVertical,
  Folder,
  Lock,
  Unlock,
  WrapText,
  CaseSensitive,
  FoldVertical,
  UnfoldVertical,
  Share2,
  FileText,
  Copy,
  Link,
  Check,
  Bookmark,
  FolderGit2,
} from "lucide-react";
import { useEditorStore } from "../../tabs/store";
import { useWorkspaceStore } from "../../workspace/store/workspaceStore";
import { WorkspaceMenuItems } from "../../workspace/components/WorkspaceMenuItems";
import { WorkspaceFolderSyncMenuItems } from "../../workspace/components/WorkspaceFolderSyncMenuItems";
import { ThemeMenuItems } from "../../settings/components/ThemeMenuItems";
import { BookmarkMenuItems } from "./BookmarkMenuItems";
import { DropdownMenu } from "../../../shared/components/DropdownMenu";
import { detectLanguageFromContent } from "../../../core/utils/fileDetection";
import { useEditorCommands } from "../hooks/useEditorCommands";
import { Z_INDEX } from "../../../core/constants/zIndex";
import {
  shareDocument,
  copyDocumentContent,
  shareApp,
  copyAppLink,
} from "../services/shareService";
import { ConvertCaseMenuItems } from "./ConvertCaseMenuItems";

export const Toolbar: React.FC = () => {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const setLanguageForActiveTab = useEditorStore(
    (s) => s.setLanguageForActiveTab,
  );

  const [dismissedTabSuggestion, setDismissedTabSuggestion] = useState<
    string | null
  >(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const editorCmds = useEditorCommands();

  const showShareFeedback = (msg: string) => {
    setShareFeedback(msg);
    setTimeout(() => {
      setShareFeedback((prev) => (prev === msg ? null : prev));
    }, 2500);
  };

  const handleShareDocument = async () => {
    if (!activeTab) return;
    const res = await shareDocument(activeTab.name, activeTab.content);
    if (res.action !== "cancelled") {
      showShareFeedback(res.message);
    }
  };

  const handleCopyDocumentContent = async () => {
    if (!activeTab) return;
    const res = await copyDocumentContent(activeTab.content);
    showShareFeedback(res.message);
  };

  const handleShareApp = async () => {
    const res = await shareApp();
    if (res.action !== "cancelled") {
      showShareFeedback(res.message);
    }
  };

  const handleCopyAppLink = async () => {
    const res = await copyAppLink();
    showShareFeedback(res.message);
  };

  const createTab = useEditorStore((s) => s.createTab);
  const openFileAction = useEditorStore((s) => s.openFileAction);
  const saveCurrentTab = useEditorStore((s) => s.saveCurrentTab);
  const saveCurrentTabAs = useEditorStore((s) => s.saveCurrentTabAs);
  const toggleLockTab = useEditorStore((s) => s.toggleLockTab);
  const toggleSearch = useEditorStore((s) => s.toggleSearch);
  const setFontSize = useEditorStore((s) => s.setFontSize);
  const previewMode = useEditorStore((s) => s.previewMode);
  const setPreviewMode = useEditorStore((s) => s.setPreviewMode);
  const theme = useEditorStore((s) => s.settings.theme);
  const lineWrapping = useEditorStore((s) => s.settings.lineWrapping);
  const toggleLineWrapping = useEditorStore((s) => s.toggleLineWrapping);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  const detected = activeTab?.content
    ? detectLanguageFromContent(activeTab.content)
    : null;
  const hasSuggestion =
    Boolean(detected) &&
    detected !== activeTab?.language &&
    dismissedTabSuggestion !== `${activeTab?.id}-${detected}`;

  return (
    <div
      style={{ zIndex: Z_INDEX.TOOLBAR }}
      className="h-11 bg-[var(--bg-toolbar)] border-b border-[var(--border-color)] px-2 flex items-center justify-between gap-2 shrink-0 select-none relative"
    >
      {/* Group: File Operations */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => createTab()}
          className="toolbar-btn"
          title="New File (Alt+N)"
        >
          <FilePlus className="w-4 h-4 text-[var(--accent)]" />
        </button>

        <button
          onClick={() => openFileAction()}
          className="toolbar-btn"
          title="Open File (Alt+O)"
        >
          <FolderOpen className="w-4 h-4 text-[var(--accent-yellow)]" />
        </button>

        <button
          onClick={() => saveCurrentTab()}
          className="toolbar-btn"
          title="Save File (Alt+S)"
        >
          <Save className="w-4 h-4 text-[var(--accent-blue)]" />
        </button>

        <button
          onClick={() => saveCurrentTabAs()}
          className="toolbar-btn hidden sm:flex"
          title="Save As... (Alt+Shift+S)"
        >
          <FileDown className="w-4 h-4 text-[var(--text-muted)]" />
        </button>

        <div className="w-[1px] h-5 bg-[var(--border-color)] mx-1" />

        {/* Group: Undo & Redo */}
        <button
          onClick={editorCmds.undo}
          className="toolbar-btn"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4 text-[var(--text-muted)] hover:text-[var(--text-main)]" />
        </button>

        <button
          onClick={editorCmds.redo}
          className="toolbar-btn"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4 text-[var(--text-muted)] hover:text-[var(--text-main)]" />
        </button>

        <div className="w-[1px] h-5 bg-[var(--border-color)] mx-1" />

        {/* Group: Search & View */}
        <button
          onClick={() => toggleSearch()}
          className="toolbar-btn"
          title="Find / Replace (Alt+F)"
        >
          <Search className="w-4 h-4 text-[var(--accent-purple)]" />
        </button>

        <button
          onClick={() => setFontSize(1)}
          className="toolbar-btn"
          title="Zoom Text In"
        >
          <ZoomIn className="w-4 h-4 text-[var(--text-muted)]" />
        </button>

        <button
          onClick={() => setFontSize(-1)}
          className="toolbar-btn"
          title="Zoom Text Out"
        >
          <ZoomOut className="w-4 h-4 text-[var(--text-muted)]" />
        </button>

        <div className="w-[1px] h-5 bg-[var(--border-color)] mx-1" />

        {/* Group: Preview Layout Mode Switcher (Split hidden on mobile screens) */}
        <div className="flex items-center bg-[var(--bg-surface)] p-0.5 rounded-sm border border-[var(--border-color)]">
          <button
            onClick={() => setPreviewMode("editor-only")}
            className={`px-2 py-1 rounded-xs text-xs flex items-center gap-1.5 transition-colors ${
              previewMode === "editor-only"
                ? "bg-[var(--bg-app)] text-[var(--text-highlight)] font-semibold shadow-2xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
            title="Editor Only"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Editor</span>
          </button>

          {/* Hidden on mobile (<md): Split view is cramped on mobile */}
          <button
            onClick={() => setPreviewMode("split")}
            className={`hidden md:flex px-2 py-1 rounded-xs text-xs items-center gap-1.5 transition-colors ${
              previewMode === "split"
                ? "bg-[var(--bg-app)] text-[var(--text-highlight)] font-semibold shadow-2xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
            title="Split Editor & Preview"
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>Split</span>
          </button>

          <button
            onClick={() => setPreviewMode("preview-only")}
            className={`px-2 py-1 rounded-xs text-xs flex items-center gap-1.5 transition-colors ${
              previewMode === "preview-only"
                ? "bg-[var(--bg-app)] text-[var(--text-highlight)] font-semibold shadow-2xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
            title="Preview Only"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </button>
        </div>
      </div>

      {/* Right Side Tools */}
      <div className="flex items-center gap-1.5">
        {/* Smart Language Suggestion Pill (Desktop only directly, or mobile via More) */}
        {hasSuggestion && detected && (
          <div className="hidden md:flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-sm bg-[var(--accent)]/15 border border-[var(--accent)]/40 text-xs text-[var(--accent)] animate-fade-in shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <button
              onClick={() => setLanguageForActiveTab(detected)}
              className="font-medium text-[11px] hover:underline cursor-pointer flex items-center gap-1"
              title={`Content looks like ${detected.toUpperCase()}. Click to switch language.`}
            >
              <span>Switch to</span>
              <strong className="uppercase font-bold tracking-wide">
                {detected}
              </strong>
            </button>
            <button
              onClick={() =>
                setDismissedTabSuggestion(`${activeTab?.id}-${detected}`)
              }
              className="p-0.5 hover:text-white rounded-xs hover:bg-[var(--bg-surface-elevated)] transition-colors ml-0.5"
              title="Dismiss suggestion"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Word Wrap Toggle (Desktop) */}
        <button
          onClick={toggleLineWrapping}
          className={`toolbar-btn hidden md:flex items-center gap-1 ${
            lineWrapping
              ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 font-medium"
              : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
          }`}
          title={`Word Wrap: ${lineWrapping ? "ON" : "OFF"}`}
        >
          <WrapText className="w-3.5 h-3.5" />
        </button>

        {/* Code Folding Buttons (Desktop) */}
        <div className="hidden md:flex items-center bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xs p-0.5 gap-0.5">
          <button
            onClick={editorCmds.foldAll}
            className="toolbar-btn p-1 h-6 w-6 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)]"
            title="Fold All Code"
          >
            <FoldVertical className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={editorCmds.unfoldAll}
            className="toolbar-btn p-1 h-6 w-6 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)]"
            title="Unfold All Code"
          >
            <UnfoldVertical className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Convert Case Dropdown (Desktop) */}
        <div className="hidden md:block">
          <DropdownMenu
            align="right"
            trigger={
              <button
                className="toolbar-btn flex items-center gap-1 px-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)]"
                title="Convert Case to..."
              >
                <CaseSensitive className="w-4 h-4" />
                <span className="text-[9px]">▾</span>
              </button>
            }
          >
            <ConvertCaseMenuItems editorCmds={editorCmds} />
          </DropdownMenu>
        </div>

        {/* Bookmarks Dropdown Button (Desktop) */}
        {activeTab && (
          <DropdownMenu
            align="right"
            trigger={
              <button
                className="toolbar-btn hidden md:flex items-center gap-1 px-2 text-xs relative"
                title="Line Bookmarks"
              >
                <Bookmark className="w-3.5 h-3.5 text-[var(--accent)]" />
                {editorCmds.getBookmarks().length > 0 && (
                  <span className="text-[10px] font-bold px-1 py-0.2 rounded-full bg-[var(--accent)] text-[var(--bg-app)] leading-tight">
                    {editorCmds.getBookmarks().length}
                  </span>
                )}
                <span className="text-[9px] text-[var(--text-muted)]">▾</span>
              </button>
            }
          >
            <BookmarkMenuItems editorCmds={editorCmds} />
          </DropdownMenu>
        )}

        {/* Lock / Unlock Toggle Button (Desktop) */}
        {activeTab && (
          <button
            onClick={() => toggleLockTab(activeTab.id)}
            className={`toolbar-btn hidden md:flex ${
              activeTab.isLocked
                ? "bg-amber-400/15 text-amber-400 border border-amber-400/30"
                : ""
            }`}
            title={
              activeTab.isLocked
                ? "Unlock File (Allow Editing)"
                : "Lock File (Read-Only Mode)"
            }
          >
            {activeTab.isLocked ? (
              <Lock className="w-4 h-4 text-amber-400" />
            ) : (
              <Unlock className="w-4 h-4 text-[var(--text-muted)] hover:text-amber-400" />
            )}
          </button>
        )}

        {/* Workspace Quick Switcher Dropdown (Desktop) */}
        <div className="hidden md:flex items-center">
          <DropdownMenu
            align="right"
            alignGutter
            trigger={
              <button
                className="toolbar-btn flex items-center gap-1.5 px-2 text-xs font-normal"
                title={`Active Workspace: ${activeWorkspace?.name || "Workspace"}${activeWorkspace?.lastSyncedAt ? " (Synced to Cloud)" : ""}`}
              >
                <div className="relative flex items-center shrink-0">
                  <Folder
                    className={`w-3.5 h-3.5 ${
                      activeWorkspace?.lastSyncedAt
                        ? "text-[var(--accent-blue)]"
                        : "text-[var(--accent-yellow)]"
                    }`}
                  />
                  {activeWorkspace?.lastSyncedAt && (
                    <span
                      className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)] ring-1 ring-[var(--bg-toolbar)]"
                      title="Cloud Synced"
                    />
                  )}
                </div>
                <span className="max-w-[110px] truncate text-[11px] text-[var(--text-main)] font-medium">
                  {activeWorkspace?.name || "Workspace"}
                </span>
                <span className="text-[9px] text-[var(--text-muted)]">▾</span>
              </button>
            }
          >
            <WorkspaceMenuItems />
          </DropdownMenu>
        </div>

        {/* Folder & Cloud Sync Dropdown Menu (Desktop) */}
        <div className="hidden md:flex items-center">
          <DropdownMenu
            align="right"
            alignGutter
            trigger={
              <button
                className="toolbar-btn flex items-center gap-1 px-1.5 text-xs text-[var(--accent-blue)]"
                title="Folder & Cloud Sync"
              >
                <FolderGit2 className="w-4 h-4 text-[var(--accent-blue)]" />
                <span className="text-[9px] text-[var(--text-muted)]">▾</span>
              </button>
            }
          >
            <WorkspaceFolderSyncMenuItems />
          </DropdownMenu>
        </div>

        {/* Theme Dropdown Menu (Desktop) */}
        <div className="hidden md:block">
          <DropdownMenu
            align="right"
            trigger={
              <button
                className="toolbar-btn flex items-center gap-1.5 px-2 text-xs"
                title={`Theme: ${theme.toUpperCase()}`}
              >
                {theme === "dark" ? (
                  <Moon className="w-4 h-4 text-[var(--accent-purple)]" />
                ) : theme === "light" ? (
                  <Sun className="w-4 h-4 text-[var(--accent-yellow)]" />
                ) : (
                  <Laptop className="w-4 h-4 text-[var(--accent-blue)]" />
                )}
                <span className="font-mono uppercase text-[11px] text-[var(--text-muted)]">
                  {theme}
                </span>
                <span className="text-[9px] text-[var(--text-muted)]">▾</span>
              </button>
            }
          >
            <ThemeMenuItems />
          </DropdownMenu>
        </div>

        {/* Share Dropdown Menu (Desktop - placed at rightmost edge) */}
        <div className="hidden md:flex items-center relative">
          <DropdownMenu
            align="right"
            trigger={
              <button
                className="toolbar-btn flex items-center gap-1 px-1.5 text-xs relative"
                title="Share Document or App"
              >
                {shareFeedback ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Share2 className="w-4 h-4 text-[var(--text-muted)] hover:text-[var(--accent)]" />
                )}
                <span className="text-[9px] text-[var(--text-muted)]">▾</span>
              </button>
            }
          >
            {activeTab && (
              <>
                <DropdownMenu.Item
                  icon={
                    <FileText className="w-3.5 h-3.5 text-[var(--accent)]" />
                  }
                  label={`Share "${activeTab.name || "Untitled"}"...`}
                  onSelect={handleShareDocument}
                />
                <DropdownMenu.Item
                  icon={
                    <Copy className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  }
                  label="Copy Document Content"
                  onSelect={handleCopyDocumentContent}
                />
                <DropdownMenu.Separator />
              </>
            )}
            <DropdownMenu.Item
              icon={
                <Share2 className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
              }
              label="Share Scripta App..."
              onSelect={handleShareApp}
            />
            <DropdownMenu.Item
              icon={<Link className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
              label="Copy App Link"
              onSelect={handleCopyAppLink}
            />
          </DropdownMenu>

          {/* Toast Notification Badge for Feedback */}
          {shareFeedback && (
            <div className="absolute right-0 -bottom-8 pointer-events-none whitespace-nowrap px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--accent)] text-[var(--accent)] text-[11px] shadow-lg animate-in fade-in zoom-in-95 duration-150 z-50">
              {shareFeedback}
            </div>
          )}
        </div>

        {/* Mobile "More" Menu button */}
        <div className="md:hidden">
          <DropdownMenu
            align="right"
            trigger={
              <button className="toolbar-btn relative" title="More Options">
                <MoreVertical className="w-4 h-4 text-[var(--text-muted)]" />
                {hasSuggestion && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                )}
              </button>
            }
            className="w-[60vw]"
          >
            {/* Lock / Unlock active file on mobile */}
            {activeTab && (
              <>
                <DropdownMenu.Item
                  icon={
                    activeTab.isLocked ? (
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    )
                  }
                  label={
                    activeTab.isLocked
                      ? "Unlock File (Allow Editing)"
                      : "Lock File (Read-Only)"
                  }
                  onSelect={() => toggleLockTab(activeTab.id)}
                />
                <DropdownMenu.Separator />
              </>
            )}

            {/* Language Switch Suggestion if available */}
            {hasSuggestion && detected && (
              <>
                <DropdownMenu.Item
                  icon={
                    <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                  }
                  label={`Switch to ${detected.toUpperCase()}`}
                  onSelect={() => setLanguageForActiveTab(detected)}
                />
                <DropdownMenu.Separator />
              </>
            )}

            {/* Word Wrap Toggle (Mobile) */}
            <DropdownMenu.Item
              icon={<WrapText className="w-3.5 h-3.5 text-[var(--accent)]" />}
              label="Word Wrap"
              checked={lineWrapping}
              onSelect={toggleLineWrapping}
            />

            {/* Code Folding (Mobile) */}
            <DropdownMenu.Item
              icon={
                <FoldVertical className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              }
              label="Fold All"
              commandId="view.foldAll"
              onSelect={editorCmds.foldAll}
            />
            <DropdownMenu.Item
              icon={
                <UnfoldVertical className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              }
              label="Unfold All"
              commandId="view.unfoldAll"
              onSelect={editorCmds.unfoldAll}
            />

            {/* Convert Case to Submenu (Mobile Accordion) */}
            <DropdownMenu.Sub
              label="Convert Case to"
              icon={
                <CaseSensitive className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
              }
            >
              <ConvertCaseMenuItems editorCmds={editorCmds} />
            </DropdownMenu.Sub>

            {/* Bookmarks Submenu (Mobile) */}
            <DropdownMenu.Sub
              label={`Bookmarks${editorCmds.getBookmarks().length > 0 ? ` (${editorCmds.getBookmarks().length})` : ""}`}
              icon={<Bookmark className="w-3.5 h-3.5 text-[var(--accent)]" />}
            >
              <BookmarkMenuItems editorCmds={editorCmds} />
            </DropdownMenu.Sub>

            <DropdownMenu.Separator />

            {/* Workspace Accordion Submenu */}
            <DropdownMenu.Sub
              label="Workspace"
              icon={
                <Folder
                  className={`w-3.5 h-3.5 ${
                    activeWorkspace?.lastSyncedAt
                      ? "text-[var(--accent-blue)]"
                      : "text-[var(--accent-yellow)]"
                  }`}
                />
              }
              alignGutter
            >
              <WorkspaceMenuItems />
            </DropdownMenu.Sub>

            {/* Folder & Cloud Sync Accordion Submenu */}
            <DropdownMenu.Sub
              label="Folder & Cloud Sync"
              icon={
                <FolderGit2 className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
              }
            >
              <WorkspaceFolderSyncMenuItems showIcon={false} />
            </DropdownMenu.Sub>

            <DropdownMenu.Separator />

            {/* Appearance / Theme Accordion Submenu */}
            <DropdownMenu.Sub
              label="Appearance"
              icon={
                theme === "dark" ? (
                  <Moon className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
                ) : theme === "light" ? (
                  <Sun className="w-3.5 h-3.5 text-[var(--accent-yellow)]" />
                ) : (
                  <Laptop className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                )
              }
              alignGutter
            >
              <ThemeMenuItems />
            </DropdownMenu.Sub>

            {/* Share Submenu (Mobile - at the bottom) */}
            <DropdownMenu.Sub
              label={shareFeedback ? `Share (${shareFeedback})` : "Share"}
              icon={<Share2 className="w-3.5 h-3.5 text-[var(--accent)]" />}
              alignGutter
            >
              {activeTab && (
                <>
                  <DropdownMenu.Item
                    icon={
                      <FileText className="w-3.5 h-3.5 text-[var(--accent)]" />
                    }
                    label={`Share "${activeTab.name || "Untitled"}"...`}
                    onSelect={handleShareDocument}
                  />
                  <DropdownMenu.Item
                    icon={
                      <Copy className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    }
                    label="Copy Document Content"
                    onSelect={handleCopyDocumentContent}
                  />
                  <DropdownMenu.Separator />
                </>
              )}
              <DropdownMenu.Item
                icon={
                  <Share2 className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                }
                label="Share Scripta App..."
                onSelect={handleShareApp}
              />
              <DropdownMenu.Item
                icon={<Link className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
                label="Copy App Link"
                onSelect={handleCopyAppLink}
              />
            </DropdownMenu.Sub>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
