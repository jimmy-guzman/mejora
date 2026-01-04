import { relative } from "pathe";

import type { Baseline, Finding } from "../types";

import { plural } from "../utils/text";

const UNPARSABLE = "__unparsable__";

function escapeHtml(text: string) {
  return text
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("[", "&#91;")
    .replaceAll("]", "&#93;");
}

function createHref(filePath: string, baselineDir: string, line?: number) {
  const href = relative(baselineDir, filePath);

  return line ? `${href}#L${line}` : href;
}

function createMarkdownLink(text: string, href: string) {
  return `[${text}](${href})`;
}

function formatItemLine(item: Finding, baselineDir: string) {
  const href = createHref(item.file, baselineDir, item.line);
  const linkText = item.line ? `Line ${item.line}` : item.file;
  const link = createMarkdownLink(linkText, href);

  const description = `${item.rule}: ${escapeHtml(item.message)}`;

  return `- ${link} - ${description}`;
}

function groupItemsByFile(items: Finding[]) {
  const grouped = Object.groupBy(items, (item) => item.file || UNPARSABLE);

  return Object.entries(grouped)
    .map(([filePath, items = []]) => ({ filePath, items }))
    .toSorted((a, b) => {
      if (a.filePath === UNPARSABLE) return 1;

      if (b.filePath === UNPARSABLE) return -1;

      return a.filePath.localeCompare(b.filePath);
    });
}

function formatUnparsableSection(items: Finding[]) {
  const lines = [`\n### Other Issues (${items.length})\n`];

  for (const item of items) {
    lines.push(`- ${item.rule}: ${escapeHtml(item.message)}`);
  }

  lines.push("");

  return lines.join("\n");
}

function formatFileSection(
  fileGroup: {
    filePath: string;
    items: Finding[];
  },
  baselineDir: string,
) {
  if (fileGroup.filePath === UNPARSABLE) {
    return formatUnparsableSection(fileGroup.items);
  }

  const href = createHref(fileGroup.filePath, baselineDir);
  const link = createMarkdownLink(fileGroup.filePath, href);

  const lines = [`\n### ${link} (${fileGroup.items.length})\n`];

  for (const item of fileGroup.items) {
    lines.push(formatItemLine(item, baselineDir));
  }

  lines.push("");

  return lines.join("\n");
}

function formatCheckSection(
  checkId: string,
  items: Finding[],
  baselineDir: string,
) {
  const issueCount = items.length;
  const issueText = plural(issueCount, "issue");

  const lines = [`\n## ${checkId} (${issueCount} ${issueText})\n`];

  if (items.length === 0) {
    lines.push("No issues");

    return lines.join("\n");
  }

  const fileGroups = groupItemsByFile(items);

  for (const fileGroup of fileGroups) {
    lines.push(formatFileSection(fileGroup, baselineDir));
  }

  return lines.join("\n");
}

function normalizeMarkdown(markdown: string) {
  return `${markdown.replaceAll(/\n{3,}/g, "\n\n").trimEnd()}\n`;
}

/**
 * Generates a Markdown report from the given baseline.
 *
 * @param baseline - The baseline data containing checks and their findings.
 *
 * @param baselineDir - The directory where the baseline is stored. Used to create relative links.
 *
 * @returns The generated Markdown report.
 */
export function generateMarkdownReport(
  baseline: Baseline,
  baselineDir: string,
) {
  const sections = [
    "<!-- prettier-ignore-start -->\n",
    "# Mejora Baseline\n",
    "This file represents the current accepted state of the codebase.",
  ];

  for (const [checkId, { items = [] }] of Object.entries(baseline.checks)) {
    sections.push(formatCheckSection(checkId, items, baselineDir));
  }

  sections.push("\n<!-- prettier-ignore-end -->");

  return normalizeMarkdown(sections.join("\n"));
}
