import type { BaselineEntry, Issue, Snapshot } from "./types";

function createInitialResult() {
  return {
    hasImprovement: false,
    hasRegression: false,
    hasRelocation: false,
    isInitial: true,
    newIssues: [],
    removedIssues: [],
  };
}

function createComparisonResult(
  newIssues: Issue[],
  removedIssues: Issue[],
  hasRelocation: boolean,
) {
  return {
    hasImprovement: removedIssues.length > 0,
    hasRegression: newIssues.length > 0,
    hasRelocation,
    isInitial: false,
    newIssues: newIssues.toSorted((a, b) => a.id.localeCompare(b.id)),
    removedIssues: removedIssues.toSorted((a, b) => a.id.localeCompare(b.id)),
  };
}

/**
 * Creates a keyed lookup for issues.
 *
 * Assumes issue IDs are unique within a comparison.
 * Duplicate IDs will be overwritten (last issue wins).
 */
function indexIssues(issues: Issue[] = []) {
  return new Map(issues.map((issue) => [issue.id, issue]));
}

function idsOf(issues: Map<string, Issue>) {
  return new Set(issues.keys());
}

function pickByIds(issues: Map<string, Issue>, ids: Set<string>) {
  const result: Issue[] = [];

  for (const id of ids) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we know the id exists in issues
    const issue = issues.get(id)!;

    result.push(issue);
  }

  return result;
}

function hasRelocation(
  current: Map<string, Issue>,
  baseline: Map<string, Issue>,
) {
  for (const [id, currentIssue] of current) {
    const baselineIssue = baseline.get(id);

    if (!baselineIssue) continue;

    if (
      currentIssue.line !== baselineIssue.line ||
      currentIssue.column !== baselineIssue.column
    ) {
      return true;
    }
  }

  return false;
}

function compareIssues(snapshot: Snapshot, baseline: BaselineEntry) {
  const currentIssues = indexIssues(snapshot.items);
  const baselineIssues = indexIssues(baseline.items);
  const currentIds = idsOf(currentIssues);
  const baselineIds = idsOf(baselineIssues);
  const newIds = currentIds.difference(baselineIds);
  const removedIds = baselineIds.difference(currentIds);
  const newIssues = pickByIds(currentIssues, newIds);
  const removedIssues = pickByIds(baselineIssues, removedIds);
  const hasCommonIssues = currentIds.size > newIds.size;
  const positionChanges = hasCommonIssues
    ? hasRelocation(currentIssues, baselineIssues)
    : false;

  return createComparisonResult(newIssues, removedIssues, positionChanges);
}

/**
 * Compares a snapshot against a baseline entry.
 *
 * @param snapshot - Current snapshot to compare.
 *
 * @param baseline - Baseline entry to compare against.
 *
 * @returns Comparison result.
 */
export function compareSnapshots(snapshot: Snapshot, baseline?: BaselineEntry) {
  if (!baseline) {
    return createInitialResult();
  }

  return compareIssues(snapshot, baseline);
}
