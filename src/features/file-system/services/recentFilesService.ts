import type { FileTab, RecentFileEntry } from '../../../core/types/file.types';
import {
  loadRecentFiles,
  saveRecentFiles,
  clearRecentFilesStorage,
} from '../../../core/utils/idbStorage';
import { createFileTabFromHandle } from '../data/fileSystemApi';

export const MAX_RECENT_FILES = 10;

class RecentFilesServiceImpl {
  private recentFiles: RecentFileEntry[] = [];
  private closedFilesStack: RecentFileEntry[] = [];
  private isLoaded = false;

  /**
   * Initializes recent files by loading existing entries from IndexedDB.
   */
  async init(): Promise<RecentFileEntry[]> {
    if (this.isLoaded) return this.recentFiles;
    try {
      this.recentFiles = await loadRecentFiles();
      this.isLoaded = true;
    } catch (e) {
      console.warn('Failed to initialize recent files', e);
      this.recentFiles = [];
    }
    return this.recentFiles;
  }

  /**
   * Returns in-memory list of recent files.
   */
  getRecentFiles(): RecentFileEntry[] {
    return [...this.recentFiles];
  }

  /**
   * Returns in-memory stack of recently closed files.
   */
  getClosedFilesStack(): RecentFileEntry[] {
    return [...this.closedFilesStack];
  }

  /**
   * Adds or bumps a file handle in recent files.
   * Keeps list unique by file name and capped to MAX_RECENT_FILES.
   */
  async addRecentFile(handle: FileSystemFileHandle, name?: string): Promise<RecentFileEntry[]> {
    const fileName = name || handle.name;
    if (!fileName) return this.recentFiles;

    const entry: RecentFileEntry = {
      name: fileName,
      handle,
      lastOpenedAt: Date.now(),
    };

    // Remove existing entry with the same name if present
    const filtered = this.recentFiles.filter((f) => f.name !== fileName);
    this.recentFiles = [entry, ...filtered].slice(0, MAX_RECENT_FILES);

    await saveRecentFiles(this.recentFiles);
    return [...this.recentFiles];
  }

  /**
   * Records a closed tab into the stack if it has a fileHandle.
   */
  recordClosedFile(tab: FileTab): void {
    if (!tab.fileHandle) return;

    const entry: RecentFileEntry = {
      name: tab.name,
      handle: tab.fileHandle,
      lastOpenedAt: Date.now(),
    };

    // Remove duplicates from closed stack and prepend
    this.closedFilesStack = [
      entry,
      ...this.closedFilesStack.filter((item) => item.name !== tab.name),
    ].slice(0, MAX_RECENT_FILES);
  }

  /**
   * Pops the most recently closed file and converts it into a FileTab.
   */
  async reopenLastClosedFile(): Promise<{ tab: FileTab | null; remainingClosed: RecentFileEntry[] }> {
    if (this.closedFilesStack.length === 0) {
      return { tab: null, remainingClosed: [] };
    }

    const [lastClosed, ...remaining] = this.closedFilesStack;
    this.closedFilesStack = remaining;

    const tab = await createFileTabFromHandle(lastClosed.handle);
    return { tab, remainingClosed: [...this.closedFilesStack] };
  }

  /**
   * Opens a specific recent file entry.
   */
  async openRecentFile(entry: RecentFileEntry): Promise<FileTab | null> {
    return await createFileTabFromHandle(entry.handle);
  }

  /**
   * Clears all recent files from memory and IndexedDB.
   */
  async clearRecentFiles(): Promise<void> {
    this.recentFiles = [];
    this.closedFilesStack = [];
    await clearRecentFilesStorage();
  }
}

export const RecentFilesService = new RecentFilesServiceImpl();
