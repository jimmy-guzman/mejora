import type { Issue, IssueInput, RawSnapshot } from "@/types";

import { hash } from "./hash";

interface HasLocation {
  column: number;
  file: string;
  line: number;
}

/**
 * Compare two objects by their source location (file, line, column).
 */
function sortByLocation<T extends HasLocation>(a: T, b: T) {
  if (a.file !== b.file) return a.file < b.file ? -1 : 1;

  if (a.line !== b.line) return a.line - b.line;

  return a.column - b.column;
}

function getSignature(item: IssueInput) {
  return `${item.file} - ${item.rule}: ${item.message}`;
}

/**
 * Assign stable, deterministic IDs to items based on their signature and relative position.
 * Items with identical signatures are distinguished by their sorted location order.
 */
function assignStableIds(items: IssueInput[]) {
  const groups = Map.groupBy(items, getSignature);
  const result: Issue[] = [];

  for (const [signature, group] of groups) {
    group.sort(sortByLocation);

    for (const [i, item] of group.entries()) {
      result.push({
        ...item,
        id: hash(`${signature}:${i}`),
      });
    }
  }

  return result;
}

/**
 * Convert a raw snapshot into normalized form with stable IDs assigned to all issues.
 */
export function normalizeSnapshot(snapshot: RawSnapshot) {
  const itemsWithIds = assignStableIds(snapshot.items);

  return {
    items: itemsWithIds.toSorted(sortByLocation),
    type: "items" as const,
  };
}
