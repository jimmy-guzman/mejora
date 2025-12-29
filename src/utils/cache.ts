import { createHash } from "node:crypto";

/**
 * Creates a stable cache key for any input by hashing a canonical JSON representation.
 * Object properties are sorted to ensure consistent keys regardless of property order.
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
