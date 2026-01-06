import { CheckRegistry } from "./check-registry";
import { loadConfig } from "./config";
import { registerRunners } from "./registry";

let config: Awaited<ReturnType<typeof loadConfig>> | null = null;
let configPromise: null | Promise<void> = null;

const registries = new Map<string, CheckRegistry>();

export default async function run({ checkId }: { checkId: string }) {
  if (!config) {
    configPromise ??= (async () => {
      config = await loadConfig();
    })();

    await configPromise;
  }

  const checkConfig = config?.checks[checkId];

  if (!checkConfig) {
    throw new Error(`Check not found in config: ${checkId}`);
  }

  let registry = registries.get(checkConfig.type);

  if (!registry) {
    registry = new CheckRegistry();

    if (!config) {
      throw new Error("Config failed to load");
    }

    registerRunners(registry, config);

    const checks = new Set([checkConfig.type]);

    await Promise.all([registry.setup(checks), registry.validate(checks)]);

    registries.set(checkConfig.type, registry);
  }

  const startTime = performance.now();
  const runner = registry.get(checkConfig.type);
  const snapshot = await runner.run(checkConfig);

  return {
    checkId,
    duration: performance.now() - startTime,
    snapshot,
    success: true,
  };
}
