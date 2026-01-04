import { mkdir } from "node:fs/promises";

import type { BaselineManager as BaselineManagerType } from "./baseline";
import type { CheckRegistry as CheckRegistryType } from "./check-registry";
import type { ESLintCheckRunner } from "./checks/eslint";
import type { TypeScriptCheckRunner } from "./checks/typescript";
import type { Baseline, BaselineEntry, Snapshot } from "./types";

import { logger } from "./utils/logger";

vi.mock("node:fs/promises", () => ({
  mkdir: vi.fn(),
}));

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

vi.mock("./utils/snapshot", () => {
  return {
    normalizeSnapshot: vi.fn((snapshot: Snapshot) => {
      return {
        ...snapshot,
        items: snapshot.items.map((item) => {
          return { ...item, id: `mocked-id-${Math.random()}` };
        }),
      };
    }),
  };
});

const { MejoraRunner } = await import("./runner");
const { CheckRegistry } = await import("./check-registry");
const { compareSnapshots } = await import("./comparison");

describe("MejoraRunner", () => {
  let mockRegistry: CheckRegistryType;
  let mockEslintRunner: ESLintCheckRunner;
  let mockTypescriptRunner: TypeScriptCheckRunner;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoad.mockResolvedValue(null);
    mockSave.mockResolvedValue(undefined);
    vi.mocked(mkdir).mockResolvedValue(undefined);

    // Create mock runners
    mockEslintRunner = {
      run: vi.fn().mockResolvedValue({ items: [], type: "items" }),
      setup: vi.fn().mockResolvedValue(undefined),
      type: "eslint",
      validate: vi.fn().mockResolvedValue(undefined),
    };

    mockTypescriptRunner = {
      run: vi.fn().mockResolvedValue({ items: [], type: "items" }),
      setup: vi.fn().mockResolvedValue(undefined),
      type: "typescript",
      validate: vi.fn().mockResolvedValue(undefined),
    };

    // Create mock registry
    mockRegistry = {
      get: vi.fn((type: string) => {
        if (type === "eslint") return mockEslintRunner;

        if (type === "typescript") return mockTypescriptRunner;
        throw new Error(`Unknown check type: ${type}`);
      }),
      getTypes: vi.fn(),
      has: vi.fn(),
      register: vi.fn(),
      setupInfrastructure: vi.fn().mockResolvedValue(undefined),
      validateDependencies: vi.fn().mockResolvedValue(undefined),
    } as unknown as CheckRegistryType;

    CheckRegistry.getRequiredTypes = vi.fn().mockReturnValue(new Set());
  });

  it("should run eslint checks", async () => {
    const config = {
      checks: {
        "my-check": { files: ["*.js"], type: "eslint" as const },
      },
    };

    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasRegression: false,
      hasRelocation: false,
      isInitial: true,
      newItems: [],
      removedItems: [],
    });

    const runner = new MejoraRunner(mockRegistry);

    await runner.run(config);

    expect(mockEslintRunner.run).toHaveBeenCalledWith(
      config.checks["my-check"],
    );
  });

  it("should run typescript checks", async () => {
    const config = {
      checks: {
        "my-check": { tsconfig: "tsconfig.json", type: "typescript" as const },
      },
    };

    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasRegression: false,
      hasRelocation: false,
      isInitial: true,
      newItems: [],
      removedItems: [],
    });

    const runner = new MejoraRunner(mockRegistry);

    await runner.run(config);

    expect(mockTypescriptRunner.run).toHaveBeenCalledWith(
      config.checks["my-check"],
    );
  });

  it("should call registry setup and validation", async () => {
    const config = {
      checks: {
        "eslint-check": { files: ["*.js"], type: "eslint" as const },
        "typescript-check": {
          tsconfig: "tsconfig.json",
          type: "typescript" as const,
        },
      },
    };

    const requiredTypes = new Set(["eslint", "typescript"]);

    CheckRegistry.getRequiredTypes = vi.fn().mockReturnValue(requiredTypes);

    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasRegression: false,
      hasRelocation: false,
      isInitial: true,
      newItems: [],
      removedItems: [],
    });

    const runner = new MejoraRunner(mockRegistry);

    await runner.run(config);

    expect(mockRegistry.setupInfrastructure).toHaveBeenCalledWith(
      requiredTypes,
    );
    expect(mockRegistry.validateDependencies).toHaveBeenCalledWith(
      requiredTypes,
    );
  });

  it("should return exit code 0 when no regressions", async () => {
    const config = {
      checks: { check1: { files: ["*.js"], type: "eslint" as const } },
    };

    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasRegression: false,
      hasRelocation: false,
      isInitial: true,
      newItems: [],
      removedItems: [],
    });

    const runner = new MejoraRunner(mockRegistry);
    const result = await runner.run(config);

    expect(result.exitCode).toBe(0);
    expect(result.hasRegression).toBe(false);
  });

  it("should return exit code 1 when regressions found", async () => {
    const config = {
      checks: { check1: { files: ["*.js"], type: "eslint" as const } },
    };

    const newItem = {
      column: 1,
      file: "new.js",
      id: "new.js-1-no-unused-vars",
      line: 1,
      message: "error",
      rule: "no-unused-vars",
      signature: "new.js - no-unused-vars: error" as const,
    };

    vi.mocked(mockEslintRunner.run).mockResolvedValue({
      items: [newItem],
      type: "items",
    });

    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasRegression: true,
      hasRelocation: false,
      isInitial: false,
      newItems: [newItem],
      removedItems: [],
    });

    const runner = new MejoraRunner(mockRegistry);
    const result = await runner.run(config);

    expect(result.exitCode).toBe(1);
    expect(result.hasRegression).toBe(true);
  });

  it("should allow regressions with --force", async () => {
    const config = {
      checks: { check1: { files: ["*.js"], type: "eslint" as const } },
    };

    const newItem = {
      column: 1,
      file: "new.js",
      id: "new.js-1-no-unused-vars",
      line: 1,
      message: "error",
      rule: "no-unused-vars",
      signature: "new.js - no-unused-vars: error" as const,
    };

    vi.mocked(mockEslintRunner.run).mockResolvedValue({
      items: [newItem],
      type: "items",
    });

    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasRegression: true,
      hasRelocation: false,
      isInitial: false,
      newItems: [newItem],
      removedItems: [],
    });

    const runner = new MejoraRunner(mockRegistry);
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

    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasRegression: false,
      hasRelocation: false,
      isInitial: true,
      newItems: [],
      removedItems: [],
    });

    const runner = new MejoraRunner(mockRegistry);

    await runner.run(config, { only: "eslint" });

    expect(mockEslintRunner.run).toHaveBeenCalledTimes(2);
    expect(mockTypescriptRunner.run).not.toHaveBeenCalled();
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

    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasRegression: false,
      hasRelocation: false,
      isInitial: true,
      newItems: [],
      removedItems: [],
    });

    const runner = new MejoraRunner(mockRegistry);

    await runner.run(config, { skip: "eslint" });

    expect(mockEslintRunner.run).not.toHaveBeenCalled();
    expect(mockTypescriptRunner.run).toHaveBeenCalledOnce();
  });

  it("should return exit code 2 on check error", async () => {
    const config = {
      checks: { check1: { files: ["*.js"], type: "eslint" as const } },
    };

    vi.mocked(mockEslintRunner.run).mockRejectedValue(
      new Error("Check failed"),
    );

    const runner = new MejoraRunner(mockRegistry);
    const result = await runner.run(config);

    expect(result.exitCode).toBe(2);
  });

  it("should return exit code 2 on setup error", async () => {
    const config = {
      checks: { check1: { files: ["*.js"], type: "eslint" as const } },
    };

    vi.mocked(mockRegistry.setupInfrastructure).mockRejectedValue(
      new Error("Permission denied"),
    );

    const runner = new MejoraRunner(mockRegistry);
    const logSpy = vi.spyOn(logger, "error");
    const result = await runner.run(config);

    expect(result.exitCode).toBe(2);
    expect(logSpy).toHaveBeenCalledWith(
      "Setup failed:",
      new Error("Permission denied"),
    );
  });

  it("should include results for each check", async () => {
    const config = {
      checks: { check1: { files: ["*.js"], type: "eslint" as const } },
    };

    const item = {
      column: 1,
      file: "file.js",
      id: "file.js-1-no-unused-vars",
      line: 1,
      message: "error",
      rule: "no-unused-vars",
      signature: "file.js - no-unused-vars: error" as const,
    };

    const snapshot = {
      items: [item],
      type: "items" as const,
    };

    vi.mocked(mockEslintRunner.run).mockResolvedValue(snapshot);

    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasRegression: false,
      hasRelocation: false,
      isInitial: true,
      newItems: [item],
      removedItems: [],
    });

    const runner = new MejoraRunner(mockRegistry);
    const result = await runner.run(config);

    expect(result.results).toHaveLength(1);
    expect(result.results[0]?.checkId).toBe("check1");
    // Snapshot will have been normalized, so check for structure
    expect(result.results[0]?.snapshot.type).toBe("items");
    expect(result.results[0]?.snapshot.items).toHaveLength(1);
  });

  it("should detect and report improvements", async () => {
    const config = {
      checks: { check1: { files: ["*.js"], type: "eslint" as const } },
    };

    const item1 = {
      column: 1,
      file: "file1.js",
      id: "file1.js-1-no-unused-vars",
      line: 1,
      message: "error",
      rule: "no-unused-vars",
      signature: "file1.js - no-unused-vars: error",
    };

    const item2 = {
      column: 2,
      file: "file2.js",
      id: "file2.js-2-no-undef",
      line: 2,
      message: "error",
      rule: "no-undef",
      signature: "file2.js - no-undef: error" as const,
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

    vi.mocked(mockEslintRunner.run).mockResolvedValue({
      items: [item2],
      type: "items",
    });

    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: true,
      hasRegression: false,
      hasRelocation: false,
      isInitial: false,
      newItems: [],
      removedItems: [item1],
    });

    const runner = new MejoraRunner(mockRegistry);
    const result = await runner.run(config);

    expect(result.hasImprovement).toBe(true);
    expect(result.hasRegression).toBe(false);
    expect(result.exitCode).toBe(0);
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        checks: expect.any(Object),
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
      column: 1,
      file: "file.js",
      line: 1,
      message: "error",
      rule: "no-unused-vars",
      signature: "file.js - no-unused-vars: error" as const,
    };

    vi.mocked(mockEslintRunner.run).mockResolvedValue({
      items: [item],
      type: "items",
    });

    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasRegression: false,
      hasRelocation: false,
      isInitial: true,
      newItems: [{ ...item, id: "mocked-id" }],
      removedItems: [],
    });

    const runner = new MejoraRunner(mockRegistry);
    const result = await runner.run(config);

    expect(result.exitCode).toBe(0);
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        checks: expect.any(Object),
        version: 2,
      }),
      undefined,
    );
  });

  it("should throw error for invalid regex pattern in --only", async () => {
    const config = {
      checks: {
        "eslint-main": { files: ["src/**/*.js"], type: "eslint" as const },
      },
    };

    const runner = new MejoraRunner(mockRegistry);

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

    const runner = new MejoraRunner(mockRegistry);

    await expect(
      runner.run(config, { skip: "(unclosed" }),
    ).rejects.toThrowError('Invalid regex pattern for --skip: "(unclosed"');
  });

  it("should not save baseline when no changes detected", async () => {
    const item = {
      column: 1,
      file: "file.js",
      id: "file.js-1-no-unused-vars",
      line: 1,
      message: "error",
      rule: "no-unused-vars",
      signature: "file.js - no-unused-vars: error" as const,
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

    vi.mocked(mockEslintRunner.run).mockResolvedValue({
      items: [item],
      type: "items",
    });

    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasRegression: false,
      hasRelocation: false,
      isInitial: false,
      newItems: [],
      removedItems: [],
    });

    const config = {
      checks: { check1: { files: ["*.js"], type: "eslint" as const } },
    };

    const runner = new MejoraRunner(mockRegistry);

    await runner.run(config);

    expect(mockSave).not.toHaveBeenCalled();
  });
});
