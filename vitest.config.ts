import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    globals: true,
    include: ["src/**/*.{test,spec}.{js,ts,tsx}"],
    exclude: ["e2e-tests/**/*", "node_modules/**/*"],
    coverage: {
      provider: "v8",
      // json + json-summary feed the coverage report action in CI.
      reporter: ["text", "html", "json", "json-summary"],
      reportOnFailure: true,
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.{test,spec}.*",
        "src/**/*.d.ts",
        "src/test-setup.ts",
        "src/main.tsx",
        "src/motionFeatures.ts",
      ],
      thresholds: {
        autoUpdate: true,
        statements: 84.53,
        branches: 72.88,
        functions: 81.25,
        lines: 85.01,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
