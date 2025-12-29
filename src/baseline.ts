import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import isInCi from "is-in-ci";

import type { Baseline, BaselineEntry } from "./types";

import { generateMarkdownReport } from "./reports";
import { logger } from "./utils/logger";

const DEFAULT_BASELINE_PATH = ".mejora/baseline.json";

export class BaselineManager {
  private baselinePath: string;

  constructor(baselinePath: string = DEFAULT_BASELINE_PATH) {
    this.baselinePath = baselinePath;
  }

  static create(checks: Record<string, BaselineEntry>) {
    return {
      checks,
      version: 1,
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

    return {
      ...current,
      checks: {
        ...current.checks,
        [checkId]: entry,
      },
    };
  }

  private static extractBaseline(partialJson: string): Baseline {
    try {
      const trimmed = partialJson.trim();

      const fullJson = `{
  "version": 1,
  ${trimmed}
}`;

      return JSON.parse(fullJson) as Baseline;
    } catch (error) {
      throw new Error(
        `Failed to parse baseline during conflict resolution: ${error instanceof Error ? error.message : "Unknown error"}`,
        { cause: error },
      );
    }
  }

  private static parseConflictMarkers(content: string) {
    const regex = /<<<<<<< .*\n([\s\S]*?)\n=======\n([\s\S]*?)\n>>>>>>> .*\n/;
    const match = regex.exec(content);

    if (!match) {
      throw new Error("Could not parse conflict markers in baseline");
    }

    const [_, ours = "", theirs = ""] = match;

    return { ours, theirs };
  }

  private static resolveConflict(content: string): Baseline {
    const sections = BaselineManager.parseConflictMarkers(content);
    const ours = BaselineManager.extractBaseline(sections.ours);
    const theirs = BaselineManager.extractBaseline(sections.theirs);

    return BaselineManager.unionMerge(ours, theirs);
  }

  private static unionMerge(ours: Baseline, theirs: Baseline): Baseline {
    const merged: Baseline = {
      checks: {},
      version: 1,
    };

    const allCheckIds = new Set([
      ...Object.keys(ours.checks),
      ...Object.keys(theirs.checks),
    ]);

    for (const checkId of allCheckIds) {
      const ourItems = new Set(ours.checks[checkId]?.items);
      const theirItems = new Set(theirs.checks[checkId]?.items);

      const mergedItems = new Set([...ourItems, ...theirItems]);

      const type =
        ours.checks[checkId]?.type ?? theirs.checks[checkId]?.type ?? "items";

      merged.checks[checkId] = {
        items: [...mergedItems].toSorted(),
        type,
      };
    }

    return merged;
  }

  async load() {
    try {
      const content = await readFile(this.baselinePath, "utf8");

      const hasMergeConflict = content.includes("<<<<<<<");

      if (hasMergeConflict) {
        logger.start("Merge conflict detected in baseline, auto-resolving...");

        const resolved = BaselineManager.resolveConflict(content);

        await this.save(resolved);

        logger.success("Baseline conflict resolved");

        return resolved;
      }

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
}
