import { create } from "zustand";

/**
 * Per-tab snapshot of the preview panel's interactive state.
 * Persists across tab switches within the same browser session,
 * but resets on page reload (no persistence middleware).
 */
export interface TabPreviewSession {
  filterQuery: string;
  currentPage: number;
  pageSize: number;
  sortState: { column: string | null; direction: "asc" | "desc" | null };
  isMergedView: boolean;
}

const DEFAULT_SESSION: TabPreviewSession = {
  filterQuery: "",
  currentPage: 1,
  pageSize: 50,
  sortState: { column: null, direction: null },
  isMergedView: false,
};

interface PreviewSessionState {
  sessions: Record<string, TabPreviewSession>;
  /** Returns session for tabId, creating a default entry if absent. */
  getSession: (tabId: string) => TabPreviewSession;
  /** Merges a partial patch into the session for tabId. */
  updateSession: (tabId: string, patch: Partial<TabPreviewSession>) => void;
  /** Removes session when the tab is closed — prevents memory leaks. */
  clearSession: (tabId: string) => void;
}

export const usePreviewSessionStore = create<PreviewSessionState>((set, get) => ({
  sessions: {},

  getSession: (tabId: string): TabPreviewSession => {
    return get().sessions[tabId] ?? { ...DEFAULT_SESSION };
  },

  updateSession: (tabId: string, patch: Partial<TabPreviewSession>): void => {
    set((state) => ({
      sessions: {
        ...state.sessions,
        [tabId]: {
          ...(state.sessions[tabId] ?? { ...DEFAULT_SESSION }),
          ...patch,
        },
      },
    }));
  },

  clearSession: (tabId: string): void => {
    set((state) => {
      const next = { ...state.sessions };
      delete next[tabId];
      return { sessions: next };
    });
  },
}));
