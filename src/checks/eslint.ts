import { relative } from "pathe";

import type { RawDiagnosticItem } from "@/checks/utils";
import type { ESLintCheckConfig } from "@/types";

import { assignStableIds, sortByLocation } from "@/checks/utils";
import { createCacheKey, ensureCacheDir } from "@/utils/cache";

// TODO: what about version
export async function validateEslintDeps() {
  try {
    await import("eslint");
  } catch {
    throw new Error(`ESLint check requires eslint but it's not installed.`);
  }
}

export async function runEslintCheck(config: ESLintCheckConfig) {
  const { ESLint } = await import("eslint");

  const cwd = process.cwd();
  const cacheDir = await ensureCacheDir(cwd, "eslint");
  const cacheKey = createCacheKey(config);

  const eslint = new ESLint({
    cache: true,
    cacheLocation: `${cacheDir}/${cacheKey}.eslintcache`,
    concurrency: "auto",
    overrideConfig: config.overrides,
  });

  const results = await eslint.lintFiles(config.files);

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

  const items = assignStableIds(rawItems);

  return {
    items: items.toSorted(sortByLocation),
    type: "items" as const,
  };
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
