# ⚡ Cloudflare Pages Deployment & Static Export Guide

## 1. Can This Project Be Statically Exported to Cloudflare Pages?

> **YES. 100% COMPATIBLE AND HIGHLY RECOMMENDED!**

Scripta is an entirely client-side Single Page Application (SPA). When running `pnpm build`:

- Vite and `vite-plugin-pwa` compile all source code into standalone static files located inside the **`dist/`** directory (`index.html`, hashed `.js` bundles, stylesheets, vector SVG icons, and Service Worker files `sw.js` / `workbox-*.js`).
- There are **zero backend dependencies**, databases, or server-side runtimes required.
- Cloudflare Pages' global Edge CDN delivers these assets with near-instant Time to First Byte (TTFB), automatic HTTPS, and global edge caching.

---

## 2. Cloudflare Pages Configuration

When linking your Git repository (GitHub / GitLab) to Cloudflare Pages:

| Setting                    | Recommended Value               |
| -------------------------- | ------------------------------- |
| **Framework preset**       | `Vite` (or `None`)              |
| **Build command**          | `pnpm build`                    |
| **Build output directory** | `dist`                          |
| **Root directory**         | `/` (leave empty for repo root) |
| **Environment Variable**   | `NODE_VERSION: 22` (or `24`)    |

---

## 3. Pre-configured Edge Cache Headers (`public/_headers`)

The repository already includes `public/_headers` to ensure proper PWA update lifecycles and high-performance asset caching on Cloudflare:

```text
/sw.js
  Cache-Control: no-cache, no-store, must-revalidate

/registerSW.js
  Cache-Control: no-cache, no-store, must-revalidate

/manifest.webmanifest
  Cache-Control: no-cache

/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

---

## 4. Direct Terminal Deployment via Wrangler CLI (Optional)

You can also deploy directly from your local terminal without Git integration:

```sh
# Deploy directly using Wrangler
npx wrangler pages deploy dist --project-name=texteditor-pwa
```
