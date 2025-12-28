import { generateMarkdownReport } from "./reports";

describe("generateMarkdownReport", () => {
  it("should generate report with no issues", () => {
    const baseline = {
      checks: {
        eslint: { items: [], type: "items" as const },
      },
      version: 1,
    };

    const result = generateMarkdownReport(baseline, "/project/.mejora");

    expect(result).toBe("# Mejora Baseline\n\n## eslint\n\nNo issues\n");
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

    expect(result).toContain("## eslint");
    expect(result).toContain("[/project/src/index.ts:10](../src/index.ts#L10)");
    expect(result).toContain("'foo' is never used");
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

    expect(result).toContain("[/project/src/types.ts](../src/types.ts)");
    expect(result).toContain("Type error");
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

    expect(result).toContain("## eslint");
    expect(result).toContain("## typescript");
    expect(result).toContain("error a");
    expect(result).toContain("error b");
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

  it("should skip items without file path", () => {
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

    expect(result).toContain("valid.ts");
    expect(result).toContain("## eslint");
  });
});
