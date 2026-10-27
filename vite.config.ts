import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  root: ".",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, "index.html")
    }
  },
  server: { host: "0.0.0.0", port: 5173, proxy: { "/api": "http://localhost:3000" } }
});