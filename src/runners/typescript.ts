import { relative, resolve, sep } from "pathe";

import type { CheckRunner } from "@/check-runner";
import type { IssueInput, TypeScriptCheckConfig } from "@/types";

import { createCacheKey, getCacheDir } from "@/utils/cache";
import { normalizeDiagnosticMessage } from "@/utils/typescript";

const GLOBAL_FILE = "(global)";

/**
 * Check runner for TypeScript.
 */
export class TypeScriptCheckRunner implements CheckRunner {
  readonly type = "typescript";

  async run(typescriptConfig: TypeScriptCheckConfig) {
    const {
      createIncrementalCompilerHost,
      createIncrementalProgram,
      findConfigFile,
      flattenDiagnosticMessageText,
      getPreEmitDiagnostics,
      parseJsonConfigFileContent,
      readConfigFile,
      sys,
      version,
    } = await import("typescript");

    const cwd = process.cwd();

    const fileExists = sys.fileExists.bind(sys);
    const readFile = sys.readFile.bind(sys);

    const configPath = typescriptConfig.tsconfig
      ? resolve(typescriptConfig.tsconfig)
      : findConfigFile(cwd, fileExists, "tsconfig.json");

    if (!configPath) {
      throw new Error("TypeScript config file not found");
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- TODO: add types to tsconfig or use zod to validate
    const { config: TSConfig, error } = readConfigFile(configPath, readFile);

    if (error) {
      const message =
        typeof error.messageText === "string"
          ? error.messageText
          : flattenDiagnosticMessageText(error.messageText, "\n");

      throw new TypeError(`Failed to read TypeScript config: ${message}`);
    }

    const parseResult = parseJsonConfigFileContent(
      TSConfig,
      sys,
      cwd,
      typescriptConfig.overrides?.compilerOptions,
    );

    const cacheDir = getCacheDir(this.type, cwd);

    const cacheKey = createCacheKey({
      configPath,
      overrides: typescriptConfig.overrides?.compilerOptions ?? {},
      parsedOptions: parseResult.options,
      typescriptVersion: version,
    });

    const tsBuildInfoFile = resolve(cacheDir, `${cacheKey}.tsbuildinfo`);

    const options = {
      ...parseResult.options,
      incremental: true,
      noEmit: true,
      skipLibCheck: parseResult.options.skipLibCheck ?? true,
      tsBuildInfoFile,
    };

    const host = createIncrementalCompilerHost(options, sys);

    const realWriteFile = host.writeFile.bind(host);

    host.writeFile = (fileName, content, ...rest) => {
      if (resolve(fileName) !== tsBuildInfoFile) return;

      realWriteFile(fileName, content, ...rest);
    };

    const incrementalProgram = createIncrementalProgram({
      host,
      options,
      projectReferences: parseResult.projectReferences ?? [],
      rootNames: parseResult.fileNames,
    });

    const program = incrementalProgram.getProgram();

    const diagnostics = getPreEmitDiagnostics(program);

    incrementalProgram.emit();

    const workspaceRoot = resolve(cwd);
    const workspacePrefix = workspaceRoot + sep;

    const workspaceDiagnostics = diagnostics.filter((diagnostic) => {
      if (!diagnostic.file) return true;

      const filePath = resolve(diagnostic.file.fileName);

      return filePath === workspaceRoot || filePath.startsWith(workspacePrefix);
    });

    const rawItems: IssueInput[] = [];

    for (const diagnostic of workspaceDiagnostics) {
      const message = flattenDiagnosticMessageText(
        diagnostic.messageText,
        "\n",
      );
      const tsCode = `TS${diagnostic.code}`;

      if (diagnostic.file && diagnostic.start !== undefined) {
        const { character, line } =
          diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);

        const file = relative(cwd, diagnostic.file.fileName);

        rawItems.push({
          column: character + 1,
          file,
          line: line + 1,
          message: normalizeDiagnosticMessage(message, cwd),
          rule: tsCode,
        });
      } else {
        rawItems.push({
          column: 0,
          file: GLOBAL_FILE,
          line: 0,
          message: normalizeDiagnosticMessage(message, cwd),
          rule: tsCode,
        });
      }
    }

    return {
      items: rawItems,
      type: "items" as const,
    };
  }

  async setup() {
    const cwd = process.cwd();
    const cacheDir = getCacheDir(this.type, cwd);
    const { mkdir } = await import("node:fs/promises");

    await mkdir(cacheDir, { recursive: true });
  }

  async validate() {
    try {
      await import("typescript");
    } catch {
      throw new Error(
        `${this.type} check requires "typescript" package to be installed. Run: npm install typescript`,
      );
    }
  }
}

/**
 * Create a TypeScript check configuration.
 *
 * @param config - TypeScript check configuration options.
 *
 * @returns A TypeScript check configuration object.
 */
export function typescriptCheck(config: TypeScriptCheckConfig) {
  return {
    type: "typescript" as const,
    ...config,
  };
}
