import type { CheckResult, RunResult } from "./types";

import * as c from "./utils/colors";
import { formatDuration } from "./utils/duration";

function categorizeResults(results: CheckResult[]) {
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

export function formatJsonOutput(result: RunResult) {
  const { improvements, initial, regressions, unchanged } = categorizeResults(
    result.results,
  );

  const totalIssues = result.results.reduce((sum, r) => {
    return sum + r.snapshot.items.length;
  }, 0);
  const avgDuration =
    result.totalDuration === undefined
      ? undefined
      : result.totalDuration / result.results.length;

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
      avgDuration,
      checksRun: result.results.length,
      improvementChecks: improvements.map((r) => r.checkId),
      improvements: improvements.length,
      initial: initial.length,
      initialChecks: initial.map((r) => r.checkId),
      regressionChecks: regressions.map((r) => r.checkId),
      regressions: regressions.length,
      totalIssues,
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
    const durationStr = formatDuration(check.duration);
    const issuesStr = `${check.snapshot.items.length} issue${check.snapshot.items.length === 1 ? "" : "s"}`;

    lines.push(
      `  ${c.dim("Completed in")} ${durationStr} ${c.dim("·")} ${issuesStr}`,
    );
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
    const durationStr = formatDuration(check.duration);
    const issuesStr = `${check.snapshot.items.length} issue${check.snapshot.items.length === 1 ? "" : "s"}`;

    lines.push(
      `  ${c.dim("Completed in")} ${durationStr} ${c.dim("·")} ${issuesStr}`,
    );
  }

  return lines;
}

function formatUnchanged(check: CheckResult, isFirst: boolean) {
  const prefix = isFirst ? "" : "\n";
  const lines = [`${prefix}${c.bold(check.checkId)}:`];

  if (check.duration !== undefined) {
    const durationStr = formatDuration(check.duration);
    const issuesStr = `${check.snapshot.items.length} issue${check.snapshot.items.length === 1 ? "" : "s"}`;

    lines.push(
      `  ${c.dim("Completed in")} ${durationStr} ${c.dim("·")} ${issuesStr}`,
    );
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

  return formatUnchanged(check, isFirst);
}

function formatSummary(result: RunResult) {
  const hasAnyInitial = result.results.some((r) => r.isInitial);
  const { improvements, initial, regressions, unchanged } = categorizeResults(
    result.results,
  );

  const summaryLines: string[] = [
    c.bold("Summary"),
    `  Checks run: ${result.results.length}`,
    "",
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

  const totalIssues = result.results.reduce((sum, r) => {
    return sum + r.snapshot.items.length;
  }, 0);

  summaryLines.push(`  Total issues: ${totalIssues}`);

  if (result.totalDuration !== undefined) {
    const avgDuration = result.totalDuration / result.results.length;

    summaryLines.push(
      `  Duration: ${formatDuration(result.totalDuration)} (avg ${formatDuration(avgDuration)} per check)`,
    );
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
