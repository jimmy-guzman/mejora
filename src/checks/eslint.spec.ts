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
    createCacheKey: vi.fn(() => "abc123def456"),
    getCacheDir: vi.fn(() => "node_modules/.cache/mejora/eslint"),
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

  it("should extract violations as DiagnosticItem objects", async () => {
    mockLintFiles.mockResolvedValue([
      {
        filePath: "/test/project/src/file.js",
        messages: [
          {
            column: 5,
            line: 1,
            message: "'foo' is not defined.",
            ruleId: "no-undef",
          },
          {
            column: 10,
            line: 2,
            message: "Unexpected console statement.",
            ruleId: "no-console",
          },
        ],
      },
    ]);

    vi.spyOn(process, "cwd").mockReturnValue("/test/project");

    const result = await runEslintCheck({ files: ["src/**/*.js"] });

    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      column: 5,
      file: "src/file.js",
      line: 1,
      message: "'foo' is not defined.",
      rule: "no-undef",
    });
    expect(result.items[0]?.id).toBeDefined();
    expect(result.items[1]).toMatchObject({
      column: 10,
      file: "src/file.js",
      line: 2,
      message: "Unexpected console statement.",
      rule: "no-console",
    });
    expect(result.items[1]?.id).toBeDefined();
  });

  it("should filter out messages without ruleId", async () => {
    mockLintFiles.mockResolvedValue([
      {
        filePath: "/test/project/file.js",
        messages: [
          { column: 1, line: 1, message: "error1", ruleId: "no-undef" },
          { column: 1, line: 2, message: "error2", ruleId: null },
          { column: 1, line: 3, message: "error3", ruleId: "semi" },
        ],
      },
    ]);

    vi.spyOn(process, "cwd").mockReturnValue("/test/project");

    const result = await runEslintCheck({ files: ["*.js"] });

    expect(result.items).toHaveLength(2);
    expect(result.items[0]?.rule).toBe("no-undef");
    expect(result.items[1]?.rule).toBe("semi");
  });

  it("should sort items by file name, line number, and column number", async () => {
    mockLintFiles.mockResolvedValue([
      {
        filePath: "/test/project/zebra.js",
        messages: [
          { column: 1, line: 1, message: "error", ruleId: "no-undef" },
        ],
      },
      {
        filePath: "/test/project/apple.js",
        messages: [
          { column: 1, line: 1, message: "error", ruleId: "no-undef" },
        ],
      },
    ]);

    vi.spyOn(process, "cwd").mockReturnValue("/test/project");

    const result = await runEslintCheck({ files: ["*.js"] });

    expect(result.items[0]?.file).toBe("apple.js");
    expect(result.items[1]?.file).toBe("zebra.js");
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
