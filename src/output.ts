import pc from "picocolors";

import type { CheckResult, RunResult } from "./types";

import { formatDuration } from "./utils/duration";

export function formatJsonOutput(result: RunResult) {
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
    totalDuration: result.totalDuration,
  };

  return JSON.stringify(output, null, 2);
}

const MAX_ITEMS_TO_DISPLAY = 10;

function formatItemList(items: string[], maxItems = MAX_ITEMS_TO_DISPLAY) {
  const lines: string[] = [];
  const itemsToShow = items.slice(0, maxItems);

  for (const item of itemsToShow) {
    lines.push(`     ${pc.dim(item)}`);
  }

  const remainingCount = items.length - maxItems;

  if (remainingCount > 0) {
    lines.push(`     ${pc.dim(`... and ${remainingCount} more`)}`);
  }

  return lines;
}

function formatInitialBaseline(check: CheckResult, isFirst: boolean) {
  const prefix = isFirst ? "" : "\n";
  const lines: string[] = [
    `${prefix}${pc.bold(check.checkId)}:`,
    `  Initial baseline created with ${pc.cyan(check.snapshot.items.length.toString())} issue(s)`,
  ];

  if (check.snapshot.items.length > 0) {
    lines.push(...formatItemList(check.snapshot.items));
  }

  if (check.duration !== undefined) {
    lines.push(`  ${pc.dim("Completed in")} ${formatDuration(check.duration)}`);
  }

  return lines;
}

function formatRegressions(check: CheckResult) {
  if (!check.hasRegression) {
    return [];
  }

  const lines = [
    `  ${pc.red(check.newItems.length.toString())} new issue(s) (regressions):`,
    ...formatItemList(check.newItems),
  ];

  return lines;
}

function formatImprovements(check: CheckResult) {
  if (!check.hasImprovement) {
    return [];
  }

  const lines = [
    `  ${pc.greenBright(check.removedItems.length.toString())} issue(s) fixed (improvements):`,
    ...formatItemList(check.removedItems),
  ];

  return lines;
}

function formatChangeBaseline(check: CheckResult, isFirst: boolean) {
  const prefix = isFirst ? "" : "\n";
  const lines = [
    `${prefix}${pc.bold(check.checkId)}:`,
    ...formatRegressions(check),
    ...formatImprovements(check),
  ];

  if (check.duration !== undefined) {
    lines.push(`  ${pc.dim("Completed in")} ${formatDuration(check.duration)}`);
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

  const summaryLines: string[] = [];

  if (hasAnyInitial) {
    summaryLines.push(pc.blue("Initial baseline created successfully."));
  } else if (result.hasRegression) {
    summaryLines.push(`${pc.red("Regressions detected.")} Run failed.`);
  } else if (result.hasImprovement) {
    summaryLines.push(
      `${pc.greenBright("Improvements detected.")} Baseline updated.`,
    );
  } else {
    summaryLines.push(pc.greenBright("All checks passed."));
  }

  if (result.totalDuration !== undefined) {
    summaryLines.push(
      `${pc.dim("Completed in")} ${formatDuration(result.totalDuration)}`,
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
