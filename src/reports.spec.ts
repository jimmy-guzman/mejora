import { generateMarkdownReport } from "./reports";

describe("generateMarkdownReport", () => {
  beforeEach(() => {
    vi.spyOn(process, "cwd").mockReturnValue("/project");
  });

  it("should generate report with no issues", () => {
    const baseline = {
      checks: {
        eslint: { items: [], type: "items" as const },
      },
      version: 1,
    };

    const result = generateMarkdownReport(baseline, "/project/.mejora");

    expect(result).toMatchInlineSnapshot(`
      "# Mejora Baseline

      ## eslint (0 issues)

      No issues
      "
    `);
  });

  it("should generate report with file path and line number", () => {
    const baseline = {
      checks: {
        eslint: {
          items: ["/project/src/index.ts:10 - 'foo' is never used"],
          type: "items" as const,
        },
      },
      version: 1,
    };

    const result = generateMarkdownReport(baseline, "/project/.mejora");

    expect(result).toMatchInlineSnapshot(`
      "# Mejora Baseline

      ## eslint (1 issue)

      ### [src/index.ts](../src/index.ts) (1)

      - [Line 10](../src/index.ts#L10) - 'foo' is never used

      "
    `);
  });

  it("should generate report with file path without line number", () => {
    const baseline = {
      checks: {
        typescript: {
          items: ["/project/src/types.ts - Type error"],
          type: "items" as const,
        },
      },
      version: 1,
    };

    const result = generateMarkdownReport(baseline, "/project/.mejora");

    expect(result).toMatchInlineSnapshot(`
      "# Mejora Baseline

      ## typescript (1 issue)

      ### [src/types.ts](../src/types.ts) (1)

      - [src/types.ts](../src/types.ts) - Type error

      "
    `);
  });

  it("should generate report with multiple checks", () => {
    const baseline = {
      checks: {
        eslint: {
          items: ["/project/src/a.ts:1 - error a"],
          type: "items" as const,
        },
        typescript: {
          items: ["/project/src/b.ts:2 - error b"],
          type: "items" as const,
        },
      },
      version: 1,
    };

    const result = generateMarkdownReport(baseline, "/project/.mejora");

    expect(result).toMatchInlineSnapshot(`
      "# Mejora Baseline

      ## eslint (1 issue)

      ### [src/a.ts](../src/a.ts) (1)

      - [Line 1](../src/a.ts#L1) - error a

      ## typescript (1 issue)

      ### [src/b.ts](../src/b.ts) (1)

      - [Line 2](../src/b.ts#L2) - error b

      "
    `);
  });

  it("should have no blank line after last check", () => {
    const baseline = {
      checks: {
        eslint: { items: [], type: "items" as const },
      },
      version: 1,
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
            "/project/src/valid.ts:10 - valid error",
            " - invalid item without path",
          ],
          type: "items" as const,
        },
      },
      version: 1,
    };

    const result = generateMarkdownReport(baseline, "/project/.mejora");

    expect(result).toMatchInlineSnapshot(`
      "# Mejora Baseline

      ## eslint (2 issues)

      ### [src/valid.ts](../src/valid.ts) (1)

      - [Line 10](../src/valid.ts#L10) - valid error

      ### Other Issues (1)

      -  - invalid item without path

      "
    `);
  });

  it("should not add description separator when item has no description", () => {
    const baseline = {
      checks: {
        eslint: {
          items: ["/project/src/index.ts:10"],
          type: "items" as const,
        },
      },
      version: 1,
    };
    const result = generateMarkdownReport(baseline, "/project/.mejora");

    expect(result).toMatchInlineSnapshot(`
      "# Mejora Baseline

      ## eslint (1 issue)

      ### [src/index.ts](../src/index.ts) (1)

      - [Line 10](../src/index.ts#L10)

      "
    `);
  });

  it("should group multiple items from same file", () => {
    const baseline = {
      checks: {
        eslint: {
          items: [
            "/project/src/index.ts:10 - error 1",
            "/project/src/index.ts:20 - error 2",
            "/project/src/utils.ts:5 - error 3",
          ],
          type: "items" as const,
        },
      },
      version: 1,
    };

    const result = generateMarkdownReport(baseline, "/project/.mejora");

    expect(result).toMatchInlineSnapshot(`
      "# Mejora Baseline

      ## eslint (3 issues)

      ### [src/index.ts](../src/index.ts) (2)

      - [Line 10](../src/index.ts#L10) - error 1
      - [Line 20](../src/index.ts#L20) - error 2

      ### [src/utils.ts](../src/utils.ts) (1)

      - [Line 5](../src/utils.ts#L5) - error 3

      "
    `);
  });

  it("should handle Windows drive-letter paths", () => {
    vi.spyOn(process, "cwd").mockReturnValue(String.raw`C:\project`);

    const baseline = {
      checks: {
        eslint: {
          items: [String.raw`C:\project\src\index.ts:10 - 'foo' is never used`],
          type: "items" as const,
        },
      },
      version: 1,
    };

    const result = generateMarkdownReport(
      baseline,
      String.raw`C:\project\.mejora`,
    );

    expect(result).toMatchInlineSnapshot(`
      "# Mejora Baseline

      ## eslint (1 issue)

      ### [src/index.ts](../src/index.ts) (1)

      - [Line 10](../src/index.ts#L10) - 'foo' is never used

      "
    `);
  });

  it("should handle Windows paths without line numbers", () => {
    vi.spyOn(process, "cwd").mockReturnValue(String.raw`D:\code\app`);

    const baseline = {
      checks: {
        typescript: {
          items: [String.raw`D:\code\app\types.ts - Type error`],
          type: "items" as const,
        },
      },
      version: 1,
    };

    const result = generateMarkdownReport(
      baseline,
      String.raw`D:\code\app\.mejora`,
    );

    expect(result).toMatchInlineSnapshot(`
      "# Mejora Baseline

      ## typescript (1 issue)

      ### [types.ts](../types.ts) (1)

      - [types.ts](../types.ts) - Type error

      "
    `);
  });

  it("should group multiple Windows path items from same file", () => {
    vi.spyOn(process, "cwd").mockReturnValue(String.raw`C:\project`);

    const baseline = {
      checks: {
        eslint: {
          items: [
            String.raw`C:\project\src\index.ts:10 - error 1`,
            String.raw`C:\project\src\index.ts:20 - error 2`,
            String.raw`C:\project\src\utils.ts:5 - error 3`,
          ],
          type: "items" as const,
        },
      },
      version: 1,
    };

    const result = generateMarkdownReport(
      baseline,
      String.raw`C:\project\.mejora`,
    );

    expect(result).toMatchInlineSnapshot(`
      "# Mejora Baseline

      ## eslint (3 issues)

      ### [src/index.ts](../src/index.ts) (2)

      - [Line 10](../src/index.ts#L10) - error 1
      - [Line 20](../src/index.ts#L20) - error 2

      ### [src/utils.ts](../src/utils.ts) (1)

      - [Line 5](../src/utils.ts#L5) - error 3

      "
    `);
  });

  it("should handle mixed Unix and Windows paths", () => {
    vi.spyOn(process, "cwd").mockReturnValue(String.raw`C:\project`);

    const baseline = {
      checks: {
        eslint: {
          items: [
            "/project/src/unix.ts:10 - unix error",
            String.raw`C:\project\src\windows.ts:20 - windows error`,
          ],
          type: "items" as const,
        },
      },
      version: 1,
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
            "/project/src/form.tsx:71 - TS7053: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type 'string | FormikErrors<ItemGroupUploadFormikRow>'.",
          ],
          type: "items" as const,
        },
      },
      version: 1,
    };

    const result = generateMarkdownReport(baseline, "/project/.mejora");

    expect(result).toMatchInlineSnapshot(`
      "# Mejora Baseline

      ## typescript (1 issue)

      ### [src/form.tsx](../src/form.tsx) (1)

      - [Line 71](../src/form.tsx#L71) - TS7053: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type 'string | FormikErrors&lt;ItemGroupUploadFormikRow&gt;'.

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
            "/project/src/test.ts:125 - The types returned by '[Symbol.iterator]().next(...)' are incompatible.",
          ],
          type: "items" as const,
        },
      },
      version: 1,
    };

    const result = generateMarkdownReport(baseline, "/project/.mejora");

    expect(result).toMatchInlineSnapshot(`
      "# Mejora Baseline

      ## typescript (1 issue)

      ### [src/test.ts](../src/test.ts) (1)

      - [Line 125](../src/test.ts#L125) - The types returned by '&#91;Symbol.iterator&#93;().next(...)' are incompatible.

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
            "/project/src/a.ts:1 - error a",
            "/project/src/b.ts:2 - error b",
          ],
          type: "items" as const,
        },
        typescript: {
          items: ["/project/src/c.ts:3 - error c"],
          type: "items" as const,
        },
      },
      version: 1,
    };

    const result = generateMarkdownReport(baseline, "/project/.mejora");

    expect(result).not.toContain("\n\n\n");

    expect(result).toMatchInlineSnapshot(`
      "# Mejora Baseline

      ## eslint (2 issues)

      ### [src/a.ts](../src/a.ts) (1)

      - [Line 1](../src/a.ts#L1) - error a

      ### [src/b.ts](../src/b.ts) (1)

      - [Line 2](../src/b.ts#L2) - error b

      ## typescript (1 issue)

      ### [src/c.ts](../src/c.ts) (1)

      - [Line 3](../src/c.ts#L3) - error c

      "
    `);
  });

  it("should place unparsable items last even when mixed with valid files", () => {
    const baseline = {
      checks: {
        eslint: {
          items: [
            " - unparsable item",
            "/project/src/zebra.ts:10 - last alphabetically",
            " - another unparsable",
            "/project/src/aardvark.ts:5 - first alphabetically",
          ],
          type: "items" as const,
        },
      },
      version: 1,
    };

    const result = generateMarkdownReport(baseline, "/project/.mejora");

    const aardvarkIndex = result.indexOf("src/aardvark.ts");
    const zebraIndex = result.indexOf("src/zebra.ts");
    const unparsableIndex = result.indexOf("Other Issues");

    expect(aardvarkIndex).toBeLessThan(zebraIndex);
    expect(zebraIndex).toBeLessThan(unparsableIndex);
  });
});
