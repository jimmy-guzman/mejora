import { normalizeSnapshot } from "./snapshot";

describe("normalizeSnapshot", () => {
  it("should add stable IDs to items", () => {
    const snapshot = {
      items: [
        {
          column: 5,
          file: "src/foo.ts",
          line: 10,
          message: "Found TODO",
          rule: "TODO",
        },
        {
          column: 3,
          file: "src/bar.ts",
          line: 20,
          message: "Found FIXME",
          rule: "FIXME",
        },
      ],
      type: "items" as const,
    };

    const result = normalizeSnapshot(snapshot);

    expect(result).toMatchObject({
      items: expect.arrayContaining([
        expect.objectContaining({
          column: 3,
          file: "src/bar.ts",
          id: expect.any(String),
          line: 20,
          message: "Found FIXME",
          rule: "FIXME",
        }),
        expect.objectContaining({
          column: 5,
          file: "src/foo.ts",
          id: expect.any(String),
          line: 10,
          message: "Found TODO",
          rule: "TODO",
        }),
      ]),
      type: "items",
    });
  });

  it("should create signatures and sort items by file, line, column", () => {
    const snapshot = {
      items: [
        {
          column: 1,
          file: "zebra.ts",
          line: 1,
          message: "error",
          rule: "rule1",
        },
        {
          column: 1,
          file: "apple.ts",
          line: 2,
          message: "error",
          rule: "rule2",
        },
        {
          column: 5,
          file: "apple.ts",
          line: 1,
          message: "error",
          rule: "rule3",
        },
        {
          column: 1,
          file: "apple.ts",
          line: 1,
          message: "error",
          rule: "rule4",
        },
      ],
      type: "items" as const,
    };

    const result = normalizeSnapshot(snapshot);

    expect(result).toMatchObject({
      items: [
        expect.objectContaining({
          column: 1,
          file: "apple.ts",
          id: expect.any(String),
          line: 1,
          message: "error",
          rule: "rule4",
        }),
        expect.objectContaining({
          column: 5,
          file: "apple.ts",
          id: expect.any(String),
          line: 1,
          message: "error",
          rule: "rule3",
        }),
        expect.objectContaining({
          column: 1,
          file: "apple.ts",
          id: expect.any(String),
          line: 2,
          message: "error",
          rule: "rule2",
        }),
        expect.objectContaining({
          column: 1,
          file: "zebra.ts",
          id: expect.any(String),
          line: 1,
          message: "error",
          rule: "rule1",
        }),
      ],
      type: "items",
    });
  });

  it("should generate stable IDs for items with same rule + message (across different files)", () => {
    const snapshot = {
      items: [
        {
          column: 5,
          file: "src/a.ts",
          line: 10,
          message: "Found TODO",
          rule: "TODO",
        },
        {
          column: 3,
          file: "src/b.ts",
          line: 20,
          message: "Found TODO",
          rule: "TODO",
        },
        {
          column: 1,
          file: "src/c.ts",
          line: 5,
          message: "Found TODO",
          rule: "TODO",
        },
      ],
      type: "items" as const,
    };

    const result1 = normalizeSnapshot(snapshot);
    const result2 = normalizeSnapshot(snapshot);

    const ids1 = result1.items.map((item) => item.id);
    const ids2 = result2.items.map((item) => item.id);

    expect(new Set(ids1).size).toBe(3);
    expect(ids1).toStrictEqual(ids2);
  });

  it("should handle empty items array", () => {
    const snapshot = {
      items: [],
      type: "items" as const,
    };

    const result = normalizeSnapshot(snapshot);

    expect(result).toStrictEqual({
      items: [],
      type: "items",
    });
  });

  it("should preserve all item properties except add ID", () => {
    const snapshot = {
      items: [
        {
          column: 10,
          file: "test.ts",
          line: 5,
          message: "Test error",
          rule: "test-rule",
        },
      ],
      type: "items" as const,
    };

    const result = normalizeSnapshot(snapshot);

    expect(result).toMatchObject({
      items: [
        expect.objectContaining({
          column: 10,
          file: "test.ts",
          id: expect.any(String),
          line: 5,
          message: "Test error",
          rule: "test-rule",
        }),
      ],
      type: "items",
    });
  });

  it("should group items by signature and assign sequential IDs", () => {
    const snapshot = {
      items: [
        {
          column: 1,
          file: "file1.ts",
          line: 1,
          message: "error A",
          rule: "rule1",
        },
        {
          column: 2,
          file: "file2.ts",
          line: 2,
          message: "error A",
          rule: "rule1",
        },
        {
          column: 3,
          file: "file3.ts",
          line: 3,
          message: "error A",
          rule: "rule1",
        },
      ],
      type: "items" as const,
    };

    const result = normalizeSnapshot(snapshot);

    const ids = result.items.map((item) => item.id);

    expect(new Set(ids).size).toBe(3);
  });

  it("should maintain stable IDs across multiple calls with same input", () => {
    const snapshot = {
      items: [
        { column: 1, file: "a.ts", line: 1, message: "error", rule: "rule1" },
        { column: 2, file: "b.ts", line: 2, message: "error", rule: "rule2" },
      ],
      type: "items" as const,
    };

    const result1 = normalizeSnapshot(snapshot);
    const result2 = normalizeSnapshot(snapshot);
    const result3 = normalizeSnapshot(snapshot);

    expect(result1.items.map((i) => i.id)).toStrictEqual(
      result2.items.map((i) => i.id),
    );
    expect(result2.items.map((i) => i.id)).toStrictEqual(
      result3.items.map((i) => i.id),
    );
  });

  it("should return snapshot with items type", () => {
    const snapshot = {
      items: [
        {
          column: 1,
          file: "test.ts",
          line: 1,
          message: "error",
          rule: "rule1",
        },
      ],
      type: "items" as const,
    };

    const result = normalizeSnapshot(snapshot);

    expect(result).toMatchObject({
      items: [expect.objectContaining({ id: expect.any(String) })],
      type: "items",
    });
  });

  it("should handle items with identical rule + message at different locations", () => {
    const snapshot = {
      items: [
        {
          column: 5,
          file: "file.ts",
          line: 10,
          message: "Same error",
          rule: "rule1",
        },
        {
          column: 10,
          file: "file.ts",
          line: 20,
          message: "Same error",
          rule: "rule1",
        },
        {
          column: 1,
          file: "file.ts",
          line: 5,
          message: "Same error",
          rule: "rule1",
        },
      ],
      type: "items" as const,
    };

    const result = normalizeSnapshot(snapshot);

    expect(result).toMatchObject({
      items: [
        expect.objectContaining({ id: expect.any(String), line: 5 }),
        expect.objectContaining({ id: expect.any(String), line: 10 }),
        expect.objectContaining({ id: expect.any(String), line: 20 }),
      ],
      type: "items",
    });

    const ids = result.items.map((item) => item.id);

    expect(new Set(ids).size).toBe(3);
  });
});
