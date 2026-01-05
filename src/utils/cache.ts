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
 * Get the cache directory path for a given check type.
 *
 * Note: The directory must already exist. The runner's setup()
 * method ensures all cache directories are created before checks run.
 */
export function getCacheDir(checkType: string, cwd: string = process.cwd()) {
  return resolve(cwd, "node_modules", ".cache", "mejora", checkType);
}
