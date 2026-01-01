import { areEntriesEqual } from "./baseline";

describe("areEntriesEqual()", () => {
  it("should return false when existingEntry is undefined", () => {
    const entry = {
      items: [
        {
          code: "no-unused-vars",
          column: 1,
          file: "src/a.ts",
          id: "src/a.ts-10-no-unused-vars",
          line: 10,
          message: "error1",
        },
      ],
      type: "items" as const,
    };

    expect(areEntriesEqual(entry, undefined)).toBe(false);
  });

  it("should return true for identical entries", () => {
    const item1 = {
      code: "no-unused-vars",
      column: 1,
      file: "src/a.ts",
      id: "src/a.ts-10-no-unused-vars",
      line: 10,
      message: "error1",
    };
    const item2 = {
      code: "no-undef",
      column: 1,
      file: "src/b.ts",
      id: "src/b.ts-20-no-undef",
      line: 20,
      message: "error2",
    };

    const entry = { items: [item1, item2], type: "items" as const };
    const existing = { items: [item1, item2], type: "items" as const };

    expect(areEntriesEqual(entry, existing)).toBe(true);
  });

  it("should return true when items are in different order", () => {
    const item1 = {
      code: "no-unused-vars",
      column: 1,
      file: "src/a.ts",
      id: "src/a.ts-10-no-unused-vars",
      line: 10,
      message: "error1",
    };
    const item2 = {
      code: "no-undef",
      column: 1,
      file: "src/b.ts",
      id: "src/b.ts-20-no-undef",
      line: 20,
      message: "error2",
    };

    const entry = { items: [item1, item2], type: "items" as const };
    const existing = { items: [item2, item1], type: "items" as const };

    expect(areEntriesEqual(entry, existing)).toBe(true);
  });

  it("should return false when items differ", () => {
    const item1 = {
      code: "no-unused-vars",
      column: 1,
      file: "src/a.ts",
      id: "src/a.ts-10-no-unused-vars",
      line: 10,
      message: "error1",
    };
    const item2 = {
      code: "no-undef",
      column: 1,
      file: "src/b.ts",
      id: "src/b.ts-20-no-undef",
      line: 20,
      message: "error2",
    };
    const item3 = {
      code: "semi",
      column: 1,
      file: "src/c.ts",
      id: "src/c.ts-30-semi",
      line: 30,
      message: "error3",
    };

    const entry = { items: [item1, item2], type: "items" as const };
    const existing = { items: [item1, item3], type: "items" as const };

    expect(areEntriesEqual(entry, existing)).toBe(false);
  });

  it("should return false when item counts differ", () => {
    const item1 = {
      code: "no-unused-vars",
      column: 1,
      file: "src/a.ts",
      id: "src/a.ts-10-no-unused-vars",
      line: 10,
      message: "error1",
    };
    const item2 = {
      code: "no-undef",
      column: 1,
      file: "src/b.ts",
      id: "src/b.ts-20-no-undef",
      line: 20,
      message: "error2",
    };

    const entry = { items: [item1, item2], type: "items" as const };
    const existing = { items: [item1], type: "items" as const };

    expect(areEntriesEqual(entry, existing)).toBe(false);
  });

  it("should return true for empty items arrays", () => {
    const entry = { items: [], type: "items" as const };
    const existing = { items: [], type: "items" as const };

    expect(areEntriesEqual(entry, existing)).toBe(true);
  });

  it("should handle duplicate items correctly", () => {
    const item1 = {
      code: "no-unused-vars",
      column: 1,
      file: "src/a.ts",
      id: "src/a.ts-10-no-unused-vars",
      line: 10,
      message: "error1",
    };
    const item2 = {
      code: "no-undef",
      column: 1,
      file: "src/b.ts",
      id: "src/b.ts-20-no-undef",
      line: 20,
      message: "error2",
    };

    const entry = { items: [item1, item1, item2], type: "items" as const };
    const existing = { items: [item1, item2], type: "items" as const };

    expect(areEntriesEqual(entry, existing)).toBe(false);
  });

  it("should return false when duplicate counts differ", () => {
    const item1 = {
      code: "no-unused-vars",
      column: 1,
      file: "src/a.ts",
      id: "src/a.ts-10-no-unused-vars",
      line: 10,
      message: "error1",
    };
    const item2 = {
      code: "no-undef",
      column: 1,
      file: "src/b.ts",
      id: "src/b.ts-20-no-undef",
      line: 20,
      message: "error2",
    };

    const entry = { items: [item1, item1], type: "items" as const };
    const existing = { items: [item1, item2], type: "items" as const };

    expect(areEntriesEqual(entry, existing)).toBe(false);
  });

  it("should return false when new entry items are missing", () => {
    const entry = {
      type: "items" as const,
    };
    const existing = {
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

    expect(areEntriesEqual(entry, existing)).toBe(false);
  });

  it("should return false when existing entry items are missing", () => {
    const entry = {
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
    const existing = {
      type: "items" as const,
    };

    expect(areEntriesEqual(entry, existing)).toBe(false);
  });

  it("should return false when duplicate distributions differ", () => {
    const item1 = {
      code: "no-unused-vars",
      column: 1,
      file: "src/a.ts",
      id: "src/a.ts-10-no-unused-vars",
      line: 10,
      message: "error1",
    };
    const item2 = {
      code: "no-undef",
      column: 1,
      file: "src/b.ts",
      id: "src/b.ts-20-no-undef",
      line: 20,
      message: "error2",
    };

    const entry = { items: [item1, item1, item2], type: "items" as const };
    const existing = { items: [item1, item2, item2], type: "items" as const };

    expect(areEntriesEqual(entry, existing)).toBe(false);
  });
});
