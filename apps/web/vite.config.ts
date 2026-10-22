import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

declare const process: { env: { GITHUB_ACTIONS?: string } };

const repoName = "KingShot2109";

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? `/${repoName}/` : "/",
  plugins: [react(), tailwindcss()],
  server: { proxy: { "/api": "http://localhost:5080" } },
  build: { chunkSizeWarningLimit: 1200 },
});
