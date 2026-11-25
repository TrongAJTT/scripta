import { create } from "zustand";
import { createTabsSlice } from "./slices/tabsSlice";
import { createFileIoSlice } from "./slices/fileIoSlice";
import { createExternalWatcherSlice } from "./slices/externalWatcherSlice";
import { createSettingsViewSlice } from "./slices/settingsViewSlice";
import type { EditorState } from "./slices/types";

export { cancelPendingSessionSave } from "./slices/sessionHelpers";
export type { EditorState } from "./slices/types";

export const useEditorStore = create<EditorState>()((...a) => ({
  ...createTabsSlice(...a),
  ...createFileIoSlice(...a),
  ...createExternalWatcherSlice(...a),
  ...createSettingsViewSlice(...a),
}));
