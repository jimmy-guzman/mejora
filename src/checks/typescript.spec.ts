import type { TypeScriptCheckConfig } from "@/types";

const mockGetPreEmitDiagnostics = vi.fn();
const mockCreateProgram = vi.fn();
const mockFindConfigFile = vi.fn();
const mockReadConfigFile = vi.fn();
const mockParseJsonConfigFileContent = vi.fn();
const mockFlattenDiagnosticMessageText = vi.fn();

vi.mock("typescript", () => {
  return {
    createProgram: mockCreateProgram,
    findConfigFile: mockFindConfigFile,
    flattenDiagnosticMessageText: mockFlattenDiagnosticMessageText,
    getPreEmitDiagnostics: mockGetPreEmitDiagnostics,
    parseJsonConfigFileContent: mockParseJsonConfigFileContent,
    readConfigFile: mockReadConfigFile,
    sys: {
      fileExists: vi.fn(),
      readFile: vi.fn(),
    },
  };
});

const { runTypescriptCheck, typescriptCheck } = await import("./typescript");

describe("typescriptCheck", () => {
  it("should return config with type 'typescript'", () => {
    const config: TypeScriptCheckConfig = {
      overrides: { compilerOptions: { strict: true } },
      tsconfig: "tsconfig.json",
    };

    const result = typescriptCheck(config);

    expect(result.type).toBe("typescript");
    expect(result.tsconfig).toBe(config.tsconfig);
    expect(result.overrides).toStrictEqual(config.overrides);
  });
});

describe("runTypescriptCheck", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(process, "cwd").mockReturnValue("/test/project");
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
    mockCreateProgram.mockReturnValue({});
    mockGetPreEmitDiagnostics.mockReturnValue([]);

    const result = await runTypescriptCheck({ tsconfig: "tsconfig.json" });

    expect(result).toStrictEqual({
      items: [],
      type: "items",
    });
  });

  it("should extract diagnostics as filepath:line:column - TScode: message", async () => {
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
    mockCreateProgram.mockReturnValue({});
    mockGetPreEmitDiagnostics.mockReturnValue([
      {
        code: 2304,
        file: mockFile,
        messageText: "Cannot find name 'foo'.",
        start: 4,
      },
    ]);
    mockFlattenDiagnosticMessageText.mockReturnValue("Cannot find name 'foo'.");

    const result = await runTypescriptCheck({ tsconfig: "tsconfig.json" });

    expect(result.items).toStrictEqual([
      "src/file.ts:1:5 - TS2304: Cannot find name 'foo'.",
    ]);
  });

  it("should handle diagnostics without file location", async () => {
    mockFindConfigFile.mockReturnValue("/test/project/tsconfig.json");
    mockReadConfigFile.mockReturnValue({ config: {} });
    mockParseJsonConfigFileContent.mockReturnValue({
      fileNames: [],
      options: {},
    });
    mockCreateProgram.mockReturnValue({});
    mockGetPreEmitDiagnostics.mockReturnValue([
      {
        code: 5009,
        messageText: "Cannot find the common subdirectory path",
      },
    ]);
    mockFlattenDiagnosticMessageText.mockReturnValue(
      "Cannot find the common subdirectory path",
    );

    const result = await runTypescriptCheck({ tsconfig: "tsconfig.json" });

    expect(result.items).toStrictEqual([
      "(global) - TS5009: Cannot find the common subdirectory path",
    ]);
  });

  it("should sort items", async () => {
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
    mockCreateProgram.mockReturnValue({});
    mockGetPreEmitDiagnostics.mockReturnValue([
      { code: 2304, file: mockFile1, messageText: "error", start: 0 },
      { code: 2304, file: mockFile2, messageText: "error", start: 0 },
    ]);
    mockFlattenDiagnosticMessageText.mockReturnValue("error");

    const result = await runTypescriptCheck({ tsconfig: "tsconfig.json" });

    expect(result.items[0]).toMatch(/^apple\.ts:/);
    expect(result.items[1]).toMatch(/^zebra\.ts:/);
  });

  it("should use custom tsconfig path when provided", async () => {
    mockFindConfigFile.mockReturnValue("/test/project/tsconfig.build.json");
    mockReadConfigFile.mockReturnValue({ config: {} });
    mockParseJsonConfigFileContent.mockReturnValue({
      fileNames: [],
      options: {},
    });
    mockCreateProgram.mockReturnValue({});
    mockGetPreEmitDiagnostics.mockReturnValue([]);

    await runTypescriptCheck({ tsconfig: "tsconfig.build.json" });

    expect(mockReadConfigFile).toHaveBeenCalledWith(
      "/test/project/tsconfig.build.json",
      expect.any(Function),
    );
  });

  it("should throw when tsconfig not found", async () => {
    mockFindConfigFile.mockReturnValue(undefined);

    await expect(runTypescriptCheck({})).rejects.toThrowError(
      "TypeScript config file not found",
    );
  });

  it("should throw when tsconfig has read error", async () => {
    mockFindConfigFile.mockReturnValue("/test/project/tsconfig.json");
    mockReadConfigFile.mockReturnValue({
      error: { messageText: "Syntax error in config" },
    });

    await expect(
      runTypescriptCheck({ tsconfig: "tsconfig.json" }),
    ).rejects.toThrowError(
      "Failed to read TypeScript config: Syntax error in config",
    );
  });

  it("should apply compiler option overrides", async () => {
    mockFindConfigFile.mockReturnValue("/test/project/tsconfig.json");
    mockReadConfigFile.mockReturnValue({ config: {} });
    mockParseJsonConfigFileContent.mockReturnValue({
      fileNames: [],
      options: {},
    });
    mockCreateProgram.mockReturnValue({});
    mockGetPreEmitDiagnostics.mockReturnValue([]);

    const overrides = { compilerOptions: { noEmit: true, strict: true } };

    await runTypescriptCheck({ overrides, tsconfig: "tsconfig.json" });

    expect(mockParseJsonConfigFileContent).toHaveBeenCalledWith(
      {},
      expect.anything(),
      expect.anything(),
      overrides.compilerOptions,
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
    mockCreateProgram.mockReturnValue({});
    mockGetPreEmitDiagnostics.mockReturnValue([
      { code: 2304, file: mockFile, messageText: "error", start: 0 },
    ]);
    mockFlattenDiagnosticMessageText.mockReturnValue("error");

    const result = await runTypescriptCheck({ tsconfig: "tsconfig.json" });

    expect(result.items[0]).toMatch(/:10:20 -/);
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
    mockCreateProgram.mockReturnValue({});
    mockGetPreEmitDiagnostics.mockReturnValue([
      {
        code: 2345,
        file: mockFile,
        messageText: { messageText: "Complex error", next: [] },
        start: 0,
      },
    ]);
    mockFlattenDiagnosticMessageText.mockReturnValue("Flattened error message");

    const result = await runTypescriptCheck({ tsconfig: "tsconfig.json" });

    expect(result.items[0]).toContain("Flattened error message");
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
      runTypescriptCheck({ tsconfig: "tsconfig.json" }),
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
    mockCreateProgram.mockReturnValue({});
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

    const result = await runTypescriptCheck({ tsconfig: "tsconfig.json" });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatch(/^src\/file\.ts:/);
    expect(result.items[0]).toContain("error inside");
  });
});

describe("validateTypescriptDeps", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("should not throw if typescript is installed", async () => {
    const { validateTypescriptDeps } = await import("./typescript");

    await expect(validateTypescriptDeps()).resolves.not.toThrowError();
  });

  it("should throw if typescript is not installed", async () => {
    vi.doUnmock("typescript");
    vi.doMock("typescript", () => {
      throw new Error("Cannot find module 'typescript'");
    });

    const { validateTypescriptDeps } = await import("./typescript");

    await expect(validateTypescriptDeps()).rejects.toThrowError(
      "TypeScript check requires typescript but it's not installed.",
    );
  });
});
