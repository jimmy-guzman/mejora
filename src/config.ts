import { pathToFileURL } from "node:url";

import { lilconfig } from "lilconfig";

import type { CheckRunner } from "./check-runner";
import type { ESLintCheckRunner } from "./runners/eslint";
import type { TypeScriptCheckRunner } from "./runners/typescript";
import type { Config } from "./types";

const loader = async (filepath: string) => {
  const url = pathToFileURL(filepath).href;
  const imported: unknown = await import(url);

  if (imported && typeof imported === "object" && "default" in imported) {
    return imported.default;
  }

  return imported;
};

type ExtractRunnerByType<
  TRunners extends readonly CheckRunner[],
  TType extends string,
> = Extract<TRunners[number], { type: TType }>;

type ExtractConfig<TRunner> = TRunner extends CheckRunner<infer C> ? C : never;

type CheckConfig<
  TRunners extends readonly CheckRunner[],
  TType extends TRunners[number]["type"],
> = ExtractConfig<ExtractRunnerByType<TRunners, TType>> & {
  type: TType;
};

type InternalRunners = readonly [ESLintCheckRunner, TypeScriptCheckRunner];

/**
 * Define mejora configuration.
 *
 * @param config - mejora configuration object.
 *
 * @param config.runners - Optional array of custom check runners to register.
 *
 * @param config.checks - Map of check names to their configurations.
 *
 * @returns The provided configuration object.
 */
export function defineConfig<
  const TRunners extends readonly CheckRunner[],
>(config: {
  checks: Record<
    string,
    CheckConfig<
      [...InternalRunners, ...TRunners],
      [...InternalRunners, ...TRunners][number]["type"]
    >
  >;
  runners?: TRunners;
}) {
  return config;
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
