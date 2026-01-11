import { fileURLToPath } from "node:url";

import { Tinypool } from "tinypool";

import type {
  Baseline,
  CheckResult,
  CliOptions,
  Config,
  WorkerResult,
} from "@/types";

import { logger } from "@/utils/logger";
import { normalizeSnapshot } from "@/utils/snapshot";

import { BaselineManager } from "./baseline";
import { CheckRegistry } from "./check-registry";
import { compareSnapshots } from "./comparison";

const workerPath = fileURLToPath(new URL("workers/check.mjs", import.meta.url));

/**
 * Main runner class for executing code quality checks.
 */
export class Runner {
  private baselineManager: BaselineManager;
  private registry: CheckRegistry;

  constructor(registry: CheckRegistry, baselinePath?: string) {
    this.registry = registry;
    this.baselineManager = new BaselineManager(baselinePath);
  }

  private static async executeChecksParallel(
    checks: Config["checks"],
    baseline: Baseline | null,
  ) {
    const checkIds = Object.keys(checks);
    const pool = new Tinypool({ filename: workerPath });

    try {
      const workerPromises = checkIds.map(async (checkId) => {
        const workerResult = (await pool.run({ checkId })) as WorkerResult;

        const snapshot = normalizeSnapshot(workerResult.snapshot);
        const baselineEntry = BaselineManager.getEntry(baseline, checkId);
        const comparison = compareSnapshots(snapshot, baselineEntry);

        return {
          baseline: baselineEntry,
          checkId,
          duration: workerResult.duration,
          hasImprovement: comparison.hasImprovement,
          hasRegression: comparison.hasRegression,
          hasRelocation: comparison.hasRelocation,
          isInitial: comparison.isInitial,
          newIssues: comparison.newIssues,
          removedIssues: comparison.removedIssues,
          snapshot,
        };
      });

      return await Promise.all(workerPromises);
    } catch (error) {
      logger.error("Parallel execution failed:", error);

      return null;
    } finally {
      await pool.destroy();
    }
  }

  private static filterChecks = (
    checks: Config["checks"],
    options: CliOptions,
  ) => {
    const only = options.only
      ? Runner.resolveRegex(options.only, "--only")
      : null;
    const skip = options.skip
      ? Runner.resolveRegex(options.skip, "--skip")
      : null;

    if (!only && !skip) {
      return checks;
    }

    return Object.fromEntries(
      Object.entries(checks).filter(([key]) => {
        if (only && !only.test(key)) return false;

        if (skip?.test(key)) return false;

        return true;
      }),
    );
  };

  private static resolveRegex(pattern: string, option: "--only" | "--skip") {
    try {
      return new RegExp(pattern);
    } catch {
      throw new Error(`Invalid regex pattern for ${option}: "${pattern}"`);
    }
  }

  async run(config: Config, options: CliOptions = {}) {
    const startTime = performance.now();
    const baseline = await this.baselineManager.load();
    const checksToRun = Runner.filterChecks(config.checks, options);
    const checkCount = Object.keys(checksToRun).length;

    logger.start(
      `Running ${checkCount} check${checkCount === 1 ? "" : "s"}...`,
    );

    const results =
      checkCount > 1
        ? await Runner.executeChecksParallel(checksToRun, baseline)
        : await this.executeChecksSequential(checksToRun, baseline);

    if (!results) {
      return {
        exitCode: 2,
        hasImprovement: false,
        hasRegression: true,
        results: [],
        totalDuration: performance.now() - startTime,
      };
    }

    let updatedBaseline = baseline;
    let hasAnyRegression = false;
    let hasAnyImprovement = false;
    let hasAnyInitial = false;

    for (const result of results) {
      if (result.hasRegression) hasAnyRegression = true;

      if (result.hasImprovement) hasAnyImprovement = true;

      if (result.isInitial) hasAnyInitial = true;

      if (
        result.hasImprovement ||
        result.hasRelocation ||
        options.force ||
        result.isInitial
      ) {
        updatedBaseline = BaselineManager.update(
          updatedBaseline,
          result.checkId,
          {
            items: result.snapshot.items,
            type: result.snapshot.type,
          },
        );
      }
    }

    if (
      updatedBaseline &&
      updatedBaseline !== baseline &&
      (!hasAnyRegression || options.force || hasAnyInitial)
    ) {
      await this.baselineManager.save(updatedBaseline, options.force);
    }

    const exitCode = hasAnyRegression && !options.force ? 1 : 0;

    return {
      exitCode,
      hasImprovement: hasAnyImprovement,
      hasRegression: hasAnyRegression,
      results,
      totalDuration: performance.now() - startTime,
    };
  }

  private async executeChecksSequential(
    checks: Config["checks"],
    baseline: Baseline | null,
  ) {
    try {
      const requiredTypes = CheckRegistry.getRequiredTypes(checks);

      await Promise.all([
        this.registry.setup(requiredTypes),
        this.registry.validate(requiredTypes),
      ]);
    } catch (error) {
      logger.error("Setup failed:", error);

      return null;
    }

    const results: CheckResult[] = [];

    for (const [checkId, checkConfig] of Object.entries(checks)) {
      try {
        const startTime = performance.now();
        const runner = this.registry.get(checkConfig.type);
        const rawSnapshot = await runner.run(checkConfig);
        const duration = performance.now() - startTime;

        const snapshot = normalizeSnapshot(rawSnapshot);
        const baselineEntry = BaselineManager.getEntry(baseline, checkId);
        const comparison = compareSnapshots(snapshot, baselineEntry);

        results.push({
          baseline: baselineEntry,
          checkId,
          duration,
          hasImprovement: comparison.hasImprovement,
          hasRegression: comparison.hasRegression,
          hasRelocation: comparison.hasRelocation,
          isInitial: comparison.isInitial,
          newIssues: comparison.newIssues,
          removedIssues: comparison.removedIssues,
          snapshot,
        });
      } catch (error) {
        logger.error(`Error running check "${checkId}":`, error);

        return null;
      }
    }

    return results;
  }
}
