import type { SampleLanguage } from "../constants/languages";

export interface SampleDocument {
  filename: string;
  content: string;
}

export const SAMPLE_DOCUMENTS: Record<SampleLanguage, SampleDocument> = {
  markdown: {
    filename: "sample.md",
    content: `# Scripta Markdown Sample

Welcome to **Markdown** with live preview, GFM tables, math, and Mermaid diagrams.

## Features
- [x] Headings, lists, and blockquotes
- [x] GitHub Flavored Markdown tables
- [ ] Export to HTML or PDF

> Tip: Toggle Split View to edit and preview side by side.

## Code & Math

\`\`\`ts
export function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
\`\`\`

Inline math $E = mc^2$ and block equation:

$$
\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}
$$

## Table

| Language | Preview Support | Extension |
| --- | --- | --- |
| Markdown | Rich HTML + KaTeX | \`.md\` |
| Mermaid | SVG Diagram | \`.mmd\` |
| LaTeX | TeX Typesetting | \`.tex\` |
`,
  },

  csv: {
    filename: "sample.csv",
    content: `id,name,role,department,score,active
1,Alice Nguyen,Staff Engineer,Platform,96.5,true
2,Bao Tran,Product Designer,Design,91.0,true
3,Charlie Kim,Data Scientist,Analytics,88.4,true
4,Diana Patel,QA Lead,Quality,94.2,false
5,Ethan Pham,DevOps Engineer,Infrastructure,90.8,true
6,Fiona Chen,Frontend Engineer,Web,95.1,true
`,
  },

  html: {
    filename: "sample.html",
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Scripta HTML Sample</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 640px;
      margin: 2rem auto;
      padding: 1.5rem;
      line-height: 1.6;
      color: #1f2937;
      background: #f9fafb;
    }
    .card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    .badge {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      background: #d1fae5;
      color: #065f46;
      font-size: 0.75rem;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <main class="card">
    <span class="badge">Live Preview</span>
    <h1>Hello from Scripta</h1>
    <p>Edit this HTML document to see live changes in the preview pane.</p>
    <button onclick="document.getElementById('out').textContent = 'Clicked at ' + new Date().toLocaleTimeString()">
      Test Interaction
    </button>
    <p id="out"></p>
  </main>
</body>
</html>
`,
  },

  javascript: {
    filename: "sample.js",
    content: `// Scripta JavaScript Sample

/**
 * Computes basic summary statistics for a numeric array.
 * @param {number[]} values
 */
function summarize(values) {
  if (values.length === 0) {
    return { count: 0, sum: 0, average: 0, min: null, max: null };
  }

  const sum = values.reduce((acc, n) => acc + n, 0);
  return {
    count: values.length,
    sum,
    average: Number((sum / values.length).toFixed(2)),
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

const scores = [88, 92, 79, 95, 84, 91];
console.log("Summary:", summarize(scores));
`,
  },

  typescript: {
    filename: "sample.ts",
    content: `// Scripta TypeScript Sample

export interface TaskItem {
  id: string;
  title: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
}

export function groupByPriority(
  tasks: readonly TaskItem[],
): Record<TaskItem["priority"], TaskItem[]> {
  return tasks.reduce<Record<TaskItem["priority"], TaskItem[]>>(
    (groups, task) => {
      groups[task.priority].push(task);
      return groups;
    },
    { low: [], medium: [], high: [] },
  );
}

const sampleTasks: TaskItem[] = [
  { id: "1", title: "Review PR #42", priority: "high", completed: false },
  { id: "2", title: "Update docs", priority: "low", completed: true },
  { id: "3", title: "Refactor parser", priority: "medium", completed: false },
];

console.log(groupByPriority(sampleTasks));
`,
  },

  css: {
    filename: "sample.css",
    content: `/* Scripta CSS Sample — Modern Card Layout */

:root {
  --surface: #ffffff;
  --ink: #0f172a;
  --muted: #475569;
  --accent: #10b981;
  --border: #e2e8f0;
}

.panel {
  display: grid;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 0.75rem;
  background-color: var(--surface);
  border: 1px solid var(--border);
  color: var(--ink);
}

.panel__title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.panel__action {
  justify-self: start;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  background-color: var(--accent);
  color: #ffffff;
  font-weight: 500;
  cursor: pointer;
}
`,
  },

  json: {
    filename: "sample.json",
    content: `{
  "name": "scripta-sample-config",
  "version": "1.0.0",
  "editor": {
    "tabSize": 2,
    "wordWrap": true,
    "minimap": false
  },
  "languages": [
    "markdown",
    "typescript",
    "python",
    "latex",
    "mermaid"
  ],
  "metadata": {
    "author": "Scripta",
    "license": "MIT"
  }
}
`,
  },

  python: {
    filename: "sample.py",
    content: `# Scripta Python Sample
from dataclasses import dataclass


@dataclass
class Point:
    x: float
    y: float

    def distance_to_origin(self) -> float:
        return (self.x ** 2 + self.y ** 2) ** 0.5


def fibonacci(n: int) -> list[int]:
    seq: list[int] = []
    a, b = 0, 1
    for _ in range(n):
        seq.append(a)
        a, b = b, a + b
    return seq


if __name__ == "__main__":
    p = Point(3.0, 4.0)
    print(f"Distance: {p.distance_to_origin():.2f}")
    print("Fibonacci(8):", fibonacci(8))
`,
  },

  svg: {
    filename: "sample.svg",
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" width="320" height="180">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#38bdf8" />
    </linearGradient>
  </defs>

  <rect width="320" height="180" rx="16" fill="url(#bg)" />
  <circle cx="80" cy="90" r="36" fill="none" stroke="url(#accent)" stroke-width="6" />
  <path d="M64 90 L76 102 L98 78" fill="none" stroke="#10b981" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
  <text x="136" y="84" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="20" font-weight="700">
    Scripta SVG
  </text>
  <text x="136" y="108" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">
    Scalable Vector Preview
  </text>
</svg>
`,
  },

  mermaid: {
    filename: "sample.mmd",
    content: `flowchart LR
    A[Open File or Sample] --> B{Detect Language}
    B -->|Markdown| C[Live HTML + KaTeX]
    B -->|Mermaid| D[SVG Diagram]
    B -->|Python| E[Pyodide Runner]
    B -->|LaTeX| F[TeX Preview]
    C --> G[Export / Save]
    D --> G
    E --> G
    F --> G
`,
  },

  latex: {
    filename: "sample.tex",
    content: `\\documentclass{article}
\\usepackage{amsmath, amssymb}

\\title{Scripta \\LaTeX{} Sample}
\\author{Scripta Workbench}
\\date{\\today}

\\begin{document}
\\maketitle

\\section{Introduction}
This is a sample \\LaTeX{} document with inline math $a^2 + b^2 = c^2$ and displayed equations.

\\section{Euler's Identity and Integrals}
\\begin{equation}
e^{i\\pi} + 1 = 0
\\end{equation}

\\[
\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}
\\]

\\end{document}
`,
  },

  plaintext: {
    filename: "sample.txt",
    content: `Scripta Plain Text Sample
=========================

Use plain text files for quick notes, logs, checklists, or scratchpad drafts.

Today's Checklist:
- [ ] Capture meeting notes
- [ ] Draft project outline
- [ ] Review action items
`,
  },

  xml: {
    filename: "sample.xml",
    content: `<?xml version="1.0" encoding="UTF-8"?>
<catalog>
  <book id="bk101">
    <author>Gambardella, Matthew</author>
    <title>XML Developer's Guide</title>
    <genre>Computer</genre>
    <price>44.95</price>
  </book>
</catalog>
`,
  },

  yaml: {
    filename: "sample.yaml",
    content: `# Scripta YAML Sample
name: scripta-app
version: 1.0.0
settings:
  theme: dark
  tabSize: 2
  wordWrap: true
features:
  - markdown
  - mermaid
  - latex
`,
  },

  sql: {
    filename: "sample.sql",
    content: `-- Scripta SQL Sample
SELECT
  id,
  name,
  department,
  score
FROM employees
WHERE active = TRUE
  AND score >= 90
ORDER BY score DESC;
`,
  },
};
