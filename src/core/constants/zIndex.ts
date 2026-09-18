/**
 * Centralized Z-Index Hierarchy for Scripta
 *
 * Ensures consistent layering across:
 * - Base workspace elements (editor, toolbars, splitters)
 * - Standard dropdowns, popovers, and context menus
 * - Base application modals (Script Manager, Preferences, Shortcuts, Insert Character)
 * - Secondary nested modals (Add Template Modal, Code Runner Modal)
 * - Global imperative dialog host (Alert, Confirm, Prompt)
 * - Supreme popups (Portaled dropdown menus that must float over everything)
 */
export const Z_INDEX = {
  // Base App Layout
  BASE: 0,
  TOOLBAR: 30,
  MENUBAR: 40,

  // Floating widgets inside workspace
  WORKSPACE_FLOATING: 50, // e.g. Drag overlay, find/replace floating box

  // Standard Modals (Preferences, ShortcutMapper, ScriptManager, InsertCharacter)
  MODAL_BASE: 1000,
  MODAL_CONTENT: 1010,

  // Nested / Secondary Modals (Add Template, Run Script modal spawned inside Script Manager)
  MODAL_SECONDARY: 1200,

  // Imperative Global Dialogs (alert, confirm, prompt) - must always be above modals
  GLOBAL_DIALOG: 2000,

  // Highest layer - Portaled Dropdown & Context menus that might be triggered inside modals
  DROPDOWN_PORTAL: 9999,
} as const;

export type ZIndexLevel = keyof typeof Z_INDEX;
