import React from "react";
import { useEditorStore } from "../../features/tabs/store";
import { useScriptStore } from "../../features/scripts/store/scriptStore";
import { useWorkspaceStore } from "../../features/workspace/store/workspaceStore";
import { WorkspaceMenuItems } from "../../features/workspace/components/WorkspaceMenuItems";
import { ThemeMenuItems } from "../../features/settings/components/ThemeMenuItems";
import { BookmarkMenuItems } from "../../features/editor/components/BookmarkMenuItems";
import type { SupportedLanguage } from "../../core/types/file.types";
import type { ScriptMetadata } from "../../features/scripts/types/script.types";
import { DropdownMenu } from "../../shared/components/DropdownMenu";
import { Z_INDEX } from "../../core/constants/zIndex";
import { useEditorCommands } from "../../features/editor/hooks/useEditorCommands";
import { useFullscreen } from "../../shared/hooks/useFullscreen";
import {
  Columns,
  Eye,
  FoldVertical,
  UnfoldVertical,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  SlidersHorizontal,
  FolderTree,
  Binary,
  Code2,
  Play,
  Folder,
  BookOpen,
  FileText,
  Shield,
  Sparkles,
  Heart,
  Coffee,
  ExternalLink,
  Pin,
  PinOff,
  Lock,
  Unlock,
  FolderSymlink,
  Settings as SettingsIcon,
  HelpCircle,
  ChevronDown,
  Keyboard,
  Download,
  Info,
  Clock,
  Trash2,
  Bookmark,
  Cloud,
} from "lucide-react";
import {
  COMMON_ENCODINGS,
  CHARACTER_SET_ENCODINGS,
} from "../../core/utils/encodingUtils";
import {
  APP_NAME,
  APP_TITLE,
  DONATE_LINKS,
  LEGAL_LINKS,
} from "../../core/constants/app";
import { WELCOME_MD_CONTENT } from "../../core/data/defaultDocuments";

export interface MenuBarProps {
  onOpenPreferences?: () => void;
  onOpenShortcutMapper?: () => void;
  onOpenScriptManager?: () => void;
  onOpenInsertCharacter?: () => void;
  onOpenUpdateModal?: () => void;
  onOpenAbout?: () => void;
  onOpenInstallApp?: () => void;
  onRunScript?: (script: ScriptMetadata) => void;
}

export const MenuBar: React.FC<MenuBarProps> = ({
  onOpenPreferences,
  onOpenShortcutMapper,
  onOpenScriptManager,
  onOpenInsertCharacter,
  onOpenUpdateModal,
  onOpenAbout,
  onOpenInstallApp,
  onRunScript,
}) => {
  const createTab = useEditorStore((s) => s.createTab);
  const openFileAction = useEditorStore((s) => s.openFileAction);
  const recentFiles = useEditorStore((s) => s.recentFiles);
  const closedFilesStack = useEditorStore((s) => s.closedFilesStack);
  const reopenClosedFile = useEditorStore((s) => s.reopenClosedFile);
  const openRecentFile = useEditorStore((s) => s.openRecentFile);
  const clearRecentFiles = useEditorStore((s) => s.clearRecentFiles);
  const saveCurrentTab = useEditorStore((s) => s.saveCurrentTab);
  const saveCurrentTabAs = useEditorStore((s) => s.saveCurrentTabAs);
  const closeTab = useEditorStore((s) => s.closeTab);
  const closeOtherTabs = useEditorStore((s) => s.closeOtherTabs);
  const closeToRightTabs = useEditorStore((s) => s.closeToRightTabs);
  const closeSavedTabs = useEditorStore((s) => s.closeSavedTabs);
  const closeAllTabsWithPrompt = useEditorStore(
    (s) => s.closeAllTabsWithPrompt,
  );
  const togglePinTab = useEditorStore((s) => s.togglePinTab);
  const toggleLockTab = useEditorStore((s) => s.toggleLockTab);
  const moveTabToWorkspace = useEditorStore((s) => s.moveTabToWorkspace);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const toggleSearch = useEditorStore((s) => s.toggleSearch);
  const setPreviewMode = useEditorStore((s) => s.setPreviewMode);
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const setLanguageForActiveTab = useEditorStore(
    (s) => s.setLanguageForActiveTab,
  );
  const settings = useEditorStore((s) => s.settings);
  const setFontSize = useEditorStore((s) => s.setFontSize);
  const resetFontSize = useEditorStore((s) => s.resetFontSize);
  const toggleToolbar = useEditorStore((s) => s.toggleToolbar);
  const toggleStatusBar = useEditorStore((s) => s.toggleStatusBar);
  const toggleTabBar = useEditorStore((s) => s.toggleTabBar);
  const toggleLineNumbers = useEditorStore((s) => s.toggleLineNumbers);
  const toggleWhitespace = useEditorStore((s) => s.toggleWhitespace);
  const setEncodingForActiveTab = useEditorStore(
    (s) => s.setEncodingForActiveTab,
  );
  const convertEncodingForActiveTab = useEditorStore(
    (s) => s.convertEncodingForActiveTab,
  );
  const scripts = useScriptStore((s) => s.scripts);

  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const editorCmds = useEditorCommands();

  const triggerClass =
    "px-2 py-0.5 rounded hover:bg-[var(--bg-tab-hover)] hover:text-[var(--text-highlight)] transition-colors inline-block cursor-pointer shrink-0 whitespace-nowrap";

  return (
    <div
      style={{ zIndex: Z_INDEX.MENUBAR }}
      className="h-7 bg-[var(--bg-toolbar)] border-b border-[var(--border-color)] px-2 flex items-center gap-1 text-xs select-none text-[var(--text-muted)] shrink-0 relative overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-none"
    >
      {/* 1. File Menu */}
      <DropdownMenu
        topDialogOnMobile
        trigger={<span className={triggerClass}>File</span>}
        alignGutter
      >
        <DropdownMenu.Item
          label="New"
          commandId="file.new"
          onSelect={() => createTab()}
        />
        <DropdownMenu.Item
          label="Open..."
          commandId="file.open"
          onSelect={() => void openFileAction()}
        />
        <DropdownMenu.Sub
          label="Open Recent"
          icon={<Clock className="w-3.5 h-3.5" />}
        >
          <DropdownMenu.Item
            label="Reopen Closed File"
            commandId="file.reopenClosed"
            disabled={closedFilesStack.length === 0}
            onSelect={() => void reopenClosedFile()}
          />
          <DropdownMenu.Separator />
          {recentFiles.length === 0 ? (
            <div className="px-3 py-1.5 text-[11px] text-[var(--text-subtle)] italic select-none">
              No Recent Files
            </div>
          ) : (
            recentFiles.map((entry) => (
              <DropdownMenu.Item
                key={entry.name}
                label={entry.name}
                icon={<FileText className="w-3.5 h-3.5" />}
                onSelect={() => void openRecentFile(entry)}
              />
            ))
          )}
          <DropdownMenu.Separator />
          <DropdownMenu.Item
            label="Clear Recently Opened"
            icon={<Trash2 className="w-3.5 h-3.5" />}
            disabled={recentFiles.length === 0}
            danger
            onSelect={() => void clearRecentFiles()}
          />
        </DropdownMenu.Sub>
        <DropdownMenu.Item
          label="Save"
          commandId="file.save"
          onSelect={() => void saveCurrentTab()}
        />
        <DropdownMenu.Item
          label="Save As..."
          commandId="file.saveAs"
          onSelect={() => void saveCurrentTabAs()}
        />
        <DropdownMenu.Separator />

        {/* Pin / Unpin Active Tab */}
        {activeTab && (
          <DropdownMenu.Item
            label={activeTab.isPinned ? "Unpin Tab" : "Pin Tab"}
            icon={
              activeTab.isPinned ? (
                <PinOff className="w-3.5 h-3.5 text-[var(--accent-yellow)]" />
              ) : (
                <Pin className="w-3.5 h-3.5 text-[var(--accent)]" />
              )
            }
            onSelect={() => togglePinTab(activeTab.id)}
          />
        )}

        {/* Lock / Unlock Active File */}
        {activeTab && (
          <DropdownMenu.Item
            label={
              activeTab.isLocked
                ? "Unlock File (Allow Edit)"
                : "Lock File (Read-Only)"
            }
            icon={
              activeTab.isLocked ? (
                <Unlock className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-amber-400" />
              )
            }
            onSelect={() => toggleLockTab(activeTab.id)}
          />
        )}

        {/* Move to Workspace Submenu */}
        {activeTab && (
          <DropdownMenu.Sub
            label="Move File to Workspace"
            icon={
              <FolderSymlink className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
            }
          >
            {workspaces.filter((w) => w.id !== activeWorkspaceId).length ===
            0 ? (
              <div className="px-3 py-1.5 text-[11px] text-[var(--text-muted)] italic">
                No other workspaces
              </div>
            ) : (
              workspaces
                .filter((w) => w.id !== activeWorkspaceId)
                .map((ws) => (
                  <DropdownMenu.Item
                    key={ws.id}
                    label={ws.name}
                    onSelect={() =>
                      void moveTabToWorkspace(activeTab.id, ws.id)
                    }
                  />
                ))
            )}
          </DropdownMenu.Sub>
        )}

        {/* Bookmarks Submenu */}
        <DropdownMenu.Sub
          label="Line Bookmarks"
          icon={<Bookmark className="w-3.5 h-3.5 text-[var(--accent)]" />}
        >
          <BookmarkMenuItems editorCmds={editorCmds} />
        </DropdownMenu.Sub>

        <DropdownMenu.Separator />

        {/* Workspace Submenu */}
        <DropdownMenu.Sub
          label="Workspace"
          icon={<Folder className="w-3.5 h-3.5 text-[var(--accent-yellow)]" />}
          alignGutter
        >
          <WorkspaceMenuItems />
        </DropdownMenu.Sub>

        {/* Cloud Sync & Backup (First-class action) */}
        <DropdownMenu.Item
          label="Cloud Sync & Backup..."
          icon={<Cloud className="w-3.5 h-3.5 text-[var(--accent-blue)]" />}
          onSelect={() => {
            window.dispatchEvent(new CustomEvent("open-cloud-sync-modal"));
          }}
        />

        <DropdownMenu.Separator />

        {/* Comprehensive Close Actions */}
        {activeTab && (
          <DropdownMenu.Item
            label="Close"
            commandId="file.closeTab"
            onSelect={() => closeTab(activeTab.id)}
          />
        )}
        {activeTab && (
          <DropdownMenu.Item
            label="Close Others"
            onSelect={() => void closeOtherTabs(activeTab.id)}
          />
        )}
        {activeTab && (
          <DropdownMenu.Item
            label="Close to the Right"
            onSelect={() => void closeToRightTabs(activeTab.id)}
          />
        )}
        <DropdownMenu.Item
          label="Close Saved"
          onSelect={() => closeSavedTabs()}
        />
        <DropdownMenu.Item
          label="Close All"
          commandId="file.closeAll"
          onSelect={() => void closeAllTabsWithPrompt()}
        />
      </DropdownMenu>

      {/* 2. Edit Menu */}
      <DropdownMenu
        topDialogOnMobile
        trigger={<span className={triggerClass}>Edit</span>}
      >
        <DropdownMenu.Item
          label="Find & Replace..."
          commandId="edit.findReplace"
          onSelect={() => toggleSearch(true)}
        />
        <DropdownMenu.Separator />

        {/* Line Operations */}
        <DropdownMenu.Item
          label="Duplicate Current Line"
          commandId="edit.duplicateLine"
          onSelect={editorCmds.duplicateLine}
        />
        <DropdownMenu.Item
          label="Delete Current Line"
          commandId="edit.deleteLine"
          onSelect={editorCmds.deleteLine}
        />
        <DropdownMenu.Item
          label="Move Line Up"
          commandId="edit.moveLineUp"
          onSelect={editorCmds.moveLineUp}
        />
        <DropdownMenu.Item
          label="Move Line Down"
          commandId="edit.moveLineDown"
          onSelect={editorCmds.moveLineDown}
        />
        <DropdownMenu.Item
          label="Join Lines"
          commandId="edit.joinLines"
          onSelect={editorCmds.joinLines}
        />
        <DropdownMenu.Separator />

        {/* Comment / Uncomment */}
        <DropdownMenu.Sub label="Comment/Uncomment">
          <DropdownMenu.Item
            label="Toggle Single Line Comment"
            commandId="edit.toggleComment"
            onSelect={editorCmds.toggleComment}
          />
          <DropdownMenu.Item
            label="Toggle Block Comment"
            commandId="edit.toggleBlockComment"
            onSelect={editorCmds.toggleBlockComment}
          />
        </DropdownMenu.Sub>

        {/* Convert Case */}
        <DropdownMenu.Sub label="Convert Case to">
          <DropdownMenu.Item
            label="UPPERCASE"
            commandId="edit.toUpperCase"
            onSelect={editorCmds.toUpperCase}
          />
          <DropdownMenu.Item
            label="lowercase"
            commandId="edit.toLowerCase"
            onSelect={editorCmds.toLowerCase}
          />
          <DropdownMenu.Item
            label="Proper Case (Blend)"
            commandId="edit.toProperCase"
            onSelect={editorCmds.toProperCase}
          />
          <DropdownMenu.Item
            label="Title Case"
            commandId="edit.toTitleCase"
            onSelect={editorCmds.toTitleCase}
          />
          <DropdownMenu.Item
            label="iNVERT cASE"
            commandId="edit.invertCase"
            onSelect={editorCmds.invertCase}
          />
        </DropdownMenu.Sub>

        {/* Line Operations Submenu */}
        <DropdownMenu.Sub label="Line Operations">
          <DropdownMenu.Item
            label="Sort Lines Lexicographically Ascending"
            commandId="edit.sortAsc"
            onSelect={editorCmds.sortLinesAscending}
          />
          <DropdownMenu.Item
            label="Sort Lines Lexicographically Descending"
            commandId="edit.sortDesc"
            onSelect={editorCmds.sortLinesDescending}
          />
          <DropdownMenu.Item
            label="Sort Lines as Integers Ascending"
            commandId="edit.sortIntAsc"
            onSelect={editorCmds.sortLinesIntegerAsc}
          />
          <DropdownMenu.Item
            label="Sort Lines as Integers Descending"
            commandId="edit.sortIntDesc"
            onSelect={editorCmds.sortLinesIntegerDesc}
          />
          <DropdownMenu.Separator />
          <DropdownMenu.Item
            label="Remove Empty Lines"
            commandId="edit.removeEmptyLines"
            onSelect={editorCmds.removeEmptyLines}
          />
          <DropdownMenu.Item
            label="Remove Duplicate Lines"
            commandId="edit.removeDuplicateLines"
            onSelect={editorCmds.removeDuplicateLines}
          />
        </DropdownMenu.Sub>

        {/* Blank Operations */}
        <DropdownMenu.Sub label="Blank Operations">
          <DropdownMenu.Item
            label="Trim Trailing Space"
            commandId="edit.trimTrailing"
            onSelect={editorCmds.trimTrailing}
          />
          <DropdownMenu.Item
            label="Trim Leading Space"
            commandId="edit.trimLeading"
            onSelect={editorCmds.trimLeading}
          />
          <DropdownMenu.Item
            label="Trim Trailing and Leading Space"
            commandId="edit.trimBoth"
            onSelect={editorCmds.trimBoth}
          />
          <DropdownMenu.Item
            label="EOL to Space"
            commandId="edit.eolToSpace"
            onSelect={editorCmds.eolToSpace}
          />
        </DropdownMenu.Sub>

        {/* EOL Conversion */}
        <DropdownMenu.Sub label="EOL Conversion">
          <DropdownMenu.Item
            label="Windows (CRLF)"
            commandId="edit.convertEolCRLF"
            onSelect={() => editorCmds.convertLineEnding("CRLF")}
          />
          <DropdownMenu.Item
            label="Unix (LF)"
            commandId="edit.convertEolLF"
            onSelect={() => editorCmds.convertLineEnding("LF")}
          />
        </DropdownMenu.Sub>

        <DropdownMenu.Separator />

        {/* Insert Submenu */}
        <DropdownMenu.Sub label="Insert">
          <DropdownMenu.Item
            label="Date Time (Short)"
            commandId="edit.insertDateTimeShort"
            onSelect={() => editorCmds.insertDateTime("short")}
          />
          <DropdownMenu.Item
            label="Date Time (Long)"
            commandId="edit.insertDateTimeLong"
            onSelect={() => editorCmds.insertDateTime("long")}
          />
          <DropdownMenu.Separator />
          <DropdownMenu.Item
            label="Character..."
            commandId="edit.insertCharacter"
            onSelect={() => onOpenInsertCharacter?.()}
          />
        </DropdownMenu.Sub>
      </DropdownMenu>

      {/* 3. View Menu */}
      <DropdownMenu
        topDialogOnMobile
        alignGutter
        trigger={<span className={triggerClass}>View</span>}
      >
        {/* Subsection 1: Panel Layout */}
        <DropdownMenu.Sub
          label="Panel Layout"
          icon={<Columns className="w-3.5 h-3.5" />}
          alignGutter
        >
          <DropdownMenu.Item
            label="Split Editor & Preview"
            commandId="view.splitMode"
            onSelect={() => setPreviewMode("split")}
          />
          <DropdownMenu.Item
            label="Editor Only"
            commandId="view.editorOnly"
            onSelect={() => setPreviewMode("editor-only")}
          />
          <DropdownMenu.Item
            label="Preview Only"
            commandId="view.previewOnly"
            onSelect={() => setPreviewMode("preview-only")}
          />
        </DropdownMenu.Sub>

        <DropdownMenu.Separator />

        {/* Subsection 2: Show / Hide UI elements */}
        <DropdownMenu.Sub
          label="Show / Hide"
          icon={<Eye className="w-3.5 h-3.5" />}
          alignGutter
        >
          <DropdownMenu.Item
            label="Toolbar"
            commandId="view.toggleToolbar"
            checked={settings.showToolbar}
            onSelect={toggleToolbar}
          />
          <DropdownMenu.Item
            label="Status Bar"
            commandId="view.toggleStatusBar"
            checked={settings.showStatusBar}
            onSelect={toggleStatusBar}
          />
          <DropdownMenu.Item
            label="Tab Bar"
            commandId="view.toggleTabBar"
            checked={settings.showTabBar}
            onSelect={toggleTabBar}
          />
          <DropdownMenu.Separator />
          <DropdownMenu.Item
            label="Line Numbers"
            commandId="view.toggleLineNumbers"
            checked={settings.showLineNumbers}
            onSelect={toggleLineNumbers}
          />
          <DropdownMenu.Item
            label="Whitespace & Tabs"
            commandId="view.toggleWhitespace"
            checked={settings.showWhitespace}
            onSelect={toggleWhitespace}
          />
        </DropdownMenu.Sub>

        {/* Subsection 3: Appearance */}
        <DropdownMenu.Sub
          label="Appearance"
          icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
          alignGutter
        >
          <ThemeMenuItems includeWordWrap />
        </DropdownMenu.Sub>

        {/* Subsection 4: Code Folding */}
        <DropdownMenu.Sub
          label="Code Folding"
          icon={<FolderTree className="w-3.5 h-3.5" />}
          alignGutter
        >
          <DropdownMenu.Item
            label="Fold All"
            icon={<FoldVertical className="w-3.5 h-3.5" />}
            commandId="view.foldAll"
            onSelect={editorCmds.foldAll}
          />
          <DropdownMenu.Item
            label="Unfold All"
            icon={<UnfoldVertical className="w-3.5 h-3.5" />}
            commandId="view.unfoldAll"
            onSelect={editorCmds.unfoldAll}
          />
        </DropdownMenu.Sub>

        <DropdownMenu.Separator />

        {/* Zoom controls */}
        <DropdownMenu.Item
          label="Zoom In"
          icon={<ZoomIn className="w-3.5 h-3.5" />}
          commandId="view.zoomIn"
          onSelect={() => setFontSize(2)}
        />
        <DropdownMenu.Item
          label="Zoom Out"
          icon={<ZoomOut className="w-3.5 h-3.5" />}
          commandId="view.zoomOut"
          onSelect={() => setFontSize(-2)}
        />
        <DropdownMenu.Item
          label="Restore Default Zoom"
          icon={<RotateCcw className="w-3.5 h-3.5" />}
          commandId="view.zoomReset"
          onSelect={resetFontSize}
        />

        <DropdownMenu.Separator />

        {/* Full Screen */}
        <DropdownMenu.Item
          label="Full Screen"
          icon={<Maximize2 className="w-3.5 h-3.5" />}
          commandId="view.fullScreen"
          checked={isFullscreen}
          onSelect={toggleFullscreen}
        />
      </DropdownMenu>

      {/* 4. Scripts Menu (Moved right after View so File, Edit, View, Scripts are together) */}
      <DropdownMenu
        topDialogOnMobile
        trigger={<span className={triggerClass}>Scripts</span>}
      >
        <DropdownMenu.Item
          label="Script Manager..."
          icon={<Code2 className="w-3.5 h-3.5" />}
          commandId="scripts.manager"
          onSelect={() => onOpenScriptManager?.()}
        />
        {scripts.length > 0 && (
          <>
            <DropdownMenu.Separator />
            <div className="px-3 py-1 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Available Scripts
            </div>
            {(() => {
              // Separate grouped vs ungrouped scripts
              const groups: Record<string, typeof scripts> = {};
              const standalone: typeof scripts = [];

              for (const sc of scripts) {
                if (sc.group && sc.group.trim()) {
                  const grp = sc.group.trim();
                  if (!groups[grp]) groups[grp] = [];
                  groups[grp].push(sc);
                } else {
                  standalone.push(sc);
                }
              }

              return (
                <>
                  {/* Folder Submenus */}
                  {Object.entries(groups).map(([grpName, groupScripts]) => (
                    <DropdownMenu.Sub
                      key={grpName}
                      label={grpName}
                      icon={
                        <Folder className="w-3.5 h-3.5 text-[var(--accent-yellow)]" />
                      }
                    >
                      {groupScripts.map((sc) => (
                        <DropdownMenu.Item
                          key={sc.id}
                          label={sc.name}
                          icon={
                            <Play className="w-3 h-3 text-[var(--accent)]" />
                          }
                          onSelect={() => onRunScript?.(sc)}
                        />
                      ))}
                    </DropdownMenu.Sub>
                  ))}

                  {/* Standalone scripts outside folders */}
                  {standalone.map((sc) => (
                    <DropdownMenu.Item
                      key={sc.id}
                      label={sc.name}
                      icon={<Play className="w-3 h-3 text-[var(--accent)]" />}
                      onSelect={() => onRunScript?.(sc)}
                    />
                  ))}
                </>
              );
            })()}
          </>
        )}
      </DropdownMenu>

      {/* Desktop-only Menus: Encoding, Language, Settings, Help */}
      <div className="hidden md:flex items-center gap-1">
        {/* Encoding Menu */}
        <DropdownMenu
          alignGutter
          trigger={<span className={triggerClass}>Encoding</span>}
        >
          {/* Section 1: Interpret / Reopen With Encoding */}
          {COMMON_ENCODINGS.map((enc) => (
            <DropdownMenu.Item
              key={enc.id}
              label={enc.label}
              checked={activeTab?.encoding === enc.id}
              onSelect={() => setEncodingForActiveTab(enc.id)}
            />
          ))}

          {/* Character Sets Submenu */}
          <DropdownMenu.Sub
            label="Character sets"
            icon={<Binary className="w-3.5 h-3.5" />}
            alignGutter
          >
            {CHARACTER_SET_ENCODINGS.map((enc) => (
              <DropdownMenu.Item
                key={enc.id}
                label={enc.label}
                checked={activeTab?.encoding === enc.id}
                onSelect={() => setEncodingForActiveTab(enc.id)}
              />
            ))}
          </DropdownMenu.Sub>

          <DropdownMenu.Separator />

          {/* Section 2: Convert to Encoding */}
          {COMMON_ENCODINGS.map((enc) => (
            <DropdownMenu.Item
              key={`convert-${enc.id}`}
              label={`Convert to ${enc.label}`}
              onSelect={() => convertEncodingForActiveTab(enc.id)}
            />
          ))}
        </DropdownMenu>

        {/* Language Menu */}
        <DropdownMenu
          trigger={<span className={triggerClass}>Language</span>}
          className="overflow-y-auto"
        >
          {(
            [
              { id: "markdown", label: "MARKDOWN" },
              { id: "html", label: "HTML" },
              { id: "javascript", label: "JAVASCRIPT" },
              { id: "typescript", label: "TYPESCRIPT" },
              { id: "css", label: "CSS" },
              { id: "json", label: "JSON" },
              { id: "python", label: "PYTHON" },
              { id: "svg", label: "SVG" },
              { id: "mermaid", label: "MERMAID" },
              { id: "plaintext", label: "PLAIN TEXT" },
              { id: "other", label: "OTHER..." },
            ] as { id: SupportedLanguage; label: string }[]
          ).map((l) => (
            <DropdownMenu.Item
              key={l.id}
              label={l.label}
              className={
                activeTab?.language === l.id
                  ? "font-bold text-[var(--accent)]"
                  : ""
              }
              onSelect={() => setLanguageForActiveTab(l.id)}
            />
          ))}
        </DropdownMenu>

        {/* Settings Menu */}
        <DropdownMenu trigger={<span className={triggerClass}>Settings</span>}>
          <DropdownMenu.Item
            label="Preferences..."
            commandId="settings.preferences"
            onSelect={() => onOpenPreferences?.()}
          />
          <DropdownMenu.Item
            label="Shortcut Mapper..."
            commandId="settings.shortcutMapper"
            onSelect={() => onOpenShortcutMapper?.()}
          />
        </DropdownMenu>

        {/* Help Menu */}
        <DropdownMenu trigger={<span className={triggerClass}>Help</span>}>
          <DropdownMenu.Item
            label="Welcome Guide"
            icon={<BookOpen className="w-3.5 h-3.5 text-[var(--accent)]" />}
            onSelect={() => {
              const existing = tabs.find((t) => t.name === "welcome.md");
              if (existing) useEditorStore.getState().setActiveTab(existing.id);
              else createTab("welcome.md", WELCOME_MD_CONTENT, "markdown");
            }}
          />
          <DropdownMenu.Item
            label="Install App..."
            icon={
              <Download className="w-3.5 h-3.5 text-[var(--accent-yellow)]" />
            }
            onSelect={() => onOpenInstallApp?.()}
          />
          <DropdownMenu.Item
            label="Check for Updates..."
            icon={<Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />}
            onSelect={onOpenUpdateModal}
          />
          <DropdownMenu.Separator />
          <DropdownMenu.Item
            label="Terms of Service"
            icon={
              <FileText className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
            }
            onSelect={() =>
              window.open(LEGAL_LINKS.TERMS, "_blank", "noopener,noreferrer")
            }
          />
          <DropdownMenu.Item
            label="Privacy Policy"
            icon={
              <Shield className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
            }
            onSelect={() =>
              window.open(LEGAL_LINKS.PRIVACY, "_blank", "noopener,noreferrer")
            }
          />
          <DropdownMenu.Separator />
          <DropdownMenu.Item
            label={`About ${APP_NAME}...`}
            icon={<Info className="w-3.5 h-3.5 text-[var(--accent)]" />}
            onSelect={() => onOpenAbout?.()}
          />
        </DropdownMenu>
      </div>

      {/* Spacer to push badge / donate to the right */}
      <div className="flex-1 min-w-2 shrink-0" />

      {/* Desktop Donate Dropdown Menu */}
      <div className="hidden md:block">
        <DropdownMenu
          align="right"
          trigger={
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-highlight)] px-2 py-1 rounded hover:bg-[var(--bg-tab-hover)] transition-colors cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
              <span>Donate</span>
            </button>
          }
        >
          <div className="px-3 py-2 text-xs text-[var(--text-muted)] max-w-[220px] leading-relaxed">
            <strong className="text-[var(--text-highlight)] block mb-0.5">
              Support {APP_NAME}
            </strong>
            Free & open-source. Buy a coffee or become a sponsor to keep it
            thriving!
          </div>
          <DropdownMenu.Separator />
          <DropdownMenu.Item
            label="Buy Me a Coffee"
            icon={<Coffee className="w-3.5 h-3.5 text-amber-500" />}
            onSelect={() =>
              window.open(
                DONATE_LINKS.BUY_ME_A_COFFEE,
                "_blank",
                "noopener,noreferrer",
              )
            }
          />
          <DropdownMenu.Item
            label="GitHub Sponsors"
            icon={<Heart className="w-3.5 h-3.5 text-pink-500" />}
            onSelect={() =>
              window.open(
                DONATE_LINKS.GITHUB_SPONSOR,
                "_blank",
                "noopener,noreferrer",
              )
            }
          />
          <DropdownMenu.Item
            label="Author Website (VietQR / Crypto)"
            icon={<ExternalLink className="w-3.5 h-3.5 text-[var(--accent)]" />}
            onSelect={() =>
              window.open(
                DONATE_LINKS.AUTHOR_DONATE,
                "_blank",
                "noopener,noreferrer",
              )
            }
          />
        </DropdownMenu>
      </div>

      {/* Desktop App Brand Badge */}
      <div className="hidden md:flex items-center gap-1.5 text-[11px] px-2 py-0.5 bg-[var(--bg-surface)] text-[var(--accent)] rounded-xs border border-[var(--border-color)] font-medium shrink-0 whitespace-nowrap">
        <span>{APP_TITLE}</span>
      </div>

      {/* Mobile Interactive Brand Badge with Dropdown for Remaining Menus */}
      <div className="md:hidden shrink-0">
        <DropdownMenu
          topDialogOnMobile
          align="right"
          trigger={
            <button
              type="button"
              className="flex items-center gap-1 text-[11px] px-2 py-0.5 bg-[var(--bg-surface)] text-[var(--accent)] rounded-xs border border-[var(--border-color)] font-medium shrink-0 whitespace-nowrap active:scale-95 transition-transform"
            >
              <span>{APP_TITLE}</span>
              <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
            </button>
          }
        >
          {/* Direct Level 1 Settings Actions */}
          <DropdownMenu.Item
            label="Preferences..."
            icon={<SettingsIcon className="w-3.5 h-3.5 text-[var(--accent)]" />}
            commandId="settings.preferences"
            onSelect={() => onOpenPreferences?.()}
          />
          <DropdownMenu.Item
            label="Shortcut Mapper..."
            icon={
              <Keyboard className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
            }
            commandId="settings.shortcutMapper"
            onSelect={() => onOpenShortcutMapper?.()}
          />

          <DropdownMenu.Separator />

          {/* Submenu: Encoding */}
          <DropdownMenu.Sub
            label="Encoding"
            icon={<Binary className="w-3.5 h-3.5" />}
            alignGutter
          >
            {COMMON_ENCODINGS.map((enc) => (
              <DropdownMenu.Item
                key={enc.id}
                label={enc.label}
                checked={activeTab?.encoding === enc.id}
                onSelect={() => setEncodingForActiveTab(enc.id)}
              />
            ))}
            <DropdownMenu.Sub
              label="Character sets"
              icon={<Binary className="w-3.5 h-3.5" />}
              alignGutter
            >
              {CHARACTER_SET_ENCODINGS.map((enc) => (
                <DropdownMenu.Item
                  key={enc.id}
                  label={enc.label}
                  checked={activeTab?.encoding === enc.id}
                  onSelect={() => setEncodingForActiveTab(enc.id)}
                />
              ))}
            </DropdownMenu.Sub>
            <DropdownMenu.Separator />
            {COMMON_ENCODINGS.map((enc) => (
              <DropdownMenu.Item
                key={`convert-${enc.id}`}
                label={`Convert to ${enc.label}`}
                onSelect={() => convertEncodingForActiveTab(enc.id)}
              />
            ))}
          </DropdownMenu.Sub>

          {/* Submenu: Language */}
          <DropdownMenu.Sub
            label="Language"
            icon={<Code2 className="w-3.5 h-3.5" />}
            alignGutter
          >
            {(
              [
                { id: "markdown", label: "MARKDOWN" },
                { id: "html", label: "HTML" },
                { id: "javascript", label: "JAVASCRIPT" },
                { id: "typescript", label: "TYPESCRIPT" },
                { id: "css", label: "CSS" },
                { id: "json", label: "JSON" },
                { id: "python", label: "PYTHON" },
                { id: "svg", label: "SVG" },
                { id: "mermaid", label: "MERMAID" },
                { id: "plaintext", label: "PLAIN TEXT" },
                { id: "other", label: "OTHER..." },
              ] as { id: SupportedLanguage; label: string }[]
            ).map((l) => (
              <DropdownMenu.Item
                key={l.id}
                label={l.label}
                className={
                  activeTab?.language === l.id
                    ? "font-bold text-[var(--accent)]"
                    : ""
                }
                onSelect={() => setLanguageForActiveTab(l.id)}
              />
            ))}
          </DropdownMenu.Sub>

          <DropdownMenu.Separator />

          {/* Submenu: Help */}
          <DropdownMenu.Sub
            label="Help & About"
            icon={<HelpCircle className="w-3.5 h-3.5 text-[var(--accent)]" />}
            alignGutter
          >
            <DropdownMenu.Item
              label="Welcome Guide"
              icon={<BookOpen className="w-3.5 h-3.5 text-[var(--accent)]" />}
              onSelect={() => {
                const existing = tabs.find((t) => t.name === "welcome.md");
                if (existing)
                  useEditorStore.getState().setActiveTab(existing.id);
                else createTab("welcome.md", WELCOME_MD_CONTENT, "markdown");
              }}
            />
            <DropdownMenu.Item
              label="Install App..."
              icon={
                <Download className="w-3.5 h-3.5 text-[var(--accent-yellow)]" />
              }
              onSelect={() => onOpenInstallApp?.()}
            />
            <DropdownMenu.Item
              label="Check for Updates..."
              icon={<Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />}
              onSelect={onOpenUpdateModal}
            />
            <DropdownMenu.Separator />
            <DropdownMenu.Item
              label="Terms of Service"
              icon={
                <FileText className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
              }
              onSelect={() =>
                window.open(LEGAL_LINKS.TERMS, "_blank", "noopener,noreferrer")
              }
            />
            <DropdownMenu.Item
              label="Privacy Policy"
              icon={
                <Shield className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
              }
              onSelect={() =>
                window.open(
                  LEGAL_LINKS.PRIVACY,
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            />
            <DropdownMenu.Separator />
            <DropdownMenu.Item
              label={`About ${APP_NAME}...`}
              icon={<Info className="w-3.5 h-3.5 text-[var(--accent)]" />}
              onSelect={() => onOpenAbout?.()}
            />
          </DropdownMenu.Sub>

          {/* Submenu: Donate */}
          <DropdownMenu.Sub
            label="Donate"
            icon={
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
            }
            alignGutter
          >
            <DropdownMenu.Item
              label="Buy Me a Coffee"
              icon={<Coffee className="w-3.5 h-3.5 text-amber-500" />}
              onSelect={() =>
                window.open(
                  DONATE_LINKS.BUY_ME_A_COFFEE,
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            />
            <DropdownMenu.Item
              label="GitHub Sponsor"
              icon={
                <svg className="w-3.5 h-3.5 fill-pink-500" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              }
              onSelect={() =>
                window.open(
                  DONATE_LINKS.GITHUB_SPONSOR,
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            />
            <DropdownMenu.Item
              label="Author Donate Page"
              icon={
                <ExternalLink className="w-3.5 h-3.5 text-[var(--accent)]" />
              }
              onSelect={() =>
                window.open(
                  DONATE_LINKS.AUTHOR_DONATE,
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            />
          </DropdownMenu.Sub>
        </DropdownMenu>
      </div>
    </div>
  );
};
