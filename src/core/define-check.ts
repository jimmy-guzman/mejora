import type { Check, CheckRunner, CustomCheckDefinition } from "@/types";

/**
 * Configuration for a check instance, combining the check-specific config
 * with required metadata fields.
 */
type UserCheckConfig<TConfig> = TConfig & {
  /**
   * Unique identifier for this check instance.
   * Used in baseline tracking and output.
   */
  name: string;
};

/**
 * Define a custom check for use with mejora().
 *
 * This is the primitive used by all checks (built-in and custom) to create
 * reusable check definitions. Multiple check instances with the same type
 * share a single runner for optimal performance.
 *
 * @param definition - Custom check definition with type, run function, and optional hooks.
 *
 * @returns A factory function that creates Check objects with different configurations.
 *
 * @example
 * ```ts
 * import { defineConfig, defineCheck } from "mejora";
 *
 * const noHardcodedUrls = defineCheck<{ files: string[] }>({
 *   type: "no-hardcoded-urls",
 *   async run(config) {
 *     const violations: IssueInput[] = [];
 *     // Custom checking logic using config.files
 *     return violations;
 *   }
 * });
 *
 * export default defineConfig({
 *   checks: [
 *     noHardcodedUrls({ name: "urls-in-src", files: ["src/**\/*.ts"] }),
 *     noHardcodedUrls({ name: "urls-in-lib", files: ["lib/**\/*.ts"] }),
 *   ]
 * });
 * ```
 */
export function defineCheck<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- user-defined config can be any shape, we just want to preserve types for better DX
  TConfig extends Record<string, any> = Record<string, any>,
>(
  definition: CustomCheckDefinition<TConfig>,
): (userConfig: UserCheckConfig<TConfig>) => Check {
  const { defaults, type } = definition;

  const createRunner = () => {
    const runner: CheckRunner = {
      async run(config: Record<string, unknown>) {
        const { type: _type, ...configWithoutType } = config;

        const result = await definition.run(configWithoutType as TConfig);

        return {
          items: result,
          type: "items" as const,
        };
      },
      type,
    };

    if (definition.setup) {
      // eslint-disable-next-line @typescript-eslint/unbound-method -- standalone function, doesn't use 'this'
      runner.setup = definition.setup;
    }

    if (definition.validate) {
      // eslint-disable-next-line @typescript-eslint/unbound-method -- standalone function, doesn't use 'this'
      runner.validate = definition.validate;
    }

    return runner;
  };

  return (userConfig) => {
    const { name, ...rest } = userConfig;

    const config = {
      ...defaults,
      ...(rest as unknown as TConfig),
    } as TConfig;

    return {
      __runnerFactory: createRunner,
      config: {
        type,
        ...config,
      },
      id: name,
    };
  };
}
