import type { Baseline, Issue } from "@/types";

import { BASELINE_VERSION } from "@/constants";
import { balanceBraces } from "@/utils/brace-balancer";
import { sortById } from "@/utils/sort";

function tryParseJson(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

function removeTrailingComma(text: string) {
  const trimmed = text.trim();

  return trimmed.endsWith(",") ? trimmed.slice(0, -1) : trimmed;
}

function wrapInBaselineStructure(fragment: string) {
  const body = removeTrailingComma(fragment);

  return `{
  "version": ${BASELINE_VERSION},
  ${body}
}`;
}

function normalizeBaselineStructure(parsed: unknown) {
  if (typeof parsed !== "object" || parsed === null) {
    throw new TypeError("Baseline must be an object");
  }

  if (
    "checks" in parsed &&
    parsed.checks &&
    typeof parsed.checks === "object"
  ) {
    return {
      checks: parsed.checks as Baseline["checks"],
      version: BASELINE_VERSION,
    } satisfies Baseline;
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
  } satisfies Baseline;
}

function parseConflictSide(side: string) {
  try {
    const trimmed = side.trim();

    if (trimmed === "") {
      return {
        checks: {},
        version: BASELINE_VERSION,
      } satisfies Baseline;
    }

    const direct = tryParseJson(trimmed);

    if (direct) {
      return normalizeBaselineStructure(direct);
    }

    const cleaned = balanceBraces(removeTrailingComma(trimmed));
    const wrapped = wrapInBaselineStructure(cleaned);

    return normalizeBaselineStructure(JSON.parse(wrapped) as unknown);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    throw new Error(
      `Failed to parse baseline during conflict resolution: ${message}`,
      { cause: error },
    );
  }
}

function extractConflictSections(content: string) {
  // `^` anchors on `<<<<<<<`, `=======`, and `>>>>>>>` prevent matching those
  // sequences inside content. Two alternates after `=======` handle:
  //   1. Normal/empty theirs: `=======\n<content>\n^>>>>>>> branch`  (closing marker anchored to line-start)
  //   2. Adjacent (no `\n`):  `=======>>>>>>> branch`                (no newline, so `^` would fail — unanchored fallback)
  // `\r?` before each `\n` makes the pattern work on both LF and CRLF line endings.
  const regex =
    /^<<<<<<< .+\r?\n([\s\S]*?)^=======(?:\r?\n([\s\S]*?)\r?\n?^>>>>>>> .+$|>>>>>>> .+$)/gm;
  const matches = [...content.matchAll(regex)];

  if (matches.length === 0) {
    throw new Error("Could not parse conflict markers in baseline");
  }

  return matches.map(([, ours = "", theirs = ""]) => ({ ours, theirs }));
}

function mergeBaselines(baselines: Baseline[]) {
  const itemsByCheck = new Map<string, Map<string, Issue>>();

  for (const baseline of baselines) {
    for (const [checkId, { items = [] }] of Object.entries(baseline.checks)) {
      if (items.length === 0) continue;

      let itemsById = itemsByCheck.get(checkId);

      if (!itemsById) {
        itemsById = new Map<string, Issue>();
        itemsByCheck.set(checkId, itemsById);
      }

      for (const item of items) {
        itemsById.set(item.id, item);
      }
    }
  }

  const checks: Baseline["checks"] = {};

  for (const [checkId, itemsById] of itemsByCheck) {
    checks[checkId] = {
      items: [...itemsById.values()].toSorted(sortById),
      type: "items",
    };
  }

  return {
    checks,
    version: BASELINE_VERSION,
  } satisfies Baseline;
}

/**
 * Resolves Git merge conflicts in a baseline file by performing a union merge.
 * Takes the raw file content containing Git conflict markers and returns a merged baseline.
 *
 * Supports multiple conflict blocks in a single file, merging all sections together.
 * Items are merged by their stable ID, making the merge robust to line number changes.
 *
 * @param content - File content containing Git conflict markers (<<<<<<< ======= >>>>>>>)
 *
 * @returns Merged baseline containing the union of all items from both sides
 *
 * @throws {Error} If conflict markers cannot be parsed or baselines are invalid
 */
export function resolveBaselineConflict(content: string) {
  const sections = extractConflictSections(content);
  const baselines: Baseline[] = [];

  for (const { ours, theirs } of sections) {
    baselines.push(parseConflictSide(ours), parseConflictSide(theirs));
  }

  return mergeBaselines(baselines);
}
