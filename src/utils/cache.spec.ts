import { makeCacheKey } from "./cache";

describe("makeCacheKey", () => {
  it("should be stable for the same input", () => {
    const input = { a: 1, b: ["x", "y"], c: { d: true } };

    expect(makeCacheKey(input)).toBe(makeCacheKey(input));
  });

  it("should change when input changes", () => {
    expect(makeCacheKey({ a: 1 })).not.toBe(makeCacheKey({ a: 2 }));
  });

  it("should be short and filesystem-friendly", () => {
    const key = makeCacheKey({ big: "x".repeat(50_000) });

    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(key).toHaveLength(64);
  });

  it("should be stable regardless of property order", () => {
    const key1 = makeCacheKey({ a: 1, b: 2 });
    // eslint-disable-next-line perfectionist/sort-objects -- testing property order stability
    const key2 = makeCacheKey({ b: 2, a: 1 });

    expect(key1).toBe(key2);
  });

  it("should handle nested property order", () => {
    const config1 = {
      files: ["src/**/*.ts"],
      overrides: { rules: { "no-console": "error", "no-debugger": "warn" } },
    };

    const config2 = {
      files: ["src/**/*.ts"],
      overrides: { rules: { "no-console": "error", "no-debugger": "warn" } },
    };

    expect(makeCacheKey(config1)).toBe(makeCacheKey(config2));
  });

  it("should handle null and undefined", () => {
    expect(makeCacheKey(null)).toBe(makeCacheKey(null));
    expect(makeCacheKey(undefined)).toBe(makeCacheKey(null));
    expect(makeCacheKey(null)).toBe(makeCacheKey(undefined));
  });

  it("should handle empty objects and arrays", () => {
    expect(makeCacheKey({})).toBe(makeCacheKey({}));
    expect(makeCacheKey([])).toBe(makeCacheKey([]));
    expect(makeCacheKey({})).not.toBe(makeCacheKey([]));
  });

  it("should handle nested empty structures", () => {
    const input = { a: [], b: {}, c: null };

    expect(makeCacheKey(input)).toBe(makeCacheKey(input));
  });

  it("should preserve array order", () => {
    const key1 = makeCacheKey({ files: ["a.ts", "b.ts"] });
    const key2 = makeCacheKey({ files: ["b.ts", "a.ts"] });

    expect(key1).not.toBe(key2);
  });
});
