import type { Command, CommandId, Keybinding } from "./types";

export const COMMANDS: Record<CommandId, Command> = {
  // --- File ---
  "file.new": {
    id: "file.new",
    label: "New File",
    category: "File",
    defaultKeybinding: {
      key: "KeyN",
      alt: true,
      ctrl: false,
      shift: false,
      meta: false,
    },
  },
  "file.open": {
    id: "file.open",
    label: "Open File...",
    category: "File",
    defaultKeybinding: {
      key: "KeyO",
      alt: false,
      ctrl: true,
      shift: false,
      meta: false,
    },
  },
  "file.save": {
    id: "file.save",
    label: "Save",
    category: "File",
    defaultKeybinding: {
      key: "KeyS",
      alt: false,
      ctrl: true,
      shift: false,
      meta: false,
    },
  },
  "file.saveAs": {
    id: "file.saveAs",
    label: "Save As...",
    category: "File",
    defaultKeybinding: {
      key: "KeyS",
      alt: false,
      ctrl: true,
      shift: true,
      meta: false,
    },
  },
  "file.closeTab": {
    id: "file.closeTab",
    label: "Close Tab",
    category: "File",
    defaultKeybinding: {
      key: "KeyW",
      alt: true,
      ctrl: false,
      shift: false,
      meta: false,
    },
  },
  "file.closeAll": {
    id: "file.closeAll",
    label: "Close All Tabs",
    category: "File",
    defaultKeybinding: null,
  },
  "file.reopenClosed": {
    id: "file.reopenClosed",
    label: "Reopen Closed File",
    category: "File",
    defaultKeybinding: {
      key: "KeyT",
      alt: true,
      ctrl: false,
      shift: true,
      meta: false,
    },
  },
  "file.toggleBookmark": {
    id: "file.toggleBookmark",
    label: "Toggle Bookmark",
    category: "File",
    defaultKeybinding: {
      key: "F2",
      alt: false,
      ctrl: true,
      shift: false,
      meta: false,
    },
  },
  "file.nextBookmark": {
    id: "file.nextBookmark",
    label: "Next Bookmark",
    category: "File",
    defaultKeybinding: {
      key: "F2",
      alt: false,
      ctrl: false,
      shift: false,
      meta: false,
    },
  },
  "file.prevBookmark": {
    id: "file.prevBookmark",
    label: "Previous Bookmark",
    category: "File",
    defaultKeybinding: {
      key: "F2",
      alt: false,
      ctrl: false,
      shift: true,
      meta: false,
    },
  },
  "file.clearBookmarks": {
    id: "file.clearBookmarks",
    label: "Clear All Bookmarks",
    category: "File",
    defaultKeybinding: {
      key: "F2",
      alt: false,
      ctrl: true,
      shift: true,
      meta: false,
    },
  },
  "file.tabInfo": {
    id: "file.tabInfo",
    label: "Tab Information...",
    category: "File",
    defaultKeybinding: null,
  },

  // --- Workspace ---
  "workspace.openFolder": {
    id: "workspace.openFolder",
    label: "Open Folder as Workspace",
    category: "File",
    defaultKeybinding: {
      key: "KeyO",
      alt: true,
      ctrl: false,
      shift: false,
      meta: false,
    },
  },
  "workspace.saveFolder": {
    id: "workspace.saveFolder",
    label: "Save Workspace as Folder",
    category: "File",
    defaultKeybinding: {
      key: "KeyS",
      alt: true,
      ctrl: false,
      shift: true,
      meta: false,
    },
  },
  "workspace.save": {
    id: "workspace.save",
    label: "Save Workspace",
    category: "File",
    defaultKeybinding: {
      key: "KeyS",
      alt: true,
      ctrl: false,
      shift: false,
      meta: false,
    },
  },
  "workspace.cloudSync": {
    id: "workspace.cloudSync",
    label: "Cloud Sync & Backup...",
    category: "File",
    defaultKeybinding: {
      key: "KeyC",
      alt: true,
      ctrl: false,
      shift: true,
      meta: false,
    },
  },
  "workspace.info": {
    id: "workspace.info",
    label: "Workspace Information",
    category: "File",
    defaultKeybinding: null,
  },

  // --- Edit (Core) ---
  "edit.findReplace": {
    id: "edit.findReplace",
    label: "Find & Replace...",
    category: "Edit",
    defaultKeybinding: {
      key: "KeyF",
      alt: false,
      ctrl: true,
      shift: false,
      meta: false,
    },
  },
  "edit.duplicateLine": {
    id: "edit.duplicateLine",
    label: "Duplicate Current Line",
    category: "Edit",
    defaultKeybinding: {
      key: "KeyD",
      alt: true,
      ctrl: false,
      shift: false,
      meta: false,
    },
  },
  "edit.deleteLine": {
    id: "edit.deleteLine",
    label: "Delete Current Line",
    category: "Edit",
    defaultKeybinding: {
      key: "KeyL",
      alt: true,
      ctrl: false,
      shift: true,
      meta: false,
    },
  },
  "edit.moveLineUp": {
    id: "edit.moveLineUp",
    label: "Move Line Up",
    category: "Edit",
    defaultKeybinding: {
      key: "ArrowUp",
      alt: true,
      ctrl: false,
      shift: false,
      meta: false,
    },
  },
  "edit.moveLineDown": {
    id: "edit.moveLineDown",
    label: "Move Line Down",
    category: "Edit",
    defaultKeybinding: {
      key: "ArrowDown",
      alt: true,
      ctrl: false,
      shift: false,
      meta: false,
    },
  },
  "edit.joinLines": {
    id: "edit.joinLines",
    label: "Join Lines",
    category: "Edit",
    defaultKeybinding: {
      key: "KeyJ",
      alt: true,
      ctrl: false,
      shift: false,
      meta: false,
    },
  },

  // --- Edit (Comment/Uncomment) ---
  "edit.toggleComment": {
    id: "edit.toggleComment",
    label: "Toggle Single Line Comment",
    category: "Edit",
    defaultKeybinding: {
      key: "Slash",
      alt: true,
      ctrl: false,
      shift: false,
      meta: false,
    },
  },
  "edit.toggleBlockComment": {
    id: "edit.toggleBlockComment",
    label: "Toggle Block Comment",
    category: "Edit",
    defaultKeybinding: {
      key: "Slash",
      alt: true,
      ctrl: false,
      shift: true,
      meta: false,
    },
  },

  // --- Edit (Case Conversion) ---
  "edit.toUpperCase": {
    id: "edit.toUpperCase",
    label: "UPPERCASE",
    category: "Edit",
    defaultKeybinding: {
      key: "KeyU",
      alt: true,
      ctrl: false,
      shift: true,
      meta: false,
    },
  },
  "edit.toLowerCase": {
    id: "edit.toLowerCase",
    label: "lowercase",
    category: "Edit",
    defaultKeybinding: {
      key: "KeyU",
      alt: true,
      ctrl: false,
      shift: false,
      meta: false,
    },
  },
  "edit.toProperCase": {
    id: "edit.toProperCase",
    label: "Proper Case (Blend)",
    category: "Edit",
    defaultKeybinding: null,
  },
  "edit.toTitleCase": {
    id: "edit.toTitleCase",
    label: "Title Case",
    category: "Edit",
    defaultKeybinding: null,
  },
  "edit.invertCase": {
    id: "edit.invertCase",
    label: "iNVERT cASE",
    category: "Edit",
    defaultKeybinding: null,
  },

  // --- Edit (Line Operations & Sort) ---
  "edit.sortAsc": {
    id: "edit.sortAsc",
    label: "Sort Lines Lexicographically Ascending",
    category: "Edit",
    defaultKeybinding: null,
  },
  "edit.sortDesc": {
    id: "edit.sortDesc",
    label: "Sort Lines Lexicographically Descending",
    category: "Edit",
    defaultKeybinding: null,
  },
  "edit.sortIntAsc": {
    id: "edit.sortIntAsc",
    label: "Sort Lines as Integers Ascending",
    category: "Edit",
    defaultKeybinding: null,
  },
  "edit.sortIntDesc": {
    id: "edit.sortIntDesc",
    label: "Sort Lines as Integers Descending",
    category: "Edit",
    defaultKeybinding: null,
  },

  // --- Edit (Blank Operations) ---
  "edit.trimTrailing": {
    id: "edit.trimTrailing",
    label: "Trim Trailing Space",
    category: "Edit",
    defaultKeybinding: null,
  },
  "edit.trimLeading": {
    id: "edit.trimLeading",
    label: "Trim Leading Space",
    category: "Edit",
    defaultKeybinding: null,
  },
  "edit.trimBoth": {
    id: "edit.trimBoth",
    label: "Trim Trailing and Leading Space",
    category: "Edit",
    defaultKeybinding: null,
  },
  "edit.eolToSpace": {
    id: "edit.eolToSpace",
    label: "EOL to Space",
    category: "Edit",
    defaultKeybinding: null,
  },
  "edit.removeEmptyLines": {
    id: "edit.removeEmptyLines",
    label: "Remove Empty Lines",
    category: "Edit",
    defaultKeybinding: null,
  },
  "edit.removeDuplicateLines": {
    id: "edit.removeDuplicateLines",
    label: "Remove Duplicate Lines",
    category: "Edit",
    defaultKeybinding: null,
  },

  // --- Edit (EOL & Insert) ---
  "edit.convertEolCRLF": {
    id: "edit.convertEolCRLF",
    label: "Convert to Windows (CRLF)",
    category: "Edit",
    defaultKeybinding: null,
  },
  "edit.convertEolLF": {
    id: "edit.convertEolLF",
    label: "Convert to Unix (LF)",
    category: "Edit",
    defaultKeybinding: null,
  },
  "edit.insertDateTimeShort": {
    id: "edit.insertDateTimeShort",
    label: "Insert Date Time (Short)",
    category: "Edit",
    defaultKeybinding: {
      key: "F5",
      alt: false,
      ctrl: false,
      shift: false,
      meta: false,
    },
  },
  "edit.insertDateTimeLong": {
    id: "edit.insertDateTimeLong",
    label: "Insert Date Time (Long)",
    category: "Edit",
    defaultKeybinding: null,
  },
  "edit.insertCharacter": {
    id: "edit.insertCharacter",
    label: "Insert Character...",
    category: "Edit",
    defaultKeybinding: {
      key: "KeyI",
      alt: true,
      ctrl: false,
      shift: false,
      meta: false,
    },
  },
  "edit.toggleUnicodeHex": {
    id: "edit.toggleUnicodeHex",
    label: "Toggle Unicode Hex",
    category: "Edit",
    defaultKeybinding: {
      key: "KeyX",
      alt: true,
      ctrl: false,
      shift: false,
      meta: false,
    },
  },

  // --- View ---
  "view.splitMode": {
    id: "view.splitMode",
    label: "Split Editor & Preview",
    category: "View",
    defaultKeybinding: null,
  },
  "view.editorOnly": {
    id: "view.editorOnly",
    label: "Editor Only",
    category: "View",
    defaultKeybinding: null,
  },
  "view.previewOnly": {
    id: "view.previewOnly",
    label: "Preview Only",
    category: "View",
    defaultKeybinding: null,
  },
  "view.toggleToolbar": {
    id: "view.toggleToolbar",
    label: "Toggle Toolbar",
    category: "View",
    defaultKeybinding: null,
  },
  "view.toggleStatusBar": {
    id: "view.toggleStatusBar",
    label: "Toggle Status Bar",
    category: "View",
    defaultKeybinding: null,
  },
  "view.toggleTabBar": {
    id: "view.toggleTabBar",
    label: "Toggle Tab Bar",
    category: "View",
    defaultKeybinding: null,
  },
  "view.toggleLineNumbers": {
    id: "view.toggleLineNumbers",
    label: "Toggle Line Numbers",
    category: "View",
    defaultKeybinding: null,
  },
  "view.toggleWhitespace": {
    id: "view.toggleWhitespace",
    label: "Toggle Whitespace & Tabs",
    category: "View",
    defaultKeybinding: null,
  },
  "view.toggleWordWrap": {
    id: "view.toggleWordWrap",
    label: "Toggle Word Wrap",
    category: "View",
    defaultKeybinding: {
      key: "KeyZ",
      alt: true,
      ctrl: false,
      shift: false,
      meta: false,
    },
  },
  "view.foldAll": {
    id: "view.foldAll",
    label: "Fold All",
    category: "View",
    defaultKeybinding: {
      key: "Digit0",
      alt: true,
      ctrl: false,
      shift: false,
      meta: false,
    },
  },
  "view.unfoldAll": {
    id: "view.unfoldAll",
    label: "Unfold All",
    category: "View",
    defaultKeybinding: {
      key: "Digit0",
      alt: true,
      ctrl: false,
      shift: true,
      meta: false,
    },
  },
  "view.zoomIn": {
    id: "view.zoomIn",
    label: "Zoom In",
    category: "View",
    defaultKeybinding: {
      key: "Equal",
      alt: true,
      ctrl: false,
      shift: false,
      meta: false,
    },
  },
  "view.zoomOut": {
    id: "view.zoomOut",
    label: "Zoom Out",
    category: "View",
    defaultKeybinding: {
      key: "Minus",
      alt: true,
      ctrl: false,
      shift: false,
      meta: false,
    },
  },
  "view.zoomReset": {
    id: "view.zoomReset",
    label: "Restore Default Zoom",
    category: "View",
    defaultKeybinding: {
      key: "Digit0",
      alt: true,
      ctrl: true,
      shift: false,
      meta: false,
    },
  },
  "view.fullScreen": {
    id: "view.fullScreen",
    label: "Full Screen",
    category: "View",
    defaultKeybinding: {
      key: "F11",
      alt: false,
      ctrl: false,
      shift: false,
      meta: false,
    },
  },

  // --- Scripts ---
  "scripts.manager": {
    id: "scripts.manager",
    label: "Script Manager...",
    category: "Scripts",
    defaultKeybinding: {
      key: "KeyX",
      alt: true,
      ctrl: false,
      shift: true,
      meta: false,
    },
  },

  // --- Settings ---
  "settings.preferences": {
    id: "settings.preferences",
    label: "Preferences...",
    category: "Settings",
    defaultKeybinding: {
      key: "KeyP",
      alt: true,
      ctrl: false,
      shift: false,
      meta: false,
    },
  },
  "settings.shortcutMapper": {
    id: "settings.shortcutMapper",
    label: "Shortcut Mapper...",
    category: "Settings",
    defaultKeybinding: {
      key: "KeyM",
      alt: true,
      ctrl: false,
      shift: false,
      meta: false,
    },
  },
};

/**
 * Format a key string from KeyboardEvent.code (e.g. 'KeyS' -> 'S', 'Digit1' -> '1')
 */
export function formatKeyCode(code: string): string {
  if (code.startsWith("Key")) {
    return code.slice(3).toUpperCase();
  }
  if (code.startsWith("Digit")) {
    return code.slice(5);
  }
  if (code.startsWith("Numpad")) {
    return `Num ${code.slice(6)}`;
  }
  if (code === "Slash") return "/";
  if (code === "ArrowUp") return "Up";
  if (code === "ArrowDown") return "Down";
  return code;
}

/**
 * Converts a Keybinding to human readable string (e.g. 'Alt+S', 'Alt+Shift+S')
 */
export function keybindingToString(kb: Keybinding | null | undefined): string {
  if (!kb) return "";
  const parts: string[] = [];
  if (kb.ctrl) parts.push("Ctrl");
  if (kb.alt) parts.push("Alt");
  if (kb.shift) parts.push("Shift");
  if (kb.meta) parts.push("Meta");
  parts.push(formatKeyCode(kb.key));
  return parts.join("+");
}

/**
 * Matches a KeyboardEvent against a Keybinding.
 * Strict rule: Disallow bare Ctrl shortcuts to avoid browser collisions.
 */
export function matchesKeybinding(
  e: KeyboardEvent,
  kb: Keybinding | null | undefined,
): boolean {
  if (!kb) return false;

  // Modifier checks
  const altMatch = Boolean(kb.alt) === e.altKey;
  const ctrlMatch = Boolean(kb.ctrl) === e.ctrlKey;
  const shiftMatch = Boolean(kb.shift) === e.shiftKey;
  const metaMatch = Boolean(kb.meta) === e.metaKey;

  if (!altMatch || !ctrlMatch || !shiftMatch || !metaMatch) {
    return false;
  }

  // Key match: compare code (e.g. 'KeyS') or fallback to key
  return e.code === kb.key || e.key.toUpperCase() === formatKeyCode(kb.key);
}

/**
 * Checks if a keybinding causes known browser conflicts.
 * Soft warnings for shortcuts that browsers rarely or never allow overriding.
 */
export function checkBrowserConflict(kb: Keybinding): string | null {
  const formatted = formatKeyCode(kb.key).toUpperCase();

  // Strict browser-level shortcuts that cannot be reliably overridden in standard web pages
  if (kb.ctrl && !kb.alt && !kb.shift) {
    if (["N", "T", "W"].includes(formatted)) {
      return `Ctrl+${formatted} is strictly reserved by web browsers and may open a new tab/window or close the browser tab.`;
    }
  }

  return null;
}
