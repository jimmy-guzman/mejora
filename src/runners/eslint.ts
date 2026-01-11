import { relative } from "pathe";

import type { CheckRunner, ESLintCheckConfig, IssueInput  } from "@/types";

import { createCacheKey, getCacheDir } from "@/utils/cache";

/**
 * Check runner for ESLint.
 */
export class ESLintCheckRunner implements CheckRunner {
  readonly type = "eslint";

  async run(eslintConfig: ESLintCheckConfig) {
    const { ESLint } = await import("eslint");

    const cwd = process.cwd();
    const cacheDir = getCacheDir(this.type, cwd);
    const cacheKey = createCacheKey(eslintConfig);

    const rulesToTrack = new Set<string>();

    if (eslintConfig.overrides) {
      const configs = Array.isArray(eslintConfig.overrides)
        ? eslintConfig.overrides
        : [eslintConfig.overrides];

      for (const config of configs) {
        if (config.rules) {
          for (const ruleId of Object.keys(config.rules)) {
            rulesToTrack.add(ruleId);
          }
        }
      }
    }

    const hasRuleFilter = rulesToTrack.size > 0;

    const eslint = new ESLint({
      cache: true,
      cacheLocation: `${cacheDir}/${cacheKey}.eslintcache`,
      overrideConfig: eslintConfig.overrides,
      //  When concurrency is enabled, all options must be cloneable values (JSON values)
      ...(!hasRuleFilter && {
        concurrency: eslintConfig.concurrency ?? "auto",
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

    return {
      items: rawItems,
      type: "items" as const,
    };
  }

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
