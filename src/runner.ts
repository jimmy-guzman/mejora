import { mkdir } from "node:fs/promises";

import { resolve } from "pathe";

import type { CheckResult, CliOptions, Config } from "./types";

import { BaselineManager } from "./baseline";
import { runEslintCheck } from "./checks/eslint";
import { runTypescriptCheck } from "./checks/typescript";
import { compareSnapshots } from "./comparison";
import { logger } from "./utils/logger";

/**
 * Main runner class for executing code quality checks.
 */
export class MejoraRunner {
  private baselineManager: BaselineManager;

  constructor(baselinePath?: string) {
    this.baselineManager = new BaselineManager(baselinePath);
  }

  private static filterChecks(checks: Config["checks"], options: CliOptions) {
    const only = options.only
      ? MejoraRunner.resolveRegex(options.only, "--only")
      : null;
    const skip = options.skip
      ? MejoraRunner.resolveRegex(options.skip, "--skip")
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
  }

  private static getRequiredCheckTypes(checks: Config["checks"]) {
    return new Set(Object.values(checks).map((c) => c.type));
  }

  private static resolveRegex(pattern: string, option: "--only" | "--skip") {
    try {
      return new RegExp(pattern);
    } catch {
      throw new Error(`Invalid regex pattern for ${option}: "${pattern}"`);
    }
  }

  private static async runCheck(checkConfig: Config["checks"][string]) {
    if (checkConfig.type === "eslint") {
      return runEslintCheck(checkConfig);
    }

    return runTypescriptCheck(checkConfig);
  }

  private static async setupInfrastructure(checks: Config["checks"]) {
    const cwd = process.cwd();
    const cacheRoot = resolve(cwd, "node_modules", ".cache", "mejora");

    const checkTypes = MejoraRunner.getRequiredCheckTypes(checks);

    const dirs = [
      cacheRoot,
      ...[...checkTypes].map((type) => resolve(cacheRoot, type)),
    ];

    await Promise.all(dirs.map((dir) => mkdir(dir, { recursive: true })));
  }

  private static async validateAllDeps(checks: Config["checks"]) {
    const checkTypes = MejoraRunner.getRequiredCheckTypes(checks);
    const validations = [];

    if (checkTypes.has("eslint")) {
      validations.push(import("eslint"));
    }

    if (checkTypes.has("typescript")) {
      validations.push(import("typescript"));
    }

    await Promise.all(validations);
  }

  async run(config: Config, options: CliOptions = {}) {
    const startTime = performance.now();
    const baseline = await this.baselineManager.load();
    const checksToRun = MejoraRunner.filterChecks(config.checks, options);

    try {
      await Promise.all([
        MejoraRunner.setupInfrastructure(checksToRun),
        MejoraRunner.validateAllDeps(checksToRun),
      ]);
    } catch (error) {
      logger.error("Setup failed:", error);

      return {
        exitCode: 2,
        hasImprovement: false,
        hasRegression: true,
        results: [],
        totalDuration: performance.now() - startTime,
      };
    }

    const checkCount = Object.keys(checksToRun).length;

    logger.start(
      `Running ${checkCount} check${checkCount === 1 ? "" : "s"}...`,
    );

    const checkResults = await this.executeChecks(checksToRun, baseline);

    if (!checkResults) {
      return {
        exitCode: 2,
        hasImprovement: false,
        hasRegression: true,
        results: [],
        totalDuration: performance.now() - startTime,
      };
    }

    const { flags, results, updatedBaseline } = this.buildResults(
      checkResults,
      baseline,
      options,
    );

    if (
      updatedBaseline &&
      updatedBaseline !== baseline &&
      (!flags.hasAnyRegression || options.force || flags.hasAnyInitial)
    ) {
      await this.baselineManager.save(updatedBaseline, options.force);
    }

    const exitCode = flags.hasAnyRegression && !options.force ? 1 : 0;

    return {
      exitCode,
      hasImprovement: flags.hasAnyImprovement,
      hasRegression: flags.hasAnyRegression,
      results,
      totalDuration: performance.now() - startTime,
    };
  }

  private buildResults(
    checkResults: NonNullable<Awaited<ReturnType<typeof this.executeChecks>>>,
    initialBaseline: Awaited<ReturnType<typeof this.baselineManager.load>>,
    options: CliOptions,
  ) {
    const results: CheckResult[] = [];

    let updatedBaseline = initialBaseline;
    let hasAnyRegression = false;
    let hasAnyImprovement = false;
    let hasAnyInitial = false;

    for (const {
      baselineEntry,
      checkId,
      comparison,
      duration,
      snapshot,
    } of checkResults) {
      results.push({
        baseline: baselineEntry,
        checkId,
        duration,
        hasImprovement: comparison.hasImprovement,
        hasRegression: comparison.hasRegression,
        hasRelocation: comparison.hasRelocation,
        isInitial: comparison.isInitial,
        newItems: comparison.newItems,
        removedItems: comparison.removedItems,
        snapshot,
      });

      if (comparison.hasRegression) hasAnyRegression = true;

      if (comparison.hasImprovement) hasAnyImprovement = true;

      if (comparison.isInitial) hasAnyInitial = true;

      if (
        comparison.hasImprovement ||
        comparison.hasRelocation ||
        options.force ||
        comparison.isInitial
      ) {
        updatedBaseline = BaselineManager.update(updatedBaseline, checkId, {
          items: snapshot.items,
          type: snapshot.type,
        });
      }
    }

    return {
      flags: { hasAnyImprovement, hasAnyInitial, hasAnyRegression },
      results,
      updatedBaseline,
    };
  }

  private async executeChecks(
    checks: Config["checks"],
    baseline: Awaited<ReturnType<typeof this.baselineManager.load>>,
  ) {
    const checkPromises = Object.entries(checks).map(
      async ([checkId, checkConfig]) => {
        try {
          const startTime = performance.now();
          const snapshot = await MejoraRunner.runCheck(checkConfig);
          const duration = performance.now() - startTime;

          const baselineEntry = BaselineManager.getEntry(baseline, checkId);
          const comparison = compareSnapshots(snapshot, baselineEntry);

          return {
            baselineEntry,
            checkId,
            comparison,
            duration,
            snapshot,
          };
        } catch (error) {
          logger.error(`Error running check "${checkId}":`, error);
          throw error;
        }
      },
    );

    try {
      return await Promise.all(checkPromises);
    } catch {
      return null;
    }
  }
}
