import type { Linter } from "eslint";
import type { CompilerOptions } from "typescript";

export interface DiagnosticItem {
  /**
   * Diagnostic error code.
   * - For ESLint, this is the rule ID.
   * - For TypeScript, this is the TS error code.
   *
   * @example "no-nested-ternary" (for ESLint)
   *
   * @example "TS2345" (for TypeScript)
   */
  code: string;
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
   */
  id: string;
  /**
   * 1-indexed line number for display.
   */
  line: number;
  /**
   *  The diagnostic message.
   */
  message: string;
}

export interface ItemsSnapshot {
  items: DiagnosticItem[];
  type: "items";
}

export type Snapshot = ItemsSnapshot;

export interface BaselineEntry {
  items?: DiagnosticItem[];
  type: Snapshot["type"];
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

export type CheckConfig =
  | (ESLintCheckConfig & {
      type: "eslint";
    })
  | (TypeScriptCheckConfig & {
      type: "typescript";
    });

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
   *   "typescript": typescript({ ... }),
   * }
   * ```
   */
  checks: Record<string, CheckConfig>;
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
  hasRelocation: boolean;
  isInitial: boolean;
  newItems: DiagnosticItem[];
  removedItems: DiagnosticItem[];
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
