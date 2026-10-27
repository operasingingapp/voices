import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  workers: 1,
  fullyParallel: false,
  reporter: [["list"], ["json", { outputFile: "test-results/e2e-results.json" }]],
  use: {
    baseURL: "http://localhost:3100",
    viewport: { width: 1180, height: 820 },
    launchOptions: { args: ["--autoplay-policy=no-user-gesture-required"] },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "bash tests/e2e/start-server.sh",
    url: "http://localhost:3100/api/auth/me",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
