import type { CheckRunner, Config } from "@/types";

import { ESLintCheckRunner } from "@/runners/eslint";
import { RegexCheckRunner } from "@/runners/regex";
import { TypeScriptCheckRunner } from "@/runners/typescript";

/**
 * Registry for managing check runners.
 *
 * Provides registration, lookup, and lifecycle management for all check types.
 */
export class CheckRegistry {
  private runners = new Map<string, CheckRunner>();

  /**
   * Get unique check types from a set of check configs.
   *
   * @param checks - Record of check configs
   *
   * @returns Set of unique check types used in the configs
   */
  static getRequiredTypes(checks: Record<string, { type: string }>) {
    return new Set(Object.values(checks).map((c) => c.type));
  }

  /**
   * Get a registered check runner by type.
   *
   * @param type - The check type (e.g., "eslint", "typescript")
   *
   * @returns The check runner
   *
   * @throws {Error} If no runner is registered for the given type
   */
  get(type: string) {
    const runner = this.runners.get(type);

    if (!runner) {
      throw new Error(`Unknown check type: ${type}`);
    }

    return runner;
  }

  /**
   * Get all registered check types.
   *
   * @returns Set of all registered check type identifiers
   */
  getTypes() {
    return new Set(this.runners.keys());
  }

  /**
   * Check if a runner is registered for the given type.
   *
   * @param type - The check type to check
   *
   * @returns True if a runner is registered for this type
   */
  has(type: string) {
    return this.runners.has(type);
  }

  init(config: Pick<Config, "runners"> = {}) {
    this.register(new ESLintCheckRunner());
    this.register(new TypeScriptCheckRunner());
    this.register(new RegexCheckRunner());

    if (config.runners) {
      for (const runner of config.runners) {
        this.register(runner);
      }
    }
  }

  /**
   * Register a check runner.
   *
   * @param runner - The check runner to register
   */
  register(runner: CheckRunner) {
    if (this.runners.has(runner.type)) {
      return;
    }

    this.runners.set(runner.type, runner);
  }

  /**
   * Setup all required check types.
   *
   * @param types - Set of check types to setup
   *
   * @throws {Error} If any setup fails
   */
  async setup(types: Set<string>) {
    await this.runLifecycle(types, "setup");
  }

  /**
   * Validate all required check types.
   *
   * @param types - Set of check types to validate
   *
   * @throws {Error} If any validation fails
   */
  async validate(types: Set<string>) {
    await this.runLifecycle(types, "validate");
  }

  /**
   * Run an optional lifecycle method on all check runners of given types.
   * Executes in parallel and waits for all to complete.
   *
   * @param types - Set of check types to operate on
   *
   * @param name - Name of the optional method to invoke
   */
  private async runLifecycle(types: Set<string>, name: "setup" | "validate") {
    const promises: Promise<void>[] = [];

    for (const type of types) {
      const runner = this.get(type);
      const promise = runner[name]?.();

      if (promise) {
        promises.push(promise);
      }
    }

    await Promise.all(promises);
  }
}
