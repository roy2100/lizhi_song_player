import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const base = isGitHubPages ? "/lizhi_song_player/" : "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      base,
      manifest: {
        name: "李志音乐播放器",
        short_name: "李志音乐",
        description: "Apple Music 风格的李志音乐播放器",
        theme_color: "#1a1a1a",
        background_color: "#fafafa",
        display: "standalone",
        orientation: "portrait",
        scope: base,
        start_url: base,
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            // 专辑封面 CDN 缓存，最多 200 张，30 天过期
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.+\.(jpg|jpeg|png|webp)/i,
            handler: "CacheFirst",
            options: {
              cacheName: "covers-cache",
              expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
  },
});
