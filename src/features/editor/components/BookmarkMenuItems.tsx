import React from "react";
import { DropdownMenu } from "../../../shared/components/DropdownMenu";
import type { useEditorCommands } from "../hooks/useEditorCommands";

interface BookmarkMenuItemsProps {
  editorCmds: ReturnType<typeof useEditorCommands>;
}

export const BookmarkMenuItems: React.FC<BookmarkMenuItemsProps> = ({
  editorCmds,
}) => {
  const bookmarks = editorCmds.getBookmarks();

  return (
    <>
      <DropdownMenu.Item
        label="Toggle Bookmark"
        commandId="file.toggleBookmark"
        onSelect={() => editorCmds.toggleBookmark()}
      />
      <DropdownMenu.Item
        label="Next"
        commandId="file.nextBookmark"
        onSelect={() => editorCmds.nextBookmark()}
      />
      <DropdownMenu.Item
        label="Previous"
        commandId="file.prevBookmark"
        onSelect={() => editorCmds.prevBookmark()}
      />
      <DropdownMenu.Item
        label="Clear All"
        commandId="file.clearBookmarks"
        danger
        disabled={bookmarks.length === 0}
        onSelect={() => editorCmds.clearBookmarks()}
      />

      {bookmarks.length > 0 && (
        <>
          <DropdownMenu.Separator />
          <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] select-none">
            Bookmarked Lines ({bookmarks.length})
          </div>
          <div className="max-h-48 overflow-y-auto">
            {bookmarks.map((bm) => (
              <DropdownMenu.Item
                key={`${bm.line}-${bm.pos}`}
                label={`Line ${bm.line}: ${bm.text}`}
                title={`Line ${bm.line}: ${bm.fullText}`}
                onSelect={() => editorCmds.jumpToBookmark(bm.line)}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
};
