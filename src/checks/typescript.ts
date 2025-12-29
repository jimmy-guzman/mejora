import { relative, resolve } from "node:path";

import type { TypeScriptCheckConfig } from "@/types";

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
    createProgram,
    findConfigFile,
    flattenDiagnosticMessageText,
    getPreEmitDiagnostics,
    parseJsonConfigFileContent,
    readConfigFile,
    sys,
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
    process.cwd(),
    config.overrides?.compilerOptions,
  );

  const program = createProgram({
    options: parseResult.options,
    rootNames: parseResult.fileNames,
  });

  const diagnostics = getPreEmitDiagnostics(program);

  const items: string[] = [];

  for (const diagnostic of diagnostics) {
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

export function typescriptCheck(config: TypeScriptCheckConfig) {
  return {
    type: "typescript" as const,
    ...config,
  };
}
