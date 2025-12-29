import { createHash } from "node:crypto";

export function makeCacheKey(input: unknown) {
  const json = JSON.stringify(input ?? null);

  return createHash("sha256").update(json).digest("hex");
}
