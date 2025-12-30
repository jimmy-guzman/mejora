import { relative } from "pathe";

import type { Baseline } from "./types";

import { plural } from "./utils/text";

const UNPARSABLE = "__unparsable__";

function escapeHtml(text: string) {
  return text
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("[", "&#91;")
    .replaceAll("]", "&#93;");
}

function parsePathWithLocation(pathWithLocation?: string) {
  if (!pathWithLocation) return { filePath: undefined, line: undefined };

  const [filePath, line] = pathWithLocation.split(":");

  return { filePath, line };
}

function parseItem(item: string) {
  const [pathWithLocation, ...rest] = item.split(" - ");
  const description = rest.join(" - ");

  return { description, pathWithLocation };
}

function createRelativePath(filePath: string, cwd: string) {
  return relative(cwd, filePath);
}

function createHref(filePath: string, baselineDir: string, line?: string) {
  const href = relative(baselineDir, filePath);

  return line ? `${href}#L${line}` : href;
}

function createMarkdownLink(text: string, href: string) {
  return `[${text}](${href})`;
}

function formatItemLine(
  item: string,
  filePath: string,
  cwd: string,
  baselineDir: string,
) {
  const { description, pathWithLocation } = parseItem(item);
  const { line } = parsePathWithLocation(pathWithLocation);

  const displayPath = createRelativePath(filePath, cwd);
  const href = createHref(filePath, baselineDir, line);
  const linkText = line ? `Line ${line}` : displayPath;
  const link = createMarkdownLink(linkText, href);
  const suffix = description ? ` - ${escapeHtml(description)}` : "";

  return `- ${link}${suffix}\n`;
}

function groupItemsByFile(items: string[]) {
  const grouped = Object.groupBy(items, (item) => {
    const { pathWithLocation } = parseItem(item);
    const { filePath = UNPARSABLE } = parsePathWithLocation(pathWithLocation);

    return filePath;
  });

  return Object.entries(grouped)
    .map(([filePath, items = []]) => ({ filePath, items }))
    .toSorted((a, b) => {
      if (a.filePath === UNPARSABLE) return 1;
      if (b.filePath === UNPARSABLE) return -1;

      return a.filePath.localeCompare(b.filePath);
    });
}

function formatUnparsableSection(items: string[]) {
  let section = `\n### Other Issues (${items.length})\n\n`;

  for (const item of items) {
    section += `- ${item}\n`;
  }

  return `${section}\n`;
}

function formatFileSection(
  fileGroup: {
    filePath: string;
    items: string[];
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
    section += formatItemLine(item, fileGroup.filePath, cwd, baselineDir);
  }

  return `${section}\n`;
}

function formatCheckSection(
  checkId: string,
  items: string[],
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
  return markdown.replaceAll(/\n{3,}/g, "\n\n");
}

export function generateMarkdownReport(
  baseline: Baseline,
  baselineDir: string,
) {
  const cwd = process.cwd();
  let markdown = "# Mejora Baseline\n";

  for (const [checkId, { items = [] }] of Object.entries(baseline.checks)) {
    markdown += formatCheckSection(checkId, items, cwd, baselineDir);
  }

  return normalizeMarkdown(markdown);
}
