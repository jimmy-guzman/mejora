import type {
  BaselineEntry,
  DiagnosticItem,
  ItemsSnapshot,
  Snapshot,
} from "./types";

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
  newItems: DiagnosticItem[],
  removedItems: DiagnosticItem[],
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

function findNewItems(
  current: Map<string, DiagnosticItem>,
  baseline: Map<string, DiagnosticItem>,
) {
  const newItems: DiagnosticItem[] = [];

  for (const [id, item] of current) {
    if (!baseline.has(id)) {
      newItems.push(item);
    }
  }

  return newItems;
}

function findRemovedItems(
  current: Map<string, DiagnosticItem>,
  baseline: Map<string, DiagnosticItem>,
) {
  const removedItems: DiagnosticItem[] = [];

  for (const [id, item] of baseline) {
    if (!current.has(id)) {
      removedItems.push(item);
    }
  }

  return removedItems;
}

function hasRelocation(
  current: Map<string, DiagnosticItem>,
  baseline: Map<string, DiagnosticItem>,
) {
  for (const [id, currentItem] of current) {
    const baselineItem = baseline.get(id);

    if (!baselineItem) {
      continue;
    }

    if (
      currentItem.line !== baselineItem.line ||
      currentItem.column !== baselineItem.column
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Creates a keyed lookup for diagnostic items.
 *
 * Assumes item IDs are unique within a comparison.
 * Duplicate IDs will be overwritten (last item wins).
 */
function indexItems(items: DiagnosticItem[] = []) {
  return new Map(items.map((item) => [item.id, item]));
}

function compareItems(snapshot: ItemsSnapshot, baseline: BaselineEntry) {
  const currentItems = indexItems(snapshot.items);
  const baselineItems = indexItems(baseline.items);

  const newItems = findNewItems(currentItems, baselineItems);
  const removedItems = findRemovedItems(currentItems, baselineItems);
  const positionChanges = hasRelocation(currentItems, baselineItems);

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
