import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import pkg from "./package.json";

export default defineConfig({
  base: "./",
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-192.png", "icon-512.png"],
      manifest: {
        name: "Minhas Contas",
        short_name: "Contas",
        description: "Organize suas contas: gastos, salário, férias, 13º e metas",
        lang: "pt-BR",
        start_url: "./",
        scope: "./",
        display: "standalone",
        orientation: "portrait",
        background_color: "#020617",
        theme_color: "#020617",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          recharts: ["recharts"],
        },
      },
    },
  },
});
