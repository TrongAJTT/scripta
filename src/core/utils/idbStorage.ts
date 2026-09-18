import { openDB, type IDBPDatabase } from "idb";
import type { FileTab, RecentFileEntry } from "../types/file.types";
import type {
  ScriptFunction,
  ScriptMetadata,
} from "../../features/scripts/types/script.types";
import type { WorkspaceSession } from "../types/workspace.types";

const DB_NAME = "TextEditorDB";
const DB_VERSION = 4;
const STORE_NAME = "tabs_session";
const SETTINGS_STORE = "settings";
const SCRIPT_FUNCTIONS_STORE = "script_functions";
const SCRIPTS_STORE = "scripts";
const WORKSPACES_STORE = "workspaces";
const RECENT_FILES_STORE = "recent_files";

interface SessionRecord {
  tabs: FileTab[];
  activeTabId: string | null;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, _oldVersion) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE);
        }
        if (!db.objectStoreNames.contains(SCRIPT_FUNCTIONS_STORE)) {
          db.createObjectStore(SCRIPT_FUNCTIONS_STORE, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(SCRIPTS_STORE)) {
          db.createObjectStore(SCRIPTS_STORE, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(WORKSPACES_STORE)) {
          db.createObjectStore(WORKSPACES_STORE, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(RECENT_FILES_STORE)) {
          db.createObjectStore(RECENT_FILES_STORE);
        }
      },
    });
  }
  return dbPromise;
}

export async function saveSessionTabs(
  tabs: FileTab[],
  activeTabId: string | null,
): Promise<void> {
  try {
    const db = await getDB();
    // Try saving tabs directly including FileSystemFileHandle via structured clone
    try {
      await db.put(
        STORE_NAME,
        { tabs, activeTabId },
        "current_session",
      );
    } catch {
      // Fallback: If browser fails to serialize FileSystemFileHandle, sanitize it
      const sanitizedTabs = tabs.map((t) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { fileHandle, ...rest } = t;
        return rest;
      });
      await db.put(
        STORE_NAME,
        { tabs: sanitizedTabs, activeTabId },
        "current_session",
      );
    }
  } catch (error) {
    console.warn("Failed to save tabs session to IndexedDB", error);
  }
}

export async function loadSessionTabs(): Promise<SessionRecord | null> {
  try {
    const db = await getDB();
    const data = await db.get(STORE_NAME, "current_session");
    return data || null;
  } catch (error) {
    console.warn("Failed to load tabs session from IndexedDB", error);
    return null;
  }
}

export async function saveSettings(
  settings: import("../types/file.types").EditorSettings,
): Promise<void> {
  try {
    const db = await getDB();
    await db.put(SETTINGS_STORE, settings, "app-settings");
  } catch (error) {
    console.warn("Failed to save settings to IndexedDB", error);
  }
}

export async function loadSettings(): Promise<
  import("../types/file.types").EditorSettings | null
> {
  try {
    const db = await getDB();
    const data = await db.get(SETTINGS_STORE, "app-settings");
    return data || null;
  } catch (error) {
    console.warn("Failed to load settings from IndexedDB", error);
    return null;
  }
}

export async function loadScriptFunctions(): Promise<ScriptFunction[]> {
  try {
    const db = await getDB();
    return await db.getAll(SCRIPT_FUNCTIONS_STORE);
  } catch (error) {
    console.warn("Failed to load script functions from IndexedDB", error);
    return [];
  }
}

export async function saveScriptFunction(fn: ScriptFunction): Promise<void> {
  try {
    const db = await getDB();
    await db.put(SCRIPT_FUNCTIONS_STORE, fn);
  } catch (error) {
    console.warn("Failed to save script function to IndexedDB", error);
  }
}

export async function deleteScriptFunction(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(SCRIPT_FUNCTIONS_STORE, id);
  } catch (error) {
    console.warn("Failed to delete script function from IndexedDB", error);
  }
}

export async function loadScripts(): Promise<ScriptMetadata[]> {
  try {
    const db = await getDB();
    return await db.getAll(SCRIPTS_STORE);
  } catch (error) {
    console.warn("Failed to load scripts from IndexedDB", error);
    return [];
  }
}

export async function saveScript(script: ScriptMetadata): Promise<void> {
  try {
    const db = await getDB();
    await db.put(SCRIPTS_STORE, script);
  } catch (error) {
    console.warn("Failed to save script to IndexedDB", error);
  }
}

export async function deleteScript(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(SCRIPTS_STORE, id);
  } catch (error) {
    console.warn("Failed to delete script from IndexedDB", error);
  }
}

// ---------------------------------------------------------------------------
// Workspaces / Sessions Storage
// ---------------------------------------------------------------------------

export async function loadWorkspaces(): Promise<WorkspaceSession[]> {
  try {
    const db = await getDB();
    return await db.getAll(WORKSPACES_STORE);
  } catch (error) {
    console.warn("Failed to load workspaces from IndexedDB", error);
    return [];
  }
}

export async function saveWorkspace(ws: WorkspaceSession): Promise<void> {
  try {
    const db = await getDB();
    await db.put(WORKSPACES_STORE, ws);
  } catch (error) {
    console.warn("Failed to save workspace to IndexedDB", error);
  }
}

export async function deleteWorkspace(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(WORKSPACES_STORE, id);
  } catch (error) {
    console.warn("Failed to delete workspace from IndexedDB", error);
  }
}

export async function saveActiveWorkspaceId(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.put(SETTINGS_STORE, id, "active-workspace-id");
  } catch (error) {
    console.warn("Failed to save active workspace id to IndexedDB", error);
  }
}

export async function loadActiveWorkspaceId(): Promise<string | null> {
  try {
    const db = await getDB();
    return (await db.get(SETTINGS_STORE, "active-workspace-id")) || null;
  } catch (error) {
    console.warn("Failed to load active workspace id from IndexedDB", error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Recent Files Storage
// ---------------------------------------------------------------------------

export async function loadRecentFiles(): Promise<RecentFileEntry[]> {
  try {
    const db = await getDB();
    const records = await db.get(RECENT_FILES_STORE, "recent_list");
    return Array.isArray(records) ? records : [];
  } catch (error) {
    console.warn("Failed to load recent files from IndexedDB", error);
    return [];
  }
}

export async function saveRecentFiles(entries: RecentFileEntry[]): Promise<void> {
  try {
    const db = await getDB();
    await db.put(RECENT_FILES_STORE, entries, "recent_list");
  } catch (error) {
    console.warn("Failed to save recent files to IndexedDB", error);
  }
}

export async function clearRecentFilesStorage(): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(RECENT_FILES_STORE, "recent_list");
  } catch (error) {
    console.warn("Failed to clear recent files from IndexedDB", error);
  }
}

