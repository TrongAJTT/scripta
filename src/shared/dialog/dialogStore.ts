import { create } from "zustand";

export type DialogVariant = "info" | "warning" | "danger" | "success";

export interface DialogCheckboxOptions {
  label: string;
  defaultChecked?: boolean;
}

export interface AlertOptions {
  title?: string;
  message: string;
  confirmText?: string;
  variant?: DialogVariant;
  checkbox?: DialogCheckboxOptions;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  checkbox?: DialogCheckboxOptions;
  defaultFocus?: "confirm" | "cancel";
}

export interface ConfirmResult {
  confirmed: boolean;
  checked: boolean;
}

export interface PromptOptions {
  title?: string;
  message: string;
  defaultValue?: string;
  initialValue?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  inputType?: "text" | "password";
  validate?: (value: string) => string | null | undefined;
}

export type DialogState =
  | {
      type: "alert";
      options: AlertOptions;
      resolve: (checked: boolean) => void;
    }
  | {
      type: "confirm";
      options: ConfirmOptions;
      resolve: (result: boolean | ConfirmResult) => void;
    }
  | {
      type: "prompt";
      options: PromptOptions;
      resolve: (result: string | null) => void;
    }
  | null;

interface DialogStore {
  currentDialog: DialogState;
  showDialog: (dialog: NonNullable<DialogState>) => void;
  closeDialog: () => void;
}

export const useDialogStore = create<DialogStore>((set) => ({
  currentDialog: null,
  showDialog: (dialog) => set({ currentDialog: dialog }),
  closeDialog: () => set({ currentDialog: null }),
}));

/**
 * Imperative Dialog Service.
 * Usable anywhere (inside hooks, callbacks, Zustand stores, async handlers).
 */
export const dialog = {
  alert: (optionsOrMessage: AlertOptions | string): Promise<boolean> => {
    const options: AlertOptions =
      typeof optionsOrMessage === "string"
        ? { message: optionsOrMessage }
        : optionsOrMessage;

    return new Promise<boolean>((resolve) => {
      useDialogStore.getState().showDialog({
        type: "alert",
        options,
        resolve: (checked: boolean) => {
          useDialogStore.getState().closeDialog();
          resolve(checked);
        },
      });
    });
  },

  confirm: (
    optionsOrMessage: ConfirmOptions | string,
  ): Promise<boolean & ConfirmResult> => {
    const options: ConfirmOptions =
      typeof optionsOrMessage === "string"
        ? { message: optionsOrMessage }
        : optionsOrMessage;

    return new Promise<boolean & ConfirmResult>((resolve) => {
      useDialogStore.getState().showDialog({
        type: "confirm",
        options,
        resolve: (res: boolean | ConfirmResult) => {
          useDialogStore.getState().closeDialog();
          const confirmed = typeof res === "boolean" ? res : res.confirmed;
          const checked = typeof res === "boolean" ? false : res.checked;

          if (options.checkbox) {
            // When checkbox is requested, return object with confirmed & checked
            resolve({
              confirmed,
              checked,
            } as unknown as boolean & ConfirmResult);
          } else {
            // Standard confirm: return clean primitive boolean so `if (confirmed)` is strictly truthy/falsy
            resolve(confirmed as unknown as boolean & ConfirmResult);
          }
        },
      });
    });
  },

  prompt: (
    optionsOrMessage: PromptOptions | string,
  ): Promise<string | null> => {
    const options: PromptOptions =
      typeof optionsOrMessage === "string"
        ? { message: optionsOrMessage }
        : optionsOrMessage;

    return new Promise<string | null>((resolve) => {
      useDialogStore.getState().showDialog({
        type: "prompt",
        options,
        resolve: (result: string | null) => {
          useDialogStore.getState().closeDialog();
          resolve(result);
        },
      });
    });
  },
};
