import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Electron loads the production build from disk, so asset URLs must be
  // relative.
  base: "./",
  build: {
    outDir: "build",
  },
  test: {
    projects: [
      {
        test: {
          name: "renderer",
          include: ["src/**/*.test.{js,jsx}"],
          environment: "jsdom",
          setupFiles: ["src/test/setup.js"],
        },
      },
      {
        test: {
          name: "electron",
          include: ["electron/**/*.test.js"],
          environment: "node",
        },
      },
    ],
  },
});
