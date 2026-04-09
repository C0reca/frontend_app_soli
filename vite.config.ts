import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [],
    css: false,
  },
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
        ws: true, // Proxy WebSocket para cookies httpOnly
        // Em dev: reescrever /api -> vazio; paths só com um segmento (ex. /clientes, /processos) ganham / no fim para bater nas rotas do backend
        rewrite: (path) => {
          const p = path.replace(/^\/api/, "");
          const pathOnly = p.split("?")[0];
          const segments = pathOnly.split("/").filter(Boolean);
          const needsSlash = segments.length === 1 && !pathOnly.endsWith("/");
          return needsSlash ? pathOnly + "/" + (p.includes("?") ? "?" + p.split("?")[1] : "") : p;
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
