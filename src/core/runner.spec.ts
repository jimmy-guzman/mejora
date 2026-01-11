import { mkdir } from "node:fs/promises";

import type { ESLintCheckRunner } from "@/runners/eslint";
import type { TypeScriptCheckRunner } from "@/runners/typescript";
import type { Baseline, BaselineEntry, Config, RawSnapshot } from "@/types";

import { logger } from "@/utils/logger";

import type { BaselineManager as BaselineManagerType } from "./baseline";
import type { CheckRegistry as CheckRegistryType } from "./check-registry";

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
    normalizeSnapshot: vi.fn((snapshot: RawSnapshot) => {
      return {
        ...snapshot,
        items: snapshot.items.map((item) => {
          return { ...item, id: `mocked-id-${Math.random()}` };
        }),
      };
    }),
  };
});

// Mock tinypool to simulate worker execution
let mockConfig: Config | null = null;
let mockRegistry: CheckRegistryType | null = null;

interface TinypoolInstance {
  destroy: () => Promise<void>;
  run: (data: { checkId: string }) => Promise<{
    checkId: string;
    duration: number;
    snapshot: RawSnapshot;
    success: true;
  }>;
}

vi.mock("tinypool", () => {
  return {
    Tinypool: vi.fn(function (this: TinypoolInstance) {
      this.run = vi.fn(async ({ checkId }: { checkId: string }) => {
        if (!mockConfig || !mockRegistry) {
          throw new Error("Test setup error: config/registry not initialized");
        }
        const checkConfig = mockConfig.checks[checkId];

        if (!checkConfig) {
          throw new Error(`Check not found in config: ${checkId}`);
        }
        const runner = mockRegistry.get(checkConfig.type);
        const snapshot = await runner.run(checkConfig);

        return { checkId, duration: 100, snapshot, success: true as const };
      });
      this.destroy = vi.fn().mockResolvedValue(undefined);

      return this;
    }),
  };
});

const { Runner } = await import("@/core/runner");
const { CheckRegistry } = await import("./check-registry");
const { compareSnapshots } = await import("@/core/comparison");

describe("Runner", () => {
  let registry: CheckRegistryType;
  let eslintRunner: ESLintCheckRunner;
  let typescriptRunner: TypeScriptCheckRunner;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoad.mockResolvedValue(null);
    mockSave.mockResolvedValue(undefined);

    vi.mocked(mkdir).mockResolvedValue(undefined);

    eslintRunner = {
      run: vi.fn().mockResolvedValue({ items: [], type: "items" }),
      setup: vi.fn().mockResolvedValue(undefined),
      type: "eslint",
      validate: vi.fn().mockResolvedValue(undefined),
    };

    typescriptRunner = {
      run: vi.fn().mockResolvedValue({ items: [], type: "items" }),
      setup: vi.fn().mockResolvedValue(undefined),
      type: "typescript",
      validate: vi.fn().mockResolvedValue(undefined),
    };

    registry = {
      get: vi.fn((type: string) => {
        if (type === "eslint") return eslintRunner;

        if (type === "typescript") return typescriptRunner;
        throw new Error(`Unknown check type: ${type}`);
      }),
      getTypes: vi.fn(),
      has: vi.fn(),
      register: vi.fn(),
      setup: vi.fn().mockResolvedValue(undefined),
      validate: vi.fn().mockResolvedValue(undefined),
    } as unknown as CheckRegistryType;

    mockRegistry = registry;

    CheckRegistry.getRequiredTypes = vi.fn().mockReturnValue(new Set());
  });

  it("should run eslint checks", async () => {
    const config: Config = {
      checks: {
        "my-check": { files: ["*.js"], type: "eslint" as const },
      },
    };

    mockConfig = config;

    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasRegression: false,
      hasRelocation: false,
      isInitial: true,
      newIssues: [],
      removedIssues: [],
    });

    const runner = new Runner(registry);

    await runner.run(config);

    expect(eslintRunner.run).toHaveBeenCalledWith(config.checks["my-check"]);
  });

  it("should run typescript checks", async () => {
    const config: Config = {
      checks: {
        "my-check": { tsconfig: "tsconfig.json", type: "typescript" as const },
      },
    };

    mockConfig = config;

    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasRegression: false,
      hasRelocation: false,
      isInitial: true,
      newIssues: [],
      removedIssues: [],
    });

    const runner = new Runner(registry);

    await runner.run(config);

    expect(typescriptRunner.run).toHaveBeenCalledWith(
      config.checks["my-check"],
    );
  });

  it("should call registry setup and validation for single check", async () => {
    const config: Config = {
      checks: {
        "eslint-check": { files: ["*.js"], type: "eslint" as const },
      },
    };

    mockConfig = config;

    const requiredTypes = new Set(["eslint"]);

    CheckRegistry.getRequiredTypes = vi.fn().mockReturnValue(requiredTypes);

    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasRegression: false,
      hasRelocation: false,
      isInitial: true,
      newIssues: [],
      removedIssues: [],
    });

    const runner = new Runner(registry);

    await runner.run(config);

    expect(registry.setup).toHaveBeenCalledWith(requiredTypes);

    expect(registry.validate).toHaveBeenCalledWith(requiredTypes);
  });

  it("should use parallel execution for multiple checks", async () => {
    const config: Config = {
      checks: {
        "eslint-check": { files: ["*.js"], type: "eslint" as const },
        "typescript-check": {
          tsconfig: "tsconfig.json",
          type: "typescript" as const,
        },
      },
    };

    mockConfig = config;

    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasRegression: false,
      hasRelocation: false,
      isInitial: true,
      newIssues: [],
      removedIssues: [],
    });

    const runner = new Runner(registry);

    await runner.run(config);

    // With parallel execution (2 checks), registry setup/validate are NOT called
    // because workers handle their own setup
    expect(registry.setup).not.toHaveBeenCalled();
    expect(registry.validate).not.toHaveBeenCalled();

    // But both runners should execute
    expect(eslintRunner.run).toHaveBeenCalledWith(
      config.checks["eslint-check"],
    );
    expect(typescriptRunner.run).toHaveBeenCalledWith(
      config.checks["typescript-check"],
    );
  });

  it("should return exit code 0 when no regressions", async () => {
    const config: Config = {
      checks: { check1: { files: ["*.js"], type: "eslint" as const } },
    };

    mockConfig = config;

    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasRegression: false,
      hasRelocation: false,
      isInitial: true,
      newIssues: [],
      removedIssues: [],
    });

    const runner = new Runner(registry);
    const result = await runner.run(config);

    expect(result.exitCode).toBe(0);
    expect(result.hasRegression).toBe(false);
  });

  it("should return exit code 1 when regressions found", async () => {
    const config: Config = {
      checks: { check1: { files: ["*.js"], type: "eslint" as const } },
    };

    mockConfig = config;

    const newItem = {
      column: 1,
      file: "new.js",
      id: "new.js-1-no-unused-vars",
      line: 1,
      message: "error",
      rule: "no-unused-vars",
      signature: "new.js - no-unused-vars: error" as const,
    };

    vi.mocked(eslintRunner.run).mockResolvedValue({
      items: [newItem],
      type: "items",
    });

    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasRegression: true,
      hasRelocation: false,
      isInitial: false,
      newIssues: [newItem],
      removedIssues: [],
    });

    const runner = new Runner(registry);
    const result = await runner.run(config);

    expect(result.exitCode).toBe(1);
    expect(result.hasRegression).toBe(true);
  });

  it("should allow regressions with --force", async () => {
    const config: Config = {
      checks: { check1: { files: ["*.js"], type: "eslint" as const } },
    };

    mockConfig = config;

    const newItem = {
      column: 1,
      file: "new.js",
      id: "new.js-1-no-unused-vars",
      line: 1,
      message: "error",
      rule: "no-unused-vars",
      signature: "new.js - no-unused-vars: error" as const,
    };

    vi.mocked(eslintRunner.run).mockResolvedValue({
      items: [newItem],
      type: "items",
    });

    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasRegression: true,
      hasRelocation: false,
      isInitial: false,
      newIssues: [newItem],
      removedIssues: [],
    });

    const runner = new Runner(registry);
    const result = await runner.run(config, { force: true });

    expect(result.exitCode).toBe(0);
  });

  it("should filter checks with --only", async () => {
    const config: Config = {
      checks: {
        "eslint-main": { files: ["src/**/*.js"], type: "eslint" as const },
        "eslint-test": { files: ["test/**/*.js"], type: "eslint" as const },
        "typescript-main": {
          tsconfig: "tsconfig.json",
          type: "typescript" as const,
        },
      },
    };

    mockConfig = config;

    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasRegression: false,
      hasRelocation: false,
      isInitial: true,
      newIssues: [],
      removedIssues: [],
    });

    const runner = new Runner(registry);

    await runner.run(config, { only: "eslint" });

    expect(eslintRunner.run).toHaveBeenCalledTimes(2);
    expect(typescriptRunner.run).not.toHaveBeenCalled();
  });

  it("should filter checks with --skip", async () => {
    const config: Config = {
      checks: {
        "eslint-main": { files: ["src/**/*.js"], type: "eslint" as const },
        "typescript-main": {
          tsconfig: "tsconfig.json",
          type: "typescript" as const,
        },
      },
    };

    mockConfig = config;

    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasRegression: false,
      hasRelocation: false,
      isInitial: true,
      newIssues: [],
      removedIssues: [],
    });

    const runner = new Runner(registry);

    await runner.run(config, { skip: "eslint" });

    expect(eslintRunner.run).not.toHaveBeenCalled();
    expect(typescriptRunner.run).toHaveBeenCalledOnce();
  });

  it("should return exit code 2 on check error", async () => {
    const config: Config = {
      checks: { check1: { files: ["*.js"], type: "eslint" as const } },
    };

    mockConfig = config;

    vi.mocked(eslintRunner.run).mockRejectedValue(new Error("Check failed"));

    const runner = new Runner(registry);
    const result = await runner.run(config);

    expect(result.exitCode).toBe(2);
  });

  it("should return exit code 2 on setup error", async () => {
    const config: Config = {
      checks: { check1: { files: ["*.js"], type: "eslint" as const } },
    };

    mockConfig = config;

    vi.mocked(registry.setup).mockRejectedValue(new Error("Permission denied"));

    const runner = new Runner(registry);
    const logSpy = vi.spyOn(logger, "error");
    const result = await runner.run(config);

    expect(result.exitCode).toBe(2);
    expect(logSpy).toHaveBeenCalledWith(
      "Setup failed:",
      new Error("Permission denied"),
    );
  });

  it("should return exit code 2 on validation error", async () => {
    const config: Config = {
      checks: { check1: { files: ["*.js"], type: "eslint" as const } },
    };

    mockConfig = config;

    vi.mocked(registry.validate).mockRejectedValue(
      new Error("ESLint not installed"),
    );

    const runner = new Runner(registry);
    const logSpy = vi.spyOn(logger, "error");
    const result = await runner.run(config);

    expect(result.exitCode).toBe(2);
    expect(logSpy).toHaveBeenCalledWith(
      "Setup failed:",
      new Error("ESLint not installed"),
    );
  });

  it("should include results for each check", async () => {
    const config: Config = {
      checks: { check1: { files: ["*.js"], type: "eslint" as const } },
    };

    mockConfig = config;

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

    vi.mocked(eslintRunner.run).mockResolvedValue(snapshot);

    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasRegression: false,
      hasRelocation: false,
      isInitial: true,
      newIssues: [item],
      removedIssues: [],
    });

    const runner = new Runner(registry);
    const result = await runner.run(config);

    expect(result.results).toHaveLength(1);
    expect(result.results[0]?.checkId).toBe("check1");
    expect(result.results[0]?.snapshot.type).toBe("items");
    expect(result.results[0]?.snapshot.items).toHaveLength(1);
  });

  it("should detect and report improvements", async () => {
    const config: Config = {
      checks: { check1: { files: ["*.js"], type: "eslint" as const } },
    };

    mockConfig = config;

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

    vi.mocked(eslintRunner.run).mockResolvedValue({
      items: [item2],
      type: "items",
    });

    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: true,
      hasRegression: false,
      hasRelocation: false,
      isInitial: false,
      newIssues: [],
      removedIssues: [item1],
    });

    const runner = new Runner(registry);
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
    const config: Config = {
      checks: { check1: { files: ["*.js"], type: "eslint" as const } },
    };

    mockConfig = config;

    mockLoad.mockResolvedValue(null);

    const item = {
      column: 1,
      file: "file.js",
      line: 1,
      message: "error",
      rule: "no-unused-vars",
      signature: "file.js - no-unused-vars: error" as const,
    };

    vi.mocked(eslintRunner.run).mockResolvedValue({
      items: [item],
      type: "items",
    });

    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasRegression: false,
      hasRelocation: false,
      isInitial: true,
      newIssues: [{ ...item, id: "mocked-id" }],
      removedIssues: [],
    });

    const runner = new Runner(registry);
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

  it("should save baseline on initial run even with regressions", async () => {
    const config: Config = {
      checks: { check1: { files: ["*.js"], type: "eslint" as const } },
    };

    mockConfig = config;

    mockLoad.mockResolvedValue(null);

    const item1 = {
      column: 1,
      file: "file1.js",
      line: 1,
      message: "error",
      rule: "no-unused-vars",
      signature: "file1.js - no-unused-vars: error" as const,
    };

    const item2 = {
      column: 2,
      file: "file2.js",
      line: 2,
      message: "error",
      rule: "no-undef",
      signature: "file2.js - no-undef: error" as const,
    };

    vi.mocked(eslintRunner.run).mockResolvedValue({
      items: [item1, item2],
      type: "items",
    });

    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasRegression: true,
      hasRelocation: false,
      isInitial: true,
      newIssues: [
        { ...item1, id: "mocked-id-1" },
        { ...item2, id: "mocked-id-2" },
      ],
      removedIssues: [],
    });

    const runner = new Runner(registry);
    const result = await runner.run(config);

    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        checks: expect.any(Object),
        version: 2,
      }),
      undefined,
    );
    expect(result.exitCode).toBe(1);
  });

  it("should throw error for invalid regex pattern in --only", async () => {
    const config: Config = {
      checks: {
        "eslint-main": { files: ["src/**/*.js"], type: "eslint" as const },
      },
    };

    mockConfig = config;

    const runner = new Runner(registry);

    await expect(runner.run(config, { only: "[invalid" })).rejects.toThrowError(
      'Invalid regex pattern for --only: "[invalid"',
    );
  });

  it("should throw error for invalid regex pattern in --skip", async () => {
    const config: Config = {
      checks: {
        "eslint-main": { files: ["src/**/*.js"], type: "eslint" as const },
      },
    };

    mockConfig = config;

    const runner = new Runner(registry);

    await expect(
      runner.run(config, { skip: "(unclosed" }),
    ).rejects.toThrowError('Invalid regex pattern for --skip: "(unclosed"');
  });

  it("should accept valid regex pattern in --only", async () => {
    const config: Config = {
      checks: {
        "eslint-main": { files: ["src/**/*.js"], type: "eslint" as const },
        "eslint-test": { files: ["test/**/*.js"], type: "eslint" as const },
        "typescript-main": {
          tsconfig: "tsconfig.json",
          type: "typescript" as const,
        },
      },
    };

    mockConfig = config;

    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasRegression: false,
      hasRelocation: false,
      isInitial: true,
      newIssues: [],
      removedIssues: [],
    });

    const runner = new Runner(registry);

    await runner.run(config, { only: "^eslint-.*" });

    expect(eslintRunner.run).toHaveBeenCalledTimes(2);
    expect(typescriptRunner.run).not.toHaveBeenCalled();
  });

  it("should accept valid regex pattern in --skip", async () => {
    const config: Config = {
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

    mockConfig = config;

    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasRegression: false,
      hasRelocation: false,
      isInitial: true,
      newIssues: [],
      removedIssues: [],
    });

    const runner = new Runner(registry);

    await runner.run(config, { skip: "typescript-.*" });

    expect(eslintRunner.run).toHaveBeenCalledOnce();
    expect(typescriptRunner.run).not.toHaveBeenCalled();
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

    vi.mocked(eslintRunner.run).mockResolvedValue({
      items: [item],
      type: "items",
    });

    vi.mocked(compareSnapshots).mockReturnValue({
      hasImprovement: false,
      hasRegression: false,
      hasRelocation: false,
      isInitial: false,
      newIssues: [],
      removedIssues: [],
    });

    const config: Config = {
      checks: { check1: { files: ["*.js"], type: "eslint" as const } },
    };

    mockConfig = config;

    const runner = new Runner(registry);

    await runner.run(config);

    expect(mockSave).not.toHaveBeenCalled();
  });
});
