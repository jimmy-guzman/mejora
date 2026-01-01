import type { CheckResult, DiagnosticItem, RunResult } from "@/types";

import { blue, bold, dim, gray, green, red } from "@/utils/colors";
import { duration } from "@/utils/duration";
import { plural } from "@/utils/text";

import { average } from "./average";

const MAX_ITEMS_TO_DISPLAY = 10;

function formatItem(item: DiagnosticItem) {
  const location = item.line > 0 ? `${item.file}:${item.line}` : item.file;

  return `${location} - ${item.code}: ${item.message}`;
}

function formatItemList(
  items: DiagnosticItem[],
  maxItems = MAX_ITEMS_TO_DISPLAY,
) {
  const lines: string[] = [];
  const itemsToShow = items.slice(0, maxItems);

  for (const item of itemsToShow) {
    lines.push(`     ${dim(formatItem(item))}`);
  }

  const remainingCount = items.length - maxItems;

  if (remainingCount > 0) {
    lines.push(`     ${dim(`... and ${remainingCount} more`)}`);
  }

  return lines;
}

function formatDuration(checkDuration?: number) {
  if (checkDuration === undefined) return [];

  return [`  ${dim("Duration")}  ${duration(checkDuration)}`];
}

function formatIssueCount(count: number) {
  return [`    ${dim("Issues")}  ${bold(count)}`];
}

function formatMetadata(check: CheckResult) {
  return [
    ...formatDuration(check.duration),
    ...formatIssueCount(check.snapshot.items.length),
  ];
}

function formatRegressions(check: CheckResult) {
  if (!check.hasRegression) return [];

  const count = check.newItems.length;

  return [
    `  ${red(count)} new ${plural(count, "issue")} (${plural(count, "regression")}):`,
    ...formatItemList(check.newItems),
  ];
}

function formatImprovements(check: CheckResult) {
  if (!check.hasImprovement) return [];

  const count = check.removedItems.length;

  return [
    `  ${green(count)} ${plural(count, "issue")} fixed (${plural(count, "improvement")}):`,
    ...formatItemList(check.removedItems),
  ];
}

function formatInitialBaseline(check: CheckResult, isFirst: boolean) {
  const prefix = isFirst ? "" : "\n";
  const count = check.snapshot.items.length;

  const lines = [
    `${prefix}${check.checkId}:`,
    `  Initial baseline created with ${blue(count)} ${plural(count, "issue")}`,
  ];

  if (check.snapshot.items.length > 0) {
    lines.push(...formatItemList(check.snapshot.items));
  }

  lines.push("", ...formatMetadata(check));

  return lines;
}

function formatChangeBaseline(check: CheckResult, isFirst: boolean) {
  const prefix = isFirst ? "" : "\n";

  const lines = [
    `${prefix}${check.checkId}:`,
    ...formatRegressions(check),
    ...formatImprovements(check),
    "",
    ...formatMetadata(check),
  ];

  return lines;
}

function formatUnchanged(check: CheckResult, isFirst: boolean) {
  const prefix = isFirst ? "" : "\n";
  const count = check.snapshot.items.length;

  if (check.duration !== undefined) {
    return [
      `${prefix}${check.checkId} (${bold(count)}) ${dim(duration(check.duration))}`,
    ];
  }

  return [`${prefix}${check.checkId} (${bold(count)})`];
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

function formatStatusMessage(result: RunResult, hasAnyInitial: boolean) {
  if (hasAnyInitial) {
    return blue("✔ Initial baseline created successfully");
  }

  if (result.hasRegression) {
    return `${red("✗ Regressions detected")} - Run failed`;
  }

  if (result.hasImprovement) {
    return `${green("✔ Improvements detected")} - Baseline updated`;
  }

  return green("✔ All checks passed");
}

function formatSummary(result: RunResult) {
  const acc = {
    hasAnyInitial: false,
    totalImprovements: 0,
    totalInitial: 0,
    totalIssues: 0,
    totalRegressions: 0,
  };

  for (const check of result.results) {
    const issueCount = check.snapshot.items.length;

    acc.totalIssues += issueCount;

    if (check.isInitial) {
      acc.hasAnyInitial = true;
      acc.totalInitial += issueCount;
      continue;
    }

    const { hasImprovement, hasRegression } = check;

    if (hasImprovement) {
      acc.totalImprovements += check.removedItems.length;
    }

    if (hasRegression) {
      acc.totalRegressions += check.newItems.length;
    }
  }

  const summaryLines = [
    `  ${dim("Improvements")}  ${green(acc.totalImprovements)}`,
    `   ${dim("Regressions")}  ${red(acc.totalRegressions)}`,
    `       ${dim("Initial")}  ${blue(acc.totalInitial)}`,
    `        ${dim("Checks")}  ${result.results.length}`,
    `        ${dim("Issues")}  ${bold(acc.totalIssues)}`,
  ];

  const avgDuration = average(result.totalDuration, result.results.length);

  if (result.totalDuration !== undefined && avgDuration !== undefined) {
    summaryLines.push(
      `      ${dim("Duration")}  ${duration(result.totalDuration)} ${gray(
        `(avg ${duration(avgDuration)})`,
      )}`,
    );
  }

  summaryLines.push("", formatStatusMessage(result, acc.hasAnyInitial));

  return summaryLines.join("\n");
}

export function formatTextOutput(result: RunResult) {
  const lines: string[] = [];

  for (const [index, check] of result.results.entries()) {
    lines.push(...formatCheckResult(check, index === 0));
  }

  if (lines.length > 0) {
    lines.push("");
  }

  lines.push(formatSummary(result));

  return lines.join("\n");
}
