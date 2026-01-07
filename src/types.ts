import type { Linter } from "eslint";
import type { CompilerOptions } from "typescript";

import type { CheckRunner } from "./check-runner";

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
 * @example
 * ```ts
 * eslint({
 *   files: ["src/**\/*.{ts,tsx}"],
 *   overrides: {
 *     rules: {
 *       "no-nested-ternary": "error",
 *     },
 *   },
 * })
 * ```
 */
export interface ESLintCheckConfig {
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

  /**
   * ESLint configuration to merge with the base config.
   *
   * This is passed to ESLint's `overrideConfig` option and merged with
   * your existing ESLint configuration.
   *
   * Can be a single config object or an array of config objects.
   *
   * @example
   * ```ts
   * {
   *   rules: {
   *     "no-console": "error",
   *   },
   * }
   * ```
   */
  overrides?: Linter.Config | Linter.Config[];
}

/**
 * Configuration for a TypeScript diagnostics check.
 *
 * @example
 * ```ts
 * typescript({
 *   overrides: {
 *     compilerOptions: {
 *       noImplicitAny: true,
 *     },
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
  overrides?: {
    compilerOptions?: CompilerOptions;
  };

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
 * mejora configuration.
 *
 * Define checks to run and track for regressions.
 *
 * @example
 * ```ts
 * import { defineConfig, eslint, typescript } from "mejora";
 *
 * export default defineConfig({
 *   checks: {
 *     "eslint > no-nested-ternary": eslint({
 *       files: ["src/**\/*.{ts,tsx}"],
 *       overrides: {
 *         rules: {
 *           "no-nested-ternary": "error",
 *         },
 *       },
 *     }),
 *     "typescript": typescript({
 *       overrides: {
 *         compilerOptions: {
 *           noImplicitAny: true,
 *         },
 *       },
 *     }),
 *   },
 * });
 * ```
 */
export interface Config {
  /**
   * Check definitions.
   *
   * Each key is a check identifier used in the baseline and output.
   * The identifier can contain any characters.
   *
   * Use `eslint()` and `typescript()` helpers to create check configs.
   *
   * @example
   * ```ts
   * {
   *   "eslint > no-console": eslint({ ... }),
   *   "typescript": typescriptCheck({ ... }),
   * }
   * ```
   */
  checks: Record<string, CheckConfig>;

  /**
   * Runners to register custom check types.
   *
   * Built-in checks (eslint, typescript) are always available.
   *
   * @example
   * ```ts
   * {
   *   runners: [myCustomRunner()],
   *   checks: {
   *     "custom": myCheck({ ... })
   *   }
   * }
   * ```
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
