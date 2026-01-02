import type { DiagnosticItem } from "@/types";

import { hash } from "../utils/hash";

interface HasLocation {
  column: number;
  file: string;
  line: number;
}

/**
 * Compare two DiagnosticItem objects by their location: file name, line number, and column number.
 *
 * @returns Comparison result: negative if a < b, positive if a > b, zero if equal.
 */
export function sortByLocation<T extends HasLocation>(a: T, b: T) {
  if (a.file !== b.file) return a.file.localeCompare(b.file);

  if (a.line !== b.line) return a.line - b.line;

  return a.column - b.column;
}

export type DiagnosticSignature = `${string} - ${string}: ${string}`;
export interface RawDiagnosticItem extends Omit<DiagnosticItem, "id"> {
  signature: DiagnosticSignature;
}

/**
 * Assign stable IDs to RawDiagnosticItem objects based on their signature and relative location.
 *
 * @param items Array of items without IDs but with signatures.
 *
 * @returns Array of DiagnosticItem objects with assigned IDs.
 */
export function assignStableIds(items: RawDiagnosticItem[]) {
  const groups = Map.groupBy(items, (item) => item.signature);

  const result: DiagnosticItem[] = [];

  for (const [signature, group] of groups) {
    group.sort(sortByLocation);

    for (const [index, element] of group.entries()) {
      const { signature: _sig, ...item } = element;

      result.push({
        ...item,
        id: hash(`${signature}:${index}`),
      });
    }
  }

  return result;
}
