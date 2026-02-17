import type { ESLint as ESLintType } from "eslint";

const mockLintFiles = vi.fn();

interface MockESLintOptions {
  cache?: boolean;
  cacheLocation?: string;
  concurrency?: "auto" | number;
  overrideConfig?: unknown;
  ruleFilter?: (context: { ruleId: string; severity: number }) => boolean;
}

vi.mock("eslint", () => {
  return {
    ESLint: vi.fn(function (
      this: ESLintType & { options?: MockESLintOptions },
      options: MockESLintOptions,
    ) {
      this.lintFiles = mockLintFiles;
      this.options = options;
    }),
  };
});

const mockCreateCacheKey = vi.fn(() => "abc123def456");
const mockGetCacheDir = vi.fn(() => "node_modules/.cache/mejora/eslint");

vi.mock("@/utils/cache", () => {
  return {
    createCacheKey: mockCreateCacheKey,
    getCacheDir: mockGetCacheDir,
  };
});

const mockMkdir = vi.fn();

vi.mock("node:fs/promises", () => ({ mkdir: mockMkdir }));

const { eslint } = await import("./eslint");
const { ESLint } = await import("eslint");

describe("eslint", () => {
  it("should return Check object with eslint config", () => {
    const config = {
      files: ["src/**/*.ts"],
      name: "test-check",
      rules: { "no-console": "error" as const },
    };

    const result = eslint(config);

    expect(result.id).toBe("test-check");
    expect(result.config.type).toBe("eslint");
    expect((result.config as { files: string[] }).files).toStrictEqual(
      config.files,
    );
    expect((result.config as { rules: unknown }).rules).toStrictEqual(
      config.rules,
    );
  });
});

describe("eslint runner", () => {
  let runner: ReturnType<
    NonNullable<ReturnType<typeof eslint>["__runnerFactory"]>
  >;

  beforeEach(() => {
    vi.clearAllMocks();
    // Create a runner instance using the factory from the check
    const check = eslint({ files: ["*.js"], name: "test" });

    if (!check.__runnerFactory) {
      throw new Error("__runnerFactory is required");
    }

    runner = check.__runnerFactory();
  });

  it("should return empty items when no violations", async () => {
    mockLintFiles.mockResolvedValue([]);

    const result = await runner.run({ files: ["*.js"] });

    expect(result).toStrictEqual({
      items: [],
      type: "items",
    });
  });

  it("should configure cacheLocation using cacheDir + cacheKey", async () => {
    mockLintFiles.mockResolvedValue([]);

    vi.spyOn(process, "cwd").mockReturnValue("/test/project");

    const config = { files: ["*.js"] };

    await runner.run(config);

    expect(mockGetCacheDir).toHaveBeenCalledWith("eslint", "/test/project");
    expect(mockCreateCacheKey).toHaveBeenCalledWith(config);

    expect(ESLint).toHaveBeenCalledWith(
      expect.objectContaining({
        cache: true,
        cacheLocation:
          "node_modules/.cache/mejora/eslint/abc123def456.eslintcache",
      }),
    );
  });

  it("should extract violations as IssueInput object (no IDs)", async () => {
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

    const result = await runner.run({ files: ["*.js"] });

    expect(result.items[0]?.file).toBe("zebra.js");
    expect(result.items[1]?.file).toBe("apple.js");
  });

  it("should configure ESLint with cache and config", async () => {
    mockLintFiles.mockResolvedValue([]);

    const config = {
      files: ["*.js"],
      rules: { "no-console": "error" as const },
    };

    await runner.run(config);

    expect(ESLint).toHaveBeenCalledWith(
      expect.objectContaining({
        cache: true,
        cacheLocation: expect.stringContaining(
          "node_modules/.cache/mejora/eslint/",
        ),
        overrideConfig: { rules: config.rules },
      }),
    );
  });

  it("should use ruleFilter when rules are specified", async () => {
    mockLintFiles.mockResolvedValue([]);

    const config = {
      files: ["*.js"],
      rules: {
        "no-console": "error" as const,
        "no-debugger": "error" as const,
      },
    };

    await runner.run(config);

    const mockESLintConstructor = vi.mocked(ESLint);
    const callArgs = mockESLintConstructor.mock.calls[0]?.[0] as
      | MockESLintOptions
      | undefined;

    expect(callArgs).toHaveProperty("ruleFilter");

    expect(callArgs?.ruleFilter?.({ ruleId: "no-console", severity: 2 })).toBe(
      true,
    );
    expect(callArgs?.ruleFilter?.({ ruleId: "no-debugger", severity: 2 })).toBe(
      true,
    );
    expect(callArgs?.ruleFilter?.({ ruleId: "semi", severity: 2 })).toBe(false);
  });

  it("should NOT use ruleFilter when no rules are specified", async () => {
    mockLintFiles.mockResolvedValue([]);

    const config = {
      files: ["*.js"],
    };

    await runner.run(config);

    const mockESLintConstructor = vi.mocked(ESLint);
    const callArgs = mockESLintConstructor.mock.calls[0]?.[0] as
      | MockESLintOptions
      | undefined;

    expect(callArgs).not.toHaveProperty("ruleFilter");
  });

  it("should NOT set concurrency when using ruleFilter", async () => {
    mockLintFiles.mockResolvedValue([]);

    const config = {
      concurrency: 4,
      files: ["*.js"],
      rules: { "no-console": "error" as const },
    };

    await runner.run(config);

    const mockESLintConstructor = vi.mocked(ESLint);
    const callArgs = mockESLintConstructor.mock.calls[0]?.[0] as
      | MockESLintOptions
      | undefined;

    expect(callArgs).not.toHaveProperty("concurrency");
    expect(callArgs).toHaveProperty("ruleFilter");
  });

  it("should use concurrency when NOT using ruleFilter", async () => {
    mockLintFiles.mockResolvedValue([]);

    const config = {
      concurrency: 4,
      files: ["*.js"],
    };

    await runner.run(config);

    expect(ESLint).toHaveBeenCalledWith(
      expect.objectContaining({
        concurrency: 4,
      }),
    );
  });

  it("should default concurrency to 'auto' when no rules are specified", async () => {
    mockLintFiles.mockResolvedValue([]);

    const config = {
      files: ["*.js"],
    };

    await runner.run(config);

    expect(ESLint).toHaveBeenCalledWith(
      expect.objectContaining({
        concurrency: "auto",
      }),
    );
  });

  it("should create cacheDir recursively", async () => {
    vi.spyOn(process, "cwd").mockReturnValue("/test/project");

    expect(runner.setup).toBeDefined();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked above
    await runner.setup!();

    expect(mockGetCacheDir).toHaveBeenCalledWith("eslint", "/test/project");
    expect(mockMkdir).toHaveBeenCalledWith(
      "node_modules/.cache/mejora/eslint",
      { recursive: true },
    );
  });

  it("should pass when eslint import succeeds", async () => {
    expect(runner.validate).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked above
    await expect(runner.validate!()).resolves.toBeUndefined();
  });

  it("should throw helpful error when eslint import fails", async () => {
    vi.resetModules();

    vi.doMock("eslint", () => {
      throw new Error("nope");
    });

    const { eslint: freshEslint } = await import("./eslint");
    const freshCheck = freshEslint({ files: ["*.js"], name: "test" });

    expect(freshCheck.__runnerFactory).toBeDefined();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked above
    const freshRunner = freshCheck.__runnerFactory!();

    expect(freshRunner.validate).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked above
    await expect(freshRunner.validate!()).rejects.toThrowError(
      'eslint check requires "eslint" package to be installed. Run: npm install eslint',
    );
  });
});
