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

  if (new Set(entryItems).size !== new Set(existingItems).size) {
    return false;
  }

  return existingItems.every((item) => entryItems.includes(item));
};
