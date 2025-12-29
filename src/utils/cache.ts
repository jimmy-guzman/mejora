import { createHash } from "node:crypto";

export function makeCacheKey(input: unknown) {
  const json = JSON.stringify(input);

  return createHash("sha256").update(json).digest("hex");
}
