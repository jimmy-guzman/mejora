import { relative } from "pathe";

import type { Baseline, DiagnosticItem } from "../types";

import { plural } from "../utils/text";

const UNPARSABLE = "__unparsable__";

function escapeHtml(text: string) {
  return text
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("[", "&#91;")
    .replaceAll("]", "&#93;");
}

function createRelativePath(filePath: string, cwd: string) {
  return relative(cwd, filePath);
}

function createHref(filePath: string, baselineDir: string, line?: number) {
  const href = relative(baselineDir, filePath);

  return line ? `${href}#L${line}` : href;
}

function createMarkdownLink(text: string, href: string) {
  return `[${text}](${href})`;
}

function formatItemLine(
  item: DiagnosticItem,
  cwd: string,
  baselineDir: string,
) {
  const displayPath = createRelativePath(item.file, cwd);
  const href = createHref(item.file, baselineDir, item.line);
  const linkText = item.line ? `Line ${item.line}` : displayPath;
  const link = createMarkdownLink(linkText, href);

  const description = `${item.rule}: ${escapeHtml(item.message)}`;

  return `- ${link} - ${description}\n`;
}

function groupItemsByFile(items: DiagnosticItem[]) {
  const grouped = Object.groupBy(items, (item) => item.file || UNPARSABLE);

  return Object.entries(grouped)
    .map(([filePath, items = []]) => ({ filePath, items }))
    .toSorted((a, b) => {
      if (a.filePath === UNPARSABLE) return 1;

      if (b.filePath === UNPARSABLE) return -1;

      return a.filePath.localeCompare(b.filePath);
    });
}

function formatUnparsableSection(items: DiagnosticItem[]) {
  let section = `\n### Other Issues (${items.length})\n\n`;

  for (const item of items) {
    section += `- ${item.rule}: ${escapeHtml(item.message)}\n`;
  }

  return `${section}\n`;
}

function formatFileSection(
  fileGroup: {
    filePath: string;
    items: DiagnosticItem[];
  },
  cwd: string,
  baselineDir: string,
) {
  if (fileGroup.filePath === UNPARSABLE) {
    return formatUnparsableSection(fileGroup.items);
  }

  const displayPath = createRelativePath(fileGroup.filePath, cwd);
  const href = createHref(fileGroup.filePath, baselineDir);
  const link = createMarkdownLink(displayPath, href);

  let section = `\n### ${link} (${fileGroup.items.length})\n\n`;

  for (const item of fileGroup.items) {
    section += formatItemLine(item, cwd, baselineDir);
  }

  return `${section}\n`;
}

function formatCheckSection(
  checkId: string,
  items: DiagnosticItem[],
  cwd: string,
  baselineDir: string,
) {
  const issueCount = items.length;
  const issueText = plural(issueCount, "issue");

  let section = `\n## ${checkId} (${issueCount} ${issueText})\n\n`;

  if (items.length === 0) {
    return `${section}No issues\n`;
  }

  const fileGroups = groupItemsByFile(items);

  for (const fileGroup of fileGroups) {
    section += formatFileSection(fileGroup, cwd, baselineDir);
  }

  return section;
}

function normalizeMarkdown(markdown: string) {
  return `${markdown.replaceAll(/\n{3,}/g, "\n\n").trimEnd()}\n`;
}

/**
 * Generates a Markdown report from the given baseline.
 *
 * @param baseline - The baseline data containing checks and their diagnostic items.
 *
 * @param baselineDir - The directory where the baseline is stored. Used to create relative links.
 *
 * @returns The generated Markdown report.
 */
export function generateMarkdownReport(
  baseline: Baseline,
  baselineDir: string,
) {
  const cwd = process.cwd();

  let markdown =
    "# Mejora Baseline\n\n" +
    "This file represents the current accepted state of the codebase.\n";

  for (const [checkId, { items = [] }] of Object.entries(baseline.checks)) {
    markdown += formatCheckSection(checkId, items, cwd, baselineDir);
  }

  return normalizeMarkdown(markdown);
}
