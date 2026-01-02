import { hash } from "@/utils/hash";

import { assignStableIds, sortByLocation } from "./utils";

describe("assignStableIds", () => {
  it("should assign ids based on relative position within a signature group", () => {
    const signature = "file - rule: - message" as const;

    const items = [
      {
        column: 1,
        file: "a.ts",
        line: 2,
        message: "msg",
        rule: "X",
        signature,
      },
      {
        column: 1,
        file: "a.ts",
        line: 10,
        message: "msg",
        rule: "X",
        signature,
      },
    ];

    const result = assignStableIds(items);

    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe(hash(`${signature}:0`));
    expect(result[1]?.id).toBe(hash(`${signature}:1`));
  });

  it("should preserve duplicate diagnostics with identical signatures", () => {
    const signature = "file - rule: - message" as const;

    const items = [
      {
        column: 1,
        file: "a.ts",
        line: 1,
        message: "same",
        rule: "X",
        signature,
      },
      {
        column: 1,
        file: "a.ts",
        line: 5,
        message: "same",
        rule: "X",
        signature,
      },
    ];

    const result = assignStableIds(items);

    expect(result).toHaveLength(2);
    expect(new Set(result.map((item) => item.id)).size).toBe(2);
  });

  it("should assign ids independently per signature group", () => {
    const items = [
      {
        column: 1,
        file: "a.ts",
        line: 1,
        message: "a",
        rule: "A",
        signature: "a.ts - A: - a" as const,
      },
      {
        column: 1,
        file: "b.ts",
        line: 1,
        message: "b",
        rule: "B",
        signature: "b.ts - B: - b" as const,
      },
    ];

    const result = assignStableIds(items);

    expect(result.map((item) => item.id)).toStrictEqual([
      hash("a.ts - A: - a:0"),
      hash("b.ts - B: - b:0"),
    ]);
  });

  it("should assign ids based on sorted location rather than input order", () => {
    const signature = "file - rule: - message" as const;

    const items = [
      {
        column: 1,
        file: "a.ts",
        line: 10,
        message: "msg",
        rule: "X",
        signature,
      },
      {
        column: 1,
        file: "a.ts",
        line: 1,
        message: "msg",
        rule: "X",
        signature,
      },
    ];

    const result = assignStableIds(items);

    expect(result[0]?.line).toBe(1);
    expect(result[0]?.id).toBe(hash(`${signature}:0`));

    expect(result[1]?.line).toBe(10);
    expect(result[1]?.id).toBe(hash(`${signature}:1`));
  });

  it("should return DiagnosticItem objects", () => {
    const signature = "file - rule: - message" as const;

    const items = [
      {
        column: 1,
        file: "a.ts",
        line: 1,
        message: "msg",
        rule: "X",
        signature,
      },
    ];

    const result = assignStableIds(items);

    const item = result[0];

    expect(item?.id).toBeDefined();
    expect(item?.file).toBe("a.ts");
  });
});

describe("sortByLocation", () => {
  it("should sort by file name first", () => {
    const items = [
      { column: 1, file: "b.ts", line: 1 },
      { column: 100, file: "a.ts", line: 100 },
    ];

    const result = items.toSorted(sortByLocation);

    expect(result[0]?.file).toBe("a.ts");
    expect(result[1]?.file).toBe("b.ts");
  });

  it("should sort by line number when file is the same", () => {
    const items = [
      { column: 1, file: "a.ts", line: 10 },
      { column: 100, file: "a.ts", line: 2 },
    ];

    const result = items.toSorted(sortByLocation);

    expect(result[0]?.line).toBe(2);
    expect(result[1]?.line).toBe(10);
  });

  it("should sort by column when file and line are the same", () => {
    const items = [
      { column: 20, file: "a.ts", line: 1 },
      { column: 3, file: "a.ts", line: 1 },
    ];

    const result = items.toSorted(sortByLocation);

    expect(result[0]?.column).toBe(3);
    expect(result[1]?.column).toBe(20);
  });

  it("should preserve order when file, line, and column are equal", () => {
    const a = { column: 1, file: "a.ts", line: 1 };
    const b = { column: 1, file: "a.ts", line: 1 };

    const result = [b, a].toSorted(sortByLocation);

    expect(result).toStrictEqual([b, a]);
  });
});
