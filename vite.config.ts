
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  root: "client",
  base: "./",
  server: {
    proxy: {
      '/api': 'http://localhost:5000', // Updated to match backend port
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "./shared"),
      "@": path.resolve(__dirname, "./client/src"),
    },
  },
  build: {
    rollupOptions: {
      // No external modules; bundle everything needed for static deployment
    },
  },
});
