import type { Config, RunOptions, RunResult } from "./types";

import { CheckRegistry } from "./core/check-registry";
import { loadConfig } from "./core/config";
import { Runner } from "./core/runner";

export async function run(
  config?: Config,
  options: RunOptions = {},
): Promise<RunResult> {
  const resolvedConfig = config ?? (await loadConfig());
  const registry = new CheckRegistry();

  registry.init(resolvedConfig);
  const runner = new Runner(registry);

  return runner.run(resolvedConfig, options);
}
