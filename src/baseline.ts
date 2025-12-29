import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import isInCi from "is-in-ci";

import type { Baseline, BaselineEntry } from "./types";

import { generateMarkdownReport } from "./reports";

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

  async load() {
    try {
      const content = await readFile(this.baselinePath, "utf8");

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
