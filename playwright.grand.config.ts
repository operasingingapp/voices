import { defineConfig } from "@playwright/test";

/**
 * The chunked grand piano against a local build (npx vite build -c vite.standalone.config.ts) and a local copy of
 * one piece's chunks (scripts/audio/grand-fixture.py). The spec serves both itself, over a throttled link.
 *   npx playwright test -c playwright.grand.config.ts
 */
export default defineConfig({
  testDir: "tests/grand",
  timeout: 120_000,
  workers: 1,
  reporter: [["list"]],
  use: {
    viewport: { width: 1180, height: 820 },
    launchOptions: { args: ["--autoplay-policy=no-user-gesture-required"] },
  },
});
