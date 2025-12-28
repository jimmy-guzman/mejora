import { consola } from "consola";

import type { CheckResult, CliOptions, Config } from "./types";

import { BaselineManager } from "./baseline";
import { runEslintCheck } from "./checks/eslint";
import { runTypescriptCheck } from "./checks/typescript";
import { compareSnapshots } from "./comparison";

export class MejoraRunner {
  private baselineManager: BaselineManager;

  constructor(baselinePath?: string) {
    this.baselineManager = new BaselineManager(baselinePath);
  }

  private static filterChecks(checks: Config["checks"], options: CliOptions) {
    let filtered = { ...checks };

    if (options.only) {
      const pattern = new RegExp(options.only);

      filtered = Object.fromEntries(
        Object.entries(filtered).filter(([key]) => pattern.test(key)),
      );
    }

    if (options.skip) {
      const pattern = new RegExp(options.skip);

      filtered = Object.fromEntries(
        Object.entries(filtered).filter(([key]) => !pattern.test(key)),
      );
    }

    return filtered;
  }

  private static async runCheck(checkConfig: Config["checks"][string]) {
    if (checkConfig.type === "eslint") {
      return runEslintCheck(checkConfig);
    }

    return runTypescriptCheck(checkConfig);
  }

  async run(config: Config, options: CliOptions = {}) {
    const overallStartTime = performance.now();
    const baseline = await this.baselineManager.load();
    const results: CheckResult[] = [];

    let hasAnyRegression = false;
    let hasAnyImprovement = false;
    let hasAnyInitial = false;
    let updatedBaseline = baseline;

    const checksToRun = MejoraRunner.filterChecks(config.checks, options);

    for (const [checkId, checkConfig] of Object.entries(checksToRun)) {
      try {
        const checkStartTime = performance.now();
        const snapshot = await MejoraRunner.runCheck(checkConfig);
        const checkDuration = performance.now() - checkStartTime;

        const baselineEntry = BaselineManager.getEntry(baseline, checkId);
        const comparison = compareSnapshots(snapshot, baselineEntry);

        const result = {
          baseline: baselineEntry,
          checkId,
          duration: checkDuration,
          hasImprovement: comparison.hasImprovement,
          hasRegression: comparison.hasRegression,
          isInitial: comparison.isInitial,
          newItems: comparison.newItems,
          removedItems: comparison.removedItems,
          snapshot,
        };

        results.push(result);

        if (comparison.hasRegression) {
          hasAnyRegression = true;
        }
        if (comparison.hasImprovement) {
          hasAnyImprovement = true;
        }
        if (comparison.isInitial) {
          hasAnyInitial = true;
        }

        if (
          comparison.hasImprovement ||
          options.force ||
          comparison.isInitial
        ) {
          updatedBaseline = BaselineManager.update(updatedBaseline, checkId, {
            items: snapshot.items,
            type: snapshot.type,
          });
        }
      } catch (error) {
        consola.error(`Error running check "${checkId}":`, error);

        return {
          exitCode: 2,
          hasImprovement: false,
          hasRegression: true,
          results,
          totalDuration: performance.now() - overallStartTime,
        };
      }
    }

    if (
      updatedBaseline &&
      updatedBaseline !== baseline &&
      (!hasAnyRegression || options.force || hasAnyInitial)
    ) {
      await this.baselineManager.save(updatedBaseline, options.force);
    }

    let exitCode = 0;

    if (hasAnyRegression && !options.force) {
      exitCode = 1;
    }

    const totalDuration = performance.now() - overallStartTime;

    return {
      exitCode,
      hasImprovement: hasAnyImprovement,
      hasRegression: hasAnyRegression,
      results,
      totalDuration,
    };
  }
}
