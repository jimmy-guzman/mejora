import { relative } from "pathe";

import type { ESLintCheckConfig, IssueInput } from "@/types";

import { defineCheck } from "@/core/define-check";
import { createCacheKey, getCacheDir } from "@/utils/cache";

/**
 * Create an ESLint check for use with mejora().
 *
 * @param config - ESLint check configuration options including name.
 *
 * @returns A Check object for use with mejora().
 *
 * @example
 * ```ts
 * import { defineConfig, eslint } from "mejora";
 *
 * export default defineConfig({
 *   checks: [
 *     eslint({
 *       name: "no-console",
 *       files: ["src/**\/*.ts"],
 *       rules: { "no-console": "error" }
 *     })
 *   ]
 * });
 * ```
 */
export const eslint = defineCheck<ESLintCheckConfig>({
  async run(config) {
    const { ESLint } = await import("eslint");

    const cwd = process.cwd();
    const cacheDir = getCacheDir("eslint", cwd);
    const cacheKey = createCacheKey(config);

    const { concurrency, ...eslintConfig } = config;

    const rulesToTrack = new Set<string>();

    if (eslintConfig.rules) {
      for (const ruleId of Object.keys(eslintConfig.rules)) {
        rulesToTrack.add(ruleId);
      }
    }

    const hasRuleFilter = rulesToTrack.size > 0;

    const eslint = new ESLint({
      cache: true,
      cacheLocation: `${cacheDir}/${cacheKey}.eslintcache`,
      overrideConfig: eslintConfig,
      //  When concurrency is enabled, all options must be cloneable values (JSON values)
      ...(!hasRuleFilter && {
        concurrency: concurrency ?? "auto",
      }),
      ...(hasRuleFilter && {
        ruleFilter: ({ ruleId }) => rulesToTrack.has(ruleId),
      }),
    });

    const results = await eslint.lintFiles(eslintConfig.files);

    const rawItems: IssueInput[] = [];

    for (const { filePath, messages } of results) {
      const file = relative(cwd, filePath);

      for (const { column, line, message, ruleId } of messages) {
        if (!ruleId) continue;

        rawItems.push({
          column,
          file,
          line,
          message,
          rule: ruleId,
        });
      }
    }

    return rawItems;
  },

  async setup() {
    const cwd = process.cwd();
    const cacheDir = getCacheDir("eslint", cwd);
    const { mkdir } = await import("node:fs/promises");

    await mkdir(cacheDir, { recursive: true });
  },

  type: "eslint",

  async validate() {
    try {
      await import("eslint");
    } catch {
      throw new Error(
        'eslint check requires "eslint" package to be installed. Run: npm install eslint',
      );
    }
  },
});
