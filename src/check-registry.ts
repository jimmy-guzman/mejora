import type { CheckRunner } from "./check-runner";

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

  /**
   * Register a check runner.
   *
   * @param runner - The check runner to register
   *
   * @throws {Error} If a runner with the same type is already registered
   */
  register(runner: CheckRunner) {
    if (this.runners.has(runner.type)) {
      throw new Error(`Check runner already registered: ${runner.type}`);
    }

    this.runners.set(runner.type, runner);
  }

  /**
   * Setup infrastructure for all required check types.
   * Runs setup in parallel if multiple types need it.
   *
   * @param types - Set of check types to setup
   */
  setupInfrastructure = async (types: Set<string>) => {
    const setupPromises: Promise<void>[] = [];

    for (const type of types) {
      const runner = this.get(type);
      const setupPromise = runner.setup?.();

      if (setupPromise) {
        setupPromises.push(setupPromise);
      }
    }

    await Promise.all(setupPromises);
  };

  /**
   * Validate all dependencies for the given check types.
   * Runs validation in parallel and throws on first failure.
   *
   * @param types - Set of check types to validate
   *
   * @throws {Error} If any validation fails
   */
  validateDependencies = async (types: Set<string>) => {
    const validations: Promise<void>[] = [];

    for (const type of types) {
      const validation = this.get(type).validate?.();

      if (validation) validations.push(validation);
    }

    await Promise.all(validations);
  };
}
