import { compareSnapshots } from "./comparison";

describe("compareSnapshots", () => {
  it("should return initial state when baseline is undefined", () => {
    const snapshot = { items: ["error1", "error2"], type: "items" as const };

    const result = compareSnapshots(snapshot, undefined);

    expect(result).toStrictEqual({
      hasImprovement: false,
      hasRegression: false,
      isInitial: true,
      newItems: [],
      removedItems: [],
    });
  });

  it("should detect new items as regressions", () => {
    const snapshot = {
      items: ["error1", "error2", "error3"],
      type: "items" as const,
    };
    const baseline = {
      items: ["error1", "error2"],
      type: "items" as const,
    };

    const result = compareSnapshots(snapshot, baseline);

    expect(result.hasRegression).toBe(true);
    expect(result.newItems).toStrictEqual(["error3"]);
    expect(result.hasImprovement).toBe(false);
    expect(result.removedItems).toStrictEqual([]);
  });

  it("should detect removed items as improvements", () => {
    const snapshot = { items: ["error1"], type: "items" as const };
    const baseline = {
      items: ["error1", "error2", "error3"],
      type: "items" as const,
    };

    const result = compareSnapshots(snapshot, baseline);

    expect(result.hasImprovement).toBe(true);
    expect(result.removedItems).toStrictEqual(["error2", "error3"]);
    expect(result.hasRegression).toBe(false);
    expect(result.newItems).toStrictEqual([]);
  });

  it("should detect both regressions and improvements", () => {
    const snapshot = { items: ["error1", "error3"], type: "items" as const };
    const baseline = {
      items: ["error1", "error2"],
      type: "items" as const,
    };

    const result = compareSnapshots(snapshot, baseline);

    expect(result.hasRegression).toBe(true);
    expect(result.hasImprovement).toBe(true);
    expect(result.newItems).toStrictEqual(["error3"]);
    expect(result.removedItems).toStrictEqual(["error2"]);
  });

  it("should return no changes when items are identical", () => {
    const snapshot = { items: ["error1", "error2"], type: "items" as const };
    const baseline = {
      items: ["error1", "error2"],
      type: "items" as const,
    };

    const result = compareSnapshots(snapshot, baseline);

    expect(result.hasRegression).toBe(false);
    expect(result.hasImprovement).toBe(false);
    expect(result.newItems).toStrictEqual([]);
    expect(result.removedItems).toStrictEqual([]);
  });

  it("should sort items alphabetically", () => {
    const snapshot = { items: ["c", "a"], type: "items" as const };
    const baseline = { items: ["d", "b"], type: "items" as const };

    const result = compareSnapshots(snapshot, baseline);

    expect(result.newItems).toStrictEqual(["a", "c"]);
    expect(result.removedItems).toStrictEqual(["b", "d"]);
  });

  it("should handle empty snapshots", () => {
    const snapshot = { items: [], type: "items" as const };
    const baseline = { items: ["error1"], type: "items" as const };

    const result = compareSnapshots(snapshot, baseline);

    expect(result.hasImprovement).toBe(true);
    expect(result.removedItems).toStrictEqual(["error1"]);
  });

  it("should handle empty baseline", () => {
    const snapshot = { items: ["error1"], type: "items" as const };
    const baseline = { items: [], type: "items" as const };

    const result = compareSnapshots(snapshot, baseline);

    expect(result.hasRegression).toBe(true);
    expect(result.newItems).toStrictEqual(["error1"]);
  });
});
