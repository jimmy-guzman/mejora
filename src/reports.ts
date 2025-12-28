import { relative } from "node:path";

import type { Baseline } from "./types";

export function generateMarkdownReport(
  baseline: Baseline,
  baselineDir: string,
) {
  let md = "# Mejora Baseline\n\n";

  const entries = Object.entries(baseline.checks);

  for (let i = 0; i < entries.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- this is fine because of the loop condition
    const [checkId, { items = [] }] = entries[i]!;
    const isLast = i === entries.length - 1;

    md += `## ${checkId}\n\n`;

    if (items.length === 0) {
      md += "No issues\n";
    } else {
      for (const item of items) {
        const [pathWithLocation, ...rest] = item.split(" - ");

        const parts = pathWithLocation?.split(":");
        const filePath = parts?.[0];
        const line = parts?.[1];

        if (filePath) {
          const relativePath = relative(baselineDir, filePath);
          const linkPath = line ? `${relativePath}#L${line}` : relativePath;

          md += `- [${pathWithLocation}](${linkPath}) - ${rest.join(" - ")}\n`;
        }
      }
    }

    if (!isLast) {
      md += "\n";
    }
  }

  return md;
}
