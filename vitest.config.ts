import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    coverage: {
      include: ["src/**/*.ts"],
    },
    globals: true,
  },
});
