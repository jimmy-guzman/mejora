#!/usr/bin/env node
import { parseArgs } from "node:util";

import { loadConfig } from "./config";
import { formatJsonOutput, formatTextOutput } from "./output";
import { MejoraRunner } from "./runner";
import { logger } from "./utils/logger";

const { values } = parseArgs({
  allowPositionals: false,
  options: {
    force: {
      default: false,
      short: "f",
      type: "boolean",
    },
    help: {
      short: "h",
      type: "boolean",
    },
    json: {
      default: false,
      type: "boolean",
    },
    only: {
      type: "string",
    },
    skip: {
      type: "string",
    },
  },
  strict: true,
});

if (values.help) {
  logger.log(`
mejora - Prevent regressions by allowing only improvement

Usage:
  mejora [options]

Options:
  -f, --force         Update baseline even with regressions
      --json          Output results as JSON
      --only <pattern> Run only checks matching pattern (e.g., "eslint > *")
      --skip <pattern> Skip checks matching pattern
  -h, --help          Show this help message

Examples:
  mejora
  mejora --force
  mejora --json
  mejora --only "eslint > *"
  mejora --skip typescript
`);
  process.exit(0);
}

try {
  const runner = new MejoraRunner();
  const config = await loadConfig();
  const result = await runner.run(config, {
    force: values.force,
    json: values.json,
    only: values.only,
    skip: values.skip,
  });

  if (values.json) {
    logger.log(formatJsonOutput(result));
  } else {
    logger.log("");
    logger.log(formatTextOutput(result));
  }

  process.exit(result.exitCode);
} catch (error) {
  if (error instanceof Error) {
    logger.error(error.message);
  } else {
    logger.error(error);
  }
  process.exit(2);
}
