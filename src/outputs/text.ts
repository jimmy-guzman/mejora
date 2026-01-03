import { basename, dirname } from "pathe";

import type { CheckResult, DiagnosticItem, RunResult } from "@/types";

import { blue, bold, dim, gray, green, red, underline } from "@/utils/colors";
import { duration } from "@/utils/duration";
import { plural } from "@/utils/text";

import { average } from "./average";

const MAX_ITEMS_TO_DISPLAY = 10;
const ITEM_INDENT = "     ";
const MESSAGE_INDENT = `${ITEM_INDENT}  `;
const SECTION_INDENT = "  ";
const SUMMARY_INDENT = "  ";
const METADATA_INDENT = "    ";
const SECTION_BREAK = "";

type Kind = "improvement" | "initial" | "regression";

function formatItemArrow(kind: Kind) {
  if (kind === "initial") {
    return dim("→");
  }

  if (kind === "improvement") {
    return green("↑");
  }

  return red("↓");
}

function formatLocation(file: string, line: number, column: number) {
  const dir = dirname(file);
  const name = basename(file);

  const position = line > 0 ? `:${line}:${column > 0 ? column : 1}` : "";

  const dirPart = dir === "." ? "" : dim(`${dir}/`);
  const namePart = underline(name);
  const posPart = position ? dim(position) : "";

  return `${dirPart}${namePart}${posPart}`;
}

function formatItem(item: DiagnosticItem, kind: Kind) {
  const arrow = formatItemArrow(kind);
  const location = formatLocation(item.file, item.line, item.column);
  const code = dim(item.rule);

  return [`${arrow} ${location}  ${code}`, item.message];
}

function formatItemList(items: DiagnosticItem[], kind: Kind) {
  const lines: string[] = [];

  const itemsToShow = items.slice(0, MAX_ITEMS_TO_DISPLAY);

  for (const item of itemsToShow) {
    const [head, message] = formatItem(item, kind);

    lines.push(`${ITEM_INDENT}${head}`, `${MESSAGE_INDENT}${message}`);
  }

  const remainingCount = items.length - itemsToShow.length;

  if (remainingCount > 0) {
    lines.push(`${ITEM_INDENT}${dim(`... and ${remainingCount} more`)}`);
  }

  return lines;
}

function formatDuration(checkDuration?: number) {
  if (checkDuration === undefined) return [];

  return [`${SECTION_INDENT}${dim("Duration")}  ${duration(checkDuration)}`];
}

function formatIssueCount(count: number) {
  return [`${METADATA_INDENT}${dim("Issues")}  ${bold(count)}`];
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
    `${SECTION_INDENT}${red(count)} new ${plural(count, "issue")} (${plural(count, "regression")}):`,
    ...formatItemList(check.newItems, "regression"),
  ];
}

function formatImprovements(check: CheckResult) {
  if (!check.hasImprovement) return [];

  const count = check.removedItems.length;

  return [
    `${SECTION_INDENT}${green(count)} ${plural(count, "issue")} fixed (${plural(count, "improvement")}):`,
    ...formatItemList(check.removedItems, "improvement"),
  ];
}

function formatInitialBaseline(check: CheckResult, isFirst: boolean) {
  const prefix = isFirst ? "" : "\n";
  const count = check.snapshot.items.length;

  const lines = [
    `${prefix}${blue("ℹ")} ${check.checkId}:`,
    `${SECTION_INDENT}Initial baseline created with ${blue(count)} ${plural(count, "issue")}`,
  ];

  if (check.snapshot.items.length > 0) {
    lines.push(...formatItemList(check.snapshot.items, "initial"));
  }

  lines.push(SECTION_BREAK, ...formatMetadata(check));

  return lines;
}

function formatChangeBaseline(check: CheckResult, isFirst: boolean) {
  const prefix = isFirst ? "" : "\n";
  const symbol = check.hasRegression ? red("✖") : green("✔");

  const lines = [
    `${prefix}${symbol} ${check.checkId}:`,
    ...formatRegressions(check),
    ...formatImprovements(check),
    SECTION_BREAK,
    ...formatMetadata(check),
  ];

  return lines;
}

function formatUnchanged(check: CheckResult, isFirst: boolean) {
  const prefix = isFirst ? "" : "\n";
  const count = check.snapshot.items.length;

  if (check.duration !== undefined) {
    return [
      `${prefix}${gray("ℹ")} ${check.checkId} (${bold(count)}) ${dim(duration(check.duration))}`,
    ];
  }

  return [`${prefix}${gray("ℹ")} ${check.checkId} (${bold(count)})`];
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
    `${SUMMARY_INDENT}${dim("Improvements")}  ${green(acc.totalImprovements)}`,
    `${SUMMARY_INDENT} ${dim("Regressions")}  ${red(acc.totalRegressions)}`,
    `${SUMMARY_INDENT}     ${dim("Initial")}  ${blue(acc.totalInitial)}`,
    `${SUMMARY_INDENT}      ${dim("Checks")}  ${result.results.length}`,
    `${SUMMARY_INDENT}      ${dim("Issues")}  ${bold(acc.totalIssues)}`,
  ];

  const avgDuration = average(result.totalDuration, result.results.length);

  if (result.totalDuration !== undefined && avgDuration !== undefined) {
    summaryLines.push(
      `${SUMMARY_INDENT}    ${dim("Duration")}  ${duration(result.totalDuration)} ${gray(
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
    lines.push(SECTION_BREAK);
  }

  lines.push(formatSummary(result));

  return lines.join("\n");
}
