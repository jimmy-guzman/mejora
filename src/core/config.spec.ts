import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";

import { join } from "pathe";

import type { Config } from "@/types";

import { defineConfig, loadConfig } from "./config";

describe("config", () => {
  let testDir: string;

  const originalCwd = process.cwd();

  beforeEach(() => {
    testDir = join(
      tmpdir(),
      `mejora-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    if (existsSync(testDir)) {
      rmSync(testDir, { force: true, recursive: true });
    }
  });

  describe("defineConfig", () => {
    it("should return config as-is", () => {
      const config: Config = {
        checks: {
          "test-check": {
            files: ["**/*.ts"],
            overrides: { rules: {} },
            type: "eslint",
          },
        },
      };

      expect(defineConfig(config)).toBe(config);
    });
  });

  describe("loadConfig", () => {
    it("should load .ts config files", async () => {
      writeFileSync(
        join(testDir, "mejora.config.ts"),
        `export default { checks: { "test": { type: "eslint", files: ["**/*.ts"], overrides: { rules: {} } } } };`,
      );

      const config = await loadConfig();

      expect(config.checks.test).toBeDefined();
    });

    it("should load .mts config files", async () => {
      writeFileSync(
        join(testDir, "mejora.config.mts"),
        `export default { checks: { "test": { type: "typescript", tsconfig: "./tsconfig.json" } } };`,
      );

      const config = await loadConfig();

      expect(config.checks.test?.type).toBe("typescript");
    });

    it("should load .js config files", async () => {
      writeFileSync(
        join(testDir, "mejora.config.js"),
        `export default { checks: { "test": { type: "eslint", files: [], overrides: { rules: {} } } } };`,
      );

      const config = await loadConfig();

      expect(config.checks.test).toBeDefined();
    });

    it("should load config without default export (named exports only)", async () => {
      writeFileSync(
        join(testDir, "mejora.config.ts"),
        `export const checks = { "test": { type: "eslint", files: [], overrides: { rules: {} } } };`,
      );

      const config = await loadConfig();

      expect(config.checks.test).toBeDefined();
    });

    it("should prioritize .ts over .js", async () => {
      writeFileSync(
        join(testDir, "mejora.config.ts"),
        `export default { checks: { "from-ts": { type: "eslint", files: [], overrides: { rules: {} } } } };`,
      );
      writeFileSync(
        join(testDir, "mejora.config.js"),
        `export default { checks: { "from-js": { type: "eslint", files: [], overrides: { rules: {} } } } };`,
      );

      const config = await loadConfig();

      expect(config.checks["from-ts"]).toBeDefined();
      expect(config.checks["from-js"]).toBeUndefined();
    });

    it("should throw when no config file exists", async () => {
      await expect(loadConfig()).rejects.toThrowError(
        "No configuration file found.",
      );
    });
  });
});
