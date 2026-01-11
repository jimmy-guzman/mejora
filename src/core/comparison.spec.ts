import { compareBaselines, compareSnapshots } from "./comparison";

describe("compareSnapshots", () => {
  it("should return initial state when baseline is undefined", () => {
    const snapshot = {
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
    };

    const result = compareSnapshots(snapshot, undefined);

    expect(result).toStrictEqual({
      hasImprovement: false,
      hasRegression: false,
      hasRelocation: false,
      isInitial: true,
      newIssues: [],
      removedIssues: [],
    });
  });

  it("should detect new items as regressions", () => {
    const error1 = {
      column: 1,
      file: "src/a.ts",
      id: "abc123def456",
      line: 10,
      message: "error1",
      rule: "no-unused-vars",
    };
    const error2 = {
      column: 1,
      file: "src/b.ts",
      id: "111aaa222bbb",
      line: 20,
      message: "error2",
      rule: "no-undef",
    };
    const error3 = {
      column: 1,
      file: "src/c.ts",
      id: "333ccc444ddd",
      line: 30,
      message: "error3",
      rule: "semi",
    };

    const snapshot = {
      items: [error1, error2, error3],
      type: "items" as const,
    };
    const baseline = {
      items: [error1, error2],
      type: "items" as const,
    };

    const result = compareSnapshots(snapshot, baseline);

    expect(result.hasRegression).toBe(true);
    expect(result.newIssues).toStrictEqual([error3]);
    expect(result.hasImprovement).toBe(false);
    expect(result.removedIssues).toStrictEqual([]);
    expect(result.hasRelocation).toBe(false);
  });

  it("should detect removed items as improvements", () => {
    const error1 = {
      column: 1,
      file: "src/a.ts",
      id: "abc123def456",
      line: 10,
      message: "error1",
      rule: "no-unused-vars",
    };
    const error2 = {
      column: 1,
      file: "src/b.ts",
      id: "111aaa222bbb",
      line: 20,
      message: "error2",
      rule: "no-undef",
    };
    const error3 = {
      column: 1,
      file: "src/c.ts",
      id: "333ccc444ddd",
      line: 30,
      message: "error3",
      rule: "semi",
    };

    const snapshot = { items: [error1], type: "items" as const };
    const baseline = {
      items: [error1, error2, error3],
      type: "items" as const,
    };

    const result = compareSnapshots(snapshot, baseline);

    expect(result.hasImprovement).toBe(true);
    expect(result.removedIssues).toStrictEqual([error2, error3]);
    expect(result.hasRegression).toBe(false);
    expect(result.newIssues).toStrictEqual([]);
    expect(result.hasRelocation).toBe(false);
  });

  it("should detect both regressions and improvements", () => {
    const error1 = {
      column: 1,
      file: "src/a.ts",
      id: "abc123def456",
      line: 10,
      message: "error1",
      rule: "no-unused-vars",
    };
    const error2 = {
      column: 1,
      file: "src/b.ts",
      id: "111aaa222bbb",
      line: 20,
      message: "error2",
      rule: "no-undef",
    };
    const error3 = {
      column: 1,
      file: "src/c.ts",
      id: "333ccc444ddd",
      line: 30,
      message: "error3",
      rule: "semi",
    };

    const snapshot = { items: [error1, error3], type: "items" as const };
    const baseline = {
      items: [error1, error2],
      type: "items" as const,
    };

    const result = compareSnapshots(snapshot, baseline);

    expect(result.hasRegression).toBe(true);
    expect(result.hasImprovement).toBe(true);
    expect(result.newIssues).toStrictEqual([error3]);
    expect(result.removedIssues).toStrictEqual([error2]);
    expect(result.hasRelocation).toBe(false);
  });

  it("should return no changes when items are identical", () => {
    const error1 = {
      column: 1,
      file: "src/a.ts",
      id: "abc123def456",
      line: 10,
      message: "error1",
      rule: "no-unused-vars",
    };
    const error2 = {
      column: 1,
      file: "src/b.ts",
      id: "111aaa222bbb",
      line: 20,
      message: "error2",
      rule: "no-undef",
    };

    const snapshot = { items: [error1, error2], type: "items" as const };
    const baseline = {
      items: [error1, error2],
      type: "items" as const,
    };

    const result = compareSnapshots(snapshot, baseline);

    expect(result.hasRegression).toBe(false);
    expect(result.hasImprovement).toBe(false);
    expect(result.newIssues).toStrictEqual([]);
    expect(result.removedIssues).toStrictEqual([]);
    expect(result.hasRelocation).toBe(false);
  });

  it("should sort items by ID", () => {
    const itemC = {
      column: 1,
      file: "src/c.ts",
      id: "ccc333",
      line: 10,
      message: "c",
      rule: "error-c",
    };
    const itemA = {
      column: 1,
      file: "src/a.ts",
      id: "aaa111",
      line: 10,
      message: "a",
      rule: "error-a",
    };
    const itemD = {
      column: 1,
      file: "src/d.ts",
      id: "ddd444",
      line: 10,
      message: "d",
      rule: "error-d",
    };
    const itemB = {
      column: 1,
      file: "src/b.ts",
      id: "bbb222",
      line: 10,
      message: "b",
      rule: "error-b",
    };

    const snapshot = { items: [itemC, itemA], type: "items" as const };
    const baseline = { items: [itemD, itemB], type: "items" as const };

    const result = compareSnapshots(snapshot, baseline);

    expect(result.newIssues).toStrictEqual([itemA, itemC]);
    expect(result.removedIssues).toStrictEqual([itemB, itemD]);
  });

  it("should handle empty snapshots", () => {
    const error1 = {
      column: 1,
      file: "src/a.ts",
      id: "abc123def456",
      line: 10,
      message: "error1",
      rule: "no-unused-vars",
    };

    const snapshot = { items: [], type: "items" as const };
    const baseline = { items: [error1], type: "items" as const };

    const result = compareSnapshots(snapshot, baseline);

    expect(result.hasImprovement).toBe(true);
    expect(result.removedIssues).toStrictEqual([error1]);
  });

  it("should handle empty baseline", () => {
    const error1 = {
      column: 1,
      file: "src/a.ts",
      id: "abc123def456",
      line: 10,
      message: "error1",
      rule: "no-unused-vars",
    };

    const snapshot = { items: [error1], type: "items" as const };
    const baseline = { items: [], type: "items" as const };

    const result = compareSnapshots(snapshot, baseline);

    expect(result.hasRegression).toBe(true);
    expect(result.newIssues).toStrictEqual([error1]);
  });

  it("should match items by ID, not by line number", () => {
    const error1AtLine50 = {
      column: 1,
      file: "src/a.ts",
      id: "7a8b9c0d1e2f",
      line: 50,
      message: "'foo' is declared but never used",
      rule: "no-unused-vars",
    };
    const error1AtLine60 = {
      column: 1,
      file: "src/a.ts",
      id: "7a8b9c0d1e2f",
      line: 60,
      message: "'foo' is declared but never used",
      rule: "no-unused-vars",
    };

    const snapshot = { items: [error1AtLine60], type: "items" as const };
    const baseline = { items: [error1AtLine50], type: "items" as const };

    const result = compareSnapshots(snapshot, baseline);

    expect(result.hasRegression).toBe(false);
    expect(result.hasImprovement).toBe(false);
    expect(result.newIssues).toStrictEqual([]);
    expect(result.removedIssues).toStrictEqual([]);
    expect(result.hasRelocation).toBe(true);
  });

  it("should detect position changes when line changes", () => {
    const error1AtLine10 = {
      column: 5,
      file: "src/a.ts",
      id: "f1e2d3c4b5a6",
      line: 10,
      message: "unused variable",
      rule: "no-unused-vars",
    };
    const error1AtLine20 = {
      column: 5,
      file: "src/a.ts",
      id: "f1e2d3c4b5a6",
      line: 20,
      message: "unused variable",
      rule: "no-unused-vars",
    };

    const snapshot = { items: [error1AtLine20], type: "items" as const };
    const baseline = { items: [error1AtLine10], type: "items" as const };

    const result = compareSnapshots(snapshot, baseline);

    expect(result.hasRegression).toBe(false);
    expect(result.hasImprovement).toBe(false);
    expect(result.hasRelocation).toBe(true);
  });

  it("should detect position changes when column changes", () => {
    const error1AtCol5 = {
      column: 5,
      file: "src/a.ts",
      id: "9z8y7x6w5v4u",
      line: 10,
      message: "unused variable",
      rule: "no-unused-vars",
    };
    const error1AtCol10 = {
      column: 10,
      file: "src/a.ts",
      id: "9z8y7x6w5v4u",
      line: 10,
      message: "unused variable",
      rule: "no-unused-vars",
    };

    const snapshot = { items: [error1AtCol10], type: "items" as const };
    const baseline = { items: [error1AtCol5], type: "items" as const };

    const result = compareSnapshots(snapshot, baseline);

    expect(result.hasRegression).toBe(false);
    expect(result.hasImprovement).toBe(false);
    expect(result.hasRelocation).toBe(true);
  });

  it("should detect position changes when both line and column change", () => {
    const error1 = {
      column: 5,
      file: "src/a.ts",
      id: "3t4r5e6w7q8a",
      line: 10,
      message: "unused variable",
      rule: "no-unused-vars",
    };
    const error1Moved = {
      column: 15,
      file: "src/a.ts",
      id: "3t4r5e6w7q8a",
      line: 20,
      message: "unused variable",
      rule: "no-unused-vars",
    };

    const snapshot = { items: [error1Moved], type: "items" as const };
    const baseline = { items: [error1], type: "items" as const };

    const result = compareSnapshots(snapshot, baseline);

    expect(result.hasRegression).toBe(false);
    expect(result.hasImprovement).toBe(false);
    expect(result.hasRelocation).toBe(true);
  });

  it("should detect position changes alongside regressions", () => {
    const error1AtLine10 = {
      column: 5,
      file: "src/a.ts",
      id: "5p6o7i8u9y0t",
      line: 10,
      message: "unused variable",
      rule: "no-unused-vars",
    };
    const error1AtLine20 = {
      column: 5,
      file: "src/a.ts",
      id: "5p6o7i8u9y0t",
      line: 20,
      message: "unused variable",
      rule: "no-unused-vars",
    };
    const error2 = {
      column: 1,
      file: "src/b.ts",
      id: "2s3d4f5g6h7j",
      line: 15,
      message: "new error",
      rule: "no-undef",
    };

    const snapshot = {
      items: [error1AtLine20, error2],
      type: "items" as const,
    };
    const baseline = { items: [error1AtLine10], type: "items" as const };

    const result = compareSnapshots(snapshot, baseline);

    expect(result.hasRegression).toBe(true);
    expect(result.hasImprovement).toBe(false);
    expect(result.hasRelocation).toBe(true);
    expect(result.newIssues).toStrictEqual([error2]);
  });

  it("should detect position changes alongside improvements", () => {
    const error1AtLine10 = {
      column: 5,
      file: "src/a.ts",
      id: "8k9l0z1x2c3v",
      line: 10,
      message: "unused variable",
      rule: "no-unused-vars",
    };
    const error1AtLine20 = {
      column: 5,
      file: "src/a.ts",
      id: "8k9l0z1x2c3v",
      line: 20,
      message: "unused variable",
      rule: "no-unused-vars",
    };
    const error2 = {
      column: 1,
      file: "src/b.ts",
      id: "4b5n6m7q8w9e",
      line: 15,
      message: "removed error",
      rule: "no-undef",
    };

    const snapshot = { items: [error1AtLine20], type: "items" as const };
    const baseline = {
      items: [error1AtLine10, error2],
      type: "items" as const,
    };

    const result = compareSnapshots(snapshot, baseline);

    expect(result.hasRegression).toBe(false);
    expect(result.hasImprovement).toBe(true);
    expect(result.hasRelocation).toBe(true);
    expect(result.removedIssues).toStrictEqual([error2]);
  });

  it("should not detect position changes for new items", () => {
    const error1 = {
      column: 5,
      file: "src/a.ts",
      id: "1a2s3d4f5g6h",
      line: 10,
      message: "existing error",
      rule: "no-unused-vars",
    };
    const error2 = {
      column: 1,
      file: "src/b.ts",
      id: "7j8k9l0p1o2i",
      line: 20,
      message: "new error",
      rule: "no-undef",
    };

    const snapshot = { items: [error1, error2], type: "items" as const };
    const baseline = { items: [error1], type: "items" as const };

    const result = compareSnapshots(snapshot, baseline);

    expect(result.hasRegression).toBe(true);
    expect(result.hasRelocation).toBe(false);
  });
});

describe("compareBaselines", () => {
  it("should return false when existingEntry is undefined", () => {
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

    expect(compareBaselines(entry, undefined)).toBe(false);
  });

  it("should return true for identical entries", () => {
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

    const entry = { items: [item1, item2], type: "items" as const };
    const existing = { items: [item1, item2], type: "items" as const };

    expect(compareBaselines(entry, existing)).toBe(true);
  });

  it("should return true when items are in different order", () => {
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

    const entry = { items: [item1, item2], type: "items" as const };
    const existing = { items: [item2, item1], type: "items" as const };

    expect(compareBaselines(entry, existing)).toBe(true);
  });

  it("should return false when items differ", () => {
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

    const entry = { items: [item1, item2], type: "items" as const };
    const existing = { items: [item1, item3], type: "items" as const };

    expect(compareBaselines(entry, existing)).toBe(false);
  });

  it("should return false when item counts differ", () => {
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

    const entry = { items: [item1, item2], type: "items" as const };
    const existing = { items: [item1], type: "items" as const };

    expect(compareBaselines(entry, existing)).toBe(false);
  });

  it("should return true for empty items arrays", () => {
    const entry = { items: [], type: "items" as const };
    const existing = { items: [], type: "items" as const };

    expect(compareBaselines(entry, existing)).toBe(true);
  });

  it("should handle duplicate items correctly", () => {
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

    const entry = { items: [item1, item1, item2], type: "items" as const };
    const existing = { items: [item1, item2], type: "items" as const };

    expect(compareBaselines(entry, existing)).toBe(false);
  });

  it("should return false when duplicate counts differ", () => {
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

    const entry = { items: [item1, item1], type: "items" as const };
    const existing = { items: [item1, item2], type: "items" as const };

    expect(compareBaselines(entry, existing)).toBe(false);
  });

  it("should return false when new entry items are missing", () => {
    const entry = {
      items: [],
      type: "items" as const,
    };
    const existing = {
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
    };

    expect(compareBaselines(entry, existing)).toBe(false);
  });

  it("should return false when existing entry items are missing", () => {
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
    const existing = {
      items: [],
      type: "items" as const,
    };

    expect(compareBaselines(entry, existing)).toBe(false);
  });

  it("should return false when duplicate distributions differ", () => {
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

    const entry = { items: [item1, item1, item2], type: "items" as const };
    const existing = { items: [item1, item2, item2], type: "items" as const };

    expect(compareBaselines(entry, existing)).toBe(false);
  });
});
