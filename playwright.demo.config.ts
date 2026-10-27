import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

/** Records the end-to-end demonstration (video per device). Run: npx playwright test -c playwright.demo.config.ts */
export default defineConfig({
  ...base,
  testDir: "tests/demo",
  timeout: 300_000,
  reporter: [["list"]],
  outputDir: "demo-output/raw",
});
