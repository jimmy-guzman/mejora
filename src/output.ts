import type { CheckResult, RunResult } from "./types";

import { blue, bold, dim, gray, green, red } from "./utils/colors";
import { duration } from "./utils/duration";
import { plural } from "./utils/text";

function computeTotalIssues(results: CheckResult[]): number {
  return results.reduce((sum, r) => sum + r.snapshot.items.length, 0);
}

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

  const totalIssues = computeTotalIssues(result.results);
  const avgDuration =
    result.totalDuration !== undefined && result.results.length > 0
      ? result.totalDuration / result.results.length
      : undefined;

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
    lines.push(`     ${dim(item)}`);
  }

  const remainingCount = items.length - maxItems;

  if (remainingCount > 0) {
    lines.push(`     ${dim(`... and ${remainingCount} more`)}`);
  }

  return lines;
}

function formatInitialBaseline(check: CheckResult, isFirst: boolean) {
  const prefix = isFirst ? "" : "\n";
  const count = check.snapshot.items.length;
  const lines: string[] = [
    `${prefix}${check.checkId}:`,
    `  Initial baseline created with ${blue(count)} ${plural(count, "issue")}`,
  ];

  if (check.snapshot.items.length > 0) {
    lines.push(...formatItemList(check.snapshot.items));
  }

  if (check.duration !== undefined) {
    lines.push(`  ${dim("Duration")}  ${duration(check.duration)}`);
  }

  const issues = `${check.snapshot.items.length}`;

  lines.push(`    ${dim("Issues")}  ${bold(issues)}`);

  return lines;
}

function formatRegressions(check: CheckResult) {
  if (!check.hasRegression) {
    return [];
  }

  const count = check.newItems.length;
  const lines = [
    `  ${red(count)} new ${plural(count, "issue")} (${plural(count, "regression")}):`,
    ...formatItemList(check.newItems),
  ];

  return lines;
}

function formatImprovements(check: CheckResult) {
  if (!check.hasImprovement) {
    return [];
  }

  const count = check.removedItems.length;
  const lines = [
    `  ${green(count)} ${plural(count, "issue")} fixed (${plural(count, "improvement")}):`,
    ...formatItemList(check.removedItems),
  ];

  return lines;
}

function formatChangeBaseline(check: CheckResult, isFirst: boolean) {
  const prefix = isFirst ? "" : "\n";
  const lines = [
    `${prefix}${check.checkId}:`,
    ...formatRegressions(check),
    ...formatImprovements(check),
  ];

  if (check.duration !== undefined) {
    lines.push(`  ${dim("Duration")}  ${duration(check.duration)}`);
  }

  const issues = `${check.snapshot.items.length}`;

  lines.push(`    ${dim("Issues")}  ${bold(issues)}`);

  return lines;
}

function formatUnchanged(check: CheckResult, isFirst: boolean) {
  const prefix = isFirst ? "" : "\n";
  const count = check.snapshot.items.length;

  if (check.duration !== undefined) {
    return [
      `${prefix}${check.checkId} (${count}) ${dim(duration(check.duration))}`,
    ];
  }

  return [`${prefix}${check.checkId} (${count})`];
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
  const {
    improvements: { length: totalImprovements },
    initial: { length: totalInitial },
    regressions: { length: totalRegressions },
    unchanged: { length: totalUnchanged },
  } = categorizeResults(result.results);

  const summaryLines = [
    `  ${dim("Improvements")}  ${totalImprovements > 0 ? green(totalImprovements) : totalImprovements}`,
    `   ${dim("Regressions")}  ${totalRegressions > 0 ? red(totalRegressions) : totalRegressions}`,
    `     ${dim("Unchanged")}  ${totalUnchanged}`,
    `       ${dim("Initial")}  ${totalInitial > 0 ? blue(totalInitial) : totalInitial}`,
    `        ${dim("Checks")}  ${result.results.length}`,
  ];

  const totalIssues = computeTotalIssues(result.results);

  summaryLines.push(`        ${dim("Issues")}  ${bold(totalIssues)}`);

  if (result.totalDuration !== undefined && result.results.length > 0) {
    const avgDuration = result.totalDuration / result.results.length;

    summaryLines.push(
      `      ${dim("Duration")}  ${duration(result.totalDuration)} ${gray(`(avg ${duration(avgDuration)})`)}`,
    );
  }

  summaryLines.push("");

  if (hasAnyInitial) {
    summaryLines.push(blue("✔ Initial baseline created successfully"));
  } else if (result.hasRegression) {
    summaryLines.push(`${red("✗ Regressions detected")} - Run failed`);
  } else if (result.hasImprovement) {
    summaryLines.push(`${green("✔ Improvements detected")} - Baseline updated`);
  } else {
    summaryLines.push(green("✔ All checks passed"));
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
