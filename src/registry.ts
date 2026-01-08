import type { CheckRegistry } from "./check-registry";
import type { Config } from "./types";

import { ESLintCheckRunner } from "./runners/eslint";
import { TypeScriptCheckRunner } from "./runners/typescript";

/**
 * Register all built-in and custom runners with the registry.
 * This ensures consistent runner setup between main thread and workers.
 */
export function registerRunners(
  registry: CheckRegistry,
  config: Pick<Config, "runners">,
) {
  registry.register(new ESLintCheckRunner());
  registry.register(new TypeScriptCheckRunner());

  if (config.runners) {
    for (const runner of config.runners) {
      registry.register(runner);
    }
  }
}
