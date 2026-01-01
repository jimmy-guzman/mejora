import type { BaselineManager as BaselineManagerType } from "./baseline";
import type { Baseline, BaselineEntry } from "./types";

import { validateEslintDeps } from "./checks/eslint";
import { validateTypescriptDeps } from "./checks/typescript";
import { logger } from "./utils/logger";

vi.mock("./checks/eslint", () => {
  return {
    runEslintCheck: vi.fn(),
    validateEslintDeps: vi.fn(),
  };
});

vi.mock("./checks/typescript", () => {
  return {
    runTypescriptCheck: vi.fn(),
    validateTypescriptDeps: vi.fn(),
  };
});

const mockLoad = vi.fn();
const mockSave = vi.fn();

vi.mock("./baseline", () => {
  return {
    BaselineManager: vi.fn(function (this: BaselineManagerType) {
      this.load = mockLoad;
      this.save = mockSave;
    }),
  };
});

const { BaselineManager } = await import("./baseline");

BaselineManager.getEntry = vi.fn(
  (baseline: Baseline | null, checkId: string) => baseline?.checks[checkId],
);

BaselineManager.update = vi.fn(
  (baseline: Baseline | null, checkId: string, entry: BaselineEntry) => {
    const current = baseline ?? { checks: {}, version: 2 };

    return {
      ...current,
      checks: {
        ...current.checks,
        [checkId]: entry,
      },
    };
  },
);

vi.mock("./comparison", () => ({
  compareSnapshots: vi.fn(),
}));

vi.mock("./utils/logger");

const { MejoraRunner } = await import("./runner");
const { runEslintCheck } = await import("./checks/eslint");
const { runTypescriptCheck } = await import("./checks/typescript");
const { compareSnapshots } = await import("./comparison");

describe("MejoraRunner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoad.mockResolvedValue(null);
    mockSave.mockResolvedValue(undefined);
  });

  it("should run eslint checks", async () => {
    const config = {
      checks: {
        "my-check": { files: ["*.js"], type: "eslint" as const },
      },
    };

    vi.mocked(runEslintCheck).mockResolvedValue({ items: [], type: "items" });
    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasPositionChanges: false,
      hasRegression: false,
      isInitial: true,
      newItems: [],
      removedItems: [],
    });

    const runner = new MejoraRunner();

    await runner.run(config);

    expect(runEslintCheck).toHaveBeenCalledWith(config.checks["my-check"]);
  });

  it("should run typescript checks", async () => {
    const config = {
      checks: {
        "my-check": { tsconfig: "tsconfig.json", type: "typescript" as const },
      },
    };

    vi.mocked(runTypescriptCheck).mockResolvedValue({
      items: [],
      type: "items",
    });
    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasPositionChanges: false,
      hasRegression: false,
      isInitial: true,
      newItems: [],
      removedItems: [],
    });

    const runner = new MejoraRunner();

    await runner.run(config);

    expect(runTypescriptCheck).toHaveBeenCalledWith(config.checks["my-check"]);
  });

  it("should return exit code 0 when no regressions", async () => {
    const config = {
      checks: { check1: { files: ["*.js"], type: "eslint" as const } },
    };

    vi.mocked(runEslintCheck).mockResolvedValue({ items: [], type: "items" });
    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasPositionChanges: false,
      hasRegression: false,
      isInitial: true,
      newItems: [],
      removedItems: [],
    });

    const runner = new MejoraRunner();
    const result = await runner.run(config);

    expect(result.exitCode).toBe(0);
    expect(result.hasRegression).toBe(false);
  });

  it("should return exit code 1 when regressions found", async () => {
    const config = {
      checks: { check1: { files: ["*.js"], type: "eslint" as const } },
    };

    const newItem = {
      code: "no-unused-vars",
      column: 1,
      file: "new.js",
      id: "new.js-1-no-unused-vars",
      line: 1,
      message: "error",
    };

    vi.mocked(runEslintCheck).mockResolvedValue({
      items: [newItem],
      type: "items",
    });
    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasPositionChanges: false,
      hasRegression: true,
      isInitial: false,
      newItems: [newItem],
      removedItems: [],
    });

    const runner = new MejoraRunner();
    const result = await runner.run(config);

    expect(result.exitCode).toBe(1);
    expect(result.hasRegression).toBe(true);
  });

  it("should allow regressions with --force", async () => {
    const config = {
      checks: { check1: { files: ["*.js"], type: "eslint" as const } },
    };

    const newItem = {
      code: "no-unused-vars",
      column: 1,
      file: "new.js",
      id: "new.js-1-no-unused-vars",
      line: 1,
      message: "error",
    };

    vi.mocked(runEslintCheck).mockResolvedValue({
      items: [newItem],
      type: "items",
    });
    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasPositionChanges: false,
      hasRegression: true,
      isInitial: false,
      newItems: [newItem],
      removedItems: [],
    });

    const runner = new MejoraRunner();
    const result = await runner.run(config, { force: true });

    expect(result.exitCode).toBe(0);
  });

  it("should filter checks with --only", async () => {
    const config = {
      checks: {
        "eslint-main": { files: ["src/**/*.js"], type: "eslint" as const },
        "eslint-test": { files: ["test/**/*.js"], type: "eslint" as const },
        "typescript-main": {
          tsconfig: "tsconfig.json",
          type: "typescript" as const,
        },
      },
    };

    vi.mocked(runEslintCheck).mockResolvedValue({ items: [], type: "items" });
    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasPositionChanges: false,
      hasRegression: false,
      isInitial: true,
      newItems: [],
      removedItems: [],
    });

    const runner = new MejoraRunner();

    await runner.run(config, { only: "eslint" });

    expect(runEslintCheck).toHaveBeenCalledTimes(2);
    expect(runTypescriptCheck).not.toHaveBeenCalled();
  });

  it("should filter checks with --skip", async () => {
    const config = {
      checks: {
        "eslint-main": { files: ["src/**/*.js"], type: "eslint" as const },
        "typescript-main": {
          tsconfig: "tsconfig.json",
          type: "typescript" as const,
        },
      },
    };

    vi.mocked(runTypescriptCheck).mockResolvedValue({
      items: [],
      type: "items",
    });
    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasPositionChanges: false,
      hasRegression: false,
      isInitial: true,
      newItems: [],
      removedItems: [],
    });

    const runner = new MejoraRunner();

    await runner.run(config, { skip: "eslint" });

    expect(runEslintCheck).not.toHaveBeenCalled();
    expect(runTypescriptCheck).toHaveBeenCalledOnce();
  });

  it("should return exit code 2 on check error", async () => {
    const config = {
      checks: { check1: { files: ["*.js"], type: "eslint" as const } },
    };

    vi.mocked(runEslintCheck).mockRejectedValue(new Error("Check failed"));

    const runner = new MejoraRunner();
    const result = await runner.run(config);

    expect(result.exitCode).toBe(2);
  });

  it("should include results for each check", async () => {
    const config = {
      checks: { check1: { files: ["*.js"], type: "eslint" as const } },
    };

    const item = {
      code: "no-unused-vars",
      column: 1,
      file: "file.js",
      id: "file.js-1-no-unused-vars",
      line: 1,
      message: "error",
    };

    const snapshot = {
      items: [item],
      type: "items" as const,
    };

    vi.mocked(runEslintCheck).mockResolvedValue(snapshot);
    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasPositionChanges: false,
      hasRegression: false,
      isInitial: true,
      newItems: [item],
      removedItems: [],
    });

    const runner = new MejoraRunner();
    const result = await runner.run(config);

    expect(result.results).toHaveLength(1);
    expect(result.results[0]?.checkId).toBe("check1");
    expect(result.results[0]?.snapshot).toStrictEqual(snapshot);
  });

  it("should detect and report improvements", async () => {
    const config = {
      checks: { check1: { files: ["*.js"], type: "eslint" as const } },
    };

    const item1 = {
      code: "no-unused-vars",
      column: 1,
      file: "file1.js",
      id: "file1.js-1-no-unused-vars",
      line: 1,
      message: "error",
    };

    const item2 = {
      code: "no-undef",
      column: 2,
      file: "file2.js",
      id: "file2.js-2-no-undef",
      line: 2,
      message: "error",
    };

    const existingBaseline = {
      checks: {
        check1: {
          items: [item1, item2],
          type: "items" as const,
        },
      },
      version: 2,
    };

    mockLoad.mockResolvedValue(existingBaseline);

    vi.mocked(runEslintCheck).mockResolvedValue({
      items: [item2],
      type: "items",
    });
    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: true,
      hasPositionChanges: false,
      hasRegression: false,
      isInitial: false,
      newItems: [],
      removedItems: [item1],
    });

    const runner = new MejoraRunner();
    const result = await runner.run(config);

    expect(result.hasImprovement).toBe(true);
    expect(result.hasRegression).toBe(false);
    expect(result.exitCode).toBe(0);
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        checks: {
          check1: {
            items: [item2],
            type: "items",
          },
        },
        version: 2,
      }),
      undefined,
    );
  });

  it("should save baseline on initial run", async () => {
    const config = {
      checks: { check1: { files: ["*.js"], type: "eslint" as const } },
    };

    mockLoad.mockResolvedValue(null);

    const item = {
      code: "no-unused-vars",
      column: 1,
      file: "file.js",
      id: "file.js-1-no-unused-vars",
      line: 1,
      message: "error",
    };

    vi.mocked(runEslintCheck).mockResolvedValue({
      items: [item],
      type: "items",
    });
    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasPositionChanges: false,
      hasRegression: false,
      isInitial: true,
      newItems: [item],
      removedItems: [],
    });

    const runner = new MejoraRunner();
    const result = await runner.run(config);

    expect(result.exitCode).toBe(0);
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        checks: {
          check1: {
            items: [item],
            type: "items",
          },
        },
        version: 2,
      }),
      undefined,
    );
  });

  it("should save baseline when improvement detected", async () => {
    const config = {
      checks: { check1: { files: ["*.js"], type: "eslint" as const } },
    };

    const item1 = {
      code: "no-unused-vars",
      column: 1,
      file: "file1.js",
      id: "file1.js-1-no-unused-vars",
      line: 1,
      message: "error",
    };

    const item2 = {
      code: "no-undef",
      column: 2,
      file: "file2.js",
      id: "file2.js-2-no-undef",
      line: 2,
      message: "error",
    };

    const existingBaseline = {
      checks: {
        check1: {
          items: [item1, item2],
          type: "items" as const,
        },
      },
      version: 2,
    };

    mockLoad.mockResolvedValue(existingBaseline);

    vi.mocked(runEslintCheck).mockResolvedValue({
      items: [item2],
      type: "items",
    });
    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: true,
      hasPositionChanges: false,
      hasRegression: false,
      isInitial: false,
      newItems: [],
      removedItems: [item1],
    });

    const runner = new MejoraRunner();

    await runner.run(config);

    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        checks: {
          check1: {
            items: [item2],
            type: "items",
          },
        },
        version: 2,
      }),
      undefined,
    );
  });

  it("should save baseline on initial run even with regressions", async () => {
    const config = {
      checks: { check1: { files: ["*.js"], type: "eslint" as const } },
    };

    mockLoad.mockResolvedValue(null);

    const item1 = {
      code: "no-unused-vars",
      column: 1,
      file: "file1.js",
      id: "file1.js-1-no-unused-vars",
      line: 1,
      message: "error",
    };

    const item2 = {
      code: "no-undef",
      column: 2,
      file: "file2.js",
      id: "file2.js-2-no-undef",
      line: 2,
      message: "error",
    };

    vi.mocked(runEslintCheck).mockResolvedValue({
      items: [item1, item2],
      type: "items",
    });
    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasPositionChanges: false,
      hasRegression: true,
      isInitial: true,
      newItems: [item1, item2],
      removedItems: [],
    });

    const runner = new MejoraRunner();
    const result = await runner.run(config);

    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        checks: {
          check1: {
            items: [item1, item2],
            type: "items",
          },
        },
        version: 2,
      }),
      undefined,
    );
    expect(result.exitCode).toBe(1);
  });

  it("should throw error for invalid regex pattern in --only", async () => {
    const config = {
      checks: {
        "eslint-main": { files: ["src/**/*.js"], type: "eslint" as const },
      },
    };

    const runner = new MejoraRunner();

    await expect(runner.run(config, { only: "[invalid" })).rejects.toThrowError(
      'Invalid regex pattern for --only: "[invalid"',
    );
  });

  it("should throw error for invalid regex pattern in --skip", async () => {
    const config = {
      checks: {
        "eslint-main": { files: ["src/**/*.js"], type: "eslint" as const },
      },
    };

    const runner = new MejoraRunner();

    await expect(
      runner.run(config, { skip: "(unclosed" }),
    ).rejects.toThrowError('Invalid regex pattern for --skip: "(unclosed"');
  });

  it("should accept valid regex pattern in --only", async () => {
    const config = {
      checks: {
        "eslint-main": { files: ["src/**/*.js"], type: "eslint" as const },
        "eslint-test": { files: ["test/**/*.js"], type: "eslint" as const },
        "typescript-main": {
          tsconfig: "tsconfig.json",
          type: "typescript" as const,
        },
      },
    };

    vi.mocked(runEslintCheck).mockResolvedValue({ items: [], type: "items" });
    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasPositionChanges: false,
      hasRegression: false,
      isInitial: true,
      newItems: [],
      removedItems: [],
    });

    const runner = new MejoraRunner();

    await runner.run(config, { only: "^eslint-.*" });

    expect(runEslintCheck).toHaveBeenCalledTimes(2);
    expect(runTypescriptCheck).not.toHaveBeenCalled();
  });

  it("should accept valid regex pattern in --skip", async () => {
    const config = {
      checks: {
        "eslint-main": { files: ["src/**/*.js"], type: "eslint" as const },
        "typescript-main": {
          tsconfig: "tsconfig.json",
          type: "typescript" as const,
        },
        "typescript-test": {
          tsconfig: "tsconfig.test.json",
          type: "typescript" as const,
        },
      },
    };

    vi.mocked(runEslintCheck).mockResolvedValue({ items: [], type: "items" });
    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasPositionChanges: false,
      hasRegression: false,
      isInitial: true,
      newItems: [],
      removedItems: [],
    });

    const runner = new MejoraRunner();

    await runner.run(config, { skip: "typescript-.*" });

    expect(runEslintCheck).toHaveBeenCalledOnce();
    expect(runTypescriptCheck).not.toHaveBeenCalled();
  });

  it("should throw when eslint dependencies are missing", async () => {
    const config = {
      checks: {
        "my-eslint-check": {
          files: ["*.js"],
          type: "eslint" as const,
        },
      },
    };

    vi.mocked(validateEslintDeps).mockRejectedValue(
      new Error("ESLint not installed"),
    );

    const runner = new MejoraRunner();
    const logSpy = vi.spyOn(logger, "error");

    await expect(runner.run(config)).resolves.toStrictEqual({
      exitCode: 2,
      hasImprovement: false,
      hasRegression: true,
      results: [],
      totalDuration: expect.any(Number),
    });

    expect(logSpy).toHaveBeenCalledWith(
      'Error running check "my-eslint-check":',
      new Error("ESLint not installed"),
    );
  });

  it("should throw when typescript dependencies are missing", async () => {
    const config = {
      checks: {
        "my-typescript-check": {
          files: ["*.ts"],
          type: "typescript" as const,
        },
      },
    };

    vi.mocked(validateTypescriptDeps).mockRejectedValue(
      new Error("TypeScript not installed"),
    );

    const runner = new MejoraRunner();
    const logSpy = vi.spyOn(logger, "error");

    await expect(runner.run(config)).resolves.toStrictEqual({
      exitCode: 2,
      hasImprovement: false,
      hasRegression: true,
      results: [],
      totalDuration: expect.any(Number),
    });

    expect(logSpy).toHaveBeenCalledWith(
      'Error running check "my-typescript-check":',
      new Error("TypeScript not installed"),
    );
  });

  it("should not save baseline when no changes detected", async () => {
    const item = {
      code: "no-unused-vars",
      column: 1,
      file: "file.js",
      id: "file.js-1-no-unused-vars",
      line: 1,
      message: "error",
    };

    const existingBaseline = {
      checks: {
        check1: {
          items: [item],
          type: "items" as const,
        },
      },
      version: 2,
    };

    mockLoad.mockResolvedValue(existingBaseline);

    vi.mocked(runEslintCheck).mockResolvedValue({
      items: [item],
      type: "items",
    });
    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasPositionChanges: false,
      hasRegression: false,
      isInitial: false,
      newItems: [],
      removedItems: [],
    });

    const config = {
      checks: { check1: { files: ["*.js"], type: "eslint" as const } },
    };

    const runner = new MejoraRunner();

    await runner.run(config);

    expect(mockSave).not.toHaveBeenCalled();
  });

  describe("spinner", () => {
    it("should not show spinner when json option is true", async () => {
      const config = {
        checks: { check1: { files: ["*.js"], type: "eslint" as const } },
      };

      vi.mocked(runEslintCheck).mockResolvedValue({ items: [], type: "items" });
      vi.mocked(compareSnapshots).mockReturnValue({
        hasImprovement: false,
        hasPositionChanges: false,
        hasRegression: false,
        isInitial: true,
        newItems: [],
        removedItems: [],
      });

      const runner = new MejoraRunner();
      const { Spinner } = await import("picospinner");
      const spinnerStartSpy = vi.spyOn(Spinner.prototype, "start");

      await runner.run(config, { json: true });

      expect(spinnerStartSpy).not.toHaveBeenCalled();

      spinnerStartSpy.mockRestore();
    });

    it("should not show spinner in CI environment", async () => {
      const config = {
        checks: { check1: { files: ["*.js"], type: "eslint" as const } },
      };

      vi.mocked(runEslintCheck).mockResolvedValue({ items: [], type: "items" });
      vi.mocked(compareSnapshots).mockReturnValue({
        hasImprovement: false,
        hasPositionChanges: false,
        hasRegression: false,
        isInitial: true,
        newItems: [],
        removedItems: [],
      });

      const runner = new MejoraRunner(undefined, true);
      const { Spinner } = await import("picospinner");
      const spinnerStartSpy = vi.spyOn(Spinner.prototype, "start");

      await runner.run(config);

      expect(spinnerStartSpy).not.toHaveBeenCalled();

      spinnerStartSpy.mockRestore();
    });

    it("should not show spinner when stdout is not a TTY", async () => {
      const config = {
        checks: { check1: { files: ["*.js"], type: "eslint" as const } },
      };

      vi.mocked(runEslintCheck).mockResolvedValue({ items: [], type: "items" });
      vi.mocked(compareSnapshots).mockReturnValue({
        hasImprovement: false,
        hasPositionChanges: false,
        hasRegression: false,
        isInitial: true,
        newItems: [],
        removedItems: [],
      });

      const originalIsTTY = process.stdout.isTTY;

      Object.defineProperty(process.stdout, "isTTY", {
        configurable: true,
        value: false,
      });

      const runner = new MejoraRunner();
      const { Spinner } = await import("picospinner");
      const spinnerStartSpy = vi.spyOn(Spinner.prototype, "start");

      await runner.run(config);

      expect(spinnerStartSpy).not.toHaveBeenCalled();

      Object.defineProperty(process.stdout, "isTTY", {
        configurable: true,
        value: originalIsTTY,
      });

      spinnerStartSpy.mockRestore();
    });

    it("should show spinner in interactive TTY when not in CI", async () => {
      const config = {
        checks: { check1: { files: ["*.js"], type: "eslint" as const } },
      };

      vi.mocked(runEslintCheck).mockResolvedValue({ items: [], type: "items" });
      vi.mocked(compareSnapshots).mockReturnValue({
        hasImprovement: false,
        hasPositionChanges: false,
        hasRegression: false,
        isInitial: true,
        newItems: [],
        removedItems: [],
      });

      const originalIsTTY = process.stdout.isTTY;

      Object.defineProperty(process.stdout, "isTTY", {
        configurable: true,
        value: true,
      });

      const runner = new MejoraRunner(undefined, false);
      const stdoutSpy = vi.spyOn(process.stdout, "write").mockReturnValue(true);

      await runner.run(config, { json: false });

      expect(stdoutSpy.mock.calls.length).toBeGreaterThan(0);

      Object.defineProperty(process.stdout, "isTTY", {
        configurable: true,
        value: originalIsTTY,
      });

      stdoutSpy.mockRestore();
    });

    it("should show spinner by default when in interactive TTY", async () => {
      const config = {
        checks: { check1: { files: ["*.js"], type: "eslint" as const } },
      };

      vi.mocked(runEslintCheck).mockResolvedValue({ items: [], type: "items" });
      vi.mocked(compareSnapshots).mockReturnValue({
        hasImprovement: false,
        hasPositionChanges: false,
        hasRegression: false,
        isInitial: true,
        newItems: [],
        removedItems: [],
      });

      const originalIsTTY = process.stdout.isTTY;

      Object.defineProperty(process.stdout, "isTTY", {
        configurable: true,
        value: true,
      });

      const runner = new MejoraRunner(undefined, false);
      const stdoutSpy = vi.spyOn(process.stdout, "write").mockReturnValue(true);

      await runner.run(config);

      expect(stdoutSpy.mock.calls.length).toBeGreaterThan(0);

      Object.defineProperty(process.stdout, "isTTY", {
        configurable: true,
        value: originalIsTTY,
      });

      stdoutSpy.mockRestore();
    });

    it("should stop spinner on check error", async () => {
      const config = {
        checks: { check1: { files: ["*.js"], type: "eslint" as const } },
      };

      vi.mocked(runEslintCheck).mockRejectedValue(new Error("Check failed"));

      const originalIsTTY = process.stdout.isTTY;

      Object.defineProperty(process.stdout, "isTTY", {
        configurable: true,
        value: true,
      });

      const runner = new MejoraRunner(undefined, false);
      const stdoutSpy = vi.spyOn(process.stdout, "write").mockReturnValue(true);

      const result = await runner.run(config);

      expect(result.exitCode).toBe(2);
      expect(stdoutSpy.mock.calls.length).toBeGreaterThan(0);

      Object.defineProperty(process.stdout, "isTTY", {
        configurable: true,
        value: originalIsTTY,
      });

      stdoutSpy.mockRestore();
    });

    it("should use logger messages instead of spinner in CI", async () => {
      const config = {
        checks: { check1: { files: ["*.js"], type: "eslint" as const } },
      };

      vi.mocked(runEslintCheck).mockResolvedValue({ items: [], type: "items" });
      vi.mocked(validateEslintDeps).mockResolvedValue(undefined);
      vi.mocked(compareSnapshots).mockReturnValue({
        hasImprovement: false,
        hasPositionChanges: false,
        hasRegression: false,
        isInitial: true,
        newItems: [],
        removedItems: [],
      });

      const runner = new MejoraRunner(undefined, true);
      const startSpy = vi.spyOn(logger, "start");
      const successSpy = vi.spyOn(logger, "success");

      await runner.run(config);

      expect(startSpy).toHaveBeenCalledWith("Running check1...");
      expect(successSpy).toHaveBeenCalledWith("check1 complete");

      startSpy.mockRestore();
      successSpy.mockRestore();
    });

    it("should call spinner.succeed when check completes successfully", async () => {
      const config = {
        checks: { check1: { files: ["*.js"], type: "eslint" as const } },
      };

      vi.mocked(runEslintCheck).mockResolvedValue({ items: [], type: "items" });
      vi.mocked(compareSnapshots).mockReturnValue({
        hasImprovement: false,
        hasPositionChanges: false,
        hasRegression: false,
        isInitial: true,
        newItems: [],
        removedItems: [],
      });

      const originalIsTTY = process.stdout.isTTY;

      Object.defineProperty(process.stdout, "isTTY", {
        configurable: true,
        value: true,
      });

      const runner = new MejoraRunner(undefined, false);
      const { Spinner } = await import("picospinner");
      const spinnerSucceedSpy = vi.spyOn(Spinner.prototype, "succeed");

      await runner.run(config);

      expect(spinnerSucceedSpy).toHaveBeenCalledWith("check1 complete");

      Object.defineProperty(process.stdout, "isTTY", {
        configurable: true,
        value: originalIsTTY,
      });

      spinnerSucceedSpy.mockRestore();
    });

    it("should call spinner.fail when check fails", async () => {
      const config = {
        checks: { check1: { files: ["*.js"], type: "eslint" as const } },
      };

      vi.mocked(runEslintCheck).mockRejectedValue(new Error("Check failed"));

      const originalIsTTY = process.stdout.isTTY;

      Object.defineProperty(process.stdout, "isTTY", {
        configurable: true,
        value: true,
      });

      const runner = new MejoraRunner(undefined, false);
      const { Spinner } = await import("picospinner");
      const spinnerFailSpy = vi.spyOn(Spinner.prototype, "fail");

      await runner.run(config);

      expect(spinnerFailSpy).toHaveBeenCalledWith("check1 failed");

      Object.defineProperty(process.stdout, "isTTY", {
        configurable: true,
        value: originalIsTTY,
      });

      spinnerFailSpy.mockRestore();
    });
  });
});
