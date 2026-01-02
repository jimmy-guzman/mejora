import type { BaselineEntry } from "@/types";

/**
 * Compares two baseline entries for equivalence ignoring order.
 */
export const areBaselineEntriesEquivalent = (
  newBaselineEntry: BaselineEntry,
  existingBaselineEntry?: BaselineEntry,
) => {
  if (!existingBaselineEntry) {
    return false;
  }

  const entryItems = newBaselineEntry.items ?? [];
  const existingItems = existingBaselineEntry.items ?? [];

  if (entryItems.length !== existingItems.length) {
    return false;
  }

  const sortedEntry = entryItems.toSorted((a, b) => a.id.localeCompare(b.id));
  const sortedExisting = existingItems.toSorted((a, b) => {
    return a.id.localeCompare(b.id);
  });

  return sortedEntry.every((item, i) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we know existingItems has the same length as entryItems
    const existing = sortedExisting[i]!;

    return (
      item.id === existing.id &&
      item.file === existing.file &&
      item.line === existing.line &&
      item.column === existing.column &&
      item.rule === existing.rule &&
      item.message === existing.message
    );
  });
};
