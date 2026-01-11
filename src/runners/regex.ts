import { createReadStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { createInterface } from "node:readline/promises";

import { join } from "pathe";

import type { CheckRunner, IssueInput, RegexCheckConfig } from "@/types";

import {
  createCacheKey,
  getCacheDir,
  getFileHash,
  loadCache,
  saveCache,
} from "@/utils/cache";
import { resolveIgnorePatterns } from "@/utils/ignore-patterns";
import { poolMap } from "@/utils/pool-map";

interface RegexCacheEntry {
  hash: string;
  items: IssueInput[];
}

type RegexCache = Record<string, RegexCacheEntry>;

/**
 * Check runner for regex pattern matching.
 */
class RegexCheckRunner implements CheckRunner {
  readonly type = "regex";

  async run(config: RegexCheckConfig) {
    const cwd = process.cwd();

    const { glob } = await import("tinyglobby");

    const ignore = resolveIgnorePatterns(config.files, config.ignore);

    const filePaths = await glob(config.files, {
      absolute: false,
      cwd,
      ignore,
    });

    const compiledPatterns = config.patterns.map(
      ({ message, pattern, rule }) => {
        const flags = pattern.flags.includes("g")
          ? pattern.flags
          : `${pattern.flags}g`;

        return {
          message,
          regex: new RegExp(pattern.source, flags),
          ruleText: rule ?? pattern.source,
        };
      },
    );

    const cacheDir = getCacheDir(this.type, cwd);
    const cacheKey = createCacheKey(config);
    const cachePath = join(cacheDir, `${cacheKey}.json`);

    const existingCache = await loadCache<RegexCache>(cachePath);
    const newCache: RegexCache = {};

    const results = await poolMap(
      filePaths,
      config.concurrency ?? 10,
      async (filePath) => {
        const absolutePath = join(cwd, filePath);
        const fileHash = await getFileHash(absolutePath);

        if (!fileHash) {
          return [];
        }

        const cachedEntry = existingCache[filePath];

        if (cachedEntry?.hash === fileHash) {
          newCache[filePath] = cachedEntry;

          return cachedEntry.items;
        }

        try {
          const items: IssueInput[] = [];

          const rl = createInterface({
            crlfDelay: Infinity,
            input: createReadStream(absolutePath, { encoding: "utf8" }),
          });

          let line = 0;

          try {
            for await (const text of rl) {
              line++;

              for (const compiled of compiledPatterns) {
                compiled.regex.lastIndex = 0;

                let match: null | RegExpExecArray;

                while ((match = compiled.regex.exec(text)) !== null) {
                  const column = match.index + 1;
                  const message =
                    typeof compiled.message === "function"
                      ? compiled.message(match)
                      : (compiled.message ?? `Pattern matched: ${match[0]}`);

                  items.push({
                    column,
                    file: filePath,
                    line,
                    message,
                    rule: compiled.ruleText,
                  });
                }
              }
            }
          } finally {
            rl.close();
          }

          newCache[filePath] = {
            hash: fileHash,
            items,
          };

          return items;
        } catch {
          return [];
        }
      },
    );

    const rawItems: IssueInput[] = [];

    for (const items of results) {
      rawItems.push(...items);
    }

    await saveCache(cachePath, newCache);

    return {
      items: rawItems,
      type: "items" as const,
    };
  }

  async setup() {
    const cwd = process.cwd();
    const cacheDir = getCacheDir(this.type, cwd);

    await mkdir(cacheDir, { recursive: true });
  }

  async validate() {
    try {
      await import("tinyglobby");
    } catch {
      throw new Error(
        `${this.type} check requires "tinyglobby" package to be installed. Run: npm install tinyglobby`,
      );
    }
  }
}

export const regexRunner = () => {
  return new RegexCheckRunner();
};

/**
 * Create a regex check configuration.
 *
 * @param config - Regex check configuration options.
 *
 * @returns A regex check configuration object.
 */
export function regexCheck(config: RegexCheckConfig) {
  return {
    type: "regex" as const,
    ...config,
  };
}
