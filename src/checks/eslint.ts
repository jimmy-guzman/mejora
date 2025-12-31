import { relative } from "pathe";

import type { ESLintCheckConfig } from "@/types";

import { ensureCacheDir, makeCacheKey } from "@/utils/cache";

type Item = `${string}:${number}:${number} - ${string}`;

const createItem = ({
  column,
  cwd,
  filePath,
  line,
  ruleId,
}: {
  column: number;
  cwd: string;
  filePath: string;
  line: number;
  ruleId: string;
}) => `${relative(cwd, filePath)}:${line}:${column} - ${ruleId}` as const;

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

  const eslint = new ESLint({
    cache: true,
    cacheLocation: `${cacheDir}/${makeCacheKey(config)}`,
    concurrency: "auto",
    overrideConfig: config.overrides,
  });

  const results = await eslint.lintFiles(config.files);
  const items: Item[] = [];

  for (const { filePath, messages } of results) {
    for (const { column, line, ruleId } of messages) {
      if (ruleId) {
        const item = createItem({ column, cwd, filePath, line, ruleId });

        items.push(item);
      }
    }
  }

  return {
    items: items.toSorted(),
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
