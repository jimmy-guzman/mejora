import type { Snapshot } from "./types";

/**
 * Interface that all check runners must implement.
 *
 * Each check type (eslint, typescript, custom) implements this interface
 * to provide consistent lifecycle hooks for execution.
 */
export interface CheckRunner {
  /**
   * Execute the check and return a snapshot of diagnostic items.
   *
   * @param config - Check-specific configuration
   *
   * @returns Snapshot containing all diagnostic items found
   */
  run(config: unknown): Promise<Snapshot>;

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
