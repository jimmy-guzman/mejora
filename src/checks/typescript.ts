import { relative, resolve, sep } from "pathe";

import type { TypeScriptCheckConfig } from "@/types";

import { createCacheKey, ensureCacheDir } from "@/utils/cache";

export async function validateTypescriptDeps() {
  try {
    await import("typescript");
  } catch {
    throw new Error(
      `TypeScript check requires typescript but it's not installed.`,
    );
  }
}

const createItem = ({
  character,
  code,
  cwd,
  fileName,
  line,
  message,
}: {
  character: number;
  code: number;
  cwd: string;
  fileName: string;
  line: number;
  message: string;
}) => {
  const filePath = relative(cwd, fileName);

  return `${filePath}:${line + 1}:${character + 1} - TS${code}: ${message}` as const;
};

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

  const cacheDir = await ensureCacheDir(cwd, "typescript");

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

  host.writeFile = (fileName, content, ...rest) => {
    const out = resolve(fileName);

    if (out !== resolve(tsBuildInfoFile)) return;

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

  const workspaceDiagnostics = diagnostics.filter((diagnostic) => {
    if (!diagnostic.file) return true;

    const filePath = resolve(diagnostic.file.fileName);
    const workspaceRoot = resolve(cwd);

    return (
      filePath === workspaceRoot || filePath.startsWith(workspaceRoot + sep)
    );
  });

  const items: string[] = [];

  for (const diagnostic of workspaceDiagnostics) {
    if (diagnostic.file && diagnostic.start !== undefined) {
      const { character, line } = diagnostic.file.getLineAndCharacterOfPosition(
        diagnostic.start,
      );
      const message = flattenDiagnosticMessageText(
        diagnostic.messageText,
        "\n",
      );

      const item = createItem({
        character,
        code: diagnostic.code,
        cwd,
        fileName: diagnostic.file.fileName,
        line,
        message,
      });

      items.push(item);
    } else {
      const message = flattenDiagnosticMessageText(
        diagnostic.messageText,
        "\n",
      );

      const item = `(global) - TS${diagnostic.code}: ${message}` as const;

      items.push(item);
    }
  }

  return {
    items: items.toSorted(),
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
