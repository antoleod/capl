import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/capl/",
  plugins: [react()],
  server: {
    proxy: {
      "/upload": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
      "/render": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
      "/status": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
      "/outputs": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
    },
  },
});