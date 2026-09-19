import { create } from "zustand";
import type { WorkspaceSession } from "../../../core/types/workspace.types";
import type { FileTab } from "../../../core/types/file.types";
import {
  loadWorkspaces,
  saveWorkspace,
  deleteWorkspace as idbDeleteWorkspace,
  saveActiveWorkspaceId,
  loadActiveWorkspaceId,
} from "../../../core/utils/idbStorage";
import { useEditorStore, cancelPendingSessionSave } from "../../tabs/store";

export interface WorkspaceStoreState {
  workspaces: WorkspaceSession[];
  activeWorkspaceId: string | null;
  isLoading: boolean;

  // Actions
  initWorkspaces: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  createWorkspace: (
    name: string,
    description?: string,
  ) => Promise<WorkspaceSession>;
  saveCurrentWorkspaceState: () => Promise<void>;
  renameWorkspace: (workspaceId: string, newName: string) => Promise<void>;
  deleteWorkspace: (workspaceId: string) => Promise<void>;
  duplicateWorkspace: (
    workspaceId: string,
    newName: string,
  ) => Promise<WorkspaceSession>;
  markWorkspaceSynced: (
    workspaceId: string,
    provider: "dropbox" | "github",
    timestamp?: number,
  ) => Promise<void>;
  applyWorkspaceSession: (
    workspace: WorkspaceSession,
    isNewCopy?: boolean,
  ) => Promise<WorkspaceSession>;
}

export const useWorkspaceStore = create<WorkspaceStoreState>((set, get) => ({
  workspaces: [],
  activeWorkspaceId: null,
  isLoading: true,

  initWorkspaces: async () => {
    try {
      const storedWorkspaces = await loadWorkspaces();
      let activeId = await loadActiveWorkspaceId();

      // If no workspaces exist yet in DB, create initial default workspace
      if (storedWorkspaces.length === 0) {
        const editorTabs = useEditorStore.getState().tabs;
        const activeTabId = useEditorStore.getState().activeTabId;

        const defaultWs: WorkspaceSession = {
          id: crypto.randomUUID(),
          name: "Default",
          description: "Default primary workspace",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          activeTabId,
          tabs: editorTabs,
        };

        await saveWorkspace(defaultWs);
        await saveActiveWorkspaceId(defaultWs.id);

        set({
          workspaces: [defaultWs],
          activeWorkspaceId: defaultWs.id,
          isLoading: false,
        });
        return;
      }

      // Check if stored activeId is valid
      if (!activeId || !storedWorkspaces.some((w) => w.id === activeId)) {
        activeId = storedWorkspaces[0].id;
        await saveActiveWorkspaceId(activeId);
      }

      set({
        workspaces: storedWorkspaces,
        activeWorkspaceId: activeId,
        isLoading: false,
      });
    } catch (err) {
      console.warn("Failed to initialize workspaces", err);
      set({ isLoading: false });
    }
  },

  saveCurrentWorkspaceState: async () => {
    const { activeWorkspaceId, workspaces } = get();
    if (!activeWorkspaceId) return;

    const currentWs = workspaces.find((w) => w.id === activeWorkspaceId);
    if (!currentWs) return;

    const editorTabs = useEditorStore.getState().tabs;
    const activeTabId = useEditorStore.getState().activeTabId;

    const updatedWs: WorkspaceSession = {
      ...currentWs,
      updatedAt: Date.now(),
      activeTabId,
      tabs: editorTabs,
    };

    await saveWorkspace(updatedWs);

    set({
      workspaces: workspaces.map((w) =>
        w.id === activeWorkspaceId ? updatedWs : w,
      ),
    });
  },

  switchWorkspace: async (workspaceId: string) => {
    const { activeWorkspaceId, workspaces } = get();
    if (workspaceId === activeWorkspaceId) return;

    const targetWs = workspaces.find((w) => w.id === workspaceId);
    if (!targetWs) return;

    // 1. Save current workspace's tabs first
    if (activeWorkspaceId) {
      await get().saveCurrentWorkspaceState();
    }

    // 2. Restore tabs for target workspace
    const restoredTabs: FileTab[] = targetWs.tabs.map((t) => ({
      ...t,
      isModified: t.content !== t.savedContent,
    }));

    // Fallback if target workspace has no tabs
    if (restoredTabs.length === 0) {
      useEditorStore.getState().closeAllTabs();
    } else {
      const activeId =
        targetWs.activeTabId &&
        restoredTabs.some((t) => t.id === targetWs.activeTabId)
          ? targetWs.activeTabId
          : restoredTabs[0].id;

      useEditorStore.setState({
        tabs: restoredTabs,
        activeTabId: activeId,
      });
    }

    // 3. Update active workspace id
    await saveActiveWorkspaceId(workspaceId);
    set({ activeWorkspaceId: workspaceId });
  },

  createWorkspace: async (name: string, description?: string) => {
    const { workspaces, activeWorkspaceId } = get();

    // Auto-save current workspace state first
    if (activeWorkspaceId) {
      await get().saveCurrentWorkspaceState();
    }

    // Create fresh workspace with a blank initial tab
    const freshTabId = crypto.randomUUID();
    const initialTabs: FileTab[] = [
      {
        id: freshTabId,
        name: "welcome.md",
        content: "# New Workspace\n\nStart writing or open files here...",
        savedContent: "# New Workspace\n\nStart writing or open files here...",
        language: "markdown",
        isModified: false,
        encoding: "UTF-8",
        lineEnding: "LF",
        previewType: "markdown",
        cursorPos: { line: 1, col: 1, selectedChars: 0 },
      },
    ];

    const newWs: WorkspaceSession = {
      id: crypto.randomUUID(),
      name: name.trim() || "Untitled Workspace",
      description: description?.trim() || "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      activeTabId: freshTabId,
      tabs: initialTabs,
    };

    await saveWorkspace(newWs);
    await saveActiveWorkspaceId(newWs.id);

    // Apply new tabs to editor store
    useEditorStore.setState({
      tabs: initialTabs,
      activeTabId: freshTabId,
    });

    set({
      workspaces: [...workspaces, newWs],
      activeWorkspaceId: newWs.id,
    });

    return newWs;
  },

  renameWorkspace: async (workspaceId: string, newName: string) => {
    const { workspaces } = get();
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (!ws) return;

    const trimmed = newName.trim();
    if (!trimmed || trimmed === ws.name) return;

    const updatedWs: WorkspaceSession = {
      ...ws,
      name: trimmed,
      updatedAt: Date.now(),
    };

    await saveWorkspace(updatedWs);
    set({
      workspaces: workspaces.map((w) => (w.id === workspaceId ? updatedWs : w)),
    });
  },

  duplicateWorkspace: async (workspaceId: string, newName: string) => {
    const { workspaces } = get();
    const sourceWs = workspaces.find((w) => w.id === workspaceId);
    if (!sourceWs) throw new Error("Workspace not found");

    const duplicatedWs: WorkspaceSession = {
      ...sourceWs,
      id: crypto.randomUUID(),
      name: newName.trim() || `${sourceWs.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      // Generate new IDs for tabs
      tabs: sourceWs.tabs.map((t) => ({ ...t, id: crypto.randomUUID() })),
    };
    duplicatedWs.activeTabId = duplicatedWs.tabs[0]?.id || null;

    await saveWorkspace(duplicatedWs);
    set({
      workspaces: [...workspaces, duplicatedWs],
    });

    return duplicatedWs;
  },

  deleteWorkspace: async (workspaceId: string) => {
    const { workspaces, activeWorkspaceId } = get();
    if (workspaces.length <= 1) {
      throw new Error("Cannot delete the only workspace");
    }

    // 1. Cancel any pending debounced auto-save from tabs store
    cancelPendingSessionSave();

    // 2. Compute remaining workspaces
    const remaining = workspaces.filter((w) => w.id !== workspaceId);

    // 3. Delete from IndexedDB
    await idbDeleteWorkspace(workspaceId);

    // 4. Update memory state immediately to exclude deleted workspace
    if (activeWorkspaceId === workspaceId) {
      const nextWs = remaining[0];
      const restoredTabs: FileTab[] = nextWs.tabs.map((t) => ({
        ...t,
        isModified: t.content !== t.savedContent,
      }));

      const activeId =
        nextWs.activeTabId &&
        restoredTabs.some((t) => t.id === nextWs.activeTabId)
          ? nextWs.activeTabId
          : restoredTabs[0]?.id || null;

      useEditorStore.setState({
        tabs: restoredTabs,
        activeTabId: activeId,
      });

      await saveActiveWorkspaceId(nextWs.id);
      set({
        workspaces: remaining,
        activeWorkspaceId: nextWs.id,
      });
    } else {
      set({ workspaces: remaining });
    }
  },

  markWorkspaceSynced: async (
    workspaceId: string,
    provider: "dropbox" | "github",
    timestamp?: number,
  ) => {
    const { workspaces } = get();
    const targetWs = workspaces.find((w) => w.id === workspaceId);
    if (!targetWs) return;

    const syncedAt = timestamp || Date.now();
    const updatedWs: WorkspaceSession = {
      ...targetWs,
      lastSyncedAt: syncedAt,
      lastSyncedProvider: provider,
    };

    await saveWorkspace(updatedWs);

    set({
      workspaces: workspaces.map((w) => (w.id === workspaceId ? updatedWs : w)),
    });
  },

  applyWorkspaceSession: async (
    workspace: WorkspaceSession,
    isNewCopy: boolean = false,
  ) => {
    // Cancel any debounced auto-saves from previous editor tabs
    cancelPendingSessionSave();

    const { workspaces } = get();

    let targetWs: WorkspaceSession;
    if (isNewCopy) {
      targetWs = {
        ...workspace,
        id: crypto.randomUUID(),
        name: `${workspace.name} (Cloud Copy)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tabs: workspace.tabs.map((t) => ({ ...t, id: crypto.randomUUID() })),
      };
      targetWs.activeTabId = targetWs.tabs[0]?.id || null;
    } else {
      targetWs = {
        ...workspace,
        updatedAt: Date.now(),
      };
    }

    // 1. Persist directly to IndexedDB
    await saveWorkspace(targetWs);
    await saveActiveWorkspaceId(targetWs.id);

    // 2. Prepare restored tabs
    const restoredTabs: FileTab[] = targetWs.tabs.map((t) => ({
      ...t,
      isModified: t.content !== t.savedContent,
    }));

    // 3. Immediately activate tabs in editor store
    if (restoredTabs.length === 0) {
      useEditorStore.getState().closeAllTabs();
    } else {
      const activeId =
        targetWs.activeTabId &&
        restoredTabs.some((t) => t.id === targetWs.activeTabId)
          ? targetWs.activeTabId
          : restoredTabs[0].id;

      useEditorStore.setState({
        tabs: restoredTabs,
        activeTabId: activeId,
      });
    }

    // 4. Update workspace store state
    const existingIndex = workspaces.findIndex((w) => w.id === targetWs.id);
    let updatedWorkspaces: WorkspaceSession[];

    if (existingIndex >= 0) {
      updatedWorkspaces = workspaces.map((w) =>
        w.id === targetWs.id ? targetWs : w,
      );
    } else {
      updatedWorkspaces = [...workspaces, targetWs];
    }

    set({
      workspaces: updatedWorkspaces,
      activeWorkspaceId: targetWs.id,
    });

    return targetWs;
  },
}));
