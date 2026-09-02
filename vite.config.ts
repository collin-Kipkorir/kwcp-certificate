import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";

// Basic Vite config for a client-side React SPA.
// This replaces the TanStack Start SSR config so the project builds a static `dist` folder.
export default defineConfig({
  base: './',
  plugins: [react(), tailwind()],
  build: {
    outDir: "dist",
    sourcemap: false
  }
});
