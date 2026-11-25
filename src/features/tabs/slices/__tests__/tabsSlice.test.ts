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
      tabGroups: [],
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

  it("creates, collapses, ungroups, and prunes tab groups", async () => {
    const store = useEditorStore.getState();
    store.createTab("one.md", "# 1");
    store.createTab("two.md", "# 2");
    const [tab1, tab2] = useEditorStore.getState().tabs;

    const groupId = store.createTabGroup("Docs", "blue", tab1.id);
    expect(useEditorStore.getState().tabGroups).toHaveLength(1);
    expect(useEditorStore.getState().tabs[0].groupId).toBe(groupId);

    store.assignTabToGroup(tab2.id, groupId);
    expect(useEditorStore.getState().tabs[1].groupId).toBe(groupId);

    store.toggleTabGroupCollapse(groupId);
    expect(useEditorStore.getState().tabGroups[0].collapsed).toBe(true);

    // Pinning a grouped tab removes it from the group
    store.togglePinTab(tab1.id);
    expect(useEditorStore.getState().tabs[0].isPinned).toBe(true);
    expect(useEditorStore.getState().tabs[0].groupId).toBeUndefined();
    expect(useEditorStore.getState().tabGroups).toHaveLength(1);

    // Closing the last tab in the group prunes the empty group
    store.closeTab(tab2.id);
    expect(useEditorStore.getState().tabGroups).toHaveLength(0);

    // New group + ungroup
    const groupId2 = store.createTabGroup("Notes", "purple");
    store.createTabInGroup(groupId2);
    expect(useEditorStore.getState().tabGroups).toHaveLength(1);
    expect(
      useEditorStore.getState().tabs.some((t) => t.groupId === groupId2),
    ).toBe(true);

    store.ungroupTabGroup(groupId2);
    expect(useEditorStore.getState().tabGroups).toHaveLength(0);
    expect(
      useEditorStore.getState().tabs.some((t) => t.groupId === groupId2),
    ).toBe(false);

    // Close group removes all tabs in that group
    store.createTab("three.txt", "3");
    const tab3 = useEditorStore.getState().tabs.find((t) => t.name === "three.txt")!;
    const groupId3 = store.createTabGroup("Temp", "rose", tab3.id);
    await store.closeTabGroup(groupId3);
    expect(useEditorStore.getState().tabGroups).toHaveLength(0);
    expect(
      useEditorStore.getState().tabs.some((t) => t.id === tab3.id),
    ).toBe(false);
  });

  it("adopts target tab groupId only when landing inside group span", () => {
    const store = useEditorStore.getState();
    store.createTab("a.txt", "a");
    store.createTab("b.txt", "b");
    store.createTab("c.txt", "c");
    const [tabA, tabB, tabC] = useEditorStore.getState().tabs;

    const groupId = store.createTabGroup("Work", "emerald", tabB.id);
    store.assignTabToGroup(tabC.id, groupId);

    // Drag ungrouped tabA (index 0) past outermost tabC (index 2) -> stays ungrouped
    store.reorderTabs(0, 2);
    expect(
      useEditorStore.getState().tabs.find((t) => t.id === tabA.id)?.groupId,
    ).toBeUndefined();

    // Drag ungrouped tabA (now index 2) back onto tabC (index 1, inside [header..tabC]) -> joins group
    store.reorderTabs(2, 1);
    expect(
      useEditorStore.getState().tabs.find((t) => t.id === tabA.id)?.groupId,
    ).toBe(groupId);
  });
});
