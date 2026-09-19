export type CommandId =
  | "file.new"
  | "file.open"
  | "file.save"
  | "file.saveAs"
  | "file.closeTab"
  | "file.closeAll"
  | "file.reopenClosed"
  | "file.toggleBookmark"
  | "file.nextBookmark"
  | "file.prevBookmark"
  | "file.clearBookmarks"
  | "file.tabInfo"
  | "workspace.openFolder"
  | "workspace.saveFolder"
  | "workspace.save"
  | "workspace.cloudSync"
  | "workspace.info"
  | "edit.findReplace"
  | "edit.duplicateLine"
  | "edit.deleteLine"
  | "edit.moveLineUp"
  | "edit.moveLineDown"
  | "edit.joinLines"
  | "edit.toggleComment"
  | "edit.toggleBlockComment"
  | "edit.toUpperCase"
  | "edit.toLowerCase"
  | "edit.toProperCase"
  | "edit.toTitleCase"
  | "edit.invertCase"
  | "edit.sortAsc"
  | "edit.sortDesc"
  | "edit.sortIntAsc"
  | "edit.sortIntDesc"
  | "edit.trimTrailing"
  | "edit.trimLeading"
  | "edit.trimBoth"
  | "edit.eolToSpace"
  | "edit.removeEmptyLines"
  | "edit.removeDuplicateLines"
  | "edit.convertEolCRLF"
  | "edit.convertEolLF"
  | "edit.insertDateTimeShort"
  | "edit.insertDateTimeLong"
  | "edit.insertCharacter"
  | "edit.toggleUnicodeHex"
  | "view.splitMode"
  | "view.editorOnly"
  | "view.previewOnly"
  | "view.toggleToolbar"
  | "view.toggleStatusBar"
  | "view.toggleTabBar"
  | "view.toggleLineNumbers"
  | "view.toggleWhitespace"
  | "view.toggleWordWrap"
  | "view.foldAll"
  | "view.unfoldAll"
  | "view.zoomIn"
  | "view.zoomOut"
  | "view.zoomReset"
  | "view.fullScreen"
  | "scripts.manager"
  | "settings.preferences"
  | "settings.shortcutMapper";

export interface Keybinding {
  key: string; // e.g. 'KeyS', 'KeyO', 'KeyN', 'KeyF', 'KeyW'
  alt: boolean;
  ctrl: boolean;
  shift: boolean;
  meta: boolean;
}

export interface Command {
  id: CommandId;
  label: string;
  category: "File" | "Edit" | "View" | "Scripts" | "Settings";
  defaultKeybinding: Keybinding | null;
}
