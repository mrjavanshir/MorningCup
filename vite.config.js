import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages serves the site from /MorningCup/, so assets need that prefix.
// Dev server is unaffected.
export default defineConfig({
  base: "/MorningCup/",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["sun.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Hello, Ganira",
        short_name: "Ganira",
        description: "A little something, whenever you need it.",
        // The site root renders deliberately blank, so an installed app has to
        // start at the hub or it opens to an empty screen.
        start_url: "/MorningCup/games",
        scope: "/MorningCup/",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#170D11",
        background_color: "#170D11",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        // The per-route HTML files are written by scripts/prerender.mjs *after*
        // this plugin builds its precache list, so they are not in it. Falling
        // back to the precached index.html covers every route offline instead,
        // and avoids shipping a dozen identical copies of the same HTML.
        navigateFallback: "/MorningCup/index.html",
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Recitations are large and never change, so keep them but cap the
            // number so the cache cannot grow without limit.
            urlPattern: /^https:\/\/everyayah\.com\//,
            handler: "CacheFirst",
            options: {
              cacheName: "recitation",
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Never serve a cached collection: a stale one would show the wrong
            // kept verses, and writes must not be answered from a cache at all.
            urlPattern: /^https:\/\/ganira-games-store\..*\.workers\.dev\//,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
});
