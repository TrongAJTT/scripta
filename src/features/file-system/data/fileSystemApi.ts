import type { FileTab } from "../../../core/types/file.types";
import {
  detectLanguageFromFilename,
  detectLineEnding,
} from "../../../core/utils/fileDetection";
import {
  detectEncodingFromBuffer,
  decodeBuffer,
  encodeString,
} from "../../../core/utils/encodingUtils";
import type { SupportedEncoding } from "../../../core/utils/encodingUtils";
import { triggerFileDownload } from "../../../core/utils/downloadUtils";

export const isFileSystemAccessSupported =
  typeof window !== "undefined" && "showOpenFilePicker" in window;

export async function createFileTabFromHandle(
  handle: FileSystemFileHandle,
): Promise<FileTab | null> {
  try {
    const hasPermission = await verifyPermission(handle, false);
    if (!hasPermission) {
      return null;
    }

    const file: File = await handle.getFile();
    const isImage =
      file.type.startsWith("image/") && !file.name.endsWith(".svg");

    let content = "";
    let imageDataUrl: string | undefined;
    let rawBuffer: Uint8Array | undefined;
    let detectedEncoding: SupportedEncoding = "UTF-8";

    if (isImage) {
      imageDataUrl = await readFileAsDataURL(file);
      content = `/* Image viewer: ${file.name} (${file.type}) */`;
    } else {
      const arrayBuf = await file.arrayBuffer();
      rawBuffer = new Uint8Array(arrayBuf);
      const det = detectEncodingFromBuffer(rawBuffer);
      detectedEncoding = det.encoding;
      content = decodeBuffer(rawBuffer, detectedEncoding);
    }

    const { language, previewType } = detectLanguageFromFilename(file.name);

    return {
      id: crypto.randomUUID(),
      name: file.name,
      content,
      savedContent: content,
      language,
      fileHandle: handle,
      isModified: false,
      encoding: detectedEncoding,
      rawBuffer,
      lineEnding: detectLineEnding(content),
      previewType: isImage ? "image" : previewType,
      imageDataUrl,
      fileLastModified: file.lastModified,
    };
  } catch (err: any) {
    if (err.name === "AbortError") return null;
    console.error("Error reading file from handle:", err);
    return null;
  }
}

export async function openLocalFile(): Promise<FileTab | null> {
  if (isFileSystemAccessSupported) {
    try {
      const [handle] = await (window as any).showOpenFilePicker({
        multiple: false,
        excludeAcceptAllOption: false,
      });

      return await createFileTabFromHandle(handle);
    } catch (err: any) {
      if (err.name === "AbortError") return null; // Người dùng hủy chọn
      console.error("Error opening file via File System Access API:", err);
    }
  }

  // Fallback qua file input truyền thống
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.style.display = "none";

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      const isImage =
        file.type.startsWith("image/") && !file.name.endsWith(".svg");
      let content = "";
      let imageDataUrl: string | undefined;

      if (isImage) {
        imageDataUrl = await readFileAsDataURL(file);
        content = `/* Image viewer: ${file.name} (${file.type}) */`;
      } else {
        content = await file.text();
      }

      const { language, previewType } = detectLanguageFromFilename(file.name);

      resolve({
        id: crypto.randomUUID(),
        name: file.name,
        content,
        savedContent: content,
        language,
        isModified: false,
        encoding: "UTF-8",
        lineEnding: detectLineEnding(content),
        previewType: isImage ? "image" : previewType,
        imageDataUrl,
      });
      document.body.removeChild(input);
    };

    input.oncancel = () => {
      resolve(null);
      document.body.removeChild(input);
    };

    document.body.appendChild(input);
    input.click();
  });
}

async function verifyPermission(
  fileHandle: FileSystemFileHandle,
  readWrite: boolean,
): Promise<boolean> {
  const options: { mode?: "read" | "readwrite" } = {};
  if (readWrite) {
    options.mode = "readwrite";
  }
  // Check if permission was already granted
  if ((await (fileHandle as any).queryPermission(options)) === "granted") {
    return true;
  }
  // Request permission to the file
  if ((await (fileHandle as any).requestPermission(options)) === "granted") {
    return true;
  }
  return false;
}

export async function saveExistingFile(tab: FileTab): Promise<FileTab> {
  const encodedBytes = encodeString(tab.content, tab.encoding || "UTF-8");

  if (tab.fileHandle && isFileSystemAccessSupported) {
    try {
      const hasPermission = await verifyPermission(tab.fileHandle, true);
      if (hasPermission) {
        const writable = await (tab.fileHandle as any).createWritable();
        await writable.write(encodedBytes);
        await writable.close();

        const now = Date.now();
        return {
          ...tab,
          rawBuffer: encodedBytes,
          savedContent: tab.content,
          isModified: false,
          lastSavedAt: now,
          fileLastModified: now,
        };
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        // User canceled permission prompt
        return tab;
      }
      console.warn("Direct file save failed, falling back to Save As:", err);
    }
  }

  return saveFileAs(tab);
}

export async function saveFileAs(tab: FileTab): Promise<FileTab> {
  const encodedBytes = encodeString(tab.content, tab.encoding || "UTF-8");

  if (isFileSystemAccessSupported) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: tab.name,
      });

      const writable = await handle.createWritable();
      await writable.write(encodedBytes);
      await writable.close();

      const newName = handle.name || tab.name;
      const { language, previewType } = detectLanguageFromFilename(newName);
      const now = Date.now();

      return {
        ...tab,
        name: newName,
        rawBuffer: encodedBytes,
        savedContent: tab.content,
        fileHandle: handle,
        isModified: false,
        language,
        previewType,
        lastSavedAt: now,
        fileLastModified: now,
      };
    } catch (err: any) {
      if (err.name === "AbortError") return tab;
      console.error("Save As error:", err);
    }
  }

  // Fallback: download via anchor
  const blob = new Blob([encodedBytes as any], { type: "text/plain" });
  triggerFileDownload(blob, tab.name);

  const now = Date.now();
  return {
    ...tab,
    rawBuffer: encodedBytes,
    savedContent: tab.content,
    isModified: false,
    lastSavedAt: now,
    fileLastModified: now,
  };
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
