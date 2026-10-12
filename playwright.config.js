import { defineConfig } from "@playwright/test";

// End-to-end tests drive the real Electron app against the production build.
// Run them with `npm run test:e2e` (which builds first).
export default defineConfig({
  testDir: "e2e",
  timeout: 30_000,
});
