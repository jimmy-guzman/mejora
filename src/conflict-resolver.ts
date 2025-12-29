import type { Baseline, BaselineEntry } from "./types";

import { BASELINE_VERSION } from "./constants";

function removeCloseBraces(json: string, count: number) {
  let result = json;

  for (let i = 0; i < count && result.includes("}"); i++) {
    const lastBraceIndex = result.lastIndexOf("}");

    result = result.slice(0, lastBraceIndex) + result.slice(lastBraceIndex + 1);
  }

  return result;
}

function addCloseBraces(json: string, count: number) {
  const closingBraces = "  }".repeat(count);

  return `${json}\n${closingBraces}`;
}

function balanceBraces(json: string) {
  let openCount = 0;
  let closeCount = 0;

  for (const char of json) {
    if (char === "{") openCount++;
    if (char === "}") closeCount++;
  }

  // Only fixes brace imbalance; other errors are handled by JSON.parse().
  if (openCount === closeCount) {
    return json;
  }

  const diff = Math.abs(openCount - closeCount);

  if (closeCount > openCount) {
    return removeCloseBraces(json, diff);
  }

  return addCloseBraces(json, diff);
}

function cleanJsonFragment(fragment: string) {
  const trimmed = fragment.trim();
  const withoutTrailingComma = trimmed.endsWith(",")
    ? trimmed.slice(0, -1)
    : trimmed;

  return balanceBraces(withoutTrailingComma);
}

function wrapInBaselineStructure(fragment: string) {
  return `{
  "version": ${BASELINE_VERSION},
  ${fragment}
}`;
}

function normalizeBaselineStructure(parsed: {
  checks?: Record<string, BaselineEntry>;
  version: number;
}) {
  if (parsed.checks) {
    return parsed as Baseline;
  }

  const checks: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(parsed)) {
    if (key !== "version") {
      checks[key] = value;
    }
  }

  return {
    checks: checks as Baseline["checks"],
    version: BASELINE_VERSION,
  };
}

function parseJsonFragment(fragment: string) {
  try {
    const cleaned = cleanJsonFragment(fragment);
    const wrapped = wrapInBaselineStructure(cleaned);
    const parsed = JSON.parse(wrapped) as Baseline;

    return normalizeBaselineStructure(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    throw new Error(
      `Failed to parse baseline during conflict resolution: ${message}`,
      { cause: error },
    );
  }
}

function extractConflictSections(content: string) {
  // Assumes standard Git conflict markers; nonstandard or corrupted cases are ignored.
  const regex = /<<<<<<< .*\n([\s\S]*?)\n=======\n([\s\S]*?)\n>>>>>>> .*$/gm;
  const matches = [...content.matchAll(regex)];

  if (matches.length === 0) {
    throw new Error("Could not parse conflict markers in baseline");
  }

  return matches.map(([, ours = "", theirs = ""]) => ({ ours, theirs }));
}

function collectAllCheckIds(baselines: Baseline[]) {
  const checkIds = new Set<string>();

  for (const baseline of baselines) {
    for (const checkId of Object.keys(baseline.checks)) {
      checkIds.add(checkId);
    }
  }

  return checkIds;
}

function mergeCheckItems(baselines: Baseline[], checkId: string) {
  const allItems = new Set<string>();

  for (const baseline of baselines) {
    const check = baseline.checks[checkId];

    if (check?.items) {
      for (const item of check.items) {
        allItems.add(item);
      }
    }
  }

  return [...allItems].toSorted();
}

function mergeBaselines(baselines: Baseline[]) {
  const merged: Baseline = {
    checks: {},
    version: BASELINE_VERSION,
  };

  const checkIds = collectAllCheckIds(baselines);

  for (const checkId of checkIds) {
    merged.checks[checkId] = {
      items: mergeCheckItems(baselines, checkId),
      // Consider preserving original entry type during merge.
      type: "items",
    };
  }

  return merged;
}

/**
 * Resolves Git merge conflicts in a baseline file by performing a union merge.
 * Takes the raw file content containing Git conflict markers and returns a merged baseline.
 *
 * Supports multiple conflict blocks in a single file, merging all sections together.
 *
 * @param content - File content containing Git conflict markers (<<<<<<< ======= >>>>>>>)
 *
 * @returns Merged baseline containing the union of all items from both sides
 *
 * @throws {Error} If conflict markers cannot be parsed or baselines are invalid
 */
export function resolveBaselineConflict(content: string) {
  const sections = extractConflictSections(content);

  const allBaselines: Baseline[] = [];

  for (const { ours, theirs } of sections) {
    allBaselines.push(parseJsonFragment(ours), parseJsonFragment(theirs));
  }

  return mergeBaselines(allBaselines);
}
