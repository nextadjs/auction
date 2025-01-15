import { fileURLToPath } from "node:url";
import path from "node:path";
import { defineConfig } from "vitest/config";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
