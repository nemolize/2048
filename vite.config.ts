import path from "node:path";

import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { localServerPort } from "./port";

export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: localServerPort,
    strictPort: true,
    allowedHosts: [".trycloudflare.com"],
  },
  preview: {
    port: localServerPort,
    strictPort: true,
  },
});
