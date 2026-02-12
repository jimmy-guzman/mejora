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
  private baselinePath: string;

  constructor(baselinePath = DEFAULT_BASELINE_PATH) {
    this.baselinePath = baselinePath;
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

      await this.resolveMarkdownConflictIfNeeded(content);

      // TODO: consider using zod for validation and parsing
      return JSON.parse(content) as Baseline;
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
    const mdPath = this.baselinePath.replace(".json", ".md");
    const baselineDir = dirname(this.baselinePath);
    const mdContent = generateMarkdownReport(baseline, baselineDir);

    await mkdir(dirname(this.baselinePath), { recursive: true });

    await Promise.all([
      writeFile(this.baselinePath, jsonContent, "utf8"),
      writeFile(mdPath, mdContent, "utf8"),
    ]);
  }

  private async resolveMarkdownConflictIfNeeded(baselineContent: string) {
    const markdownPath = this.baselinePath.replace(".json", ".md");

    try {
      const markdownContent = await readFile(markdownPath, "utf8");

      if (markdownContent.includes("<<<<<<<")) {
        logger.start(
          "Merge conflict detected in markdown report, regenerating...",
        );

        const baseline = JSON.parse(baselineContent) as Baseline;
        const baselineDir = dirname(this.baselinePath);
        const cleanMarkdown = generateMarkdownReport(baseline, baselineDir);

        await writeFile(markdownPath, cleanMarkdown, "utf8");

        logger.success("Markdown report regenerated");
      }
    } catch {
      // Markdown doesn't exist or can't be read, no problem
    }
  }
}
