import { useWorkspaceStore } from "../store/workspaceStore";
import { dialog } from "../../../shared/dialog/dialogStore";

export async function promptCreateWorkspace(): Promise<void> {
  const name = await dialog.prompt({
    title: "New Workspace",
    message: "Enter a name for the new workspace:",
    placeholder: "e.g. Project Alpha, Notes, Scratchpad",
    confirmText: "Create",
    cancelText: "Cancel",
  });
  if (name && name.trim()) {
    await useWorkspaceStore.getState().createWorkspace(name.trim());
  }
}

export async function promptRenameWorkspace(
  id: string,
  currentName: string,
): Promise<void> {
  const newName = await dialog.prompt({
    title: "Rename Workspace",
    message: "Enter a new name for this workspace:",
    initialValue: currentName,
    confirmText: "Rename",
    cancelText: "Cancel",
  });
  if (newName && newName.trim() && newName.trim() !== currentName) {
    await useWorkspaceStore.getState().renameWorkspace(id, newName.trim());
  }
}

export async function promptDeleteWorkspace(
  id: string,
  name: string,
): Promise<void> {
  const workspaces = useWorkspaceStore.getState().workspaces;
  if (workspaces.length <= 1) {
    await dialog.alert({
      title: "Cannot Delete Workspace",
      message: "You must have at least one active workspace.",
      variant: "info",
    });
    return;
  }
  const confirmed = await dialog.confirm({
    title: "Delete Workspace",
    message: `Are you sure you want to delete workspace "${name}"?\nAll tabs inside this workspace will be removed.`,
    confirmText: "Delete",
    cancelText: "Cancel",
    variant: "danger",
    defaultFocus: "cancel",
  });
  if (confirmed) {
    await useWorkspaceStore.getState().deleteWorkspace(id);
  }
}
