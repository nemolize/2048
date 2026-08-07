import { defineConfig, devices } from "@playwright/test";

import { localServerURL } from "./port";

const isCI = Boolean(process.env["CI"]);

export default defineConfig({
  testDir: "./e2e-tests",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  ...(isCI ? { workers: 1 } : {}),
  reporter: "list",
  use: {
    baseURL: localServerURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command: "pnpm run dev",
    url: localServerURL,
    reuseExistingServer: !isCI,
  },
});
