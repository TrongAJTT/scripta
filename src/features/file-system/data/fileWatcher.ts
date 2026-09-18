import type { FileTab } from '../../../core/types/file.types';

export type FileWatcherEvent = 
  | { type: 'UNCHANGED' }
  | { type: 'DELETED'; filename: string }
  | { type: 'MODIFIED_EXTERNALLY'; filename: string; diskLastModified: number; newContent: string };

export async function checkExternalFileChanges(tab: FileTab): Promise<FileWatcherEvent> {
  // Chỉ kiểm tra những tab đã gắn với fileHandle thực tế trên ổ cứng
  if (!tab.fileHandle) {
    return { type: 'UNCHANGED' };
  }

  try {
    const file = await tab.fileHandle.getFile();
    const diskLastModified = file.lastModified;

    // Nếu timestamp trên đĩa mới hơn lần lưu/mở gần nhất của app
    const knownModifiedTime = tab.fileLastModified || tab.lastSavedAt || 0;
    
    // Nếu có sự chênh lệch thời gian (> 1000ms để tránh sai số flush của OS)
    if (knownModifiedTime > 0 && diskLastModified - knownModifiedTime > 1000) {
      const isImage = file.type.startsWith('image/') && !file.name.endsWith('.svg');
      if (!isImage) {
        const diskContent = await file.text();
        // Nếu nội dung trên đĩa khác với savedContent trong app
        if (diskContent !== tab.savedContent) {
          return {
            type: 'MODIFIED_EXTERNALLY',
            filename: tab.name,
            diskLastModified,
            newContent: diskContent,
          };
        }
      }
    }

    return { type: 'UNCHANGED' };
  } catch (err: any) {
    if (err.name === 'NotFoundError') {
      return {
        type: 'DELETED',
        filename: tab.name,
      };
    }
    // Nếu lỗi permission hoặc abort thì bỏ qua
    return { type: 'UNCHANGED' };
  }
}
