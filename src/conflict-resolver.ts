import type { Baseline } from "./types";

import { BASELINE_VERSION } from "./constants";

function parseConflictMarkers(content: string) {
  const regex = /<<<<<<< .*\n([\s\S]*?)\n=======\n([\s\S]*?)\n>>>>>>> .*\n/;
  const match = regex.exec(content);

  if (!match) {
    throw new Error("Could not parse conflict markers in baseline");
  }

  const [_, ours = "", theirs = ""] = match;

  return { ours, theirs };
}

function extractBaseline(partialJson: string): Baseline {
  try {
    const trimmed = partialJson.trim();

    const fullJson = `{
  "version": ${BASELINE_VERSION},
  ${trimmed}
}`;

    return JSON.parse(fullJson) as Baseline;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    throw new Error(
      `Failed to parse baseline during conflict resolution: ${message}`,
      { cause: error },
    );
  }
}

function unionMerge(ours: Baseline, theirs: Baseline): Baseline {
  const merged: Baseline = {
    checks: {},
    version: BASELINE_VERSION,
  };

  const allCheckIds = new Set([
    ...Object.keys(ours.checks),
    ...Object.keys(theirs.checks),
  ]);

  for (const checkId of allCheckIds) {
    const ourItems = new Set(ours.checks[checkId]?.items);
    const theirItems = new Set(theirs.checks[checkId]?.items);
    const mergedItems = new Set([...ourItems, ...theirItems]);

    const type =
      ours.checks[checkId]?.type ?? theirs.checks[checkId]?.type ?? "items";

    merged.checks[checkId] = {
      items: [...mergedItems].toSorted(),
      type,
    };
  }

  return merged;
}

/**
 * Resolves a Git merge conflict in a baseline file by performing a union merge.
 * Takes the raw file content containing Git conflict markers and returns a merged baseline.
 *
 * @param content - File content containing Git conflict markers (<<<<<<< ======= >>>>>>>)
 *
 * @returns Merged baseline containing the union of all items from both sides
 *
 * @throws {Error} If conflict markers cannot be parsed or baselines are invalid
 */
export function resolveBaselineConflict(content: string): Baseline {
  const sections = parseConflictMarkers(content);
  const ours = extractBaseline(sections.ours);
  const theirs = extractBaseline(sections.theirs);

  return unionMerge(ours, theirs);
}
