import { pathToFileURL } from "node:url";

import { lilconfig } from "lilconfig";

import type { Config } from "./types";

const loader = async (filepath: string) => {
  const url = pathToFileURL(filepath).href;
  const imported: unknown = await import(url);

  if (imported && typeof imported === "object" && "default" in imported) {
    return imported.default;
  }

  return imported;
};

/**
 * Define mejora configuration.
 *
 * @param config - mejora configuration object.
 *
 * @returns The provided configuration object.
 */
export const defineConfig = (config: Config) => {
  return config;
};

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
