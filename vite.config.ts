import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const base = "/Fitness-app/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.svg",
        "icons/apple-touch-icon.png",
        "icons/icon-192.png",
        "icons/icon-512.png",
        "icons/icon-maskable-512.png",
      ],
      manifest: {
        name: "Fitness",
        short_name: "Fitness",
        description: "Daily targets, workouts, exercise demos, and progress. Logs stay on this phone.",
        lang: "en",
        theme_color: "#1d1a16",
        background_color: "#f3efe6",
        display: "standalone",
        start_url: base,
        scope: base,
        id: base,
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        cacheId: "fitness-v9",
        globPatterns: ["**/*.{js,css,html,svg,png,webmanifest,ico}"],
        navigateFallback: `${base}index.html`,
        navigateFallbackDenylist: [/\/assets\//],
      },
    }),
  ],
});
