import { defineConfig } from "@jimmy.codes/eslint-config";
import { GLOB_TESTS } from "@jimmy.codes/eslint-config/globs";

export default defineConfig({
  overrides: [
    {
      files: GLOB_TESTS,
      rules: {
        "@typescript-eslint/unbound-method": "off",
      },
    },
  ],
  vitest: {
    globals: "implicit",
  },
});
