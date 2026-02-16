import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";

import { join } from "pathe";

import { eslint } from "@/runners/eslint";

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
    it("should create config with array of checks", () => {
      const config = defineConfig({
        checks: [
          eslint({
            files: ["**/*.ts"],
            name: "test-check",
            rules: {},
          }),
        ],
      });

      expect(config.checks).toHaveLength(1);
      expect(config.checks[0]?.id).toBe("test-check");
    });
  });

  describe("loadConfig", () => {
    it("should load .ts config files", async () => {
      writeFileSync(
        join(testDir, "mejora.config.ts"),
        `import { defineConfig, eslint } from "${originalCwd}/src/index.ts";
         export default defineConfig({
           checks: [
             eslint({ name: "test", files: ["**/*.ts"], rules: {} })
           ]
         });`,
      );

      const config = await loadConfig();

      expect(config.checks[0]?.id).toBe("test");
    });

    it("should load .mts config files", async () => {
      writeFileSync(
        join(testDir, "mejora.config.mts"),
        `import { defineConfig, typescript } from "${originalCwd}/src/index.ts";
         export default defineConfig({
           checks: [
             typescript({ name: "test", tsconfig: "./tsconfig.json" })
           ]
         });`,
      );

      const config = await loadConfig();

      expect(config.checks[0]?.config.type).toBe("typescript");
    });

    it("should load .js config files", async () => {
      writeFileSync(
        join(testDir, "mejora.config.js"),
        `import { defineConfig, eslint } from "${originalCwd}/src/index.ts";
         export default defineConfig({
           checks: [
             eslint({ name: "test", files: [], rules: {} })
           ]
         });`,
      );

      const config = await loadConfig();

      expect(config.checks[0]?.id).toBe("test");
    });

    it("should prioritize .ts over .js", async () => {
      writeFileSync(
        join(testDir, "mejora.config.ts"),
        `import { defineConfig, eslint } from "${originalCwd}/src/index.ts";
         export default defineConfig({
           checks: [
             eslint({ name: "from-ts", files: [], rules: {} })
           ]
         });`,
      );
      writeFileSync(
        join(testDir, "mejora.config.js"),
        `import { defineConfig, eslint } from "${originalCwd}/src/index.ts";
         export default defineConfig({
           checks: [
             eslint({ name: "from-js", files: [], rules: {} })
           ]
         });`,
      );

      const config = await loadConfig();

      expect(config.checks[0]?.id).toBe("from-ts");
    });

    it("should throw when no config file exists", async () => {
      await expect(loadConfig()).rejects.toThrowError(
        "No configuration file found.",
      );
    });
  });
});
