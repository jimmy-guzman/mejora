import { generateMarkdownReport } from "./markdown";

describe("generateMarkdownReport", () => {
  beforeEach(() => {
    vi.spyOn(process, "cwd").mockReturnValue("/project");
  });

  it("should generate report with no issues", () => {
    const baseline = {
      checks: {
        eslint: { items: [], type: "items" as const },
      },
      version: 2,
    };

    const result = generateMarkdownReport(baseline, "/project/.mejora");

    expect(result).toMatchInlineSnapshot(`
      "# Mejora Baseline

      This file represents the current accepted state of the codebase.

      ## eslint (0 issues)

      No issues
      "
    `);
  });

  it("should generate report with file path and line number", () => {
    const baseline = {
      checks: {
        eslint: {
          items: [
            {
              column: 1,
              file: "src/index.ts",
              id: "abc123",
              line: 10,
              message: "'foo' is never used",
              rule: "no-unused-vars",
            },
          ],
          type: "items" as const,
        },
      },
      version: 2,
    };

    const result = generateMarkdownReport(baseline, "/project/.mejora");

    expect(result).toMatchInlineSnapshot(`
      "# Mejora Baseline

      This file represents the current accepted state of the codebase.

      ## eslint (1 issue)

      ### [src/index.ts](../src/index.ts) (1)

      - [Line 10](../src/index.ts#L10) - no-unused-vars: 'foo' is never used
      "
    `);
  });

  it("should generate report with file path without line number", () => {
    const baseline = {
      checks: {
        typescript: {
          items: [
            {
              column: 0,
              file: "src/types.ts",
              id: "def456",
              line: 0,
              message: "Type error",
              rule: "2304",
            },
          ],
          type: "items" as const,
        },
      },
      version: 2,
    };

    const result = generateMarkdownReport(baseline, "/project/.mejora");

    expect(result).toMatchInlineSnapshot(`
      "# Mejora Baseline

      This file represents the current accepted state of the codebase.

      ## typescript (1 issue)

      ### [src/types.ts](../src/types.ts) (1)

      - [src/types.ts](../src/types.ts) - 2304: Type error
      "
    `);
  });

  it("should generate report with multiple checks", () => {
    const baseline = {
      checks: {
        eslint: {
          items: [
            {
              column: 1,
              file: "src/a.ts",
              id: "abc1",
              line: 1,
              message: "error a",
              rule: "error-a",
            },
          ],
          type: "items" as const,
        },
        typescript: {
          items: [
            {
              column: 1,
              file: "src/b.ts",
              id: "abc2",
              line: 2,
              message: "error b",
              rule: "2304",
            },
          ],
          type: "items" as const,
        },
      },
      version: 2,
    };

    const result = generateMarkdownReport(baseline, "/project/.mejora");

    expect(result).toMatchInlineSnapshot(`
      "# Mejora Baseline

      This file represents the current accepted state of the codebase.

      ## eslint (1 issue)

      ### [src/a.ts](../src/a.ts) (1)

      - [Line 1](../src/a.ts#L1) - error-a: error a

      ## typescript (1 issue)

      ### [src/b.ts](../src/b.ts) (1)

      - [Line 2](../src/b.ts#L2) - 2304: error b
      "
    `);
  });

  it("should have no blank line after last check", () => {
    const baseline = {
      checks: {
        eslint: { items: [], type: "items" as const },
      },
      version: 2,
    };

    const result = generateMarkdownReport(baseline, "/project/.mejora");

    expect(result.endsWith("\n\n")).toBe(false);
    expect(result.endsWith("\n")).toBe(true);
  });

  it("should group unparsable items under Other Issues", () => {
    const baseline = {
      checks: {
        eslint: {
          items: [
            {
              column: 1,
              file: "src/valid.ts",
              id: "valid1",
              line: 10,
              message: "valid error",
              rule: "some-error",
            },
            {
              column: 0,
              file: "",
              id: "invalid1",
              line: 0,
              message: "invalid item without path",
              rule: "unknown",
            },
          ],
          type: "items" as const,
        },
      },
      version: 2,
    };

    const result = generateMarkdownReport(baseline, "/project/.mejora");

    expect(result).toMatchInlineSnapshot(`
      "# Mejora Baseline

      This file represents the current accepted state of the codebase.

      ## eslint (2 issues)

      ### [src/valid.ts](../src/valid.ts) (1)

      - [Line 10](../src/valid.ts#L10) - some-error: valid error

      ### Other Issues (1)

      - unknown: invalid item without path
      "
    `);
  });

  it("should group multiple items from same file", () => {
    const baseline = {
      checks: {
        eslint: {
          items: [
            {
              column: 1,
              file: "src/index.ts",
              id: "item1",
              line: 10,
              message: "error 1",
              rule: "error-1",
            },
            {
              column: 1,
              file: "src/index.ts",
              id: "item2",
              line: 20,
              message: "error 2",
              rule: "error-2",
            },
            {
              column: 1,
              file: "src/utils.ts",
              id: "item3",
              line: 5,
              message: "error 3",
              rule: "error-3",
            },
          ],
          type: "items" as const,
        },
      },
      version: 2,
    };

    const result = generateMarkdownReport(baseline, "/project/.mejora");

    expect(result).toMatchInlineSnapshot(`
      "# Mejora Baseline

      This file represents the current accepted state of the codebase.

      ## eslint (3 issues)

      ### [src/index.ts](../src/index.ts) (2)

      - [Line 10](../src/index.ts#L10) - error-1: error 1
      - [Line 20](../src/index.ts#L20) - error-2: error 2

      ### [src/utils.ts](../src/utils.ts) (1)

      - [Line 5](../src/utils.ts#L5) - error-3: error 3
      "
    `);
  });

  it("should handle Windows drive-letter paths", () => {
    vi.spyOn(process, "cwd").mockReturnValue(String.raw`C:\project`);

    const baseline = {
      checks: {
        eslint: {
          items: [
            {
              column: 1,
              file: "src/index.ts",
              id: "win1",
              line: 10,
              message: "'foo' is never used",
              rule: "no-unused-vars",
            },
          ],
          type: "items" as const,
        },
      },
      version: 2,
    };

    const result = generateMarkdownReport(
      baseline,
      String.raw`C:\project\.mejora`,
    );

    expect(result).toMatchInlineSnapshot(`
      "# Mejora Baseline

      This file represents the current accepted state of the codebase.

      ## eslint (1 issue)

      ### [src/index.ts](../src/index.ts) (1)

      - [Line 10](../src/index.ts#L10) - no-unused-vars: 'foo' is never used
      "
    `);
  });

  it("should handle Windows paths without line numbers", () => {
    vi.spyOn(process, "cwd").mockReturnValue(String.raw`D:\code\app`);

    const baseline = {
      checks: {
        typescript: {
          items: [
            {
              column: 0,
              file: "types.ts",
              id: "win2",
              line: 0,
              message: "Type error",
              rule: "2304",
            },
          ],
          type: "items" as const,
        },
      },
      version: 2,
    };

    const result = generateMarkdownReport(
      baseline,
      String.raw`D:\code\app\.mejora`,
    );

    expect(result).toMatchInlineSnapshot(`
      "# Mejora Baseline

      This file represents the current accepted state of the codebase.

      ## typescript (1 issue)

      ### [types.ts](../types.ts) (1)

      - [types.ts](../types.ts) - 2304: Type error
      "
    `);
  });

  it("should group multiple Windows path items from same file", () => {
    vi.spyOn(process, "cwd").mockReturnValue(String.raw`C:\project`);

    const baseline = {
      checks: {
        eslint: {
          items: [
            {
              column: 1,
              file: "src/index.ts",
              id: "win3",
              line: 10,
              message: "error 1",
              rule: "error-1",
            },
            {
              column: 1,
              file: "src/index.ts",
              id: "win4",
              line: 20,
              message: "error 2",
              rule: "error-2",
            },
            {
              column: 1,
              file: "src/utils.ts",
              id: "win5",
              line: 5,
              message: "error 3",
              rule: "error-3",
            },
          ],
          type: "items" as const,
        },
      },
      version: 2,
    };

    const result = generateMarkdownReport(
      baseline,
      String.raw`C:\project\.mejora`,
    );

    expect(result).toMatchInlineSnapshot(`
      "# Mejora Baseline

      This file represents the current accepted state of the codebase.

      ## eslint (3 issues)

      ### [src/index.ts](../src/index.ts) (2)

      - [Line 10](../src/index.ts#L10) - error-1: error 1
      - [Line 20](../src/index.ts#L20) - error-2: error 2

      ### [src/utils.ts](../src/utils.ts) (1)

      - [Line 5](../src/utils.ts#L5) - error-3: error 3
      "
    `);
  });

  it("should handle mixed Unix and Windows paths", () => {
    vi.spyOn(process, "cwd").mockReturnValue(String.raw`C:\project`);

    const baseline = {
      checks: {
        eslint: {
          items: [
            {
              column: 1,
              file: "src/unix.ts",
              id: "unix1",
              line: 10,
              message: "unix error",
              rule: "unix-error",
            },
            {
              column: 1,
              file: "src/windows.ts",
              id: "win6",
              line: 20,
              message: "windows error",
              rule: "windows-error",
            },
          ],
          type: "items" as const,
        },
      },
      version: 2,
    };

    const result = generateMarkdownReport(baseline, "/project/.mejora");

    expect(result).toContain("unix.ts");
    expect(result).toContain("windows.ts");
    expect(result).toContain("unix error");
    expect(result).toContain("windows error");
  });

  it("should escape HTML-like syntax in error messages", () => {
    const baseline = {
      checks: {
        typescript: {
          items: [
            {
              column: 1,
              file: "src/form.tsx",
              id: "html1",
              line: 71,
              message:
                "Element implicitly has an 'any' type because expression of type 'string' can't be used to index type 'string | FormikErrors<ItemGroupUploadFormikRow>'.",
              rule: "7053",
            },
          ],
          type: "items" as const,
        },
      },
      version: 2,
    };

    const result = generateMarkdownReport(baseline, "/project/.mejora");

    expect(result).toMatchInlineSnapshot(`
      "# Mejora Baseline

      This file represents the current accepted state of the codebase.

      ## typescript (1 issue)

      ### [src/form.tsx](../src/form.tsx) (1)

      - [Line 71](../src/form.tsx#L71) - 7053: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type 'string | FormikErrors&lt;ItemGroupUploadFormikRow&gt;'.
      "
    `);

    expect(result).not.toMatch(/ - .*<[^&]/);
    expect(result).toContain("&lt;");
    expect(result).toContain("&gt;");
  });

  it("should escape square brackets in error messages", () => {
    const baseline = {
      checks: {
        typescript: {
          items: [
            {
              column: 1,
              file: "src/test.ts",
              id: "bracket1",
              line: 125,
              message:
                "The types returned by '[Symbol.iterator]().next(...)' are incompatible.",
              rule: "2345",
            },
          ],
          type: "items" as const,
        },
      },
      version: 2,
    };

    const result = generateMarkdownReport(baseline, "/project/.mejora");

    expect(result).toMatchInlineSnapshot(`
      "# Mejora Baseline

      This file represents the current accepted state of the codebase.

      ## typescript (1 issue)

      ### [src/test.ts](../src/test.ts) (1)

      - [Line 125](../src/test.ts#L125) - 2345: The types returned by '&#91;Symbol.iterator&#93;().next(...)' are incompatible.
      "
    `);

    expect(result).not.toMatch(/ - .*\[(?!Line \d+\])/);
    expect(result).toContain("&#91;");
    expect(result).toContain("&#93;");
  });

  it("should not have multiple consecutive blank lines", () => {
    const baseline = {
      checks: {
        eslint: {
          items: [
            {
              column: 1,
              file: "src/a.ts",
              id: "multi1",
              line: 1,
              message: "error a",
              rule: "error-a",
            },
            {
              column: 1,
              file: "src/b.ts",
              id: "multi2",
              line: 2,
              message: "error b",
              rule: "error-b",
            },
          ],
          type: "items" as const,
        },
        typescript: {
          items: [
            {
              column: 1,
              file: "src/c.ts",
              id: "multi3",
              line: 3,
              message: "error c",
              rule: "2304",
            },
          ],
          type: "items" as const,
        },
      },
      version: 2,
    };

    const result = generateMarkdownReport(baseline, "/project/.mejora");

    expect(result).not.toContain("\n\n\n");

    expect(result).toMatchInlineSnapshot(`
      "# Mejora Baseline

      This file represents the current accepted state of the codebase.

      ## eslint (2 issues)

      ### [src/a.ts](../src/a.ts) (1)

      - [Line 1](../src/a.ts#L1) - error-a: error a

      ### [src/b.ts](../src/b.ts) (1)

      - [Line 2](../src/b.ts#L2) - error-b: error b

      ## typescript (1 issue)

      ### [src/c.ts](../src/c.ts) (1)

      - [Line 3](../src/c.ts#L3) - 2304: error c
      "
    `);
  });

  it("should place unparsable items last even when mixed with valid files", () => {
    const baseline = {
      checks: {
        eslint: {
          items: [
            {
              column: 0,
              file: "",
              id: "unparsable",
              line: 0,
              message: "unparsable item",
              rule: "unknown",
            },
            {
              column: 1,
              file: "src/zebra.ts",
              id: "zebra1",
              line: 10,
              message: "last alphabetically",
              rule: "last",
            },
            {
              column: 0,
              file: "",
              id: "unparsable",
              line: 0,
              message: "another unparsable",
              rule: "unknown",
            },
            {
              column: 1,
              file: "src/aardvark.ts",
              id: "aardvark1",
              line: 5,
              message: "first alphabetically",
              rule: "first",
            },
          ],
          type: "items" as const,
        },
      },
      version: 2,
    };

    const result = generateMarkdownReport(baseline, "/project/.mejora");

    const aardvarkIndex = result.indexOf("src/aardvark.ts");
    const zebraIndex = result.indexOf("src/zebra.ts");
    const unparsableIndex = result.indexOf("Other Issues");

    expect(aardvarkIndex).toBeLessThan(zebraIndex);
    expect(zebraIndex).toBeLessThan(unparsableIndex);
  });

  it("should end with exactly one newline even when there are issues", () => {
    const baseline = {
      checks: {
        eslint: {
          items: [
            {
              column: 1,
              file: "src/index.ts",
              id: "end1",
              line: 10,
              message: "'foo' is never used",
              rule: "no-unused-vars",
            },
          ],
          type: "items" as const,
        },
      },
      version: 2,
    };

    const result = generateMarkdownReport(baseline, "/project/.mejora");

    expect(result).toMatch(/[^\n]\n$/);
    expect(result.endsWith("\n\n")).toBe(false);
  });

  it("should handle items with line and column numbers", () => {
    const baseline = {
      checks: {
        eslint: {
          items: [
            {
              column: 7,
              file: "src/index.ts",
              id: "col1",
              line: 4,
              message: "'foo' is declared but never used",
              rule: "@typescript-eslint/no-unused-vars",
            },
          ],
          type: "items" as const,
        },
      },
      version: 2,
    };
    const result = generateMarkdownReport(baseline, "/project/.mejora");

    expect(result).toMatchInlineSnapshot(`
      "# Mejora Baseline

      This file represents the current accepted state of the codebase.

      ## eslint (1 issue)

      ### [src/index.ts](../src/index.ts) (1)

      - [Line 4](../src/index.ts#L4) - @typescript-eslint/no-unused-vars: 'foo' is declared but never used
      "
    `);
  });
});
