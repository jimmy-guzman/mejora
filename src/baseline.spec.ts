import { mkdir, readFile, writeFile } from "node:fs/promises";

import type { Baseline, BaselineEntry } from "./types";

import { BaselineManager } from "./baseline";

vi.mock("node:fs/promises");

vi.mock("is-in-ci", () => ({
  default: false,
}));

const mockReadFile = vi.mocked(readFile);
const mockWriteFile = vi.mocked(writeFile);
const mockMkdir = vi.mocked(mkdir);

describe("BaselineManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("static createBaseline", () => {
    it("should create a baseline with version 1", () => {
      const checks = {
        eslint: { items: ["error1"], type: "items" as const },
      };

      const baseline = BaselineManager.create(checks);

      expect(baseline).toStrictEqual({
        checks,
        version: 1,
      });
    });

    it("should create a baseline with empty checks", () => {
      const baseline = BaselineManager.create({});

      expect(baseline).toStrictEqual({
        checks: {},
        version: 1,
      });
    });

    it("should create a baseline with multiple checks", () => {
      const checks = {
        eslint: { items: ["error1"], type: "items" as const },
        typescript: { items: ["error2", "error3"], type: "items" as const },
      };

      const baseline = BaselineManager.create(checks);

      expect(baseline).toStrictEqual({
        checks,
        version: 1,
      });
    });
  });

  describe("static getEntry", () => {
    it("should return entry when baseline exists and has the check", () => {
      const baseline: Baseline = {
        checks: {
          eslint: { items: ["error1"], type: "items" as const },
        },
        version: 1,
      };

      const entry = BaselineManager.getEntry(baseline, "eslint");

      expect(entry).toStrictEqual({ items: ["error1"], type: "items" });
    });

    it("should return undefined when baseline exists but check does not", () => {
      const baseline: Baseline = {
        checks: {
          eslint: { items: ["error1"], type: "items" as const },
        },
        version: 1,
      };

      const entry = BaselineManager.getEntry(baseline, "typescript");

      expect(entry).toBeUndefined();
    });

    it("should return undefined when baseline is null", () => {
      const entry = BaselineManager.getEntry(null, "eslint");

      expect(entry).toBeUndefined();
    });
  });

  describe("static updateBaseline", () => {
    it("should add new entry to existing baseline", () => {
      const baseline: Baseline = {
        checks: {
          eslint: { items: ["error1"], type: "items" as const },
        },
        version: 1,
      };

      const newEntry: BaselineEntry = {
        items: ["error2"],
        type: "items" as const,
      };

      const updated = BaselineManager.update(baseline, "typescript", newEntry);

      expect(updated).toStrictEqual({
        checks: {
          eslint: { items: ["error1"], type: "items" },
          typescript: { items: ["error2"], type: "items" },
        },
        version: 1,
      });
    });

    it("should update existing entry in baseline", () => {
      const baseline: Baseline = {
        checks: {
          eslint: { items: ["error1"], type: "items" as const },
        },
        version: 1,
      };

      const updatedEntry: BaselineEntry = {
        items: ["error2", "error3"],
        type: "items" as const,
      };

      const updated = BaselineManager.update(baseline, "eslint", updatedEntry);

      expect(updated).toStrictEqual({
        checks: {
          eslint: { items: ["error2", "error3"], type: "items" },
        },
        version: 1,
      });
    });

    it("should create new baseline when baseline is null", () => {
      const entry: BaselineEntry = {
        items: ["error1"],
        type: "items" as const,
      };

      const updated = BaselineManager.update(null, "eslint", entry);

      expect(updated).toStrictEqual({
        checks: {
          eslint: { items: ["error1"], type: "items" },
        },
        version: 1,
      });
    });

    it("should not mutate the original baseline", () => {
      const baseline: Baseline = {
        checks: {
          eslint: { items: ["error1"], type: "items" as const },
        },
        version: 1,
      };

      const newEntry: BaselineEntry = {
        items: ["error2"],
        type: "items" as const,
      };

      BaselineManager.update(baseline, "typescript", newEntry);

      expect(baseline.checks).toStrictEqual({
        eslint: { items: ["error1"], type: "items" },
      });
    });
  });

  describe("load", () => {
    it("should load and parse baseline file", async () => {
      const baseline: Baseline = {
        checks: {
          eslint: { items: ["error1"], type: "items" as const },
        },
        version: 1,
      };

      mockReadFile.mockResolvedValue(JSON.stringify(baseline));

      const manager = new BaselineManager(".mejora/baseline.json");
      const result = await manager.load();

      expect(result).toStrictEqual(baseline);
      expect(mockReadFile).toHaveBeenCalledWith(
        ".mejora/baseline.json",
        "utf8",
      );
    });

    it("should return null when file does not exist", async () => {
      const error = new Error("ENOENT") as NodeJS.ErrnoException;

      error.code = "ENOENT";
      mockReadFile.mockRejectedValue(error);

      const manager = new BaselineManager(".mejora/baseline.json");
      const result = await manager.load();

      expect(result).toBeNull();
    });

    it("should throw error for other file system errors", async () => {
      const error = new Error("Permission denied") as NodeJS.ErrnoException;

      error.code = "EACCES";
      mockReadFile.mockRejectedValue(error);

      const manager = new BaselineManager(".mejora/baseline.json");

      await expect(manager.load()).rejects.toThrowError("Permission denied");
    });

    it("should use custom baseline path", async () => {
      const baseline: Baseline = {
        checks: {},
        version: 1,
      };

      mockReadFile.mockResolvedValue(JSON.stringify(baseline));

      const manager = new BaselineManager("custom/path/baseline.json");

      await manager.load();

      expect(mockReadFile).toHaveBeenCalledWith(
        "custom/path/baseline.json",
        "utf8",
      );
    });
  });

  describe("save", () => {
    beforeEach(() => {
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue();
    });

    it("should save both JSON and markdown files", async () => {
      const baseline: Baseline = {
        checks: {
          eslint: { items: ["error1"], type: "items" as const },
        },
        version: 1,
      };

      const manager = new BaselineManager(".mejora/baseline.json");

      await manager.save(baseline);

      expect(mockMkdir).toHaveBeenCalledWith(".mejora", { recursive: true });
      expect(mockWriteFile).toHaveBeenCalledWith(
        ".mejora/baseline.json",
        `${JSON.stringify(baseline, null, 2)}\n`,
        "utf8",
      );
      // Should also write the markdown file
      expect(mockWriteFile).toHaveBeenCalledWith(
        ".mejora/baseline.md",
        expect.any(String),
        "utf8",
      );
    });

    it("should save with force parameter true", async () => {
      const baseline: Baseline = {
        checks: {
          eslint: { items: ["error1"], type: "items" as const },
        },
        version: 1,
      };

      const manager = new BaselineManager(".mejora/baseline.json");

      await manager.save(baseline, true);

      // Should still save when force is true
      expect(mockMkdir).toHaveBeenCalledWith(".mejora", { recursive: true });
      expect(mockWriteFile).toHaveBeenCalledTimes(2);
    });

    it("should save with force parameter false in non-CI environment", async () => {
      const baseline: Baseline = {
        checks: {
          eslint: { items: ["error1"], type: "items" as const },
        },
        version: 1,
      };

      const manager = new BaselineManager(".mejora/baseline.json");

      await manager.save(baseline, false);

      // Should save when force is false in non-CI environment (isInCi is mocked as false)
      expect(mockMkdir).toHaveBeenCalledWith(".mejora", { recursive: true });
      expect(mockWriteFile).toHaveBeenCalledTimes(2);
    });

    it("should use custom baseline path for save", async () => {
      const baseline: Baseline = {
        checks: {},
        version: 1,
      };

      const manager = new BaselineManager("custom/path/baseline.json");

      await manager.save(baseline);

      expect(mockMkdir).toHaveBeenCalledWith("custom/path", {
        recursive: true,
      });
      expect(mockWriteFile).toHaveBeenCalledWith(
        "custom/path/baseline.json",
        expect.any(String),
        "utf8",
      );
      expect(mockWriteFile).toHaveBeenCalledWith(
        "custom/path/baseline.md",
        expect.any(String),
        "utf8",
      );
    });

    it("should format JSON with 2 space indentation and trailing newline", async () => {
      const baseline: Baseline = {
        checks: {
          eslint: { items: ["error1", "error2"], type: "items" as const },
        },
        version: 1,
      };

      const manager = new BaselineManager(".mejora/baseline.json");

      await manager.save(baseline);

      const expectedJson = `${JSON.stringify(baseline, null, 2)}\n`;

      expect(mockWriteFile).toHaveBeenCalledWith(
        ".mejora/baseline.json",
        expectedJson,
        "utf8",
      );
      expect(expectedJson).toContain("\n");
      expect(expectedJson).toMatch(/ {2}"checks"/); // 2 space indent
    });

    it("should handle nested directory creation", async () => {
      const baseline: Baseline = {
        checks: {},
        version: 1,
      };

      const manager = new BaselineManager("deep/nested/path/baseline.json");

      await manager.save(baseline);

      expect(mockMkdir).toHaveBeenCalledWith("deep/nested/path", {
        recursive: true,
      });
    });
  });

  describe("constructor", () => {
    it("should use default baseline path when not provided", async () => {
      const manager = new BaselineManager();
      const baseline: Baseline = {
        checks: {},
        version: 1,
      };

      mockReadFile.mockResolvedValue(JSON.stringify(baseline));
      await manager.load();

      expect(mockReadFile).toHaveBeenCalledWith(
        ".mejora/baseline.json",
        "utf8",
      );
    });

    it("should use custom baseline path when provided", async () => {
      const customPath = "my-custom/baseline.json";
      const manager = new BaselineManager(customPath);
      const baseline: Baseline = {
        checks: {},
        version: 1,
      };

      mockReadFile.mockResolvedValue(JSON.stringify(baseline));
      await manager.load();

      expect(mockReadFile).toHaveBeenCalledWith(customPath, "utf8");
    });
  });

  describe("save in CI environment", () => {
    beforeEach(() => {
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue();
    });

    it("should not save when in CI without force flag", async () => {
      vi.doMock("is-in-ci", () => ({
        default: true,
      }));

      // Need to re-import BaselineManager to pick up the new mock
      vi.resetModules();
      const { BaselineManager: CIBaselineManager } = await import("./baseline");

      const baseline: Baseline = {
        checks: {
          eslint: { items: ["error1"], type: "items" as const },
        },
        version: 1,
      };

      const manager = new CIBaselineManager(".mejora/baseline.json");

      await manager.save(baseline, false);

      // Should not write any files when in CI without force
      expect(mockWriteFile).not.toHaveBeenCalled();
      expect(mockMkdir).not.toHaveBeenCalled();
    });

    it("should save when in CI with force flag", async () => {
      // Re-mock is-in-ci to return true
      vi.doMock("is-in-ci", () => ({
        default: true,
      }));

      // Need to re-import BaselineManager to pick up the new mock
      vi.resetModules();
      const { BaselineManager: CIBaselineManager } = await import("./baseline");

      const baseline: Baseline = {
        checks: {
          eslint: { items: ["error1"], type: "items" as const },
        },
        version: 1,
      };

      const manager = new CIBaselineManager(".mejora/baseline.json");

      await manager.save(baseline, true);

      // Should write files when force is true, even in CI
      expect(mockMkdir).toHaveBeenCalledWith(".mejora", { recursive: true });
      expect(mockWriteFile).toHaveBeenCalledTimes(2);
    });
  });
});
