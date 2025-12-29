import type { BaselineEntry } from "@/types";

export const areEntriesEqual = (
  newEntry: BaselineEntry,
  existingEntry?: BaselineEntry,
) => {
  if (!existingEntry) {
    return false;
  }

  const entryItems = newEntry.items ?? [];
  const existingItems = existingEntry.items ?? [];

  if (entryItems.length !== existingItems.length) {
    return false;
  }

  const sortedEntry = entryItems.toSorted();
  const sortedExisting = existingItems.toSorted();

  return sortedEntry.every((item, i) => item === sortedExisting[i]);
};
