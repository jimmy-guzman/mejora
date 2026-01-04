import type { BaselineEntry, Finding, Snapshot } from "./types";

function createInitialResult() {
  return {
    hasImprovement: false,
    hasRegression: false,
    hasRelocation: false,
    isInitial: true,
    newItems: [],
    removedItems: [],
  };
}

function createComparisonResult(
  newItems: Finding[],
  removedItems: Finding[],
  hasRelocation: boolean,
) {
  return {
    hasImprovement: removedItems.length > 0,
    hasRegression: newItems.length > 0,
    hasRelocation,
    isInitial: false,
    newItems: newItems.toSorted((a, b) => a.id.localeCompare(b.id)),
    removedItems: removedItems.toSorted((a, b) => a.id.localeCompare(b.id)),
  };
}

/**
 * Creates a keyed lookup for findings.
 *
 * Assumes item IDs are unique within a comparison.
 * Duplicate IDs will be overwritten (last item wins).
 */
function indexItems(items: Finding[] = []) {
  return new Map(items.map((item) => [item.id, item]));
}

function idsOf(items: Map<string, Finding>) {
  return new Set(items.keys());
}

function pickByIds(items: Map<string, Finding>, ids: Set<string>) {
  const result: Finding[] = [];

  for (const id of ids) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we know the id exists in items
    const item = items.get(id)!;

    result.push(item);
  }

  return result;
}

function hasRelocation(
  current: Map<string, Finding>,
  baseline: Map<string, Finding>,
) {
  for (const [id, currentItem] of current) {
    const baselineItem = baseline.get(id);

    if (!baselineItem) continue;

    if (
      currentItem.line !== baselineItem.line ||
      currentItem.column !== baselineItem.column
    ) {
      return true;
    }
  }

  return false;
}

function compareItems(snapshot: Snapshot, baseline: BaselineEntry) {
  const currentItems = indexItems(snapshot.items);
  const baselineItems = indexItems(baseline.items);
  const currentIds = idsOf(currentItems);
  const baselineIds = idsOf(baselineItems);
  const newIds = currentIds.difference(baselineIds);
  const removedIds = baselineIds.difference(currentIds);
  const newItems = pickByIds(currentItems, newIds);
  const removedItems = pickByIds(baselineItems, removedIds);

  const hasCommonItems = currentIds.size > newIds.size;
  const positionChanges = hasCommonItems
    ? hasRelocation(currentItems, baselineItems)
    : false;

  return createComparisonResult(newItems, removedItems, positionChanges);
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

  return compareItems(snapshot, baseline);
}
