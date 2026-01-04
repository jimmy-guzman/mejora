import { relative, resolve, sep } from "pathe";

import type { RawDiagnosticItem } from "@/checks/utils";
import type { TypeScriptCheckConfig } from "@/types";

import { assignStableIds, sortByLocation } from "@/checks/utils";
import { createCacheKey, getCacheDir } from "@/utils/cache";

export async function runTypescriptCheck(config: TypeScriptCheckConfig) {
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

  const configPath = config.tsconfig
    ? resolve(config.tsconfig)
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
    config.overrides?.compilerOptions,
  );

  const cacheDir = getCacheDir("typescript", cwd);

  const cacheKey = createCacheKey({
    configPath,
    overrides: config.overrides?.compilerOptions ?? {},
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

  const resolvedBuildInfoPath = resolve(tsBuildInfoFile);

  host.writeFile = (fileName, content, ...rest) => {
    if (resolve(fileName) !== resolvedBuildInfoPath) return;

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

  const rawItems: RawDiagnosticItem[] = [];

  for (const diagnostic of workspaceDiagnostics) {
    const message = flattenDiagnosticMessageText(diagnostic.messageText, "\n");
    const tsCode = `TS${diagnostic.code}`;

    if (diagnostic.file && diagnostic.start !== undefined) {
      const { character, line } = diagnostic.file.getLineAndCharacterOfPosition(
        diagnostic.start,
      );

      const file = relative(cwd, diagnostic.file.fileName);
      const signature = `${file} - ${tsCode}: ${message}` as const;

      rawItems.push({
        column: character + 1,
        file,
        line: line + 1,
        message,
        rule: tsCode,
        signature,
      });
    } else {
      const file = "(global)";
      const signature = `${file} - ${tsCode}: ${message}` as const;

      rawItems.push({
        column: 0,
        file,
        line: 0,
        message,
        rule: tsCode,
        signature,
      });
    }
  }

  const items = assignStableIds(rawItems);

  return {
    items: items.toSorted(sortByLocation),
    type: "items" as const,
  };
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
