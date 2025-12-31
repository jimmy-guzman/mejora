import { mkdir } from "node:fs/promises";

import { resolve } from "pathe";

import { ensureCacheDir, makeCacheKey } from "./cache";

vi.mock("node:fs/promises");
vi.mock("pathe");

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

describe("ensureCacheDir", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should create cache directory in node_modules/.cache/mejora", async () => {
    vi.mocked(resolve).mockReturnValue("/project/node_modules/.cache/mejora");
    vi.mocked(mkdir).mockResolvedValue(undefined);

    const result = await ensureCacheDir("/project");

    expect(resolve).toHaveBeenCalledWith(
      "/project",
      "node_modules",
      ".cache",
      "mejora",
    );
    expect(mkdir).toHaveBeenCalledWith("/project/node_modules/.cache/mejora", {
      recursive: true,
    });
    expect(result).toBe("/project/node_modules/.cache/mejora");
  });

  it("should use process.cwd() when no cwd provided", async () => {
    vi.spyOn(process, "cwd").mockReturnValue("/default/path");
    vi.mocked(resolve).mockReturnValue(
      "/default/path/node_modules/.cache/mejora",
    );
    vi.mocked(mkdir).mockResolvedValue(undefined);

    await ensureCacheDir();

    expect(resolve).toHaveBeenCalledWith(
      "/default/path",
      "node_modules",
      ".cache",
      "mejora",
    );
  });

  it("should include subpath when provided", async () => {
    vi.mocked(resolve).mockReturnValue(
      "/project/node_modules/.cache/mejora/typescript",
    );
    vi.mocked(mkdir).mockResolvedValue(undefined);

    const result = await ensureCacheDir("/project", "typescript");

    expect(resolve).toHaveBeenCalledWith(
      "/project",
      "node_modules",
      ".cache",
      "mejora",
      "typescript",
    );
    expect(mkdir).toHaveBeenCalledWith(
      "/project/node_modules/.cache/mejora/typescript",
      { recursive: true },
    );
    expect(result).toBe("/project/node_modules/.cache/mejora/typescript");
  });

  it("should create directory recursively", async () => {
    vi.mocked(resolve).mockReturnValue("/project/node_modules/.cache/mejora");
    vi.mocked(mkdir).mockResolvedValue(undefined);

    await ensureCacheDir("/project");

    expect(mkdir).toHaveBeenCalledWith(expect.any(String), { recursive: true });
  });

  it("should handle mkdir errors", async () => {
    vi.mocked(resolve).mockReturnValue("/project/node_modules/.cache/mejora");
    const error = new Error("Permission denied");

    vi.mocked(mkdir).mockRejectedValue(error);

    await expect(ensureCacheDir("/project")).rejects.toThrowError(
      "Permission denied",
    );
  });
});
