import type { TypeScriptCheckConfig } from "@/types";

const mockGetPreEmitDiagnostics = vi.fn();
const mockGetProgram = vi.fn();
const mockCreateIncrementalProgram = vi.fn();
const mockCreateIncrementalCompilerHost = vi.fn();
const mockFindConfigFile = vi.fn();
const mockReadConfigFile = vi.fn();
const mockParseJsonConfigFileContent = vi.fn();
const mockFlattenDiagnosticMessageText = vi.fn();

vi.mock("typescript", () => {
  return {
    createIncrementalCompilerHost: mockCreateIncrementalCompilerHost,
    createIncrementalProgram: mockCreateIncrementalProgram,
    findConfigFile: mockFindConfigFile,
    flattenDiagnosticMessageText: mockFlattenDiagnosticMessageText,
    getPreEmitDiagnostics: mockGetPreEmitDiagnostics,
    parseJsonConfigFileContent: mockParseJsonConfigFileContent,
    readConfigFile: mockReadConfigFile,
    sys: {
      fileExists: vi.fn(),
      readFile: vi.fn(),
    },
    version: "5.0.0",
  };
});

const mockCreateCacheKey = vi.fn().mockReturnValue("abc123def456");
const mockGetCacheDir = vi.fn(() => "node_modules/.cache/mejora/typescript");

vi.mock("@/utils/cache", () => {
  return {
    createCacheKey: mockCreateCacheKey,
    getCacheDir: mockGetCacheDir,
  };
});

const mockMkdir = vi.fn();

vi.mock("node:fs/promises", () => ({ mkdir: mockMkdir }));

const { typescript } = await import("./typescript");

describe("typescript", () => {
  it("should return Check object with typescript config", () => {
    const config: TypeScriptCheckConfig & { name: string } = {
      compilerOptions: { strict: true },
      name: "test-check",
      tsconfig: "tsconfig.json",
    };

    const result = typescript(config);
    const resultConfig = result.config as unknown as TypeScriptCheckConfig;

    expect(result.id).toBe("test-check");
    expect(result.config.type).toBe("typescript");
    expect(resultConfig.tsconfig).toBe(config.tsconfig);
    expect(resultConfig.compilerOptions).toStrictEqual(config.compilerOptions);
  });
});

describe("typescript runner", () => {
  let runner: ReturnType<
    NonNullable<ReturnType<typeof typescript>["__runnerFactory"]>
  >;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, "cwd").mockReturnValue("/test/project");

    // Create a runner instance using the factory from the check
    const check = typescript({ name: "test", tsconfig: "tsconfig.json" });

    if (!check.__runnerFactory) {
      throw new Error("__runnerFactory is required");
    }

    runner = check.__runnerFactory();

    mockCreateIncrementalCompilerHost.mockReturnValue({
      writeFile: vi.fn(),
    });
    mockGetProgram.mockReturnValue({});
    mockCreateIncrementalProgram.mockReturnValue({
      emit: vi.fn(),
      getProgram: mockGetProgram,
    });

    mockFlattenDiagnosticMessageText.mockImplementation((msg: unknown) => {
      return typeof msg === "string" ? msg : String(msg);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return empty items when no diagnostics", async () => {
    mockFindConfigFile.mockReturnValue("/test/project/tsconfig.json");
    mockReadConfigFile.mockReturnValue({ config: {} });
    mockParseJsonConfigFileContent.mockReturnValue({
      fileNames: [],
      options: {},
    });
    mockGetPreEmitDiagnostics.mockReturnValue([]);

    const result = await runner.run({ tsconfig: "tsconfig.json" });

    expect(result).toStrictEqual({
      items: [],
      type: "items",
    });
  });

  it("should create incremental compiler with correct options", async () => {
    mockFindConfigFile.mockReturnValue("/test/project/tsconfig.json");
    mockReadConfigFile.mockReturnValue({ config: {} });
    mockParseJsonConfigFileContent.mockReturnValue({
      fileNames: ["src/file.ts"],
      options: { strict: true },
    });
    mockGetPreEmitDiagnostics.mockReturnValue([]);

    await runner.run({ tsconfig: "tsconfig.json" });

    expect(mockCreateIncrementalProgram).toHaveBeenCalledWith({
      host: expect.anything(),
      options: expect.objectContaining({
        incremental: true,
        noEmit: true,
        skipLibCheck: true,
        strict: true,
        tsBuildInfoFile:
          "/test/project/node_modules/.cache/mejora/typescript/abc123def456.tsbuildinfo",
      }),
      projectReferences: [],
      rootNames: ["src/file.ts"],
    });
  });

  it("should pass project references when available", async () => {
    const projectReferences = [{ path: "../shared" }];

    mockFindConfigFile.mockReturnValue("/test/project/tsconfig.json");
    mockReadConfigFile.mockReturnValue({ config: {} });
    mockParseJsonConfigFileContent.mockReturnValue({
      fileNames: [],
      options: {},
      projectReferences,
    });
    mockGetPreEmitDiagnostics.mockReturnValue([]);

    await runner.run({ tsconfig: "tsconfig.json" });

    expect(mockCreateIncrementalProgram).toHaveBeenCalledWith(
      expect.objectContaining({
        projectReferences,
      }),
    );
  });

  it("should respect skipLibCheck from tsconfig", async () => {
    mockFindConfigFile.mockReturnValue("/test/project/tsconfig.json");
    mockReadConfigFile.mockReturnValue({ config: {} });
    mockParseJsonConfigFileContent.mockReturnValue({
      fileNames: [],
      options: { skipLibCheck: false },
    });
    mockGetPreEmitDiagnostics.mockReturnValue([]);

    await runner.run({ tsconfig: "tsconfig.json" });

    expect(mockCreateIncrementalProgram).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          skipLibCheck: false,
        }),
      }),
    );
  });

  it("should extract diagnostics as IssueInput objects (no ID)", async () => {
    const mockFile = {
      fileName: "/test/project/src/file.ts",
      getLineAndCharacterOfPosition: vi.fn().mockReturnValue({
        character: 4,
        line: 0,
      }),
    };

    mockFindConfigFile.mockReturnValue("/test/project/tsconfig.json");
    mockReadConfigFile.mockReturnValue({ config: {} });
    mockParseJsonConfigFileContent.mockReturnValue({
      fileNames: ["src/file.ts"],
      options: {},
    });
    mockGetPreEmitDiagnostics.mockReturnValue([
      {
        code: 2304,
        file: mockFile,
        messageText: "Cannot find name 'foo'.",
        start: 4,
      },
    ]);
    mockFlattenDiagnosticMessageText.mockReturnValue("Cannot find name 'foo'.");

    const result = await runner.run({ tsconfig: "tsconfig.json" });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toStrictEqual({
      column: 5,
      file: "src/file.ts",
      line: 1,
      message: "Cannot find name 'foo'.",
      rule: "TS2304",
    });
  });

  it("should handle diagnostics without file location", async () => {
    mockFindConfigFile.mockReturnValue("/test/project/tsconfig.json");
    mockReadConfigFile.mockReturnValue({ config: {} });
    mockParseJsonConfigFileContent.mockReturnValue({
      fileNames: [],
      options: {},
    });
    mockGetPreEmitDiagnostics.mockReturnValue([
      {
        code: 5009,
        messageText: "Cannot find the common subdirectory path",
      },
    ]);
    mockFlattenDiagnosticMessageText.mockReturnValue(
      "Cannot find the common subdirectory path",
    );

    const result = await runner.run({ tsconfig: "tsconfig.json" });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      column: 0,
      file: "(global)",
      line: 0,
      message: "Cannot find the common subdirectory path",
      rule: "TS5009",
    });
  });

  it("should NOT sort items - that happens in normalizeSnapshot()", async () => {
    const mockFile1 = {
      fileName: "/test/project/zebra.ts",
      getLineAndCharacterOfPosition: vi.fn().mockReturnValue({
        character: 0,
        line: 0,
      }),
    };
    const mockFile2 = {
      fileName: "/test/project/apple.ts",
      getLineAndCharacterOfPosition: vi.fn().mockReturnValue({
        character: 0,
        line: 0,
      }),
    };

    mockFindConfigFile.mockReturnValue("/test/project/tsconfig.json");
    mockReadConfigFile.mockReturnValue({ config: {} });
    mockParseJsonConfigFileContent.mockReturnValue({
      fileNames: [],
      options: {},
    });
    mockGetPreEmitDiagnostics.mockReturnValue([
      { code: 2304, file: mockFile1, messageText: "error", start: 0 },
      { code: 2304, file: mockFile2, messageText: "error", start: 0 },
    ]);
    mockFlattenDiagnosticMessageText.mockReturnValue("error");

    const result = await runner.run({ tsconfig: "tsconfig.json" });

    expect(result.items[0]?.file).toBe("zebra.ts");
    expect(result.items[1]?.file).toBe("apple.ts");
  });

  it("should use custom tsconfig path when provided", async () => {
    mockFindConfigFile.mockReturnValue("/test/project/tsconfig.build.json");
    mockReadConfigFile.mockReturnValue({ config: {} });
    mockParseJsonConfigFileContent.mockReturnValue({
      fileNames: [],
      options: {},
    });
    mockGetPreEmitDiagnostics.mockReturnValue([]);

    await runner.run({ tsconfig: "tsconfig.build.json" });

    expect(mockReadConfigFile).toHaveBeenCalledWith(
      "/test/project/tsconfig.build.json",
      expect.any(Function),
    );
  });

  it("should throw when tsconfig not found", async () => {
    mockFindConfigFile.mockReturnValue(undefined);

    await expect(runner.run({})).rejects.toThrowError(
      "TypeScript config file not found",
    );
  });

  it("should throw when tsconfig has read error", async () => {
    mockFindConfigFile.mockReturnValue("/test/project/tsconfig.json");
    mockReadConfigFile.mockReturnValue({
      error: { messageText: "Syntax error in config" },
    });

    await expect(
      runner.run({ tsconfig: "tsconfig.json" }),
    ).rejects.toThrowError(
      "Failed to read TypeScript config: Syntax error in config",
    );
  });

  it("should apply compiler options", async () => {
    mockFindConfigFile.mockReturnValue("/test/project/tsconfig.json");
    mockReadConfigFile.mockReturnValue({ config: {} });
    mockParseJsonConfigFileContent.mockReturnValue({
      fileNames: [],
      options: {},
    });
    mockGetPreEmitDiagnostics.mockReturnValue([]);

    const compilerOptions = { strict: true };

    await runner.run({ compilerOptions, tsconfig: "tsconfig.json" });

    expect(mockParseJsonConfigFileContent).toHaveBeenCalledWith(
      {},
      expect.anything(),
      expect.anything(),
      compilerOptions,
    );
  });

  it("should convert 0-based line/character to 1-based", async () => {
    const mockFile = {
      fileName: "/test/project/test.ts",
      getLineAndCharacterOfPosition: vi.fn().mockReturnValue({
        character: 19,
        line: 9,
      }),
    };

    mockFindConfigFile.mockReturnValue("/test/project/tsconfig.json");
    mockReadConfigFile.mockReturnValue({ config: {} });
    mockParseJsonConfigFileContent.mockReturnValue({
      fileNames: [],
      options: {},
    });
    mockGetPreEmitDiagnostics.mockReturnValue([
      { code: 2304, file: mockFile, messageText: "error", start: 0 },
    ]);
    mockFlattenDiagnosticMessageText.mockReturnValue("error");

    const result = await runner.run({ tsconfig: "tsconfig.json" });

    expect(result.items[0]?.line).toBe(10);
    expect(result.items[0]?.column).toBe(20);
  });

  it("should handle multiline diagnostic messages", async () => {
    const mockFile = {
      fileName: "/test/project/test.ts",
      getLineAndCharacterOfPosition: vi.fn().mockReturnValue({
        character: 0,
        line: 0,
      }),
    };

    mockFindConfigFile.mockReturnValue("/test/project/tsconfig.json");
    mockReadConfigFile.mockReturnValue({ config: {} });
    mockParseJsonConfigFileContent.mockReturnValue({
      fileNames: [],
      options: {},
    });
    mockGetPreEmitDiagnostics.mockReturnValue([
      {
        code: 2345,
        file: mockFile,
        messageText: { messageText: "Complex error", next: [] },
        start: 0,
      },
    ]);
    mockFlattenDiagnosticMessageText.mockReturnValue("Flattened error message");

    const result = await runner.run({ tsconfig: "tsconfig.json" });

    expect(result.items[0]?.message).toBe("Flattened error message");
    expect(mockFlattenDiagnosticMessageText).toHaveBeenCalledWith(
      { messageText: "Complex error", next: [] },
      "\n",
    );
  });

  it("should throw when tsconfig has read error with complex message", async () => {
    mockFindConfigFile.mockReturnValue("/test/project/tsconfig.json");
    mockReadConfigFile.mockReturnValue({
      error: { messageText: { messageText: "Complex error", next: [] } },
    });
    mockFlattenDiagnosticMessageText.mockReturnValue("Flattened complex error");

    await expect(
      runner.run({ tsconfig: "tsconfig.json" }),
    ).rejects.toThrowError(
      "Failed to read TypeScript config: Flattened complex error",
    );
  });

  it("should filter out diagnostics from files outside workspace", async () => {
    const mockFileInside = {
      fileName: "/test/project/src/file.ts",
      getLineAndCharacterOfPosition: vi.fn().mockReturnValue({
        character: 0,
        line: 0,
      }),
    };
    const mockFileOutside = {
      fileName: "/test/libs/mocks/src/file.ts",
      getLineAndCharacterOfPosition: vi.fn().mockReturnValue({
        character: 0,
        line: 0,
      }),
    };

    mockFindConfigFile.mockReturnValue("/test/project/tsconfig.json");
    mockReadConfigFile.mockReturnValue({ config: {} });
    mockParseJsonConfigFileContent.mockReturnValue({
      fileNames: [],
      options: {},
    });
    mockGetPreEmitDiagnostics.mockReturnValue([
      {
        code: 2304,
        file: mockFileInside,
        messageText: "error inside",
        start: 0,
      },
      {
        code: 2322,
        file: mockFileOutside,
        messageText: "error outside",
        start: 0,
      },
    ]);
    mockFlattenDiagnosticMessageText
      .mockReturnValueOnce("error inside")
      .mockReturnValueOnce("error outside");

    const result = await runner.run({ tsconfig: "tsconfig.json" });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.file).toBe("src/file.ts");
    expect(result.items[0]?.message).toBe("error inside");
  });

  it("should not include files from sibling directories with similar names", async () => {
    const mockFileInside = {
      fileName: "/test/project/src/file.ts",
      getLineAndCharacterOfPosition: vi.fn().mockReturnValue({
        character: 0,
        line: 0,
      }),
    };
    const mockFileSibling = {
      fileName: "/test/project-other/src/file.ts",
      getLineAndCharacterOfPosition: vi.fn().mockReturnValue({
        character: 0,
        line: 0,
      }),
    };

    mockFindConfigFile.mockReturnValue("/test/project/tsconfig.json");
    mockReadConfigFile.mockReturnValue({ config: {} });
    mockParseJsonConfigFileContent.mockReturnValue({
      fileNames: [],
      options: {},
    });
    mockGetPreEmitDiagnostics.mockReturnValue([
      {
        code: 2304,
        file: mockFileInside,
        messageText: "error inside",
        start: 0,
      },
      {
        code: 2322,
        file: mockFileSibling,
        messageText: "error in sibling",
        start: 0,
      },
    ]);
    mockFlattenDiagnosticMessageText.mockReset();
    mockFlattenDiagnosticMessageText.mockImplementation((msg: unknown) => {
      return typeof msg === "string" ? msg : String(msg);
    });

    const result = await runner.run({ tsconfig: "tsconfig.json" });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.file).toBe("src/file.ts");
    expect(result.items[0]?.message).toBe("error inside");
  });

  it("should call emit to enable tsbuildinfo caching", async () => {
    const realWriteFile = vi.fn();
    const host = { writeFile: realWriteFile };
    const emit = vi.fn();

    mockCreateIncrementalCompilerHost.mockReturnValue(host);
    mockCreateIncrementalProgram.mockReturnValue({
      emit,
      getProgram: mockGetProgram,
    });

    mockFindConfigFile.mockReturnValue("/test/project/tsconfig.json");
    mockReadConfigFile.mockReturnValue({ config: {} });
    mockParseJsonConfigFileContent.mockReturnValue({
      fileNames: ["src/file.ts"],
      options: {},
    });
    mockGetPreEmitDiagnostics.mockReturnValue([]);

    await runner.run({ tsconfig: "tsconfig.json" });

    expect(emit).toHaveBeenCalledOnce();
  });

  it("should filter host.writeFile to only allow tsBuildInfoFile writes", async () => {
    const realWriteFile = vi.fn();
    const host = { writeFile: realWriteFile };

    let capturedHost: typeof host | undefined;
    let capturedOptions: { tsBuildInfoFile: string };

    const emit = vi.fn();

    mockCreateIncrementalCompilerHost.mockReturnValue(host);
    mockCreateIncrementalProgram.mockImplementation(
      (args: { host: typeof host; options: { tsBuildInfoFile: string } }) => {
        capturedHost = args.host;
        capturedOptions = args.options;
        emit.mockImplementation(() => {
          capturedHost?.writeFile(capturedOptions.tsBuildInfoFile, "testing");
          capturedHost?.writeFile("/test/project/src/file.ts", "NOPE");
          capturedHost?.writeFile(
            "/test/project/node_modules/.cache/mejora/typescript/other.tsbuildinfo",
            "NOPE",
          );
        });

        return {
          emit,
          getProgram: mockGetProgram,
        };
      },
    );

    mockFindConfigFile.mockReturnValue("/test/project/tsconfig.json");
    mockReadConfigFile.mockReturnValue({ config: {} });
    mockParseJsonConfigFileContent.mockReturnValue({
      fileNames: ["src/file.ts"],
      options: {},
    });
    mockGetPreEmitDiagnostics.mockReturnValue([]);

    await runner.run({ tsconfig: "tsconfig.json" });

    expect(realWriteFile).toHaveBeenCalledExactlyOnceWith(
      "/test/project/node_modules/.cache/mejora/typescript/abc123def456.tsbuildinfo",
      "testing",
    );
  });

  it("should create cacheDir recursively", async () => {
    expect(runner.setup).toBeDefined();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked above
    await runner.setup!();

    expect(mockGetCacheDir).toHaveBeenCalledWith("typescript", "/test/project");
    expect(mockMkdir).toHaveBeenCalledWith(
      "node_modules/.cache/mejora/typescript",
      { recursive: true },
    );
  });

  it("should pass when typescript import succeeds", async () => {
    expect(runner.validate).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked above
    await expect(runner.validate!()).resolves.toBeUndefined();
  });

  it("should normalize absolute import paths in diagnostic messages", async () => {
    const mockFile = {
      fileName: "/test/project/src/file.ts",
      getLineAndCharacterOfPosition: vi.fn().mockReturnValue({
        character: 4,
        line: 0,
      }),
    };

    mockFindConfigFile.mockReturnValue("/test/project/tsconfig.json");
    mockReadConfigFile.mockReturnValue({ config: {} });
    mockParseJsonConfigFileContent.mockReturnValue({
      fileNames: ["src/file.ts"],
      options: {},
    });
    mockGetPreEmitDiagnostics.mockReturnValue([
      {
        code: 7053,
        file: mockFile,
        messageText:
          "Element implicitly has an 'any' type because expression of type 'string' can't be used to index type 'typeof import(\"/test/project/src/actions\")'.",
        start: 4,
      },
    ]);
    mockFlattenDiagnosticMessageText.mockReturnValue(
      "Element implicitly has an 'any' type because expression of type 'string' can't be used to index type 'typeof import(\"/test/project/src/actions\")'.",
    );

    const result = await runner.run({ tsconfig: "tsconfig.json" });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.message).toBe(
      "Element implicitly has an 'any' type because expression of type 'string' can't be used to index type 'typeof import(\"src/actions\")'.",
    );
  });

  describe("typescript runner - validation", () => {
    it("should throw helpful error when typescript import fails", async () => {
      vi.resetModules();
      vi.doMock("typescript", () => {
        throw new Error("nope");
      });
      const { typescript: freshTypescript } = await import("./typescript");
      const freshCheck = freshTypescript({ name: "test" });

      expect(freshCheck.__runnerFactory).toBeDefined();

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked above
      const freshRunner = freshCheck.__runnerFactory!();

      expect(freshRunner.validate).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked above
      await expect(freshRunner.validate!()).rejects.toThrowError(
        'typescript check requires "typescript" package to be installed. Run: npm install typescript',
      );
    });
  });
});
