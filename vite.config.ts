import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const API = process.env.COUNTERPART_API ?? "http://localhost:3001";

export default defineConfig({
  plugins: [react()],
  assetsInclude: ["**/*.sf2"],
  server: {
    port: 5173,
    host: true,
    proxy: {
      // keep the browser's Host header so the API's same-origin check sees the real origin
      "/api": { target: API, changeOrigin: false },
      "/content": { target: API, changeOrigin: false },
      "/ws": { target: API.replace("http", "ws"), ws: true, changeOrigin: false },
    },
  },
  build: { outDir: "dist", sourcemap: true, chunkSizeWarningLimit: 4000 },
});
