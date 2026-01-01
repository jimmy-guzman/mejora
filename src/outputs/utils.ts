import type { CheckResult } from "@/types";

export function sum(
  results: CheckResult[],
  getItems: (r: CheckResult) => unknown[],
) {
  return results.reduce((sum, r) => sum + getItems(r).length, 0);
}

export function categorize(results: CheckResult[]) {
  const improvements: CheckResult[] = [];
  const regressions: CheckResult[] = [];
  const unchanged: CheckResult[] = [];
  const initial: CheckResult[] = [];

  for (const r of results) {
    if (r.isInitial) {
      initial.push(r);
    } else {
      if (r.hasImprovement) improvements.push(r);
      if (r.hasRegression) regressions.push(r);
      if (!r.hasImprovement && !r.hasRegression) unchanged.push(r);
    }
  }

  return { improvements, initial, regressions, unchanged };
}

export function average(totalDuration: number | undefined, count: number) {
  if (totalDuration === undefined || count === 0) return undefined;

  return totalDuration / count;
}
