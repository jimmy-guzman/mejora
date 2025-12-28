import type { BaselineEntry, ItemsSnapshot, Snapshot } from "./types";

function createInitialResult() {
  return {
    hasImprovement: false,
    hasRegression: false,
    isInitial: true,
    newItems: [],
    removedItems: [],
  };
}

function createComparisonResult(newItems: string[], removedItems: string[]) {
  return {
    hasImprovement: removedItems.length > 0,
    hasRegression: newItems.length > 0,
    isInitial: false,
    newItems: newItems.toSorted(),
    removedItems: removedItems.toSorted(),
  };
}

function findNewItems(current: Set<string>, baseline: Set<string>) {
  const newItems: string[] = [];

  for (const item of current) {
    if (!baseline.has(item)) {
      newItems.push(item);
    }
  }

  return newItems;
}

function findRemovedItems(current: Set<string>, baseline: Set<string>) {
  const removedItems: string[] = [];

  for (const item of baseline) {
    if (!current.has(item)) {
      removedItems.push(item);
    }
  }

  return removedItems;
}

function compareItems(snapshot: ItemsSnapshot, baseline: BaselineEntry) {
  const currentItems = new Set(snapshot.items);
  const baselineItems = new Set(baseline.items);

  const newItems = findNewItems(currentItems, baselineItems);
  const removedItems = findRemovedItems(currentItems, baselineItems);

  return createComparisonResult(newItems, removedItems);
}

export function compareSnapshots(
  snapshot: Snapshot,
  baseline: BaselineEntry | undefined,
) {
  if (!baseline) {
    return createInitialResult();
  }

  return compareItems(snapshot, baseline);
}
