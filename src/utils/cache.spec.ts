import { resolve } from "pathe";

import { createCacheKey, getCacheDir } from "./cache";

vi.mock("pathe");

describe("createCacheKey", () => {
  it("should be stable for the same input", () => {
    const input = { a: 1, b: ["x", "y"], c: { d: true } };

    expect(createCacheKey(input)).toBe(createCacheKey(input));
  });

  it("should change when input changes", () => {
    expect(createCacheKey({ a: 1 })).not.toBe(createCacheKey({ a: 2 }));
  });

  it("should be short and filesystem-friendly", () => {
    const key = createCacheKey({ big: "x".repeat(50_000) });

    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(key).toHaveLength(64);
  });

  it("should be stable regardless of property order", () => {
    const key1 = createCacheKey({ a: 1, b: 2 });
    // eslint-disable-next-line perfectionist/sort-objects -- testing property order stability
    const key2 = createCacheKey({ b: 2, a: 1 });

    expect(key1).toBe(key2);
  });

  it("should handle nested property order", () => {
    const config1 = {
      files: ["src/**/*.ts"],
      // eslint-disable-next-line perfectionist/sort-objects -- testing property order stability
      rules: { "no-debugger": "warn", "no-console": "error" },
    };

    const config2 = {
      files: ["src/**/*.ts"],
      rules: { "no-console": "error", "no-debugger": "warn" },
    };

    expect(createCacheKey(config1)).toBe(createCacheKey(config2));
  });

  it("should handle null and undefined", () => {
    expect(createCacheKey(null)).toBe(createCacheKey(null));
    expect(createCacheKey(undefined)).toBe(createCacheKey(null));
    expect(createCacheKey(null)).toBe(createCacheKey(undefined));
  });

  it("should handle empty objects and arrays", () => {
    expect(createCacheKey({})).toBe(createCacheKey({}));
    expect(createCacheKey([])).toBe(createCacheKey([]));
    expect(createCacheKey({})).not.toBe(createCacheKey([]));
  });

  it("should handle nested empty structures", () => {
    const input = { a: [], b: {}, c: null };

    expect(createCacheKey(input)).toBe(createCacheKey(input));
  });

  it("should preserve array order", () => {
    const key1 = createCacheKey({ files: ["a.ts", "b.ts"] });
    const key2 = createCacheKey({ files: ["b.ts", "a.ts"] });

    expect(key1).not.toBe(key2);
  });

  it("should handle circular references without throwing", () => {
    const plugin: Record<string, unknown> = {
      meta: { name: "test-plugin" },
      rules: { "test-rule": { meta: {} } },
    };

    const configs = {
      recommended: { plugins: { test: plugin } },
    };

    plugin.configs = configs;

    expect(() => createCacheKey(plugin)).not.toThrowError();

    const key1 = createCacheKey(plugin);
    const key2 = createCacheKey(plugin);

    expect(key1).toBe(key2);
  });
});

describe("getCacheDir", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return cache directory path for check type", () => {
    vi.mocked(resolve).mockReturnValue(
      "/project/node_modules/.cache/mejora/typescript",
    );

    const result = getCacheDir("typescript", "/project");

    expect(resolve).toHaveBeenCalledWith(
      "/project",
      "node_modules",
      ".cache",
      "mejora",
      "typescript",
    );
    expect(result).toBe("/project/node_modules/.cache/mejora/typescript");
  });

  it("should use process.cwd() when no cwd provided", () => {
    vi.spyOn(process, "cwd").mockReturnValue("/default/path");
    vi.mocked(resolve).mockReturnValue(
      "/default/path/node_modules/.cache/mejora/eslint",
    );

    const result = getCacheDir("eslint");

    expect(resolve).toHaveBeenCalledWith(
      "/default/path",
      "node_modules",
      ".cache",
      "mejora",
      "eslint",
    );
    expect(result).toBe("/default/path/node_modules/.cache/mejora/eslint");
  });

  it("should handle different check types", () => {
    vi.mocked(resolve).mockImplementation((...args) => args.join("/"));

    const eslintDir = getCacheDir("eslint", "/project");
    const tsDir = getCacheDir("typescript", "/project");

    expect(eslintDir).toBe("/project/node_modules/.cache/mejora/eslint");
    expect(tsDir).toBe("/project/node_modules/.cache/mejora/typescript");
  });

  it("should not create directories (assumes they exist)", () => {
    vi.mocked(resolve).mockReturnValue(
      "/project/node_modules/.cache/mejora/eslint",
    );

    getCacheDir("eslint", "/project");

    expect(vi.mocked(resolve)).toHaveBeenCalledWith(
      "/project",
      "node_modules",
      ".cache",
      "mejora",
      "eslint",
    );
  });
});
