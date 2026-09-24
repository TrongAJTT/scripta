/**
 * Print utility for Scripta Preview Panel.
 * Clones the live element into a detached print container attached to document.body,
 * with print-optimized styles. This bypasses all CSS layout / flexbox constraints
 * of the application layout without affecting the on-screen UI, ensuring all content
 * paginates cleanly across multiple sheets.
 */

let activePrintCleanup: (() => void) | null = null;

export function printLiveElement(element: HTMLElement): void {
  // Clean up any lingering print containers/styles from previous invocations
  if (activePrintCleanup) {
    activePrintCleanup();
  }

  // Clone the element deeply so we can print it outside the cramped app flex layout
  const clone = element.cloneNode(true) as HTMLElement;
  const containerId = "scripta-print-sandbox-" + Date.now();
  clone.id = containerId;

  // Add the sandbox container directly to body
  document.body.appendChild(clone);

  // Inject @media print styles
  const styleEl = document.createElement("style");
  styleEl.setAttribute("data-scripta-print-style", "true");
  styleEl.textContent = `
    /* Sandbox is completely hidden on screen */
    #${containerId} {
      display: none;
    }

    @media print {
      /* Force browser to print colors and backgrounds accurately */
      *, *::before, *::after {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }

      /* Page margins */
      @page {
        margin: 12mm;
        size: auto;
      }

      /* Hide the entire application DOM when printing */
      body > *:not(#${containerId}) {
        display: none !important;
      }

      /* Display our detached clone as the sole content of the printed page */
      #${containerId} {
        display: block !important;
        position: static !important;
        width: 100% !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        overflow: visible !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #0f172a !important;
      }

      /* Remove scrollbars and unconstrain all children */
      #${containerId} * {
        overflow: visible !important;
        height: auto !important;
        max-height: none !important;
      }

      /* Light theme tokens for crisp black-on-white text */
      #${containerId} {
        --bg-app: #ffffff !important;
        --bg-surface: #f8fafc !important;
        --bg-surface-elevated: #f1f5f9 !important;
        --bg-preview: #ffffff !important;
        --border-color: #cbd5e1 !important;
        --border-subtle: #e2e8f0 !important;
        --text-main: #0f172a !important;
        --text-muted: #475569 !important;
        --text-subtle: #64748b !important;
        --text-highlight: #000000 !important;
      }

      /* Markdown Prose reset for white paper */
      #${containerId} .prose,
      #${containerId} .prose-invert {
        color: #0f172a !important;
        --tw-prose-body: #0f172a !important;
        --tw-prose-headings: #0f172a !important;
        --tw-prose-links: #2563eb !important;
        --tw-prose-bold: #0f172a !important;
        --tw-prose-counters: #475569 !important;
        --tw-prose-bullets: #475569 !important;
        --tw-prose-hr: #e2e8f0 !important;
        --tw-prose-quotes: #0f172a !important;
        --tw-prose-quote-borders: #cbd5e1 !important;
        --tw-prose-code: #0f172a !important;
        --tw-prose-pre-code: #0f172a !important;
        --tw-prose-pre-bg: #f8fafc !important;
        --tw-prose-th-borders: #cbd5e1 !important;
        --tw-prose-td-borders: #e2e8f0 !important;
      }

      /* Hide interactive controls in print */
      #${containerId} .no-print,
      #${containerId} [data-no-print="true"] {
        display: none !important;
      }

      /* Table printing optimizations */
      #${containerId} table {
        width: 100% !important;
        border-collapse: collapse !important;
        page-break-inside: auto;
      }
      #${containerId} tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
      #${containerId} thead {
        display: table-header-group;
      }
      #${containerId} tfoot {
        display: table-footer-group;
      }
      #${containerId} th, #${containerId} td {
        border: 1px solid #cbd5e1 !important;
      }
      #${containerId} thead th {
        background-color: #f1f5f9 !important;
        color: #0f172a !important;
        border-bottom: 2px solid #cbd5e1 !important;
      }

      /* SVG / Mermaid diagram sizing */
      #${containerId} svg {
        max-width: 100% !important;
        height: auto !important;
        page-break-inside: avoid;
      }
    }
  `;

  document.head.appendChild(styleEl);

  const cleanup = () => {
    if (document.body.contains(clone)) {
      document.body.removeChild(clone);
    }
    if (document.head.contains(styleEl)) {
      document.head.removeChild(styleEl);
    }
    window.removeEventListener("afterprint", cleanup);
    activePrintCleanup = null;
  };

  activePrintCleanup = cleanup;
  window.addEventListener("afterprint", cleanup);

  // Invoke native browser print
  window.print();
}
