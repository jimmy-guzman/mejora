import type { Issue, RunResult } from "@/types";

import { average } from "./average";

interface Check {
  checkId: string;
  duration: number | undefined;
  hasImprovement: boolean;
  hasRegression: boolean;
  isInitial: boolean;
  newIssues: Issue[];
  removedIssues: Issue[];
  totalIssues: number;
}

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

  const checks: Check[] = [];

  for (const check of results) {
    const issues = check.snapshot.items.length;

    totalIssues += issues;

    if (check.isInitial) {
      initial += issues;
      initialChecks.push(check.checkId);
    } else {
      if (check.hasImprovement) {
        improvements += check.removedIssues.length;
        improvementChecks.push(check.checkId);
      }

      if (check.hasRegression) {
        regressions += check.newIssues.length;
        regressionChecks.push(check.checkId);
      }

      if (!check.hasImprovement && !check.hasRegression) {
        unchanged += issues;
        unchangedChecks.push(check.checkId);
      }
    }

    checks.push({
      checkId: check.checkId,
      duration: check.duration,
      hasImprovement: check.hasImprovement,
      hasRegression: check.hasRegression,
      isInitial: check.isInitial,
      newIssues: check.newIssues,
      removedIssues: check.removedIssues,
      totalIssues: issues,
    });
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
