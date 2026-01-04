import type { Linter } from "eslint";
import type { CompilerOptions } from "typescript";

import type { CheckRunner } from "./check-runner";

/**
 * Diagnostic item without an ID.
 *
 * This is what users provide when creating custom checks.
 * The ID will be auto-generated using a stable hashing algorithm
 * that groups items by signature and assigns IDs based on position.
 */
export type DiagnosticItemInput = Omit<DiagnosticItem, "id">;

export interface DiagnosticItem {
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
   *  The diagnostic message.
   */
  message: string;
  /**
   * Rule identifier.
   *
   * @example "no-nested-ternary" (ESLint)
   *
   * @example "TS2345" (TypeScript)
   */
  rule: string;
}

interface ItemsSnapshot {
  /**
   * Diagnostic items found by the check.
   *
   * IDs will be auto-generated if not provided.
   */
  items: DiagnosticItemInput[];
  type: "items";
}

export type Snapshot = ItemsSnapshot;

interface NormalizedItemsSnapshot {
  items: DiagnosticItem[];
  type: "items";
}

export type NormalizedSnapshot = NormalizedItemsSnapshot;

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

export type CheckConfig =
  | (ESLintCheckConfig & {
      type: "eslint";
    })
  | (TypeScriptCheckConfig & {
      type: "typescript";
    })
  | {
      [key: string]: unknown;
      type: string;
    };

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
   * Plugins to register custom check types.
   *
   * Built-in checks (eslint, typescript) are always available.
   *
   * @example
   * ```ts
   * {
   *   plugins: [myCustomPlugin()],
   *   checks: {
   *     "custom": myCheck({ ... })
   *   }
   * }
   * ```
   */
  plugins?: CheckRunner[];
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
   * Indicates whether any diagnostic items were relocated (i.e., their
   * file, line, or column changed) compared to the baseline.
   */
  hasRelocation: boolean;
  isInitial: boolean;
  newItems: DiagnosticItem[];
  removedItems: DiagnosticItem[];
  snapshot: NormalizedSnapshot;
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
