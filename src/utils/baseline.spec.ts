import { areEntriesEqual } from "./baseline";

describe("areEntriesEqual()", () => {
  it("should return false when existingEntry is undefined", () => {
    const entry = { items: ["error1"], type: "items" as const };

    expect(areEntriesEqual(entry, undefined)).toBe(false);
  });

  it("should return true for identical entries", () => {
    const entry = { items: ["error1", "error2"], type: "items" as const };
    const existing = {
      items: ["error1", "error2"],
      type: "items" as const,
    };

    expect(areEntriesEqual(entry, existing)).toBe(true);
  });

  it("should return true when items are in different order", () => {
    const entry = { items: ["error1", "error2"], type: "items" as const };
    const existing = {
      items: ["error2", "error1"],
      type: "items" as const,
    };

    expect(areEntriesEqual(entry, existing)).toBe(true);
  });

  it("should return false when items differ", () => {
    const entry = { items: ["error1", "error2"], type: "items" as const };
    const existing = {
      items: ["error1", "error3"],
      type: "items" as const,
    };

    expect(areEntriesEqual(entry, existing)).toBe(false);
  });

  it("should return false when item counts differ", () => {
    const entry = { items: ["error1", "error2"], type: "items" as const };
    const existing = { items: ["error1"], type: "items" as const };

    expect(areEntriesEqual(entry, existing)).toBe(false);
  });

  it("should return true for empty items arrays", () => {
    const entry = { items: [], type: "items" as const };
    const existing = { items: [], type: "items" as const };

    expect(areEntriesEqual(entry, existing)).toBe(true);
  });

  it("should handle duplicate items correctly", () => {
    const entry = {
      items: ["error1", "error1", "error2"],
      type: "items" as const,
    };
    const existing = {
      items: ["error1", "error2"],
      type: "items" as const,
    };

    expect(areEntriesEqual(entry, existing)).toBe(false);
  });

  it("should return false when duplicate counts differ", () => {
    const entry = {
      items: ["error1", "error1"],
      type: "items" as const,
    };
    const existing = {
      items: ["error1", "error2"],
      type: "items" as const,
    };

    expect(areEntriesEqual(entry, existing)).toBe(false);
  });

  it("should return false when new entry items are missing", () => {
    const entry = {
      type: "items" as const,
    };
    const existing = {
      items: ["error1", "error2"],
      type: "items" as const,
    };

    expect(areEntriesEqual(entry, existing)).toBe(false);
  });

  it("should return false when existing entry items are missing", () => {
    const entry = {
      items: ["error1", "error2"],
      type: "items" as const,
    };
    const existing = {
      type: "items" as const,
    };

    expect(areEntriesEqual(entry, existing)).toBe(false);
  });
});
