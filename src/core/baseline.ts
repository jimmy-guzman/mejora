import { mkdir, readFile, writeFile } from "node:fs/promises";

import { dirname } from "pathe";

import type { Baseline, BaselineEntry } from "@/types";

import { BASELINE_VERSION, DEFAULT_BASELINE_PATH } from "@/constants";
import { generateMarkdownReport } from "@/reports/markdown";
import isInCi from "@/utils/is-in-ci";
import { logger } from "@/utils/logger";

import { compareBaselines } from "./comparison";
import { resolveBaselineConflict } from "./conflict-resolver";

export class BaselineManager {
  private baselineDir: string;
  private baselinePath: string;
  private mdPath: string;

  constructor(baselinePath = DEFAULT_BASELINE_PATH) {
    this.baselinePath = baselinePath;
    this.baselineDir = dirname(baselinePath);
    this.mdPath = baselinePath.replace(".json", ".md");
  }

  /**
   * Apply multiple check updates in a single pass, copying the checks object at most once.
   */
  static batchUpdate(
    baseline: Baseline | null,
    updates: { checkId: string; entry: BaselineEntry }[],
  ) {
    const current = baseline ?? BaselineManager.create({});
    const newChecks = { ...current.checks };

    let changed = false;

    for (const { checkId, entry } of updates) {
      if (!compareBaselines(entry, current.checks[checkId])) {
        newChecks[checkId] = entry;
        changed = true;
      }
    }

    return changed ? { ...current, checks: newChecks } : current;
  }

  static create(checks: Record<string, BaselineEntry>) {
    return {
      checks,
      version: BASELINE_VERSION,
    };
  }

  static getEntry(baseline: Baseline | null, checkId: string) {
    return baseline?.checks[checkId];
  }

  static update(
    baseline: Baseline | null,
    checkId: string,
    entry: BaselineEntry,
  ) {
    const current = baseline ?? BaselineManager.create({});
    const existingEntry = current.checks[checkId];

    if (compareBaselines(entry, existingEntry)) {
      return current;
    }

    return {
      ...current,
      checks: {
        ...current.checks,
        [checkId]: entry,
      },
    };
  }

  async load() {
    try {
      const content = await readFile(this.baselinePath, "utf8");

      if (content.includes("<<<<<<<")) {
        logger.start("Merge conflict detected in baseline, auto-resolving...");
        const resolved = resolveBaselineConflict(content);

        await this.save(resolved, true);
        logger.success("Baseline conflict resolved");

        return resolved;
      }

      // TODO: consider using zod for validation and parsing
      const baseline = JSON.parse(content) as Baseline;

      await this.resolveMarkdownConflictIfNeeded(baseline);

      return baseline;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }

      throw error;
    }
  }

  async save(baseline: Baseline, force = false) {
    if (isInCi && !force) {
      return;
    }

    const jsonContent = `${JSON.stringify(baseline, null, 2)}\n`;
    const mdContent = generateMarkdownReport(baseline, this.baselineDir);

    await mkdir(this.baselineDir, { recursive: true });

    await Promise.all([
      writeFile(this.baselinePath, jsonContent, "utf8"),
      writeFile(this.mdPath, mdContent, "utf8"),
    ]);
  }

  private async resolveMarkdownConflictIfNeeded(baseline: Baseline) {
    try {
      const markdownContent = await readFile(this.mdPath, "utf8");

      if (markdownContent.includes("<<<<<<<")) {
        logger.start(
          "Merge conflict detected in markdown report, regenerating...",
        );

        const cleanMarkdown = generateMarkdownReport(
          baseline,
          this.baselineDir,
        );

        await writeFile(this.mdPath, cleanMarkdown, "utf8");

        logger.success("Markdown report regenerated");
      }
    } catch {
      // Markdown doesn't exist or can't be read, no problem
    }
  }
}
