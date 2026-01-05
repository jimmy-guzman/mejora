import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { CheckRunner } from "@/check-runner";
import type { IssueInput, RegexCheckConfig } from "@/types";

/**
 * Check runner for regex pattern matching.
 */
export class RegexCheckRunner implements CheckRunner {
  readonly type = "regex";

  // eslint-disable-next-line class-methods-use-this -- implements interface
  async run(regexConfig: RegexCheckConfig) {
    const cwd = process.cwd();
    const rawItems: IssueInput[] = [];

    const { glob } = await import("tinyglobby");

    const filePaths = await glob(regexConfig.files, {
      absolute: false,
      cwd,
      ignore: regexConfig.ignore ?? [
        "**/node_modules/**",
        "**/dist/**",
        "**/.git/**",
      ],
    });

    const compiledPatterns = regexConfig.patterns.map((patternConfig) => {
      const { message, pattern, rule } = patternConfig;
      const regex = new RegExp(
        pattern.source,
        pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`,
      );

      return { message, pattern, regex, rule };
    });

    const batchSize = 100;

    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize);

      const results = await Promise.all(
        batch.map(async (filePath) => {
          const absolutePath = join(cwd, filePath);

          let content: string;

          try {
            content = await readFile(absolutePath, "utf8");
          } catch {
            return [];
          }

          const items: IssueInput[] = [];
          const lines = content.split("\n");

          for (const [lineIndex, line] of lines.entries()) {
            const lineNumber = lineIndex + 1;

            for (const { message, pattern, regex, rule } of compiledPatterns) {
              regex.lastIndex = 0;

              let match: null | RegExpExecArray;

              while ((match = regex.exec(line)) !== null) {
                const column = match.index + 1;
                const messageText =
                  typeof message === "function"
                    ? message(match)
                    : (message ?? `Pattern matched: ${match[0]}`);

                items.push({
                  column,
                  file: filePath,
                  line: lineNumber,
                  message: messageText,
                  rule: rule ?? pattern.source,
                });
              }
            }
          }

          return items;
        }),
      );

      rawItems.push(...results.flat());
    }

    return {
      items: rawItems,
      type: "items" as const,
    };
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
