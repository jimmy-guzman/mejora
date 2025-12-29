import { inspect } from "node:util";

import * as c from "./colors";

function formatError(error: Error) {
  const lines = [error.message];

  if (error.stack) {
    const stack = error.stack
      .split("\n")
      .slice(1)
      .map((line) => c.dim(line.trim()))
      .join("\n");

    lines.push(stack);
  }

  return lines.join("\n");
}

function format(...args: unknown[]) {
  return args
    .map((arg) => {
      if (typeof arg === "string") return arg;
      if (arg instanceof Error) return formatError(arg);

      return inspect(arg, { colors: false, depth: 10 });
    })
    .join(" ");
}

export const logger = {
  error: (...args: unknown[]) => {
    // eslint-disable-next-line no-console -- logger utility
    console.error(c.bgRed(c.black(" ERROR ")), format(...args));
  },
  log: (...args: unknown[]) => {
    // eslint-disable-next-line no-console -- logger utility
    console.log(format(...args));
  },
  start: (...args: unknown[]) => {
    // eslint-disable-next-line no-console -- logger utility
    console.log(c.cyan("◐"), format(...args));
  },
  success: (...args: unknown[]) => {
    // eslint-disable-next-line no-console -- logger utility
    console.log(c.green("✔"), format(...args));
  },
};
