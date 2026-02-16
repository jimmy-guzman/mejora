import { pathToFileURL } from "node:url";

import { lilconfig } from "lilconfig";

import type { Check, CheckRunner, Config } from "@/types";

const loader = async (filepath: string) => {
  const url = pathToFileURL(filepath).href;
  const imported: unknown = await import(url);

  if (imported && typeof imported === "object" && "default" in imported) {
    return imported.default;
  }

  return imported;
};

/**
 * Define a mejora configuration.
 *
 * @param config - Configuration object
 *
 * @param config.checks - Array of checks to run
 *
 * @returns A mejora configuration object
 *
 * @example
 * ```ts
 * import { defineConfig, eslint, typescript, regex } from "mejora";
 *
 * export default defineConfig({
 *   checks: [
 *     eslint({
 *       name: "no-console",
 *       files: ["src/**\/*.ts"],
 *       overrides: {
 *         rules: { "no-console": "error" }
 *       }
 *     }),
 *     typescript({
 *       name: "strict",
 *       overrides: {
 *         compilerOptions: { noImplicitAny: true }
 *       }
 *     }),
 *     regex({
 *       name: "no-todos",
 *       files: ["**\/*"],
 *       patterns: [{ pattern: /TODO/g }]
 *     })
 *   ]
 * });
 * ```
 */
export function defineConfig(config: { checks: Check[] }): Config {
  const runners: CheckRunner[] = [];
  const seen = new Set<string>();

  for (const check of config.checks) {
    const checkWithFactory = check as Check & {
      __runnerFactory?: () => CheckRunner;
    };

    if (checkWithFactory.__runnerFactory && !seen.has(check.config.type)) {
      seen.add(check.config.type);
      const runner = checkWithFactory.__runnerFactory();

      runners.push(runner);
    }
  }

  const result: Config = {
    checks: config.checks,
  };

  if (runners.length > 0) {
    result.runners = runners;
  }

  return result;
}

export const loadConfig = async () => {
  const explorer = lilconfig("mejora", {
    loaders: {
      ".js": loader,
      ".mjs": loader,
      ".mts": loader,
      ".ts": loader,
    },
    searchPlaces: [
      "mejora.config.ts",
      "mejora.config.mts",
      "mejora.config.js",
      "mejora.config.mjs",
    ],
  });

  const result = await explorer.search(process.cwd());

  if (!result?.config) {
    throw new Error("No configuration file found.");
  }

  // TODO: consider adding schema validation like zod in a future iteration
  return result.config as Config;
};
