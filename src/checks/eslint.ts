import { relative } from "pathe";

import type { CheckRunner } from "@/check-runner";
import type { RawDiagnosticItem } from "@/checks/utils";
import type { ESLintCheckConfig } from "@/types";

import { createCacheKey, getCacheDir } from "@/utils/cache";

/**
 * Check runner for ESLint.
 */
export class ESLintCheckRunner implements CheckRunner {
  readonly type = "eslint";

  // TODO: does this need to be unknown or can it be ESLintCheckConfig?
  run = async (config: unknown) => {
    const eslintConfig = config as ESLintCheckConfig;
    const { ESLint } = await import("eslint");

    const cwd = process.cwd();
    const cacheDir = getCacheDir(this.type, cwd);
    const cacheKey = createCacheKey(eslintConfig);

    const eslint = new ESLint({
      cache: true,
      cacheLocation: `${cacheDir}/${cacheKey}.eslintcache`,
      concurrency: eslintConfig.concurrency ?? "auto",
      overrideConfig: eslintConfig.overrides,
    });

    const results = await eslint.lintFiles(eslintConfig.files);

    const rawItems: RawDiagnosticItem[] = [];

    for (const { filePath, messages } of results) {
      const file = relative(cwd, filePath);

      for (const { column, line, message, ruleId } of messages) {
        if (!ruleId) continue;

        const signature = `${file} - ${ruleId}: ${message}` as const;

        rawItems.push({
          column,
          file,
          line,
          message,
          rule: ruleId,
          signature,
        });
      }
    }

    return {
      items: rawItems,
      type: "items" as const,
    };
  };

  async setup() {
    const cwd = process.cwd();
    const cacheDir = getCacheDir(this.type, cwd);
    const { mkdir } = await import("node:fs/promises");

    await mkdir(cacheDir, { recursive: true });
  }

  async validate() {
    try {
      await import("eslint");
    } catch {
      throw new Error(
        `${this.type} check requires "eslint" package to be installed. Run: npm install eslint`,
      );
    }
  }
}

/**
 * Create an ESLint check configuration.
 *
 * @param config - ESLint check configuration options.
 *
 * @returns An ESLint check configuration object.
 */
export function eslintCheck(config: ESLintCheckConfig) {
  return {
    type: "eslint" as const,
    ...config,
  };
}
