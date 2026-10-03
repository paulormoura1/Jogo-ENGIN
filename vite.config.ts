import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { createResearchMiddleware } from "./server/researchApi.mjs";

export default defineConfig(({ mode }) => ({
  base: "/Jogo-ENGIN/",
  plugins: [react(), {
    name: "research-api",
    configureServer(server) {
      const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
      server.middlewares.use(createResearchMiddleware(env));
    },
    configurePreviewServer(server) {
      const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
      server.middlewares.use(createResearchMiddleware(env));
    },
  }],
}));
