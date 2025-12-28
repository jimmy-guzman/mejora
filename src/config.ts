import { pathToFileURL } from "node:url";

import { lilconfig } from "lilconfig";

import type { Config } from "./types";

const loadTs = async (filepath: string) => {
  const url = pathToFileURL(filepath).href;
  const imported: unknown = await import(url);

  if (imported && typeof imported === "object" && "default" in imported) {
    return imported.default;
  }

  return imported;
};

export const defineConfig = (config: Config) => {
  return config;
};

export const loadConfig = async () => {
  const explorer = lilconfig("mejora", {
    loaders: {
      ".mts": loadTs,
      ".ts": loadTs,
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

  return result.config as Config;
};
