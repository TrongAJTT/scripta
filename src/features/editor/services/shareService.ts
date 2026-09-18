import { APP_TITLE } from "../../../core/constants/app";

export interface ShareResult {
  success: boolean;
  action:
    | "shared-file"
    | "shared-text"
    | "shared-app"
    | "copied-content"
    | "copied-link"
    | "cancelled"
    | "failed";
  message: string;
}

/**
 * Share the document file via Web Share API with files payload,
 * falling back to text sharing or clipboard copying.
 */
export const shareDocument = async (
  fileName: string,
  content: string,
): Promise<ShareResult> => {
  const safeName = fileName || "document.txt";

  try {
    const file = new File([content], safeName, {
      type: "text/plain",
    });

    if (
      typeof navigator !== "undefined" &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        files: [file],
        title: safeName,
      });
      return {
        success: true,
        action: "shared-file",
        message: "Shared file successfully",
      };
    }

    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({
        title: safeName,
        text: content,
      });
      return {
        success: true,
        action: "shared-text",
        message: "Shared content successfully",
      };
    }

    await navigator.clipboard.writeText(content);
    return {
      success: true,
      action: "copied-content",
      message: "File content copied to clipboard",
    };
  } catch (err) {
    if ((err as Error)?.name === "AbortError") {
      return {
        success: false,
        action: "cancelled",
        message: "Sharing cancelled",
      };
    }

    try {
      await navigator.clipboard.writeText(content);
      return {
        success: true,
        action: "copied-content",
        message: "File content copied to clipboard",
      };
    } catch {
      return {
        success: false,
        action: "failed",
        message: "Could not share or copy file",
      };
    }
  }
};

/**
 * Directly copy document text content to clipboard.
 */
export const copyDocumentContent = async (
  content: string,
): Promise<ShareResult> => {
  try {
    await navigator.clipboard.writeText(content);
    return {
      success: true,
      action: "copied-content",
      message: "Document content copied to clipboard",
    };
  } catch {
    return {
      success: false,
      action: "failed",
      message: "Failed to copy to clipboard",
    };
  }
};

/**
 * Share Scripta Web App link with description or fallback to copy URL.
 */
export const shareApp = async (): Promise<ShareResult> => {
  const url = window.location.origin;
  const title = APP_TITLE;
  const text = "Scripta - Modern, lightning-fast text & code editor for the web";

  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({
        title,
        text,
        url,
      });
      return {
        success: true,
        action: "shared-app",
        message: "Shared app successfully",
      };
    }

    await navigator.clipboard.writeText(url);
    return {
      success: true,
      action: "copied-link",
      message: "App link copied to clipboard",
    };
  } catch (err) {
    if ((err as Error)?.name === "AbortError") {
      return {
        success: false,
        action: "cancelled",
        message: "Sharing cancelled",
      };
    }

    try {
      await navigator.clipboard.writeText(url);
      return {
        success: true,
        action: "copied-link",
        message: "App link copied to clipboard",
      };
    } catch {
      return {
        success: false,
        action: "failed",
        message: "Could not share or copy app link",
      };
    }
  }
};

/**
 * Directly copy app origin URL to clipboard.
 */
export const copyAppLink = async (): Promise<ShareResult> => {
  try {
    await navigator.clipboard.writeText(window.location.origin);
    return {
      success: true,
      action: "copied-link",
      message: "App link copied to clipboard",
    };
  } catch {
    return {
      success: false,
      action: "failed",
      message: "Failed to copy app link",
    };
  }
};
