import { isAbsolute, relative } from "pathe";

/**
 * Normalizes absolute paths in TypeScript diagnostic messages to be relative
 * to the project root, making baselines portable across environments.
 */
export function normalizeDiagnosticMessage(
  message: string,
  projectRoot: string,
) {
  const importPattern = /import\("([^"]+)"\)/g;

  return message.replaceAll(importPattern, (match, importPath: string) => {
    try {
      if (isAbsolute(importPath)) {
        const relativePath = relative(projectRoot, importPath);

        if (!relativePath.startsWith("..")) {
          const normalizedPath = relativePath || ".";

          return `import("${normalizedPath}")`;
        }
      }
    } catch {
      // Leave unchanged on error
    }

    return match;
  });
}
