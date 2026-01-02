import { mkdir } from "node:fs/promises";

import { resolve } from "pathe";

import { hash } from "./hash";

const stableReplacer = (_key: string, value: unknown) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};

    for (const key of Object.keys(obj).toSorted()) {
      sorted[key] = obj[key];
    }

    return sorted;
  }

  return value;
};

/**
 * Generates a stable hash key for caching purposes
 *
 * @param input The input to hash
 *
 * @returns A stable hash key for the given input
 */
export function createCacheKey(input: unknown): string {
  const json = JSON.stringify(input ?? null, stableReplacer);

  return hash(json);
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
