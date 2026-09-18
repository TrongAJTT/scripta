import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileCode, Image as ImageIcon } from 'lucide-react';
import { exportSvgToFile, exportSvgToRaster } from '../services/mermaidExportService';

interface MermaidExportMenuProps {
  svgContent: string;
  baseFileName?: string;
  className?: string;
}

export const MermaidExportMenu: React.FC<MermaidExportMenuProps> = ({
  svgContent,
  baseFileName = 'mermaid-diagram',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('mousedown', handleClickOutside);
      return () => window.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const cleanName = baseFileName.replace(/\.[^/.]+$/, '');

  const handleExport = async (format: 'svg' | 'png' | 'jpeg' | 'webp') => {
    setIsOpen(false);
    if (!svgContent) return;

    try {
      if (format === 'svg') {
        exportSvgToFile(svgContent, `${cleanName}.svg`);
      } else {
        await exportSvgToRaster(svgContent, format, `${cleanName}.${format === 'jpeg' ? 'jpg' : format}`);
      }
    } catch (err) {
      console.error('Failed to export mermaid diagram', err);
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--bg-surface)] hover:bg-[var(--bg-tab-hover)] border border-[var(--border-color)] text-xs text-[var(--text-main)] hover:text-[var(--text-highlight)] transition-colors cursor-pointer"
        title="Export Diagram (SVG / PNG / JPG / WEBP)"
      >
        <Download className="w-3.5 h-3.5 text-[var(--accent)]" />
        <span className="font-semibold text-[11px]">Export</span>
        <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-44 py-1 rounded-md bg-[var(--bg-surface-elevated)] border border-[var(--border-color)] shadow-xl z-50 text-xs animate-fade-in">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-subtle)] mb-1">
            Export Format
          </div>

          <button
            onClick={() => handleExport('svg')}
            className="w-full px-3 py-1.5 text-left flex items-center justify-between text-[var(--text-main)] hover:bg-[var(--bg-tab-hover)] hover:text-[var(--accent)] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <FileCode className="w-3.5 h-3.5 text-purple-400" />
              <span>SVG Vector</span>
            </div>
            <span className="font-mono text-[10px] text-[var(--text-muted)]">.svg</span>
          </button>

          <button
            onClick={() => handleExport('png')}
            className="w-full px-3 py-1.5 text-left flex items-center justify-between text-[var(--text-main)] hover:bg-[var(--bg-tab-hover)] hover:text-[var(--accent)] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>PNG Image</span>
            </div>
            <span className="font-mono text-[10px] text-[var(--text-muted)]">.png</span>
          </button>

          <button
            onClick={() => handleExport('jpeg')}
            className="w-full px-3 py-1.5 text-left flex items-center justify-between text-[var(--text-main)] hover:bg-[var(--bg-tab-hover)] hover:text-[var(--accent)] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
              <span>JPG Image</span>
            </div>
            <span className="font-mono text-[10px] text-[var(--text-muted)]">.jpg</span>
          </button>

          <button
            onClick={() => handleExport('webp')}
            className="w-full px-3 py-1.5 text-left flex items-center justify-between text-[var(--text-main)] hover:bg-[var(--bg-tab-hover)] hover:text-[var(--accent)] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>WEBP Modern</span>
            </div>
            <span className="font-mono text-[10px] text-[var(--text-muted)]">.webp</span>
          </button>
        </div>
      )}
    </div>
  );
};
