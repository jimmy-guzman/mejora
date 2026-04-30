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
  "version": ${JSON.stringify(BASELINE_VERSION)},
  ${body}
}`;
}

function hasChecksProperty(
  value: object,
): value is { checks: Baseline["checks"] } {
  return (
    "checks" in value &&
    value.checks !== null &&
    typeof value.checks === "object"
  );
}

function coerceToBaseline(parsed: unknown) {
  if (typeof parsed !== "object" || parsed === null) {
    throw new TypeError("Baseline must be an object");
  }

  if (hasChecksProperty(parsed)) {
    return { checks: parsed.checks, version: BASELINE_VERSION };
  }

  const checks: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(parsed)) {
    if (key !== "version") {
      checks[key] = value;
    }
  }

  return { checks: checks as Baseline["checks"], version: BASELINE_VERSION };
}

const EMPTY_BASELINE: Baseline = {
  checks: {},
  version: BASELINE_VERSION,
};

function parseConflictSide(side: string) {
  try {
    const trimmed = side.trim();

    if (trimmed === "") {
      return EMPTY_BASELINE;
    }

    const direct = tryParseJson(trimmed);

    if (direct !== undefined) {
      return coerceToBaseline(direct);
    }

    const cleaned = balanceBraces(removeTrailingComma(trimmed));
    const wrapped = wrapInBaselineStructure(cleaned);

    return coerceToBaseline(JSON.parse(wrapped) as unknown);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    throw new Error(
      `Failed to parse baseline during conflict resolution: ${message}`,
      { cause: error },
    );
  }
}

// Two alternates after `=======` handle:
//   1. Normal/empty theirs:  `=======\n<content>\n^>>>>>>> branch`
//   2. Adjacent (no `\n`):   `=======>>>>>>> branch`
// `\r?` before each `\n` handles both LF and CRLF line endings.
// `^` anchors prevent false matches on those sequences inside JSON strings.
const CONFLICT_REGEX =
  /^<<<<<<< .+\r?\n([\s\S]*?)^=======(?:\r?\n([\s\S]*?)\r?\n?^>>>>>>> .+$|>>>>>>> .+$)/gm;

function tryResolveInlineConflictsByMerging(
  content: string,
  matches: RegExpExecArray[],
) {
  let resolved = content;

  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];

    if (!match) continue;

    const ours = (match[1] ?? "").trim();
    const theirs = (match[2] ?? "").trim();
    const start = match.index;
    const end = start + match[0].length;

    const combined = ours && theirs ? `${ours},\n${theirs}` : ours || theirs;

    resolved = resolved.slice(0, start) + combined + resolved.slice(end);
  }

  const parsed = tryParseJson(resolved);

  if (parsed === undefined) return undefined;

  try {
    const baseline = coerceToBaseline(parsed);

    return mergeBaselines([baseline]);
  } catch {
    return undefined;
  }
}

function tryResolveInlineConflicts(content: string) {
  const matches = [...content.matchAll(CONFLICT_REGEX)];

  if (matches.length === 0) return undefined;

  for (const [, ours = "", theirs = ""] of matches) {
    if (ours.includes("{") || theirs.includes("{")) {
      const oursArray = tryParseJson(`[${removeTrailingComma(ours.trim())}]`);
      const theirsArray = tryParseJson(
        `[${removeTrailingComma(theirs.trim())}]`,
      );

      if (Array.isArray(oursArray) && Array.isArray(theirsArray)) {
        return tryResolveInlineConflictsByMerging(content, matches);
      }

      return undefined;
    }
  }

  let resolved = content;

  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];

    if (!match) continue;

    const ours = (match[1] ?? "").trimEnd();
    const start = match.index;
    const end = start + match[0].length;

    resolved = resolved.slice(0, start) + ours + resolved.slice(end);
  }

  const parsed = tryParseJson(resolved);

  if (parsed === undefined) return undefined;

  try {
    return coerceToBaseline(parsed);
  } catch {
    return undefined;
  }
}

function extractConflictSections(content: string) {
  const matches = [...content.matchAll(CONFLICT_REGEX)];

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

      if (itemsById === undefined) {
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

  return { checks, version: BASELINE_VERSION };
}

/**
 * Resolves Git merge conflicts in a baseline file by performing a union merge.
 *
 * Supports multiple conflict blocks in a single file. Items are merged by
 * their stable `id`, making the merge robust to line-number changes.
 *
 * @param content - File content containing Git conflict markers
 *
 * @returns Merged baseline containing the union of all items from both sides
 *
 * @throws {Error} If conflict markers cannot be parsed or baselines are invalid
 */
export function resolveBaselineConflict(content: string): Baseline {
  const inline = tryResolveInlineConflicts(content);

  if (inline !== undefined) return inline;

  const sections = extractConflictSections(content);
  const baselines: Baseline[] = [];

  for (const { ours, theirs } of sections) {
    baselines.push(parseConflictSide(ours), parseConflictSide(theirs));
  }

  return mergeBaselines(baselines);
}
