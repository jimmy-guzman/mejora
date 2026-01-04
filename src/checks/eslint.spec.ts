import type { ESLint as ESLintType } from "eslint";

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

const { eslintCheck, ESLintCheckRunner } = await import("./eslint");
const { ESLint } = await import("eslint");

describe("eslintCheck", () => {
  it("should return config with type 'eslint'", () => {
    const config = {
      files: ["src/**/*.ts"],
      overrides: { rules: { "no-console": "error" as const } },
    };

    const result = eslintCheck(config);

    expect(result.type).toBe("eslint");
    expect(result.files).toStrictEqual(config.files);
    expect(result.overrides).toStrictEqual(config.overrides);
  });
});

describe("ESLintCheckRunner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty items when no violations", async () => {
    mockLintFiles.mockResolvedValue([]);

    const runner = new ESLintCheckRunner();

    const result = await runner.run({ files: ["*.js"] });

    expect(result).toStrictEqual({
      items: [],
      type: "items",
    });
  });

  it("should extract violations as FindingInput object (no IDs)", async () => {
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

    const runner = new ESLintCheckRunner();

    const result = await runner.run({ files: ["src/**/*.js"] });

    expect(result.items).toHaveLength(2);

    expect(result.items[0]).toStrictEqual({
      column: 5,
      file: "src/file.js",
      line: 1,
      message: "'foo' is not defined.",
      rule: "no-undef",
    });
    expect(result.items[1]).toStrictEqual({
      column: 10,
      file: "src/file.js",
      line: 2,
      message: "Unexpected console statement.",
      rule: "no-console",
    });
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

    const runner = new ESLintCheckRunner();

    const result = await runner.run({ files: ["*.js"] });

    expect(result.items).toHaveLength(2);
    expect(result.items[0]?.rule).toBe("no-undef");
    expect(result.items[1]?.rule).toBe("semi");
  });

  it("should NOT sort items - that happens in normalizeSnapshot()", async () => {
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

    const runner = new ESLintCheckRunner();

    const result = await runner.run({ files: ["*.js"] });

    expect(result.items[0]?.file).toBe("zebra.js");
    expect(result.items[1]?.file).toBe("apple.js");
  });

  it("should configure ESLint with cache, concurrency, and overrides", async () => {
    mockLintFiles.mockResolvedValue([]);

    const config = {
      files: ["*.js"],
      overrides: { rules: { "no-console": "error" as const } },
    };

    const runner = new ESLintCheckRunner();

    await runner.run(config);

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

  it("should use custom concurrency when provided", async () => {
    mockLintFiles.mockResolvedValue([]);

    const config = {
      concurrency: 4,
      files: ["*.ts"],
    };

    const runner = new ESLintCheckRunner();

    await runner.run(config);

    expect(ESLint).toHaveBeenCalledWith(
      expect.objectContaining({
        concurrency: 4,
      }),
    );
  });
});
