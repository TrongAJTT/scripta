import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { PreviewAdapterProps } from './types';
import { useEditorStore } from '../../tabs/store';
import { Code2, SlidersVertical, FileSymlink, Check, LayoutTemplate, ChevronDown } from 'lucide-react';
import { DropdownMenu } from '../../../shared/components/DropdownMenu';

interface TemplatePreset {
  id: string;
  name: string;
  html: string;
}

const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: 'buttons',
    name: 'Buttons & Badges',
    html: `<div class="container">
  <h2>Button Showcase</h2>
  <div class="row">
    <button class="btn btn-primary">Primary Button</button>
    <button class="btn btn-secondary">Secondary</button>
    <button class="btn btn-outline">Outline</button>
  </div>
  <div class="row">
    <span class="badge badge-success">Active</span>
    <span class="badge badge-warning">Pending</span>
    <span class="badge badge-danger">Error</span>
  </div>
</div>`,
  },
  {
    id: 'card',
    name: 'Card & Media',
    html: `<div class="card">
  <div class="card-header">
    <span class="tag">Featured</span>
    <h3>Interactive CSS Component</h3>
  </div>
  <div class="card-body">
    <p>Style this card directly by editing your CSS file on the left!</p>
    <div class="meta">
      <span>★ 4.9 Rating</span>
      <span>• Updated Today</span>
    </div>
  </div>
  <div class="card-footer">
    <button class="btn">Explore More</button>
  </div>
</div>`,
  },
  {
    id: 'typography',
    name: 'Typography Article',
    html: `<article class="article">
  <h1>The Beauty of CSS Typography</h1>
  <p class="lead">Design is not just what it looks like and feels like. Design is how it works.</p>
  <p>Customize headings, font pairings, line heights, and blockquotes in realtime.</p>
  <blockquote>"Simplicity is the soul of efficiency."</blockquote>
  <a href="#" class="link">Read complete guide &rarr;</a>
</article>`,
  },
  {
    id: 'canvas',
    name: 'Clean Canvas',
    html: `<div class="canvas">
  <div class="box">
    <span>#box</span>
  </div>
</div>`,
  },
];

export const CssAdapter: React.FC<PreviewAdapterProps> = ({ tab, setHeaderActions }) => {
  const tabs = useEditorStore((s) => s.tabs);
  const [selectedTemplateId, setSelectedTemplateId] = useState('buttons');
  const [customHtml, setCustomHtml] = useState<string>(TEMPLATE_PRESETS[0].html);
  const [showHtmlEditor, setShowHtmlEditor] = useState(true);
  const [htmlPaneHeightRatio, setHtmlPaneHeightRatio] = useState(0.4); // 40% height for HTML editor
  const [copiedImport, setCopiedImport] = useState(false);

  // Available HTML tabs that can be imported
  const htmlTabs = useMemo(() => {
    return tabs.filter((t) => t.language === 'html' || t.name.endsWith('.html'));
  }, [tabs]);

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const found = TEMPLATE_PRESETS.find((t) => t.id === templateId);
    if (found) {
      setCustomHtml(found.html);
    }
  };

  const handleImportFromTab = useCallback((tabId: string) => {
    const targetTab = tabs.find((t) => t.id === tabId);
    if (targetTab) {
      setCustomHtml(targetTab.content);
      setSelectedTemplateId('custom');
      setCopiedImport(true);
      setTimeout(() => setCopiedImport(false), 2000);
    }
  }, [tabs]);

  // Compile CSS + HTML into an isolated sandboxed document
  const compiledDoc = useMemo(() => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* Default Canvas Base */
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #0f1219;
      color: #e2e8f0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    /* Injected User CSS */
    ${tab.content || ''}
  </style>
</head>
<body>
  ${customHtml}
</body>
</html>`;
  }, [tab.content, customHtml]);

  // Inject trailing actions into unified PreviewPanel header
  useEffect(() => {
    const activeTemplateName =
      selectedTemplateId === 'custom'
        ? 'Imported HTML'
        : TEMPLATE_PRESETS.find((t) => t.id === selectedTemplateId)?.name || 'Custom';

    setHeaderActions?.(
      <div className="flex items-center gap-1.5 select-none">
        <DropdownMenu
          align="right"
          trigger={
            <button
              type="button"
              className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--bg-surface-elevated)] border border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-tab-hover)] hover:text-[var(--text-highlight)] transition-colors cursor-pointer"
            >
              <LayoutTemplate className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span className="truncate max-w-[130px]">{activeTemplateName}</span>
              <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
            </button>
          }
        >
          {/* Toggle HTML Source Editor Pane */}
          <DropdownMenu.Item
            label="HTML Source Pane"
            icon={<SlidersVertical className="w-3.5 h-3.5 text-[var(--accent)]" />}
            checked={showHtmlEditor}
            onSelect={() => setShowHtmlEditor((prev) => !prev)}
          />

          <DropdownMenu.Separator />

          {/* Submenu: HTML Templates */}
          <DropdownMenu.Sub
            label="HTML Templates"
            icon={<LayoutTemplate className="w-3.5 h-3.5" />}
            alignGutter
          >
            {TEMPLATE_PRESETS.map((tmpl) => (
              <DropdownMenu.Item
                key={tmpl.id}
                label={tmpl.name}
                checked={selectedTemplateId === tmpl.id}
                onSelect={() => handleSelectTemplate(tmpl.id)}
              />
            ))}
            {selectedTemplateId === 'custom' && (
              <DropdownMenu.Item
                label="Imported HTML"
                checked
                disabled
              />
            )}
          </DropdownMenu.Sub>

          {/* Submenu: Import from open HTML tabs (if any) */}
          {htmlTabs.length > 0 && (
            <DropdownMenu.Sub
              label="Import from Tab"
              icon={
                copiedImport ? (
                  <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
                ) : (
                  <FileSymlink className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                )
              }
              alignGutter
            >
              {htmlTabs.map((ht) => (
                <DropdownMenu.Item
                  key={ht.id}
                  label={ht.name}
                  onSelect={() => handleImportFromTab(ht.id)}
                />
              ))}
            </DropdownMenu.Sub>
          )}
        </DropdownMenu>
      </div>
    );

    return () => setHeaderActions?.(null);
  }, [setHeaderActions, selectedTemplateId, showHtmlEditor, htmlTabs, copiedImport, handleImportFromTab]);

  // State and ref for divider drag
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDividerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    setIsDragging(true);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  };

  const handleDividerPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newRatio = (e.clientY - rect.top) / rect.height;
    const clamped = Math.max(0.15, Math.min(0.8, newRatio));
    setHtmlPaneHeightRatio(clamped);
  };

  const handleDividerPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Pointer capture might already be released
      }
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  };

  return (
    <div
      ref={containerRef}
      id="css-adapter-container"
      className="h-full w-full flex flex-col overflow-hidden bg-[var(--bg-preview)] relative"
    >
      {/* Upper Pane: HTML Template Source Editor (Collapsible via Divider) */}
      {showHtmlEditor && (
        <div
          style={{ height: `${htmlPaneHeightRatio * 100}%` }}
          className="w-full flex flex-col bg-[var(--bg-surface)] border-b border-[var(--border-color)] overflow-hidden shrink-0"
        >
          <div className="h-7 px-3 bg-[var(--bg-toolbar)] border-b border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)] select-none">
            <div className="flex items-center gap-1.5 font-mono">
              <Code2 className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
              <span className="text-[var(--text-main)] font-semibold">Target HTML Template</span>
            </div>
            <span className="text-[10px] text-[var(--text-subtle)]">Edit HTML to see CSS applied</span>
          </div>
          <textarea
            value={customHtml}
            onChange={(e) => {
              setCustomHtml(e.target.value);
              setSelectedTemplateId('custom');
            }}
            placeholder="Enter custom HTML code to preview with your CSS..."
            className="flex-1 w-full p-3 font-mono text-xs bg-transparent text-[var(--text-main)] resize-none outline-none leading-relaxed select-text"
            spellCheck={false}
          />
        </div>
      )}

      {/* Interactive Drag Divider */}
      {showHtmlEditor && (
        <div
          onPointerDown={handleDividerPointerDown}
          onPointerMove={handleDividerPointerMove}
          onPointerUp={handleDividerPointerUp}
          onPointerCancel={handleDividerPointerUp}
          onDoubleClick={() => setHtmlPaneHeightRatio(0.4)}
          className={`h-2.5 w-full shrink-0 relative flex items-center justify-center cursor-row-resize select-none touch-none transition-colors border-y border-[var(--border-subtle)] z-20 group ${
            isDragging
              ? 'bg-[var(--accent)]/30'
              : 'bg-[var(--border-subtle)] hover:bg-[var(--accent-blue)]/50 active:bg-[var(--accent)]/50'
          }`}
          title="Drag to resize HTML pane (Double click to reset)"
        >
          <div
            className={`w-10 h-1 rounded-full transition-colors ${
              isDragging
                ? 'bg-[var(--accent)]'
                : 'bg-[var(--text-subtle)] group-hover:bg-white group-active:bg-white'
            }`}
          />
        </div>
      )}

      {/* Lower Pane: Live Styled Sandboxed Output */}
      <div className="flex-1 w-full h-full relative overflow-hidden bg-[#0f1219]">
        {/* Transparent overlay when dragging to prevent iframe from intercepting mouse events */}
        {isDragging && <div className="absolute inset-0 z-30 cursor-row-resize" />}
        <iframe
          srcDoc={compiledDoc}
          title="CSS Preview Sandbox"
          sandbox="allow-scripts"
          className="w-full h-full border-none"
          style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
        />
      </div>
    </div>
  );
};
