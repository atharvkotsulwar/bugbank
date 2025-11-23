import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,         // dev server port (optional)
    open: true,         // auto-open browser
  },
  build: {
    outDir: "dist",     // default, but explicit
    sourcemap: true,    // helpful for debugging in production
  },
  resolve: {
    alias: {
      "@": "/src",      // lets you use import x from "@/components/X"
    },
  },
});
