import { createHash } from "node:crypto";
import { mkdir } from "node:fs/promises";

import { resolve } from "pathe";

/**
 * Creates a stable cache key for any input by hashing a canonical JSON representation.
 * Object properties are sorted to ensure consistent keys regardless of property order.
 *
 * @param input The input to create a cache key for
 *
 * @returns A SHA-256 hash string representing the cache key
 */
export function makeCacheKey(input: unknown): string {
  const json = JSON.stringify(input ?? null, (_key, value: unknown) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>;

      return Object.keys(obj)
        .toSorted()
        .reduce<Record<string, unknown>>((sorted, key) => {
          return { ...sorted, [key]: obj[key] };
        }, {});
    }

    return value;
  });

  return createHash("sha256").update(json).digest("hex");
}

/**
 * Ensures mejora's cache directory exists and returns the path
 *
 * @param cwd Current working directory
 *
 * @param subpath Optional subdirectory within the cache
 */
export async function ensureCacheDir(
  cwd: string = process.cwd(),
  subpath?: string,
) {
  const cacheDir = resolve(
    cwd,
    "node_modules",
    ".cache",
    "mejora",
    ...(subpath ? [subpath] : []),
  );

  await mkdir(cacheDir, { recursive: true });

  return cacheDir;
}
