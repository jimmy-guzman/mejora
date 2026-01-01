import type { RunResult } from "@/types";

import { average } from "./average";

export function formatJsonOutput(result: RunResult) {
  const { results, totalDuration } = result;
  const checksRun = results.length;

  const improvementChecks: string[] = [];
  const regressionChecks: string[] = [];
  const initialChecks: string[] = [];
  const unchangedChecks: string[] = [];

  let improvements = 0;
  let regressions = 0;
  let initial = 0;
  let unchanged = 0;
  let totalIssues = 0;

  const checks = Array.from({ length: checksRun });

  for (let i = 0; i < checksRun; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked by loop condition
    const check = results[i]!;
    const issues = check.snapshot.items.length;

    totalIssues += issues;

    if (check.isInitial) {
      initial++;
      initialChecks.push(check.checkId);
    } else {
      const { hasImprovement, hasRegression } = check;

      if (hasImprovement) {
        improvements++;
        improvementChecks.push(check.checkId);
      }

      if (hasRegression) {
        regressions++;
        regressionChecks.push(check.checkId);
      }

      if (!hasImprovement && !hasRegression) {
        unchanged++;
        unchangedChecks.push(check.checkId);
      }
    }

    checks[i] = {
      checkId: check.checkId,
      duration: check.duration,
      hasImprovement: check.hasImprovement,
      hasRegression: check.hasRegression,
      isInitial: check.isInitial,
      newItems: check.newItems,
      removedItems: check.removedItems,
      totalIssues: issues,
    };
  }

  const output = {
    checks,
    exitCode: result.exitCode,
    hasImprovement: result.hasImprovement,
    hasRegression: result.hasRegression,
    summary: {
      avgDuration: average(totalDuration, checksRun),
      checksRun,
      improvementChecks,
      improvements,
      initial,
      initialChecks,
      regressionChecks,
      regressions,
      totalIssues,
      unchanged,
      unchangedChecks,
    },
    totalDuration,
  };

  return JSON.stringify(output, null, 2);
}
