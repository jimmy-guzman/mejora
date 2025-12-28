#!/usr/bin/env node
import { consola } from "consola";
import { cli, define } from "gunshi";

import { loadConfig } from "./config";
import { formatJsonOutput, formatTextOutput } from "./output";
import { MejoraRunner } from "./runner";

const command = define({
  args: {
    force: {
      default: false,
      description: "Update baseline even with regressions",
      short: "f",
      type: "boolean",
    },
    json: {
      default: false,
      description: "Output results as JSON",
      type: "boolean",
    },
    only: {
      description: 'Run only checks matching pattern (e.g., "eslint > *")',
      type: "string",
    },
    skip: {
      description: "Skip checks matching pattern",
      type: "string",
    },
  },
  description: "Prevent regressions by allowing only improvement",
  examples: `
# Run mejora with default settings
$ mejora

# Update baseline even with regressions
$ mejora --force

# Output results as JSON
$ mejora --json

# Run only checks matching pattern
$ mejora --only "eslint > *"

# Skip checks matching pattern
$ mejora --skip typescript
`,
  name: "mejora",
  run: async (ctx) => {
    try {
      const runner = new MejoraRunner();

      const config = await loadConfig();
      const result = await runner.run(config, {
        force: ctx.values.force,
        json: ctx.values.json,
        only: ctx.values.only,
        skip: ctx.values.skip,
      });

      if (ctx.values.json) {
        consola.log(formatJsonOutput(result));
      } else {
        consola.log(formatTextOutput(result));
      }

      process.exit(result.exitCode);
    } catch (error) {
      if (error instanceof Error) {
        consola.error(error.message);
      } else {
        consola.error(error);
      }

      process.exit(2);
    }
  },
});

await cli(process.argv.slice(2), command);
