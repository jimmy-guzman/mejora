import { readFile, stat, writeFile } from "node:fs/promises";

import { resolve } from "pathe";

import { hash } from "./hash";

function createStableReplacer() {
  const seen = new WeakSet();

  return (_key: string, value: unknown) => {
    if (value && typeof value === "object") {
      if (seen.has(value)) {
        return "[Circular]";
      }

      seen.add(value);

      if (!Array.isArray(value)) {
        const obj = value as Record<string, unknown>;
        const sorted: Record<string, unknown> = {};

        for (const key of Object.keys(obj).toSorted()) {
          const val = obj[key];

          if (typeof val === "function" || typeof val === "symbol") {
            continue;
          }

          sorted[key] = val;
        }

        return sorted;
      }
    }

    return value;
  };
}

/**
 * Generates a stable hash key for caching purposes
 *
 * @param input The input to hash
 *
 * @returns A stable hash key for the given input
 */
export function createCacheKey(input: unknown): string {
  const json = JSON.stringify(input ?? null, createStableReplacer());

  return hash(json);
}

/**
 * Get the cache directory path for a given check type.
 *
 */
export function getCacheDir(checkType: string, cwd: string = process.cwd()) {
  return resolve(cwd, "node_modules", ".cache", "mejora", checkType);
}

export async function loadCache<T>(cachePath: string) {
  try {
    const content = await readFile(cachePath, "utf8");

    return JSON.parse(content) as T;
  } catch {
    return {} as T;
  }
}

export async function saveCache(cachePath: string, cache: unknown) {
  try {
    await writeFile(cachePath, JSON.stringify(cache, null, 2), "utf8");
  } catch {
    // Silently fail if we can't write cache
  }
}

export async function getFileHash(absolutePath: string) {
  try {
    const stats = await stat(absolutePath);

    return `${stats.mtimeMs}-${stats.size}`;
  } catch {
    return null;
  }
}
