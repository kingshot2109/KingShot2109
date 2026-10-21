import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const repoName = "KingShot2109";

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? `/${repoName}/` : "/",
  plugins: [react(), tailwindcss()],
  server: { proxy: { "/api": "http://localhost:5080" } },
  build: { chunkSizeWarningLimit: 1200 },
});
