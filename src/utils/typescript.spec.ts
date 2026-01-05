import { resolve } from "pathe";

import { normalizeDiagnosticMessage } from "./typescript";

describe("normalizeDiagnosticMessage", () => {
  const projectRoot = "/Users/test/project";

  it("should normalize absolute paths in import statements", () => {
    const message =
      "Element implicitly has an 'any' type because expression of type 'string' can't be used to index type 'typeof import(\"/Users/test/project/src/actions\")'.";

    const result = normalizeDiagnosticMessage(message, projectRoot);

    expect(result).toBe(
      "Element implicitly has an 'any' type because expression of type 'string' can't be used to index type 'typeof import(\"src/actions\")'.",
    );
  });

  it("should handle Windows-style absolute paths", () => {
    const windowsRoot = "C:/Users/test/project";
    const message =
      "Cannot find module './types' or its corresponding type declarations from import(\"C:/Users/test/project/src/index.ts\").";

    const result = normalizeDiagnosticMessage(message, windowsRoot);

    expect(result).toBe(
      "Cannot find module './types' or its corresponding type declarations from import(\"src/index.ts\").",
    );
  });

  it("should normalize multiple import paths in the same message", () => {
    const message =
      'Types from import("/Users/test/project/src/a") and import("/Users/test/project/src/b") are incompatible.';

    const result = normalizeDiagnosticMessage(message, projectRoot);

    expect(result).toBe(
      'Types from import("src/a") and import("src/b") are incompatible.',
    );
  });

  it("should leave relative paths unchanged", () => {
    const message = 'Cannot find module from import("./relative/path").';

    const result = normalizeDiagnosticMessage(message, projectRoot);

    expect(result).toBe(message);
  });

  it("should leave paths outside project root unchanged", () => {
    const message =
      'Type error in import("/some/other/project/node_modules/lib").';

    const result = normalizeDiagnosticMessage(message, projectRoot);

    expect(result).toBe(message);
  });

  it("should handle messages without import statements", () => {
    const message = "Type 'string' is not assignable to type 'number'.";

    const result = normalizeDiagnosticMessage(message, projectRoot);

    expect(result).toBe(message);
  });

  it("should handle empty messages", () => {
    const result = normalizeDiagnosticMessage("", projectRoot);

    expect(result).toBe("");
  });

  it("should handle malformed import statements gracefully", () => {
    const message = 'Broken import("unclosed';

    const result = normalizeDiagnosticMessage(message, projectRoot);

    expect(result).toBe(message);
  });

  it("should normalize nested subdirectories correctly", () => {
    const message = `Property does not exist on type 'typeof import("${projectRoot}/src/deeply/nested/module")'.`;

    const result = normalizeDiagnosticMessage(message, projectRoot);

    expect(result).toBe(
      "Property does not exist on type 'typeof import(\"src/deeply/nested/module\")'.",
    );
  });

  it("should handle paths with special characters", () => {
    const specialRoot = "/Users/test/my-project@2.0";
    const message = `Error in import("${specialRoot}/src/file-name.ts").`;

    const result = normalizeDiagnosticMessage(message, specialRoot);

    expect(result).toBe('Error in import("src/file-name.ts").');
  });

  it("should preserve message structure with mixed content", () => {
    const message = `Type '"value"' cannot be assigned.
  The type import("${projectRoot}/src/types") has no matching signature.
  Consider using import("${projectRoot}/src/utils") instead.`;

    const result = normalizeDiagnosticMessage(message, projectRoot);

    expect(result).toContain('import("src/types")');
    expect(result).toContain('import("src/utils")');
    expect(result).toContain("Type '\"value\"' cannot be assigned");
  });

  it("should handle project root as the import path itself", () => {
    const message = `Error in import("${projectRoot}").`;

    const result = normalizeDiagnosticMessage(message, projectRoot);

    expect(result).toBe('Error in import(".").');
  });

  it("should not modify non-import quoted strings", () => {
    const message = `Property "someProperty" does not exist on type 'MyType'.`;

    const result = normalizeDiagnosticMessage(message, projectRoot);

    expect(result).toBe(message);
  });

  it("should handle errors during path operations gracefully", () => {
    const message = 'Error in import("").';

    const result = normalizeDiagnosticMessage(message, projectRoot);

    expect(result).toBe(message);
  });

  it("should use pathe's cross-platform path handling", () => {
    const mixedSlashRoot = resolve("/Users/test/project");
    const message = `Error in import("${mixedSlashRoot}/src/file").`;

    const result = normalizeDiagnosticMessage(message, mixedSlashRoot);

    expect(result).toMatch(/import\("src\/file"\)/);
    expect(result).not.toContain("\\");
  });
});
