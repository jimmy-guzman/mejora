import type { Linter } from "eslint";
import type { CompilerOptions } from "typescript";

export interface Issue {
  /**
   * 1-indexed column number for display.
   */
  column: number;
  /**
   * Relative path from cwd.
   */
  file: string;
  /**
   * Hash of canonical representation.
   *
   * @example "a1b2c3d4e5f6g7h8i9j0"
   */
  id: string;
  /**
   * 1-indexed line number for display.
   */
  line: number;
  /**
   *  The message.
   */
  message: string;
  /**
   * Identifier for the issue (rule name, diagnostic code, etc).
   *
   * @example "no-nested-ternary" (ESLint)
   *
   * @example "TS2345" (TypeScript)
   */
  rule: string;
}

/**
 * Issue produced by a check runner.
 */
export type IssueInput = Omit<Issue, "id">;

type SnapshotType = "items";

export interface RawSnapshot {
  /**
   * Snapshot items (each item represents an issue produced by the check).
   */
  items: IssueInput[];
  type: SnapshotType;
}

export interface Snapshot {
  items: Issue[];
  type: SnapshotType;
}

export interface BaselineEntry {
  items: Issue[];
  type: SnapshotType;
}

export interface Baseline {
  checks: Record<string, BaselineEntry>;
  version: number;
}

/**
 * Configuration for an ESLint check.
 *
 * All ESLint configuration fields (rules, languageOptions, plugins, etc.)
 * are passed directly to ESLint's `overrideConfig` option.
 *
 * @example
 * ```ts
 * eslint({
 *   name: "no-console",
 *   files: ["src/**\/*.{ts,tsx}"],
 *   rules: {
 *     "no-console": "error",
 *   },
 * })
 * ```
 *
 * @example Advanced with custom parser
 * ```ts
 * eslint({
 *   name: "typescript-strict",
 *   files: ["src/**\/*.ts"],
 *   rules: {
 *     "@typescript-eslint/no-explicit-any": "error"
 *   },
 *   languageOptions: {
 *     parser: typescriptParser
 *   }
 * })
 * ```
 */
export interface ESLintCheckConfig extends Linter.Config {
  /**
   * Concurrency setting for ESLint.
   *
   * @see https://eslint.org/blog/2025/08/multithread-linting/#cli-multithreading-support
   *
   * @default "auto"
   */
  concurrency?: "auto" | "off" | number;

  /**
   * Glob patterns for files to lint.
   *
   * Passed directly to ESLint's `lintFiles()` method.
   *
   * @example ["src/**\/*.ts", "src/**\/*.tsx"]
   */
  files: string[];
}

/**
 * Configuration for a TypeScript diagnostics check.
 *
 * @example
 * ```ts
 * typescript({
 *   name: "strict",
 *   compilerOptions: {
 *     noImplicitAny: true,
 *   },
 * })
 * ```
 */
export interface TypeScriptCheckConfig {
  /**
   * Compiler options to merge with the base tsconfig.
   *
   * These options are merged with (not replacing) the compiler options
   * from your tsconfig file.
   */
  compilerOptions?: CompilerOptions;

  /**
   * Path to a TypeScript config file.
   *
   * If not provided, mejora will search for the nearest `tsconfig.json`
   * starting from the current working directory.
   *
   * @example "tsconfig.strict.json"
   */
  tsconfig?: string;
}

/**
 * A regex pattern configuration.
 */
export interface RegexPattern {
  /**
   * Human-readable message for matches.
   *
   * @example "TODO comment found"
   *
   * @example "console.log statement"
   *
   * @example (match) => `Found TODO at line ${match.index + 1}`
   */
  message?: ((match: RegExpExecArray) => string) | string;

  /**
   * The regex pattern to match.
   *
   * @example /\/\/\s*TODO:/gi
   *
   * @example /console\.log/g
   */
  pattern: RegExp;

  /**
   * Rule identifier for this pattern.
   * If not provided, uses the pattern source as the rule ID.
   *
   * @example "no-todos"
   *
   * @example "no-console-log"
   */
  rule?: string;
}

/**
 * Configuration for regex pattern matching check.
 */
export interface RegexCheckConfig {
  /**
   * Concurrency for processing files.
   *
   * @default 10
   */
  concurrency?: number;

  /**
   * Array of glob patterns for files to check.
   *
   * @example ["src/**\/*.ts", "lib/**\/*.js"]
   */
  files: string[];

  /**
   * Array of glob patterns to ignore.
   *
   * @default ["**\/node_modules/**", "**\/dist/**", "**\/.git/**"]
   */
  ignore?: string[];

  /**
   * Array of regex patterns to match.
   */
  patterns: RegexPattern[];
}

type CustomCheckConfig = Record<string, unknown> & { type: string };

export type CheckConfig =
  | (ESLintCheckConfig & { type: "eslint" })
  | (TypeScriptCheckConfig & { type: "typescript" })
  // eslint-disable-next-line perfectionist/sort-union-types -- keep related types together for better hover UX
  | CustomCheckConfig;

/**
 * A check object that can be passed to mejora().
 * Created by factory functions like eslint(), typescript(), regex(), or defineCheck().
 */
export interface Check {
  /**
   * Internal factory for creating the check runner.
   * Used by defineConfig() for auto-registration.
   *
   * @internal
   */
  __runnerFactory?: () => CheckRunner;

  /**
   * The underlying check configuration.
   */
  config: CheckConfig;

  /**
   * Unique identifier for this check.
   * Used in baseline tracking and output.
   */
  id: string;
}

/**
 * mejora configuration.
 *
 * Define checks to run and track for regressions.
 *
 * @example
 * ```ts
 * import { defineConfig, eslint, typescript } from "mejora";
 *
 * export default defineConfig({
 *   checks: [
 *     eslint({
 *       name: "no-nested-ternary",
 *       files: ["src/**\/*.{ts,tsx}"],
 *       rules: {
 *         "no-nested-ternary": "error",
 *       },
 *     }),
 *     typescript({
 *       name: "strict",
 *       compilerOptions: {
 *         noImplicitAny: true,
 *       },
 *     }),
 *   ]
 * });
 * ```
 */
export interface Config {
  /**
   * Array of checks to run.
   */
  checks: Check[];

  /**
   * Optional custom check runners.
   */
  runners?: CheckRunner[];
}

export interface CheckResult {
  baseline: BaselineEntry | undefined;
  checkId: string;
  /**
   * Duration of the check run in milliseconds.
   */
  duration?: number;
  hasImprovement: boolean;
  hasRegression: boolean;
  /**
   * Indicates whether any issues were relocated (i.e., their
   * file, line, or column changed) compared to the baseline.
   */
  hasRelocation: boolean;
  isInitial: boolean;
  newIssues: Issue[];
  removedIssues: Issue[];
  snapshot: Snapshot;
}

export interface RunResult {
  exitCode: number;
  hasImprovement: boolean;
  hasRegression: boolean;
  results: CheckResult[];
  /**
   * Total duration of the run in milliseconds.
   */
  totalDuration?: number;
}

export interface CliOptions {
  force?: boolean | undefined;
  json?: boolean | undefined;
  only?: string | undefined;
  skip?: string | undefined;
}

/**
 * Result returned from worker thread after running a check.
 */
export interface WorkerResult {
  duration: number;
  snapshot: RawSnapshot;
}

/**
 * Interface that all check runners must implement.
 *
 * Each check type (eslint, typescript, custom) implements this interface
 * to provide consistent lifecycle hooks for execution.
 */
export interface CheckRunner<TConfig = unknown> {
  /**
   * Execute the check and return a snapshot of issues.
   *
   * @param config - Check-specific configuration
   *
   * @returns Snapshot containing all issues found
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

/**
 * Custom check definition for defineCheck().
 */
export interface CustomCheckDefinition<
  TConfig extends Record<string, unknown> = Record<string, unknown>,
> {
  /**
   * Optional default configuration values.
   * These will be merged with user-provided config.
   */
  defaults?: Partial<TConfig>;

  /**
   * Execute the check and return violations.
   *
   * @param config - The full check configuration object
   *
   * @returns Array of violations found
   */
  run(config: TConfig): Promise<IssueInput[]>;

  /**
   * Setup any infrastructure needed for this check type.
   * Called once per type during runner setup, in parallel with other checks.
   *
   * Examples: creating cache directories, initializing compilation state.
   *
   * Optional - not all checks need infrastructure setup.
   */
  setup?(): Promise<void>;

  /**
   * Unique identifier for this check type.
   * Multiple check instances can share the same type and runner.
   *
   * @example "eslint"
   *
   * @example "typescript"
   *
   * @example "no-hardcoded-urls"
   */
  type: string;

  /**
   * Validate that all dependencies for this check type are available.
   * Called once per type during runner setup before any checks execute.
   *
   * Should throw a descriptive error if dependencies are missing.
   *
   * @throws {Error} If required dependencies are not installed
   */
  validate?(): Promise<void>;
}
