import type { ESLint as ESLintType } from "eslint";

import type { ESLintCheckConfig } from "@/types";

const mockLintFiles = vi.fn();

vi.mock("eslint", () => {
  return {
    ESLint: vi.fn(function (this: ESLintType) {
      this.lintFiles = mockLintFiles;
    }),
  };
});

vi.mock("@/utils/cache", () => {
  return {
    ensureCacheDir: vi.fn(),
    makeCacheKey: vi.fn(() => `node_modules/.cache/mejora/eslint/`),
  };
});

const { eslintCheck, runEslintCheck } = await import("./eslint");
const { ESLint } = await import("eslint");

describe("eslintCheck", () => {
  it("should return config with type 'eslint'", () => {
    const config: ESLintCheckConfig = {
      files: ["src/**/*.ts"],
      overrides: { rules: { "no-console": "error" } },
    };

    const result = eslintCheck(config);

    expect(result.type).toBe("eslint");
    expect(result.files).toStrictEqual(config.files);
    expect(result.overrides).toStrictEqual(config.overrides);
  });
});

describe("runEslintCheck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty items when no violations", async () => {
    mockLintFiles.mockResolvedValue([]);

    const result = await runEslintCheck({ files: ["*.js"] });

    expect(result).toStrictEqual({
      items: [],
      type: "items",
    });
  });

  it("should extract violations as filepath:line:column - ruleId", async () => {
    mockLintFiles.mockResolvedValue([
      {
        filePath: "/test/project/src/file.js",
        messages: [
          { column: 5, line: 1, ruleId: "no-undef" },
          { column: 10, line: 2, ruleId: "no-console" },
        ],
      },
    ]);

    vi.spyOn(process, "cwd").mockReturnValue("/test/project");

    const result = await runEslintCheck({ files: ["src/**/*.js"] });

    expect(result.items).toStrictEqual([
      "src/file.js:1:5 - no-undef",
      "src/file.js:2:10 - no-console",
    ]);
  });

  it("should filter out messages without ruleId", async () => {
    mockLintFiles.mockResolvedValue([
      {
        filePath: "/test/project/file.js",
        messages: [
          { column: 1, line: 1, ruleId: "no-undef" },
          { column: 1, line: 2, ruleId: null },
          { column: 1, line: 3, ruleId: "semi" },
        ],
      },
    ]);

    vi.spyOn(process, "cwd").mockReturnValue("/test/project");

    const result = await runEslintCheck({ files: ["*.js"] });

    expect(result.items).toStrictEqual([
      "file.js:1:1 - no-undef",
      "file.js:3:1 - semi",
    ]);
  });

  it("should sort items", async () => {
    mockLintFiles.mockResolvedValue([
      {
        filePath: "/test/project/zebra.js",
        messages: [{ column: 1, line: 1, ruleId: "no-undef" }],
      },
      {
        filePath: "/test/project/apple.js",
        messages: [{ column: 1, line: 1, ruleId: "no-undef" }],
      },
    ]);

    vi.spyOn(process, "cwd").mockReturnValue("/test/project");

    const result = await runEslintCheck({ files: ["*.js"] });

    expect(result.items).toStrictEqual([
      "apple.js:1:1 - no-undef",
      "zebra.js:1:1 - no-undef",
    ]);
  });

  it("should configure ESLint with cache and overrides", async () => {
    mockLintFiles.mockResolvedValue([]);

    const config: ESLintCheckConfig = {
      files: ["*.js"],
      overrides: { rules: { "no-console": "error" } },
    };

    await runEslintCheck(config);

    expect(ESLint).toHaveBeenCalledWith(
      expect.objectContaining({
        cache: true,
        cacheLocation: expect.stringContaining(
          "node_modules/.cache/mejora/eslint/",
        ),
        concurrency: "auto",
        overrideConfig: config.overrides,
      }),
    );
  });
});

describe("validateEslintDeps", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("should not throw if eslint is installed", async () => {
    const { validateEslintDeps } = await import("./eslint");

    await expect(validateEslintDeps()).resolves.not.toThrowError();
  });

  it("should throw if eslint is not installed", async () => {
    vi.doUnmock("eslint");
    vi.doMock("eslint", () => {
      throw new Error("Cannot find module 'eslint'");
    });

    const { validateEslintDeps } = await import("./eslint");

    await expect(validateEslintDeps()).rejects.toThrowError(
      "ESLint check requires eslint but it's not installed.",
    );
  });
});
