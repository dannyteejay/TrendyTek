import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  // Vitest Configuration: Only run Unit Tests inside src/
  test: {
    globals: true,
    include: ["src/**/*.{test,spec}.{js,jsx}"],
    exclude: ["tests/**", "node_modules/**", "dist/**"],
  },
});