import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  let taggerPlugin = null;
  if (mode === 'development') {
    // Dynamically import the development-only plugin to avoid build-time errors in production
    const { componentTagger } = await import("lovable-tagger");
    taggerPlugin = componentTagger();
  }

  return {
    // Served by the relay under /suite/ (locally + via tunnel) — assets must
    // resolve under /suite/assets/. A bare '/' base 404s all JS (white screen).
    base: '/suite/',
    server: {
      host: "::",
      port: 8080,
      allowedHosts: ["relay.mobilemonero.com", "suite.mobilemonero.com"],
    },
    plugins: [
      react(),
      taggerPlugin,
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
