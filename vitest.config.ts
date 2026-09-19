import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  // `@/` resolves through tsconfig paths for the application build, but Vitest
  // does not read tsconfig paths, so a module that imports a runtime value
  // through the alias cannot be unit tested without this mapping.
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
