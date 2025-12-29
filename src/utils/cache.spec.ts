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
});
