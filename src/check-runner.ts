import type { RawSnapshot } from "./types";

/**
 * Interface that all check runners must implement.
 *
 * Each check type (eslint, typescript, custom) implements this interface
 * to provide consistent lifecycle hooks for execution.
 */
export interface CheckRunner<TConfig = unknown> {
  /**
   * Execute the check and return a snapshot of findings.
   *
   * @param config - Check-specific configuration
   *
   * @returns Snapshot containing all findings found
   */
  run(config: TConfig): Promise<RawSnapshot>;

  /**
   * Setup any infrastructure needed for this check.
   * Called once during runner setup, in parallel with other checks.
   *
   * Examples: creating cache directories, initializing compilation state.
   *
   * Optional - not all checks need infrastructure setup.
   */
  setup?(): Promise<void>;

  /**
   * Unique identifier for this check type.
   * Must match the `type` field in CheckConfig.
   *
   * @example "eslint"
   *
   * @example "typescript"
   */
  readonly type: string;

  /**
   * Validate that all dependencies for this check are available.
   * Called once during runner setup before any checks execute.
   *
   * Should throw a descriptive error if dependencies are missing.
   *
   * @throws {Error} If required dependencies are not installed
   */
  validate?(): Promise<void>;
}
