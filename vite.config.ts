import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import packageJson from "./package.json" with { type: "json" };
import type { Plugin } from "vite";

function generateVersionJsonPlugin(): Plugin {
  return {
    name: "generate-version-json",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "version.json",
        source: JSON.stringify(
          {
            version: packageJson.version,
            buildTime: Date.now(),
          },
          null,
          2,
        ),
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/zustand/")
          ) {
            return "react-vendor";
          }
          if (
            id.includes("node_modules/@codemirror/") ||
            id.includes("node_modules/codemirror/") ||
            id.includes("node_modules/@lezer/")
          ) {
            return "codemirror-vendor";
          }
          if (
            id.includes("node_modules/lucide-react/") ||
            id.includes("node_modules/@dnd-kit/")
          ) {
            return "ui-vendor";
          }
          return undefined;
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    generateVersionJsonPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "Scripta - Text Editor & Live Viewer",
        short_name: "Scripta",
        description:
          "High-performance hybrid text editor and live document viewer with Markdown, Mermaid, and File System Access",
        theme_color: "#181825",
        background_color: "#181825",
        display: "standalone",
        orientation: "any",
        start_url: "/",
        icons: [
          {
            src: "/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
});
