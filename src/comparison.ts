import type {
  BaselineEntry,
  DiagnosticItem,
  ItemsSnapshot,
  Snapshot,
} from "./types";

function createInitialResult() {
  return {
    hasImprovement: false,
    hasPositionChanges: false,
    hasRegression: false,
    isInitial: true,
    newItems: [],
    removedItems: [],
  };
}

function createComparisonResult(
  newItems: DiagnosticItem[],
  removedItems: DiagnosticItem[],
  hasPositionChanges: boolean,
) {
  return {
    hasImprovement: removedItems.length > 0,
    hasPositionChanges,
    hasRegression: newItems.length > 0,
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

function hasPositionChanges(
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

function compareItems(snapshot: ItemsSnapshot, baseline: BaselineEntry) {
  const currentItems = new Map(snapshot.items.map((item) => [item.id, item]));
  const baselineItems = new Map(baseline.items?.map((item) => [item.id, item]));

  const newItems = findNewItems(currentItems, baselineItems);
  const removedItems = findRemovedItems(currentItems, baselineItems);
  const positionChanges = hasPositionChanges(currentItems, baselineItems);

  return createComparisonResult(newItems, removedItems, positionChanges);
}

export function compareSnapshots(snapshot: Snapshot, baseline?: BaselineEntry) {
  if (!baseline) {
    return createInitialResult();
  }

  return compareItems(snapshot, baseline);
}
