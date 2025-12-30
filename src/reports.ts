import { relative } from "node:path";

import type { Baseline } from "./types";

import { plural } from "./utils/text";

function generateItemLine(item: string, href: string, displayPath: string) {
  const [pathWithLocation, ...rest] = item.split(" - ");
  const parts = pathWithLocation?.split(":");
  const line = parts?.[1];

  const linkPath = line ? `${href}#L${line}` : href;
  const lineDisplay = line ? `Line ${line}` : displayPath;
  const description = rest.length > 0 ? ` - ${rest.join(" - ")}` : "";

  return `- [${lineDisplay}](${linkPath})${description}\n`;
}

function groupItemsByFile(items: string[]) {
  const itemsByFile = new Map<string, string[]>();

  for (const item of items) {
    const [pathWithLocation] = item.split(" - ");
    // TODO: Path parsing may break on Windows drive-letter paths.
    const parts = pathWithLocation?.split(":");
    const filePath = parts?.[0];

    // TODO: Items without a parsable path are silently dropped.
    if (filePath) {
      if (!itemsByFile.has(filePath)) {
        itemsByFile.set(filePath, []);
      }
      itemsByFile.get(filePath)?.push(item);
    }
  }

  return itemsByFile;
}

function generateFileSection(
  filePath: string,
  fileItems: string[],
  cwd: string,
  baselineDir: string,
) {
  const displayPath = relative(cwd, filePath);
  const href = relative(baselineDir, filePath);

  let section = `### [${displayPath}](${href}) (${fileItems.length})\n`;

  for (const item of fileItems) {
    section += generateItemLine(item, href, displayPath);
  }

  section += "\n";

  return section;
}

function generateCheckSection(
  checkId: string,
  items: string[],
  cwd: string,
  baselineDir: string,
) {
  const issueCount = items.length;
  let section = `## ${checkId} (${issueCount} ${plural(issueCount, "issue")})\n\n`;

  if (items.length === 0) {
    section += "No issues\n";

    return section;
  }

  const sortedEntries = [...groupItemsByFile(items).entries()].toSorted(
    ([a], [b]) => a.localeCompare(b),
  );

  for (const [filePath, fileItems] of sortedEntries) {
    section += generateFileSection(filePath, fileItems, cwd, baselineDir);
  }

  return section;
}

export function generateMarkdownReport(
  baseline: Baseline,
  baselineDir: string,
) {
  const cwd = process.cwd();
  const entries = Object.entries(baseline.checks);

  let markdown = "# Mejora Baseline\n\n";

  for (const [index, [checkId, { items = [] }]] of entries.entries()) {
    const isLast = index === entries.length - 1;

    markdown += generateCheckSection(checkId, items, cwd, baselineDir);

    if (!isLast) {
      markdown += "\n";
    }
  }

  return markdown;
}
