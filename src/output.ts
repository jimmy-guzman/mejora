import type { CheckResult, RunResult } from "./types";

import * as c from "./utils/colors";
import { formatDuration } from "./utils/duration";

function categorizeResults(results: CheckResult[]) {
  const improvements = results.filter((r) => r.hasImprovement && !r.isInitial);
  const regressions = results.filter((r) => r.hasRegression);
  const unchanged = results.filter((r) => {
    return !r.hasImprovement && !r.hasRegression && !r.isInitial;
  });
  const initial = results.filter((r) => r.isInitial);

  return { improvements, initial, regressions, unchanged };
}

export function formatJsonOutput(result: RunResult) {
  const { improvements, initial, regressions, unchanged } = categorizeResults(
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
      checksRun: result.results.length,
      improvementChecks: improvements.map((r) => r.checkId),
      improvements: improvements.length,
      initial: initial.length,
      initialChecks: initial.map((r) => r.checkId),
      regressionChecks: regressions.map((r) => r.checkId),
      regressions: regressions.length,
      unchanged: unchanged.length,
      unchangedChecks: unchanged.map((r) => r.checkId),
    },
    totalDuration: result.totalDuration,
  };

  return JSON.stringify(output, null, 2);
}

const MAX_ITEMS_TO_DISPLAY = 10;

function formatItemList(items: string[], maxItems = MAX_ITEMS_TO_DISPLAY) {
  const lines: string[] = [];
  const itemsToShow = items.slice(0, maxItems);

  for (const item of itemsToShow) {
    lines.push(`     ${c.dim(item)}`);
  }

  const remainingCount = items.length - maxItems;

  if (remainingCount > 0) {
    lines.push(`     ${c.dim(`... and ${remainingCount} more`)}`);
  }

  return lines;
}

function formatInitialBaseline(check: CheckResult, isFirst: boolean) {
  const prefix = isFirst ? "" : "\n";
  const lines: string[] = [
    `${prefix}${c.bold(check.checkId)}:`,
    `  Initial baseline created with ${c.cyan(check.snapshot.items.length.toString())} issue(s)`,
  ];

  if (check.snapshot.items.length > 0) {
    lines.push(...formatItemList(check.snapshot.items));
  }

  if (check.duration !== undefined) {
    lines.push(`  ${c.dim("Completed in")} ${formatDuration(check.duration)}`);
  }

  return lines;
}

function formatRegressions(check: CheckResult) {
  if (!check.hasRegression) {
    return [];
  }

  const lines = [
    `  ${c.red(check.newItems.length.toString())} new issue(s) (regressions):`,
    ...formatItemList(check.newItems),
  ];

  return lines;
}

function formatImprovements(check: CheckResult) {
  if (!check.hasImprovement) {
    return [];
  }

  const lines = [
    `  ${c.greenBright(check.removedItems.length.toString())} issue(s) fixed (improvements):`,
    ...formatItemList(check.removedItems),
  ];

  return lines;
}

function formatChangeBaseline(check: CheckResult, isFirst: boolean) {
  const prefix = isFirst ? "" : "\n";
  const lines = [
    `${prefix}${c.bold(check.checkId)}:`,
    ...formatRegressions(check),
    ...formatImprovements(check),
  ];

  if (check.duration !== undefined) {
    lines.push(`  ${c.dim("Completed in")} ${formatDuration(check.duration)}`);
  }

  return lines;
}

function formatCheckResult(check: CheckResult, isFirst: boolean) {
  if (check.isInitial) {
    return formatInitialBaseline(check, isFirst);
  }

  if (check.hasRegression || check.hasImprovement) {
    return formatChangeBaseline(check, isFirst);
  }

  return [];
}

function formatSummary(result: RunResult) {
  const hasAnyInitial = result.results.some((r) => r.isInitial);
  const { improvements, initial, regressions, unchanged } = categorizeResults(
    result.results,
  );

  const summaryLines: string[] = [
    c.bold("Summary"),
    `  Checks run: ${result.results.length}`,
  ];

  if (improvements.length > 0) {
    const names = improvements.map((r) => r.checkId).join(", ");

    summaryLines.push(`  Improvements: ${improvements.length} (${names})`);
  } else {
    summaryLines.push(`  Improvements: 0`);
  }

  if (regressions.length > 0) {
    const names = regressions.map((r) => r.checkId).join(", ");

    summaryLines.push(`  Regressions: ${regressions.length} (${names})`);
  } else {
    summaryLines.push(`  Regressions: 0`);
  }

  if (unchanged.length > 0) {
    const names = unchanged.map((r) => r.checkId).join(", ");

    summaryLines.push(`  Unchanged: ${unchanged.length} (${names})`);
  } else {
    summaryLines.push(`  Unchanged: 0`);
  }

  if (initial.length > 0) {
    const names = initial.map((r) => r.checkId).join(", ");

    summaryLines.push(`  Initial: ${initial.length} (${names})`);
  } else {
    summaryLines.push(`  Initial: 0`);
  }

  summaryLines.push("");

  if (hasAnyInitial) {
    summaryLines.push(c.blue("✓ Initial baseline created successfully"));
  } else if (result.hasRegression) {
    summaryLines.push(`${c.red("✗ Regressions detected")} - Run failed`);
  } else if (result.hasImprovement) {
    summaryLines.push(
      `${c.greenBright("✓ Improvements detected")} - Baseline updated`,
    );
  } else {
    summaryLines.push(c.greenBright("✓ All checks passed"));
  }

  if (result.totalDuration !== undefined) {
    summaryLines.push(
      `${c.dim("Completed in")} ${formatDuration(result.totalDuration)}`,
    );
  }

  return summaryLines.join("\n");
}

export function formatTextOutput(result: RunResult) {
  const lines: string[] = [];

  for (let i = 0; i < result.results.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked by loop condition
    const check = result.results[i]!;

    lines.push(...formatCheckResult(check, i === 0));
  }

  if (lines.length > 0) {
    lines.push("");
  }

  lines.push(formatSummary(result));

  return lines.join("\n");
}
