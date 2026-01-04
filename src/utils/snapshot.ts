import type { DiagnosticItem, Snapshot } from "@/types";

import { assignStableIds, sortByLocation } from "@/checks/utils";

/**
 * Normalize a snapshot by ensuring all items have stable IDs.
 *
 * Converts DiagnosticItemInput (without IDs) to DiagnosticItem (with IDs)
 * using the stable ID assignment algorithm.
 *
 * @param snapshot - Snapshot with items that may lack IDs
 *
 * @returns Snapshot with all items having stable IDs
 */
export function normalizeSnapshot(snapshot: Snapshot): Omit<
  Snapshot,
  "items"
> & {
  items: DiagnosticItem[];
} {
  // Convert inputs to raw items with signatures
  const rawItems = snapshot.items.map((item) => {
    return {
      column: item.column,
      file: item.file,
      line: item.line,
      message: item.message,
      rule: item.rule,
      signature: `${item.file} - ${item.rule}: ${item.message}` as const,
    };
  });

  // Assign stable IDs using the grouping/sorting algorithm
  const itemsWithIds = assignStableIds(rawItems);

  const sortedItems = itemsWithIds.toSorted(sortByLocation);

  return {
    items: sortedItems,
    type: "items",
  };
}
