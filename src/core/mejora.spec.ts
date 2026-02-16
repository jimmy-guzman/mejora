import { eslint } from "@/runners/eslint";
import { regex } from "@/runners/regex";
import { typescript } from "@/runners/typescript";

import { defineConfig } from "./config";
import { defineCheck } from "./define-check";

describe("defineConfig", () => {
  it("should create config from array of checks", () => {
    const config = defineConfig({
      checks: [
        eslint({
          files: ["**/*.ts"],
          name: "eslint-check",
          rules: {
            "no-console": "error",
          },
        }),
        typescript({
          compilerOptions: {
            noImplicitAny: true,
          },
          files: ["src/**/*.ts"],
          name: "ts-check",
        }),
      ],
    });

    expect(config.checks).toHaveLength(2);
    expect(config.checks[0]?.id).toBe("eslint-check");
    expect(config.checks[0]?.config.type).toBe("eslint");
    expect(config.checks[1]?.id).toBe("ts-check");
    expect(config.checks[1]?.config.type).toBe("typescript");
  });

  it("should create config with regex check", () => {
    const config = defineConfig({
      checks: [
        regex({
          files: ["**/*.ts"],
          name: "no-todos",
          patterns: [
            {
              message: "TODO comment found",
              pattern: /TODO/g,
            },
          ],
        }),
      ],
    });

    expect(config.checks).toHaveLength(1);
    expect(config.checks[0]?.id).toBe("no-todos");
    expect(config.checks[0]?.config.type).toBe("regex");
  });

  it("should create config with custom check", () => {
    const customCheck = defineCheck({
      run(_config) {
        return Promise.resolve([]);
      },
      type: "custom-check",
    });

    const config = defineConfig({
      checks: [customCheck({ files: ["**/*.ts"], name: "my-check" })],
    });

    expect(config.checks).toHaveLength(1);
    expect(config.checks[0]?.id).toBe("my-check");
    expect(config.checks[0]?.config.type).toBe("custom-check");
    expect(config.runners).toBeDefined();
    expect(config.runners).toHaveLength(1);
    expect(config.runners?.[0]?.type).toBe("custom-check");
  });

  it("should deduplicate runners with same type", () => {
    const customCheck = defineCheck({
      run() {
        return Promise.resolve([]);
      },
      type: "my-custom-check",
    });

    const config = defineConfig({
      checks: [
        customCheck({ files: ["**/*.ts"], name: "check-1" }),
        customCheck({ files: ["**/*.js"], name: "check-2" }),
      ],
    });

    expect(config.checks).toHaveLength(2);
    // Same type, so only one runner
    expect(config.runners).toHaveLength(1);
    expect(config.runners?.[0]?.type).toBe("my-custom-check");
  });

  it("should include runners for built-in checks", () => {
    const config = defineConfig({
      checks: [
        eslint({
          files: ["**/*.ts"],
          name: "eslint-check",
        }),
        typescript({ files: ["src/**/*.ts"], name: "ts-check" }),
      ],
    });

    expect(config.checks).toHaveLength(2);
    expect(config.runners).toHaveLength(2);
    expect(config.runners?.[0]?.type).toBe("eslint");
    expect(config.runners?.[1]?.type).toBe("typescript");
  });

  it("should mix built-in and custom checks", () => {
    const customCheck = defineCheck({
      run() {
        return Promise.resolve([]);
      },
      type: "custom",
    });

    const config = defineConfig({
      checks: [
        eslint({
          files: ["**/*.ts"],
          name: "eslint-check",
        }),
        customCheck({ files: ["**/*.ts"], name: "custom-check" }),
        typescript({ files: ["src/**/*.ts"], name: "ts-check" }),
      ],
    });

    expect(config.checks).toHaveLength(3);
    expect(config.runners).toHaveLength(3);
    expect(config.runners?.[0]?.type).toBe("eslint");
    expect(config.runners?.[1]?.type).toBe("custom");
    expect(config.runners?.[2]?.type).toBe("typescript");
  });
});
