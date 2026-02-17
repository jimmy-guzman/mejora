import { parentPort, workerData } from "node:worker_threads";

import { CheckRegistry } from "@/core/check-registry";
import { loadConfig } from "@/core/config";

let config: Awaited<ReturnType<typeof loadConfig>> | null = null;
let configPromise: null | Promise<void> = null;

const registries = new Map<string, CheckRegistry>();

export async function checkWorker({ checkId }: { checkId: string }) {
  if (!config) {
    configPromise ??= (async () => {
      config = await loadConfig();
    })();

    await configPromise;
  }

  const check = config?.checks.find((c) => c.id === checkId);

  if (!check) {
    throw new Error(`Check not found in config: ${checkId}`);
  }

  const checkConfig = check.config;

  let registry = registries.get(checkConfig.type);

  if (!registry) {
    registry = new CheckRegistry();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we know config is defined here
    registry.init(config!);

    const checks = new Set([checkConfig.type]);

    await Promise.all([registry.setup(checks), registry.validate(checks)]);

    registries.set(checkConfig.type, registry);
  }

  const startTime = performance.now();
  const runner = registry.get(checkConfig.type);
  const snapshot = await runner.run(checkConfig);

  return {
    duration: performance.now() - startTime,
    snapshot,
  };
}

if (parentPort) {
  const result = await checkWorker(workerData as { checkId: string });

  parentPort.postMessage(result);
}
