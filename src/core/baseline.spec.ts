import { mkdir, readFile, writeFile } from "node:fs/promises";

import { logger } from "@/utils/logger";

import { BaselineManager } from "./baseline";

vi.mock("node:fs/promises");
vi.mock("@/utils/is-in-ci", () => ({
  default: false,
}));
vi.mock("@/utils/logger");

const mockReadFile = vi.mocked(readFile);
const mockWriteFile = vi.mocked(writeFile);
const mockMkdir = vi.mocked(mkdir);

describe("BaselineManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("static create", () => {
    it("should create a baseline with version 2", () => {
      const checks = {
        eslint: {
          items: [
            {
              column: 1,
              file: "src/a.ts",
              id: "abc123def456",
              line: 10,
              message: "error1",
              rule: "no-unused-vars",
            },
          ],
          type: "items" as const,
        },
      };

      const baseline = BaselineManager.create(checks);

      expect(baseline).toStrictEqual({
        checks,
        version: 2,
      });
    });

    it("should create a baseline with empty checks", () => {
      const baseline = BaselineManager.create({});

      expect(baseline).toStrictEqual({
        checks: {},
        version: 2,
      });
    });

    it("should create a baseline with multiple checks", () => {
      const checks = {
        eslint: {
          items: [
            {
              column: 1,
              file: "src/a.ts",
              id: "abc123def456",
              line: 10,
              message: "error1",
              rule: "no-unused-vars",
            },
          ],
          type: "items" as const,
        },
        typescript: {
          items: [
            {
              column: 1,
              file: "src/b.ts",
              id: "789xyz012tuv",
              line: 20,
              message: "error2",
              rule: "TS2304",
            },
            {
              column: 1,
              file: "src/c.ts",
              id: "fed654cba321",
              line: 30,
              message: "error3",
              rule: "TS2345",
            },
          ],
          type: "items" as const,
        },
      };

      const baseline = BaselineManager.create(checks);

      expect(baseline).toStrictEqual({
        checks,
        version: 2,
      });
    });
  });

  describe("static getEntry", () => {
    it("should return entry when baseline exists and has the check", () => {
      const baseline = {
        checks: {
          eslint: {
            items: [
              {
                column: 1,
                file: "src/a.ts",
                id: "abc123def456",
                line: 10,
                message: "error1",
                rule: "no-unused-vars",
              },
            ],
            type: "items" as const,
          },
        },
        version: 2,
      };

      const entry = BaselineManager.getEntry(baseline, "eslint");

      expect(entry).toStrictEqual({
        items: [
          {
            column: 1,
            file: "src/a.ts",
            id: "abc123def456",
            line: 10,
            message: "error1",
            rule: "no-unused-vars",
          },
        ],
        type: "items",
      });
    });

    it("should return undefined when baseline exists but check does not", () => {
      const baseline = {
        checks: {
          eslint: {
            items: [
              {
                column: 1,
                file: "src/a.ts",
                id: "abc123def456",
                line: 10,
                message: "error1",
                rule: "no-unused-vars",
              },
            ],
            type: "items" as const,
          },
        },
        version: 2,
      };

      const entry = BaselineManager.getEntry(baseline, "typescript");

      expect(entry).toBeUndefined();
    });

    it("should return undefined when baseline is null", () => {
      const entry = BaselineManager.getEntry(null, "eslint");

      expect(entry).toBeUndefined();
    });
  });

  describe("static update", () => {
    it("should add new entry to existing baseline", () => {
      const baseline = {
        checks: {
          eslint: {
            items: [
              {
                column: 1,
                file: "src/a.ts",
                id: "abc123def456",
                line: 10,
                message: "error1",
                rule: "no-unused-vars",
              },
            ],
            type: "items" as const,
          },
        },
        version: 2,
      };

      const newEntry = {
        items: [
          {
            column: 1,
            file: "src/b.ts",
            id: "789xyz012tuv",
            line: 20,
            message: "error2",
            rule: "TS2304",
          },
        ],
        type: "items" as const,
      };

      const updated = BaselineManager.update(baseline, "typescript", newEntry);

      expect(updated).toStrictEqual({
        checks: {
          eslint: {
            items: [
              {
                column: 1,
                file: "src/a.ts",
                id: "abc123def456",
                line: 10,
                message: "error1",
                rule: "no-unused-vars",
              },
            ],
            type: "items",
          },
          typescript: {
            items: [
              {
                column: 1,
                file: "src/b.ts",
                id: "789xyz012tuv",
                line: 20,
                message: "error2",
                rule: "TS2304",
              },
            ],
            type: "items",
          },
        },
        version: 2,
      });
    });

    it("should update existing entry in baseline", () => {
      const baseline = {
        checks: {
          eslint: {
            items: [
              {
                column: 1,
                file: "src/a.ts",
                id: "abc123def456",
                line: 10,
                message: "error1",
                rule: "no-unused-vars",
              },
            ],
            type: "items" as const,
          },
        },
        version: 2,
      };

      const updatedEntry = {
        items: [
          {
            column: 1,
            file: "src/b.ts",
            id: "111aaa222bbb",
            line: 20,
            message: "error2",
            rule: "no-undef",
          },
          {
            column: 1,
            file: "src/c.ts",
            id: "333ccc444ddd",
            line: 30,
            message: "error3",
            rule: "semi",
          },
        ],
        type: "items" as const,
      };

      const updated = BaselineManager.update(baseline, "eslint", updatedEntry);

      expect(updated).toStrictEqual({
        checks: {
          eslint: {
            items: [
              {
                column: 1,
                file: "src/b.ts",
                id: "111aaa222bbb",
                line: 20,
                message: "error2",
                rule: "no-undef",
              },
              {
                column: 1,
                file: "src/c.ts",
                id: "333ccc444ddd",
                line: 30,
                message: "error3",
                rule: "semi",
              },
            ],
            type: "items",
          },
        },
        version: 2,
      });
    });

    it("should create new baseline when baseline is null", () => {
      const entry = {
        items: [
          {
            column: 1,
            file: "src/a.ts",
            id: "abc123def456",
            line: 10,
            message: "error1",
            rule: "no-unused-vars",
          },
        ],
        type: "items" as const,
      };

      const updated = BaselineManager.update(null, "eslint", entry);

      expect(updated).toStrictEqual({
        checks: {
          eslint: {
            items: [
              {
                column: 1,
                file: "src/a.ts",
                id: "abc123def456",
                line: 10,
                message: "error1",
                rule: "no-unused-vars",
              },
            ],
            type: "items",
          },
        },
        version: 2,
      });
    });

    it("should not mutate the original baseline", () => {
      const baseline = {
        checks: {
          eslint: {
            items: [
              {
                column: 1,
                file: "src/a.ts",
                id: "abc123def456",
                line: 10,
                message: "error1",
                rule: "no-unused-vars",
              },
            ],
            type: "items" as const,
          },
        },
        version: 2,
      };

      const newEntry = {
        items: [
          {
            column: 1,
            file: "src/b.ts",
            id: "789xyz012tuv",
            line: 20,
            message: "error2",
            rule: "TS2304",
          },
        ],
        type: "items" as const,
      };

      BaselineManager.update(baseline, "typescript", newEntry);

      expect(baseline.checks).toStrictEqual({
        eslint: {
          items: [
            {
              column: 1,
              file: "src/a.ts",
              id: "abc123def456",
              line: 10,
              message: "error1",
              rule: "no-unused-vars",
            },
          ],
          type: "items",
        },
      });
    });

    it("should return same reference when entry is identical", () => {
      const item1 = {
        column: 1,
        file: "src/a.ts",
        id: "abc123def456",
        line: 10,
        message: "error1",
        rule: "no-unused-vars",
      };
      const item2 = {
        column: 1,
        file: "src/b.ts",
        id: "111aaa222bbb",
        line: 20,
        message: "error2",
        rule: "no-undef",
      };

      const baseline = {
        checks: {
          eslint: {
            items: [item1, item2],
            type: "items" as const,
          },
        },
        version: 2,
      };

      const identicalEntry = {
        items: [item1, item2],
        type: "items" as const,
      };

      const updated = BaselineManager.update(
        baseline,
        "eslint",
        identicalEntry,
      );

      expect(updated).toBe(baseline);
    });

    it("should return new reference when items differ", () => {
      const baseline = {
        checks: {
          eslint: {
            items: [
              {
                column: 1,
                file: "src/a.ts",
                id: "abc123def456",
                line: 10,
                message: "error1",
                rule: "no-unused-vars",
              },
            ],
            type: "items" as const,
          },
        },
        version: 2,
      };

      const differentEntry = {
        items: [
          {
            column: 1,
            file: "src/b.ts",
            id: "111aaa222bbb",
            line: 20,
            message: "error2",
            rule: "no-undef",
          },
        ],
        type: "items" as const,
      };

      const updated = BaselineManager.update(
        baseline,
        "eslint",
        differentEntry,
      );

      expect(updated).not.toBe(baseline);
      expect(updated.checks.eslint).toStrictEqual({
        items: [
          {
            column: 1,
            file: "src/b.ts",
            id: "111aaa222bbb",
            line: 20,
            message: "error2",
            rule: "no-undef",
          },
        ],
        type: "items",
      });
    });

    it("should return same reference when items order differs", () => {
      const item1 = {
        column: 1,
        file: "src/a.ts",
        id: "abc123def456",
        line: 10,
        message: "error1",
        rule: "no-unused-vars",
      };
      const item2 = {
        column: 1,
        file: "src/b.ts",
        id: "111aaa222bbb",
        line: 20,
        message: "error2",
        rule: "no-undef",
      };

      const baseline = {
        checks: {
          eslint: {
            items: [item1, item2],
            type: "items" as const,
          },
        },
        version: 2,
      };

      const reorderedEntry = {
        items: [item2, item1],
        type: "items" as const,
      };

      const updated = BaselineManager.update(
        baseline,
        "eslint",
        reorderedEntry,
      );

      expect(updated).toBe(baseline);
    });

    it("should return new reference when adding new check", () => {
      const baseline = {
        checks: {
          eslint: {
            items: [
              {
                column: 1,
                file: "src/a.ts",
                id: "abc123def456",
                line: 10,
                message: "error1",
                rule: "no-unused-vars",
              },
            ],
            type: "items" as const,
          },
        },
        version: 2,
      };

      const newEntry = {
        items: [
          {
            column: 1,
            file: "src/b.ts",
            id: "789xyz012tuv",
            line: 20,
            message: "error2",
            rule: "TS2304",
          },
        ],
        type: "items" as const,
      };

      const updated = BaselineManager.update(baseline, "typescript", newEntry);

      expect(updated).not.toBe(baseline);
    });
  });

  describe("load", () => {
    it("should load and parse baseline file", async () => {
      const baseline = {
        checks: {
          eslint: {
            items: [
              {
                column: 1,
                file: "src/a.ts",
                id: "abc123def456",
                line: 10,
                message: "error1",
                rule: "no-unused-vars",
              },
            ],
            type: "items" as const,
          },
        },
        version: 2,
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
      const baseline = {
        checks: {},
        version: 2,
      };

      mockReadFile.mockResolvedValue(JSON.stringify(baseline));

      const manager = new BaselineManager("custom/path/baseline.json");

      await manager.load();

      expect(mockReadFile).toHaveBeenCalledWith(
        "custom/path/baseline.json",
        "utf8",
      );
    });

    it("should auto-resolve merge conflicts", async () => {
      const item1 = {
        column: 1,
        file: "src/a.ts",
        id: "abc123def456",
        line: 10,
        message: "error1",
        rule: "no-unused-vars",
      };
      const item2 = {
        column: 1,
        file: "src/b.ts",
        id: "111aaa222bbb",
        line: 20,
        message: "error2",
        rule: "no-undef",
      };
      const item3 = {
        column: 1,
        file: "src/c.ts",
        id: "333ccc444ddd",
        line: 30,
        message: "error3",
        rule: "semi",
      };

      const conflictContent = [
        "{",
        '  "version": 2,',
        "<<<<<<< HEAD",
        '  "checks": {',
        '    "eslint": {',
        '      "type": "items",',
        '      "items": [',
        `        ${JSON.stringify(item1)},`,
        `        ${JSON.stringify(item2)}`,
        "      ]",
        "    }",
        "  }",
        "=======",
        '  "checks": {',
        '    "eslint": {',
        '      "type": "items",',
        '      "items": [',
        `        ${JSON.stringify(item2)},`,
        `        ${JSON.stringify(item3)}`,
        "      ]",
        "    }",
        "  }",
        ">>>>>>> feature",
        "}",
      ].join("\n");

      mockReadFile.mockResolvedValue(conflictContent);
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue();

      const manager = new BaselineManager(".mejora/baseline.json");
      const result = await manager.load();

      expect(result?.checks.eslint?.items).toHaveLength(3);
      expect(logger.start).toHaveBeenCalledWith(
        "Merge conflict detected in baseline, auto-resolving...",
      );
      expect(logger.success).toHaveBeenCalledWith("Baseline conflict resolved");
      expect(mockWriteFile).toHaveBeenCalledWith(
        ".mejora/baseline.json",
        expect.stringContaining('"no-unused-vars"'),
        "utf8",
      );
    });

    it("should handle conflicts with different checks on each side", async () => {
      const item1 = {
        column: 1,
        file: "src/a.ts",
        id: "abc123def456",
        line: 10,
        message: "error1",
        rule: "no-unused-vars",
      };
      const item2 = {
        column: 1,
        file: "src/b.ts",
        id: "789xyz012tuv",
        line: 20,
        message: "error2",
        rule: "TS2304",
      };

      const conflictContent = [
        "{",
        '  "version": 2,',
        "<<<<<<< HEAD",
        '  "checks": {',
        '    "eslint": {',
        '      "type": "items",',
        `      "items": [${JSON.stringify(item1)}]`,
        "    }",
        "  }",
        "=======",
        '  "checks": {',
        '    "typescript": {',
        '      "type": "items",',
        `      "items": [${JSON.stringify(item2)}]`,
        "    }",
        "  }",
        ">>>>>>> feature",
        "}",
      ].join("\n");

      mockReadFile.mockResolvedValue(conflictContent);
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue();

      const manager = new BaselineManager(".mejora/baseline.json");
      const result = await manager.load();

      expect(result?.checks.eslint?.items).toHaveLength(1);
      expect(result?.checks.typescript?.items).toHaveLength(1);
    });

    it("should handle conflicts with overlapping items by ID", async () => {
      const item1 = {
        column: 1,
        file: "src/a.ts",
        id: "aaa111",
        line: 10,
        message: "error1",
        rule: "no-unused-vars",
      };
      const item2 = {
        column: 1,
        file: "src/b.ts",
        id: "bbb222",
        line: 20,
        message: "error2",
        rule: "no-undef",
      };
      const item3 = {
        column: 1,
        file: "src/c.ts",
        id: "ccc333",
        line: 30,
        message: "error3",
        rule: "semi",
      };
      const item4 = {
        column: 1,
        file: "src/d.ts",
        id: "ddd444",
        line: 40,
        message: "error4",
        rule: "quotes",
      };

      const conflictContent = [
        "{",
        '  "version": 2,',
        "<<<<<<< HEAD",
        '  "checks": {',
        '    "eslint": {',
        '      "type": "items",',
        '      "items": [',
        `        ${JSON.stringify(item1)},`,
        `        ${JSON.stringify(item2)},`,
        `        ${JSON.stringify(item3)}`,
        "      ]",
        "    }",
        "  }",
        "=======",
        '  "checks": {',
        '    "eslint": {',
        '      "type": "items",',
        '      "items": [',
        `        ${JSON.stringify(item2)},`,
        `        ${JSON.stringify(item3)},`,
        `        ${JSON.stringify(item4)}`,
        "      ]",
        "    }",
        "  }",
        ">>>>>>> feature",
        "}",
      ].join("\n");

      mockReadFile.mockResolvedValue(conflictContent);
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue();

      const manager = new BaselineManager(".mejora/baseline.json");
      const result = await manager.load();

      expect(result?.checks.eslint?.items).toHaveLength(4);
    });

    it("should sort merged items by ID", async () => {
      const itemZ = {
        column: 1,
        file: "src/z.ts",
        id: "zzz999",
        line: 10,
        message: "z-error",
        rule: "z-error",
      };
      const itemA = {
        column: 1,
        file: "src/a.ts",
        id: "aaa111",
        line: 20,
        message: "a-error",
        rule: "a-error",
      };
      const itemM = {
        column: 1,
        file: "src/m.ts",
        id: "mmm555",
        line: 30,
        message: "m-error",
        rule: "m-error",
      };
      const itemB = {
        column: 1,
        file: "src/b.ts",
        id: "bbb222",
        line: 40,
        message: "b-error",
        rule: "b-error",
      };

      const conflictContent = [
        "{",
        '  "version": 2,',
        "<<<<<<< HEAD",
        '  "checks": {',
        '    "eslint": {',
        '      "type": "items",',
        '      "items": [',
        `        ${JSON.stringify(itemZ)},`,
        `        ${JSON.stringify(itemA)}`,
        "      ]",
        "    }",
        "  }",
        "=======",
        '  "checks": {',
        '    "eslint": {',
        '      "type": "items",',
        '      "items": [',
        `        ${JSON.stringify(itemM)},`,
        `        ${JSON.stringify(itemB)}`,
        "      ]",
        "    }",
        "  }",
        ">>>>>>> feature",
        "}",
      ].join("\n");

      mockReadFile.mockResolvedValue(conflictContent);
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue();

      const manager = new BaselineManager(".mejora/baseline.json");
      const result = await manager.load();

      const ids = result?.checks.eslint?.items.map((i) => i.id);

      expect(ids).toStrictEqual(["aaa111", "bbb222", "mmm555", "zzz999"]);
    });

    it("should throw error for malformed conflict markers", async () => {
      const conflictContent = [
        "{",
        '  "version": 2,',
        "<<<<<<< HEAD",
        '  "checks": {}',
        "  // Missing =======",
        ">>>>>>> feature",
        "}",
      ].join("\n");

      mockReadFile.mockResolvedValue(conflictContent);

      const manager = new BaselineManager(".mejora/baseline.json");

      await expect(manager.load()).rejects.toThrowError(
        "Could not parse conflict markers in baseline",
      );
    });

    it("should throw error for invalid JSON in conflict sections", async () => {
      const conflictContent = [
        "{",
        '  "version": 2,',
        "<<<<<<< HEAD",
        '  "checks": { invalid json }',
        "=======",
        '  "checks": {}',
        ">>>>>>> feature",
        "}",
      ].join("\n");

      mockReadFile.mockResolvedValue(conflictContent);

      const manager = new BaselineManager(".mejora/baseline.json");

      await expect(manager.load()).rejects.toThrowError(
        "Failed to parse baseline during conflict resolution",
      );
    });
  });

  describe("save", () => {
    beforeEach(() => {
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue();
    });

    it("should save both JSON and markdown files", async () => {
      const baseline = {
        checks: {
          eslint: {
            items: [
              {
                column: 1,
                file: "src/a.ts",
                id: "abc123def456",
                line: 10,
                message: "error1",
                rule: "no-unused-vars",
              },
            ],
            type: "items" as const,
          },
        },
        version: 2,
      };

      const manager = new BaselineManager(".mejora/baseline.json");

      await manager.save(baseline);

      expect(mockMkdir).toHaveBeenCalledWith(".mejora", { recursive: true });
      expect(mockWriteFile).toHaveBeenCalledWith(
        ".mejora/baseline.json",
        `${JSON.stringify(baseline, null, 2)}\n`,
        "utf8",
      );
      expect(mockWriteFile).toHaveBeenCalledWith(
        ".mejora/baseline.md",
        expect.any(String),
        "utf8",
      );
    });

    it("should save with force parameter true", async () => {
      const baseline = {
        checks: {
          eslint: {
            items: [
              {
                column: 1,
                file: "src/a.ts",
                id: "abc123def456",
                line: 10,
                message: "error1",
                rule: "no-unused-vars",
              },
            ],
            type: "items" as const,
          },
        },
        version: 2,
      };

      const manager = new BaselineManager(".mejora/baseline.json");

      await manager.save(baseline, true);

      expect(mockMkdir).toHaveBeenCalledWith(".mejora", { recursive: true });
      expect(mockWriteFile).toHaveBeenCalledTimes(2);
    });

    it("should save with force parameter false in non-CI environment", async () => {
      const baseline = {
        checks: {
          eslint: {
            items: [
              {
                column: 1,
                file: "src/a.ts",
                id: "abc123def456",
                line: 10,
                message: "error1",
                rule: "no-unused-vars",
              },
            ],
            type: "items" as const,
          },
        },
        version: 2,
      };

      const manager = new BaselineManager(".mejora/baseline.json");

      await manager.save(baseline, false);

      expect(mockMkdir).toHaveBeenCalledWith(".mejora", { recursive: true });
      expect(mockWriteFile).toHaveBeenCalledTimes(2);
    });

    it("should use custom baseline path for save", async () => {
      const baseline = {
        checks: {},
        version: 2,
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
      const baseline = {
        checks: {
          eslint: {
            items: [
              {
                column: 1,
                file: "src/a.ts",
                id: "abc123def456",
                line: 10,
                message: "error1",
                rule: "no-unused-vars",
              },
              {
                column: 1,
                file: "src/b.ts",
                id: "111aaa222bbb",
                line: 20,
                message: "error2",
                rule: "no-undef",
              },
            ],
            type: "items" as const,
          },
        },
        version: 2,
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
      const baseline = {
        checks: {},
        version: 2,
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
      const baseline = {
        checks: {},
        version: 2,
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
      const baseline = {
        checks: {},
        version: 2,
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
      vi.doMock("@/utils/is-in-ci", () => ({
        default: true,
      }));
      vi.resetModules();

      const { BaselineManager: CIBaselineManager } = await import("./baseline");

      const baseline = {
        checks: {
          eslint: {
            items: [
              {
                column: 1,
                file: "src/a.ts",
                id: "abc123def456",
                line: 10,
                message: "error1",
                rule: "no-unused-vars",
              },
            ],
            type: "items" as const,
          },
        },
        version: 2,
      };

      const manager = new CIBaselineManager(".mejora/baseline.json");

      await manager.save(baseline, false);

      expect(mockWriteFile).not.toHaveBeenCalled();
      expect(mockMkdir).not.toHaveBeenCalled();
    });

    it("should save when in CI with force flag", async () => {
      vi.doMock("is-in-ci", () => ({
        default: true,
      }));
      vi.resetModules();

      const { BaselineManager: CIBaselineManager } = await import("./baseline");

      const baseline = {
        checks: {
          eslint: {
            items: [
              {
                column: 1,
                file: "src/a.ts",
                id: "abc123def456",
                line: 10,
                message: "error1",
                rule: "no-unused-vars",
              },
            ],
            type: "items" as const,
          },
        },
        version: 2,
      };

      const manager = new CIBaselineManager(".mejora/baseline.json");

      await manager.save(baseline, true);

      expect(mockMkdir).toHaveBeenCalledWith(".mejora", { recursive: true });
      expect(mockWriteFile).toHaveBeenCalledTimes(2);
    });
  });

  it("should regenerate markdown when it has merge conflicts but JSON is clean", async () => {
    const baseline = {
      checks: {
        eslint: {
          items: [
            {
              column: 1,
              file: "src/a.ts",
              id: "abc123def456",
              line: 10,
              message: "error1",
              rule: "no-unused-vars",
            },
          ],
          type: "items" as const,
        },
      },
      version: 2,
    };

    const markdownWithConflict = [
      "# Mejora Baseline",
      "",
      "<<<<<<< HEAD",
      "## eslint",
      "- error1 in src/a.ts",
      "=======",
      "## eslint",
      "- error2 in src/b.ts",
      ">>>>>>> feature",
    ].join("\n");

    mockReadFile.mockResolvedValueOnce(JSON.stringify(baseline));
    mockReadFile.mockResolvedValueOnce(markdownWithConflict);
    mockWriteFile.mockResolvedValue();

    const manager = new BaselineManager(".mejora/baseline.json");
    const result = await manager.load();

    expect(result).toStrictEqual(baseline);
    expect(logger.start).toHaveBeenCalledWith(
      "Merge conflict detected in markdown report, regenerating...",
    );
    expect(logger.success).toHaveBeenCalledWith("Markdown report regenerated");
    expect(mockWriteFile).toHaveBeenCalledExactlyOnceWith(
      ".mejora/baseline.md",
      expect.any(String),
      "utf8",
    );
  });

  it("should not check markdown when JSON has conflicts", async () => {
    const item1 = {
      column: 1,
      file: "src/a.ts",
      id: "abc123def456",
      line: 10,
      message: "error1",
      rule: "no-unused-vars",
    };

    const conflictContent = [
      "{",
      '  "version": 2,',
      "<<<<<<< HEAD",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(item1)}]`,
      "    }",
      "  }",
      "=======",
      '  "checks": {}',
      ">>>>>>> feature",
      "}",
    ].join("\n");

    mockReadFile.mockResolvedValue(conflictContent);
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue();

    const manager = new BaselineManager(".mejora/baseline.json");

    await manager.load();

    expect(mockReadFile).toHaveBeenCalledExactlyOnceWith(
      ".mejora/baseline.json",
      "utf8",
    );
  });

  it("should handle missing markdown file gracefully", async () => {
    const baseline = {
      checks: {
        eslint: {
          items: [
            {
              column: 1,
              file: "src/a.ts",
              id: "abc123def456",
              line: 10,
              message: "error1",
              rule: "no-unused-vars",
            },
          ],
          type: "items" as const,
        },
      },
      version: 2,
    };

    const mdError = new Error("ENOENT") as NodeJS.ErrnoException;

    mdError.code = "ENOENT";

    mockReadFile.mockResolvedValueOnce(JSON.stringify(baseline));
    mockReadFile.mockRejectedValueOnce(mdError);

    const manager = new BaselineManager(".mejora/baseline.json");
    const result = await manager.load();

    expect(result).toStrictEqual(baseline);
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it("should handle markdown read errors gracefully", async () => {
    const baseline = {
      checks: {
        eslint: {
          items: [
            {
              column: 1,
              file: "src/a.ts",
              id: "abc123def456",
              line: 10,
              message: "error1",
              rule: "no-unused-vars",
            },
          ],
          type: "items" as const,
        },
      },
      version: 2,
    };

    const mdError = new Error("Permission denied") as NodeJS.ErrnoException;

    mdError.code = "EACCES";

    mockReadFile.mockResolvedValueOnce(JSON.stringify(baseline));
    mockReadFile.mockRejectedValueOnce(mdError);

    const manager = new BaselineManager(".mejora/baseline.json");
    const result = await manager.load();

    expect(result).toStrictEqual(baseline);
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it("should not regenerate markdown when it has no conflicts", async () => {
    const baseline = {
      checks: {
        eslint: {
          items: [
            {
              column: 1,
              file: "src/a.ts",
              id: "abc123def456",
              line: 10,
              message: "error1",
              rule: "no-unused-vars",
            },
          ],
          type: "items" as const,
        },
      },
      version: 2,
    };

    const cleanMarkdown = [
      "# Mejora Baseline",
      "",
      "## eslint",
      "- error1 in src/a.ts",
    ].join("\n");

    mockReadFile.mockResolvedValueOnce(JSON.stringify(baseline));
    mockReadFile.mockResolvedValueOnce(cleanMarkdown);

    const manager = new BaselineManager(".mejora/baseline.json");
    const result = await manager.load();

    expect(result).toStrictEqual(baseline);
    expect(logger.start).not.toHaveBeenCalledWith(
      "Merge conflict detected in markdown report, regenerating...",
    );
    expect(mockWriteFile).not.toHaveBeenCalled();
  });
});
