import React, { useMemo } from "react";
import { useEditorStore } from "../../tabs/store";
import { formatByteSize } from "../../../core/utils/fileDetection";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { DropdownMenu } from "../../../shared/components/DropdownMenu";
import { COMMON_ENCODINGS } from "../../../core/utils/encodingUtils";

export const StatusBar: React.FC = () => {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const cursorPos = useEditorStore((s) => s.activeCursorPos);
  const setEncodingForActiveTab = useEditorStore((s) => s.setEncodingForActiveTab);
  const convertEncodingForActiveTab = useEditorStore((s) => s.convertEncodingForActiveTab);

  const byteSize = useMemo(
    () => new Blob([activeTab?.content || ""]).size,
    [activeTab?.content],
  );

  if (!activeTab) return null;

  const linesCount =
    cursorPos.linesCount ??
    (activeTab.content ? activeTab.content.split("\n").length : 1);
  const charsCount =
    cursorPos.charsCount ?? (activeTab.content?.length || 0);

  return (
    <div className="h-6 bg-[var(--bg-statusbar)] border-t border-[var(--border-color)] px-3 flex items-center justify-between text-[11px] text-[var(--text-muted)] select-none shrink-0 font-mono">
      {/* Trái: Vị trí con trỏ và kích thước văn bản */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <span>
            Ln :{" "}
            <strong className="text-[var(--text-main)]">
              {cursorPos.line}
            </strong>
          </span>
          <span>
            Col :{" "}
            <strong className="text-[var(--text-main)]">{cursorPos.col}</strong>
          </span>
          {cursorPos.selectedChars > 0 && (
            <span className="text-[var(--accent-yellow)] font-medium">
              Sel : {cursorPos.selectedChars}
            </span>
          )}
        </div>

        <div className="h-3 w-[1px] bg-[var(--border-color)]" />

        <div className="hidden sm:flex items-center gap-3">
          <span>
            Lines :{" "}
            <strong className="text-[var(--text-main)]">{linesCount}</strong>
          </span>
          <span>
            Length :{" "}
            <strong className="text-[var(--text-main)]">
              {charsCount.toLocaleString()}
            </strong>
          </span>
          <span>
            Size :{" "}
            <strong className="text-[var(--text-main)]">
              {formatByteSize(byteSize)}
            </strong>
          </span>
        </div>
      </div>

      {/* Phải: Encoding, Line Endings, Save Status & Language */}
      <div className="flex items-center gap-3">
        {/* Status indicator */}
        <div className="flex items-center gap-1">
          {activeTab.isModified ? (
            <span className="flex items-center gap-1 text-[var(--accent-red)]">
              <AlertCircle className="w-3 h-3" />
              <span className="hidden md:inline">Modified</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[var(--accent)]">
              <CheckCircle2 className="w-3 h-3" />
              <span className="hidden md:inline">Saved</span>
            </span>
          )}
        </div>

        <div className="h-3 w-[1px] bg-[var(--border-color)]" />

        <span>
          {activeTab.lineEnding === "CRLF" ? "Windows (CRLF)" : "Unix (LF)"}
        </span>

        <div className="h-3 w-[1px] bg-[var(--border-color)]" />

        <DropdownMenu
          align="right"
          alignGutter
          trigger={
            <span
              className="cursor-pointer hover:text-[var(--text-highlight)] hover:underline decoration-dotted transition-colors"
              title="Click to change encoding"
            >
              {activeTab.encoding || "UTF-8"}
            </span>
          }
        >
          {COMMON_ENCODINGS.map((enc) => (
            <DropdownMenu.Item
              key={enc.id}
              label={enc.label}
              checked={activeTab.encoding === enc.id}
              onSelect={() => setEncodingForActiveTab(enc.id)}
            />
          ))}
          <DropdownMenu.Separator />
          {COMMON_ENCODINGS.map((enc) => (
            <DropdownMenu.Item
              key={`convert-${enc.id}`}
              label={`Convert to ${enc.label}`}
              onSelect={() => convertEncodingForActiveTab(enc.id)}
            />
          ))}
        </DropdownMenu>

        <div className="h-3 w-[1px] bg-[var(--border-color)]" />

        <span className="text-[var(--accent-blue)] uppercase font-semibold">
          {activeTab.language}
        </span>
      </div>
    </div>
  );
};
