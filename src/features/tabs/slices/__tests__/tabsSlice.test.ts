import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useEditorStore, cancelPendingSessionSave } from "../../store";

vi.mock("../../../../core/utils/idbStorage", () => ({
  saveSessionTabs: vi.fn().mockResolvedValue(undefined),
  loadSessionTabs: vi.fn().mockResolvedValue(null),
  saveSettings: vi.fn().mockResolvedValue(undefined),
  loadSettings: vi.fn().mockResolvedValue(null),
  saveWorkspace: vi.fn().mockResolvedValue(undefined),
  loadWorkspaces: vi.fn().mockResolvedValue([]),
  deleteWorkspace: vi.fn().mockResolvedValue(undefined),
  saveActiveWorkspaceId: vi.fn().mockResolvedValue(undefined),
  loadActiveWorkspaceId: vi.fn().mockResolvedValue(null),
  saveRecentFiles: vi.fn().mockResolvedValue(undefined),
  loadRecentFiles: vi.fn().mockResolvedValue([]),
}));

describe("tabsSlice (via useEditorStore)", () => {
  beforeEach(() => {
    useEditorStore.setState({
      tabs: [],
      activeTabId: null,
      recentTabIds: [],
      bypassedPreviewTabIds: [],
    });
  });

  afterEach(() => {
    cancelPendingSessionSave();
  });

  it("creates tabs with auto-detected language and sets activeTabId", () => {
    const store = useEditorStore.getState();
    store.createTab("diagram.mmd", "graph TD\nA-->B");

    const state = useEditorStore.getState();
    expect(state.tabs).toHaveLength(1);
    expect(state.tabs[0].name).toBe("diagram.mmd");
    expect(state.tabs[0].language).toBe("mermaid");
    expect(state.tabs[0].previewType).toBe("mermaid");
    expect(state.activeTabId).toBe(state.tabs[0].id);
  });

  it("auto-creates a fresh tab when closing the last tab", () => {
    const store = useEditorStore.getState();
    store.createTab("temp.txt", "hello");
    const tabId = useEditorStore.getState().tabs[0].id;

    store.closeTab(tabId);

    const state = useEditorStore.getState();
    expect(state.tabs).toHaveLength(1);
    expect(state.tabs[0].name).toBe("new 1");
    expect(state.activeTabId).toBe(state.tabs[0].id);
  });

  it("pins tabs to the front and prevents reordering across pin groups", () => {
    const store = useEditorStore.getState();
    store.createTab("a.txt", "a");
    store.createTab("b.txt", "b");
    store.createTab("c.txt", "c");

    const thirdId = useEditorStore.getState().tabs[2].id;
    store.togglePinTab(thirdId);

    let names = useEditorStore.getState().tabs.map((t) => t.name);
    expect(names).toEqual(["c.txt", "a.txt", "b.txt"]);

    // Attempt to reorder pinned tab (index 0) with unpinned tab (index 1) -> ignored
    store.reorderTabs(0, 1);
    names = useEditorStore.getState().tabs.map((t) => t.name);
    expect(names).toEqual(["c.txt", "a.txt", "b.txt"]);

    // Reorder within unpinned group (index 1 <-> index 2) -> allowed
    store.reorderTabs(1, 2);
    names = useEditorStore.getState().tabs.map((t) => t.name);
    expect(names).toEqual(["c.txt", "b.txt", "a.txt"]);
  });

  it("tracks content modifications, line endings, and language changes", () => {
    const store = useEditorStore.getState();
    store.createTab("note.txt", "line1\nline2");
    const id = useEditorStore.getState().tabs[0].id;

    store.updateTabContent(id, "line1\r\nline2");
    let tab = useEditorStore.getState().tabs[0];
    expect(tab.isModified).toBe(true);
    expect(tab.lineEnding).toBe("CRLF");

    store.convertLineEnding(id, "LF");
    tab = useEditorStore.getState().tabs[0];
    expect(tab.content).toBe("line1\nline2");
    expect(tab.lineEnding).toBe("LF");
    expect(tab.isModified).toBe(false);

    store.setLanguageForActiveTab("markdown");
    tab = useEditorStore.getState().tabs[0];
    expect(tab.language).toBe("markdown");
    expect(tab.name).toBe("note.md");
    expect(tab.previewType).toBe("markdown");
  });

  it("closes only unmodified and unpinned tabs in closeSavedTabs", () => {
    const store = useEditorStore.getState();
    store.createTab("saved.txt", "1");
    store.createTab("modified.txt", "2");
    store.createTab("pinned-saved.txt", "3");

    const tabs = useEditorStore.getState().tabs;
    store.updateTabContent(tabs[1].id, "2-edited");
    store.togglePinTab(tabs[2].id);

    store.closeSavedTabs();

    const remainingNames = useEditorStore.getState().tabs.map((t) => t.name);
    expect(remainingNames).toEqual(["pinned-saved.txt", "modified.txt"]);
  });
});
