import { openDB, type IDBPDatabase } from "idb";
import type { FileTab, RecentFileEntry } from "../types/file.types";
import type {
  ScriptFunction,
  ScriptMetadata,
} from "../../features/scripts/types/script.types";
import type { WorkspaceSession } from "../types/workspace.types";
import {
  encryptWithDeviceKey,
  decryptWithDeviceKey,
  isDeviceEncryptedRecord,
} from "./cryptoUtils";

const DB_NAME = "TextEditorDB";
const DB_VERSION = 6;
const STORE_NAME = "tabs_session";
const SETTINGS_STORE = "settings";
const SCRIPT_FUNCTIONS_STORE = "script_functions";
const SCRIPTS_STORE = "scripts";
const WORKSPACES_STORE = "workspaces";
const RECENT_FILES_STORE = "recent_files";
const CLOUD_AUTH_STORE = "cloud_auth";
const DEVICE_KEYS_STORE = "device_keys";
const DEVICE_AUTH_KEY_ID = "auth_storage_key";

interface SessionRecord {
  tabs: FileTab[];
  activeTabId: string | null;
}

let dbPromise: Promise<IDBPDatabase> | null = null;
let cachedDeviceKey: CryptoKey | null = null;

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
        if (!db.objectStoreNames.contains(CLOUD_AUTH_STORE)) {
          db.createObjectStore(CLOUD_AUTH_STORE);
        }
        if (!db.objectStoreNames.contains(DEVICE_KEYS_STORE)) {
          db.createObjectStore(DEVICE_KEYS_STORE);
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Retrieves or generates an internal, non-extractable AES-GCM 256-bit CryptoKey.
 * Marked as extractable: false so raw key bytes cannot be inspected via console.
 */
async function getOrCreateDeviceKey(): Promise<CryptoKey | null> {
  if (cachedDeviceKey) return cachedDeviceKey;
  try {
    const db = await getDB();
    const existing = await db.get(DEVICE_KEYS_STORE, DEVICE_AUTH_KEY_ID);
    if (existing instanceof CryptoKey) {
      cachedDeviceKey = existing;
      return existing;
    }

    // Generate non-extractable key
    const newKey = await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      false, // non-extractable!
      ["encrypt", "decrypt"],
    );

    await db.put(DEVICE_KEYS_STORE, newKey, DEVICE_AUTH_KEY_ID);
    cachedDeviceKey = newKey;
    return newKey;
  } catch (error) {
    console.warn("Web Crypto device key generation unavailable, fallback to standard store", error);
    return null;
  }
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

// ---------------------------------------------------------------------------
// Cloud Storage Auth Data
// ---------------------------------------------------------------------------

export async function loadCloudAuth<T>(key: string): Promise<T | null> {
  try {
    const db = await getDB();
    const rawResult = await db.get(CLOUD_AUTH_STORE, key);
    if (!rawResult) return null;

    if (isDeviceEncryptedRecord(rawResult)) {
      const deviceKey = await getOrCreateDeviceKey();
      if (!deviceKey) {
        throw new Error("Unable to retrieve device decryption key.");
      }
      const decryptedJson = await decryptWithDeviceKey(rawResult, deviceKey);
      return JSON.parse(decryptedJson) as T;
    }

    return null;
  } catch (error) {
    console.warn(`Failed to load or decrypt cloud auth for "${key}" from IndexedDB`, error);
    return null;
  }
}

export async function saveCloudAuth<T>(key: string, data: T): Promise<void> {
  try {
    const db = await getDB();
    const deviceKey = await getOrCreateDeviceKey();

    if (deviceKey) {
      // Encrypt sensitive auth tokens before saving into IndexedDB
      const serialized = JSON.stringify(data);
      const encryptedRecord = await encryptWithDeviceKey(serialized, deviceKey);
      await db.put(CLOUD_AUTH_STORE, encryptedRecord, key);
    } else {
      // Fallback if Web Crypto is unavailable
      await db.put(CLOUD_AUTH_STORE, data, key);
    }
  } catch (error) {
    console.warn(`Failed to encrypt and save cloud auth for "${key}" to IndexedDB`, error);
  }
}

export async function deleteCloudAuth(key: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(CLOUD_AUTH_STORE, key);
  } catch (error) {
    console.warn(`Failed to delete cloud auth for "${key}" from IndexedDB`, error);
  }
}

