import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "client",
  server: {
    proxy: {
      '/api': 'http://localhost:5000', // Updated to match backend port
    },
  },
  plugins: [react()],
});
