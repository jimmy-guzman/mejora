import type { Finding, RawSnapshot } from "@/types";

import { assignStableIds, sortByLocation } from "@/checks/utils";

/**
 * Normalize a snapshot by ensuring all items have stable IDs.
 *
 * Converts FindingInput (w/o IDs & w/ signature) to Finding (w/ IDs)
 * using the stable ID assignment algorithm.
 *
 * @param snapshot - Snapshot with items that may lack IDs
 *
 * @returns Snapshot with all items having stable IDs
 */
export function normalizeSnapshot(snapshot: RawSnapshot): Omit<
  RawSnapshot,
  "items"
> & {
  items: Finding[];
} {
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

  const itemsWithIds = assignStableIds(rawItems);

  const sortedItems = itemsWithIds.toSorted(sortByLocation);

  return {
    items: sortedItems,
    type: "items",
  };
}
