import { relative } from "pathe";

import type { Baseline } from "./types";

import { plural } from "./utils/text";

function parsePathWithLocation(pathWithLocation: string | undefined) {
  if (!pathWithLocation) return { filePath: undefined, line: undefined };

  const parts = pathWithLocation.split(":");
  const filePath = parts[0];
  const line = parts[1];

  return { filePath, line };
}

function generateItemLine(item: string, href: string, displayPath: string) {
  const [pathWithLocation, ...rest] = item.split(" - ");
  const { line } = parsePathWithLocation(pathWithLocation);

  const linkPath = line ? `${href}#L${line}` : href;
  const lineDisplay = line ? `Line ${line}` : displayPath;
  const description = rest.length > 0 ? ` - ${rest.join(" - ")}` : "";

  return `- [${lineDisplay}](${linkPath})${description}\n`;
}

function groupItemsByFile(items: string[]) {
  const itemsByFile = new Map<string, string[]>();
  const unparsableItems: string[] = [];

  for (const item of items) {
    const [pathWithLocation] = item.split(" - ");

    const { filePath } = parsePathWithLocation(pathWithLocation);

    if (filePath) {
      if (!itemsByFile.has(filePath)) {
        itemsByFile.set(filePath, []);
      }
      itemsByFile.get(filePath)?.push(item);
    } else {
      unparsableItems.push(item);
    }
  }

  if (unparsableItems.length > 0) {
    itemsByFile.set("__unparsable__", unparsableItems);
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
  let section = `\n### [${displayPath}](${href}) (${fileItems.length})\n\n`;

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
  let section = `\n## ${checkId} (${issueCount} ${plural(issueCount, "issue")})\n\n`;

  if (items.length === 0) {
    section += "No issues\n";

    return section;
  }

  const itemsByFile = groupItemsByFile(items);
  const unparsableItems = itemsByFile.get("__unparsable__");

  itemsByFile.delete("__unparsable__");

  const sortedEntries = [...itemsByFile.entries()].toSorted(([a], [b]) => {
    return a.localeCompare(b);
  });

  for (const [filePath, fileItems] of sortedEntries) {
    section += generateFileSection(filePath, fileItems, cwd, baselineDir);
  }

  if (unparsableItems && unparsableItems.length > 0) {
    section += `\n### Other Issues (${unparsableItems.length})\n\n`;

    for (const item of unparsableItems) {
      section += `- ${item}\n`;
    }

    section += "\n";
  }

  return section;
}

export function generateMarkdownReport(
  baseline: Baseline,
  baselineDir: string,
) {
  const cwd = process.cwd();
  const entries = Object.entries(baseline.checks);
  let markdown = "# Mejora Baseline\n";

  for (const [checkId, { items = [] }] of entries) {
    markdown += generateCheckSection(checkId, items, cwd, baselineDir);
  }

  return markdown;
}
