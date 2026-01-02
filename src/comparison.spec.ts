import { compareSnapshots } from "./comparison";

describe("compareSnapshots", () => {
  it("should return initial state when baseline is undefined", () => {
    const snapshot = {
      items: [
        {
          code: "no-unused-vars",
          column: 1,
          file: "src/a.ts",
          id: "src/a.ts-10-no-unused-vars",
          line: 10,
          message: "error1",
        },
        {
          code: "no-undef",
          column: 1,
          file: "src/b.ts",
          id: "src/b.ts-20-no-undef",
          line: 20,
          message: "error2",
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
      newItems: [],
      removedItems: [],
    });
  });

  it("should detect new items as regressions", () => {
    const error1 = {
      code: "no-unused-vars",
      column: 1,
      file: "src/a.ts",
      id: "src/a.ts-10-no-unused-vars",
      line: 10,
      message: "error1",
    };
    const error2 = {
      code: "no-undef",
      column: 1,
      file: "src/b.ts",
      id: "src/b.ts-20-no-undef",
      line: 20,
      message: "error2",
    };
    const error3 = {
      code: "semi",
      column: 1,
      file: "src/c.ts",
      id: "src/c.ts-30-semi",
      line: 30,
      message: "error3",
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
    expect(result.newItems).toStrictEqual([error3]);
    expect(result.hasImprovement).toBe(false);
    expect(result.removedItems).toStrictEqual([]);
    expect(result.hasRelocation).toBe(false);
  });

  it("should detect removed items as improvements", () => {
    const error1 = {
      code: "no-unused-vars",
      column: 1,
      file: "src/a.ts",
      id: "src/a.ts-10-no-unused-vars",
      line: 10,
      message: "error1",
    };
    const error2 = {
      code: "no-undef",
      column: 1,
      file: "src/b.ts",
      id: "src/b.ts-20-no-undef",
      line: 20,
      message: "error2",
    };
    const error3 = {
      code: "semi",
      column: 1,
      file: "src/c.ts",
      id: "src/c.ts-30-semi",
      line: 30,
      message: "error3",
    };

    const snapshot = { items: [error1], type: "items" as const };
    const baseline = {
      items: [error1, error2, error3],
      type: "items" as const,
    };

    const result = compareSnapshots(snapshot, baseline);

    expect(result.hasImprovement).toBe(true);
    expect(result.removedItems).toStrictEqual([error2, error3]);
    expect(result.hasRegression).toBe(false);
    expect(result.newItems).toStrictEqual([]);
    expect(result.hasRelocation).toBe(false);
  });

  it("should detect both regressions and improvements", () => {
    const error1 = {
      code: "no-unused-vars",
      column: 1,
      file: "src/a.ts",
      id: "src/a.ts-10-no-unused-vars",
      line: 10,
      message: "error1",
    };
    const error2 = {
      code: "no-undef",
      column: 1,
      file: "src/b.ts",
      id: "src/b.ts-20-no-undef",
      line: 20,
      message: "error2",
    };
    const error3 = {
      code: "semi",
      column: 1,
      file: "src/c.ts",
      id: "src/c.ts-30-semi",
      line: 30,
      message: "error3",
    };

    const snapshot = { items: [error1, error3], type: "items" as const };
    const baseline = {
      items: [error1, error2],
      type: "items" as const,
    };

    const result = compareSnapshots(snapshot, baseline);

    expect(result.hasRegression).toBe(true);
    expect(result.hasImprovement).toBe(true);
    expect(result.newItems).toStrictEqual([error3]);
    expect(result.removedItems).toStrictEqual([error2]);
    expect(result.hasRelocation).toBe(false);
  });

  it("should return no changes when items are identical", () => {
    const error1 = {
      code: "no-unused-vars",
      column: 1,
      file: "src/a.ts",
      id: "src/a.ts-10-no-unused-vars",
      line: 10,
      message: "error1",
    };
    const error2 = {
      code: "no-undef",
      column: 1,
      file: "src/b.ts",
      id: "src/b.ts-20-no-undef",
      line: 20,
      message: "error2",
    };

    const snapshot = { items: [error1, error2], type: "items" as const };
    const baseline = {
      items: [error1, error2],
      type: "items" as const,
    };

    const result = compareSnapshots(snapshot, baseline);

    expect(result.hasRegression).toBe(false);
    expect(result.hasImprovement).toBe(false);
    expect(result.newItems).toStrictEqual([]);
    expect(result.removedItems).toStrictEqual([]);
    expect(result.hasRelocation).toBe(false);
  });

  it("should sort items by ID", () => {
    const itemC = {
      code: "error-c",
      column: 1,
      file: "src/c.ts",
      id: "src/c.ts-10-error-c",
      line: 10,
      message: "c",
    };
    const itemA = {
      code: "error-a",
      column: 1,
      file: "src/a.ts",
      id: "src/a.ts-10-error-a",
      line: 10,
      message: "a",
    };
    const itemD = {
      code: "error-d",
      column: 1,
      file: "src/d.ts",
      id: "src/d.ts-10-error-d",
      line: 10,
      message: "d",
    };
    const itemB = {
      code: "error-b",
      column: 1,
      file: "src/b.ts",
      id: "src/b.ts-10-error-b",
      line: 10,
      message: "b",
    };

    const snapshot = { items: [itemC, itemA], type: "items" as const };
    const baseline = { items: [itemD, itemB], type: "items" as const };

    const result = compareSnapshots(snapshot, baseline);

    expect(result.newItems).toStrictEqual([itemA, itemC]);
    expect(result.removedItems).toStrictEqual([itemB, itemD]);
  });

  it("should handle empty snapshots", () => {
    const error1 = {
      code: "no-unused-vars",
      column: 1,
      file: "src/a.ts",
      id: "src/a.ts-10-no-unused-vars",
      line: 10,
      message: "error1",
    };

    const snapshot = { items: [], type: "items" as const };
    const baseline = { items: [error1], type: "items" as const };

    const result = compareSnapshots(snapshot, baseline);

    expect(result.hasImprovement).toBe(true);
    expect(result.removedItems).toStrictEqual([error1]);
  });

  it("should handle empty baseline", () => {
    const error1 = {
      code: "no-unused-vars",
      column: 1,
      file: "src/a.ts",
      id: "src/a.ts-10-no-unused-vars",
      line: 10,
      message: "error1",
    };

    const snapshot = { items: [error1], type: "items" as const };
    const baseline = { items: [], type: "items" as const };

    const result = compareSnapshots(snapshot, baseline);

    expect(result.hasRegression).toBe(true);
    expect(result.newItems).toStrictEqual([error1]);
  });

  it("should match items by ID, not by line number", () => {
    const error1AtLine50 = {
      code: "no-unused-vars",
      column: 1,
      file: "src/a.ts",
      id: "hash-of-canonical-form",
      line: 50,
      message: "'foo' is declared but never used",
    };
    const error1AtLine60 = {
      code: "no-unused-vars",
      column: 1,
      file: "src/a.ts",
      id: "hash-of-canonical-form",
      line: 60,
      message: "'foo' is declared but never used",
    };

    const snapshot = { items: [error1AtLine60], type: "items" as const };
    const baseline = { items: [error1AtLine50], type: "items" as const };

    const result = compareSnapshots(snapshot, baseline);

    expect(result.hasRegression).toBe(false);
    expect(result.hasImprovement).toBe(false);
    expect(result.newItems).toStrictEqual([]);
    expect(result.removedItems).toStrictEqual([]);
    expect(result.hasRelocation).toBe(true);
  });

  it("should detect position changes when line changes", () => {
    const error1AtLine10 = {
      code: "no-unused-vars",
      column: 5,
      file: "src/a.ts",
      id: "error-id",
      line: 10,
      message: "unused variable",
    };
    const error1AtLine20 = {
      code: "no-unused-vars",
      column: 5,
      file: "src/a.ts",
      id: "error-id",
      line: 20,
      message: "unused variable",
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
      code: "no-unused-vars",
      column: 5,
      file: "src/a.ts",
      id: "error-id",
      line: 10,
      message: "unused variable",
    };
    const error1AtCol10 = {
      code: "no-unused-vars",
      column: 10,
      file: "src/a.ts",
      id: "error-id",
      line: 10,
      message: "unused variable",
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
      code: "no-unused-vars",
      column: 5,
      file: "src/a.ts",
      id: "error-id",
      line: 10,
      message: "unused variable",
    };
    const error1Moved = {
      code: "no-unused-vars",
      column: 15,
      file: "src/a.ts",
      id: "error-id",
      line: 20,
      message: "unused variable",
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
      code: "no-unused-vars",
      column: 5,
      file: "src/a.ts",
      id: "error1-id",
      line: 10,
      message: "unused variable",
    };
    const error1AtLine20 = {
      code: "no-unused-vars",
      column: 5,
      file: "src/a.ts",
      id: "error1-id",
      line: 20,
      message: "unused variable",
    };
    const error2 = {
      code: "no-undef",
      column: 1,
      file: "src/b.ts",
      id: "error2-id",
      line: 15,
      message: "new error",
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
    expect(result.newItems).toStrictEqual([error2]);
  });

  it("should detect position changes alongside improvements", () => {
    const error1AtLine10 = {
      code: "no-unused-vars",
      column: 5,
      file: "src/a.ts",
      id: "error1-id",
      line: 10,
      message: "unused variable",
    };
    const error1AtLine20 = {
      code: "no-unused-vars",
      column: 5,
      file: "src/a.ts",
      id: "error1-id",
      line: 20,
      message: "unused variable",
    };
    const error2 = {
      code: "no-undef",
      column: 1,
      file: "src/b.ts",
      id: "error2-id",
      line: 15,
      message: "removed error",
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
    expect(result.removedItems).toStrictEqual([error2]);
  });

  it("should not detect position changes for new items", () => {
    const error1 = {
      code: "no-unused-vars",
      column: 5,
      file: "src/a.ts",
      id: "error1-id",
      line: 10,
      message: "existing error",
    };
    const error2 = {
      code: "no-undef",
      column: 1,
      file: "src/b.ts",
      id: "error2-id",
      line: 20,
      message: "new error",
    };

    const snapshot = { items: [error1, error2], type: "items" as const };
    const baseline = { items: [error1], type: "items" as const };

    const result = compareSnapshots(snapshot, baseline);

    expect(result.hasRegression).toBe(true);
    expect(result.hasRelocation).toBe(false);
  });
});
