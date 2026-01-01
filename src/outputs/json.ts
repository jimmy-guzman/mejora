import type { RunResult } from "@/types";

import { average, categorize, sum } from "./utils";

export function formatJsonOutput(result: RunResult) {
  const { improvements, initial, regressions, unchanged } = categorize(
    result.results,
  );

  const output = {
    checks: result.results.map((check) => {
      return {
        checkId: check.checkId,
        duration: check.duration,
        hasImprovement: check.hasImprovement,
        hasRegression: check.hasRegression,
        isInitial: check.isInitial,
        newItems: check.newItems,
        removedItems: check.removedItems,
        totalIssues: check.snapshot.items.length || 0,
      };
    }),
    exitCode: result.exitCode,
    hasImprovement: result.hasImprovement,
    hasRegression: result.hasRegression,
    summary: {
      avgDuration: average(result.totalDuration, result.results.length),
      checksRun: result.results.length,
      improvementChecks: improvements.map((r) => r.checkId),
      improvements: improvements.length,
      initial: initial.length,
      initialChecks: initial.map((r) => r.checkId),
      regressionChecks: regressions.map((r) => r.checkId),
      regressions: regressions.length,
      totalIssues: sum(result.results, (r) => r.snapshot.items),
      unchanged: unchanged.length,
      unchangedChecks: unchanged.map((r) => r.checkId),
    },
    totalDuration: result.totalDuration,
  };

  return JSON.stringify(output, null, 2);
}
