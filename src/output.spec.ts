import { formatJsonOutput, formatTextOutput } from "./output";

function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex -- this regex is to remove ANSI escape codes
  return str.replaceAll(/\u001B\[\d+m/g, "");
}

describe("formatJsonOutput", () => {
  it("should format result with regressions", () => {
    const result = {
      exitCode: 1,
      hasImprovement: false,
      hasRegression: true,
      results: [
        {
          baseline: { items: [], type: "items" as const },
          checkId: "eslint",
          hasImprovement: false,
          hasRegression: true,
          isInitial: false,
          newItems: ["error1", "error2"],
          removedItems: [],
          snapshot: {
            items: ["error1", "error2"],
            type: "items" as const,
          },
        },
      ],
    };

    const output = formatJsonOutput(result);
    const parsed = JSON.parse(output);

    expect(parsed).toStrictEqual({
      checks: [
        {
          checkId: "eslint",
          hasImprovement: false,
          hasRegression: true,
          isInitial: false,
          newItems: ["error1", "error2"],
          removedItems: [],
          totalIssues: 2,
        },
      ],
      exitCode: 1,
      hasImprovement: false,
      hasRegression: true,
    });
  });

  it("should format result with improvements", () => {
    const result = {
      exitCode: 0,
      hasImprovement: true,
      hasRegression: false,
      results: [
        {
          baseline: { items: ["error1", "error2"], type: "items" as const },
          checkId: "eslint",
          hasImprovement: true,
          hasRegression: false,
          isInitial: false,
          newItems: [],
          removedItems: ["error1"],
          snapshot: { items: ["error2"], type: "items" as const },
        },
      ],
    };

    const output = formatJsonOutput(result);
    const parsed = JSON.parse(output);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- this is to check the output structure
    expect(parsed.checks[0].hasImprovement).toBe(true);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- this is to check the output structure
    expect(parsed.checks[0].removedItems).toStrictEqual(["error1"]);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- this is to check the output structure
    expect(parsed.checks[0].totalIssues).toBe(1);
  });

  it("should format initial baseline", () => {
    const result = {
      exitCode: 0,
      hasImprovement: false,
      hasRegression: false,
      results: [
        {
          baseline: undefined,
          checkId: "eslint",
          hasImprovement: false,
          hasRegression: false,
          isInitial: true,
          newItems: [],
          removedItems: [],
          snapshot: { items: ["error1"], type: "items" as const },
        },
      ],
    };

    const output = formatJsonOutput(result);
    const parsed = JSON.parse(output);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- this is to check the output structure
    expect(parsed.checks[0].isInitial).toBe(true);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- this is to check the output structure
    expect(parsed.checks[0].totalIssues).toBe(1);
  });

  it("should handle empty snapshot items", () => {
    const result = {
      exitCode: 0,
      hasImprovement: false,
      hasRegression: false,
      results: [
        {
          baseline: { items: [], type: "items" as const },
          checkId: "eslint",
          hasImprovement: false,
          hasRegression: false,
          isInitial: false,
          newItems: [],
          removedItems: [],
          snapshot: { items: [], type: "items" as const },
        },
      ],
    };

    const output = formatJsonOutput(result);
    const parsed = JSON.parse(output);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- this is to check the output structure
    expect(parsed.checks[0].totalIssues).toBe(0);
  });

  it("should format multiple checks", () => {
    const result = {
      exitCode: 1,
      hasImprovement: false,
      hasRegression: true,
      results: [
        {
          baseline: { items: [], type: "items" as const },
          checkId: "eslint",
          hasImprovement: false,
          hasRegression: true,
          isInitial: false,
          newItems: ["error1"],
          removedItems: [],
          snapshot: { items: ["error1"], type: "items" as const },
        },
        {
          baseline: { items: ["error2"], type: "items" as const },
          checkId: "typescript",
          hasImprovement: true,
          hasRegression: false,
          isInitial: false,
          newItems: [],
          removedItems: ["error2"],
          snapshot: { items: [], type: "items" as const },
        },
      ],
    };

    const output = formatJsonOutput(result);
    const parsed = JSON.parse(output);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- this is to check the output structure
    expect(parsed.checks).toHaveLength(2);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- this is to check the output structure
    expect(parsed.checks[0].checkId).toBe("eslint");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- this is to check the output structure
    expect(parsed.checks[1].checkId).toBe("typescript");
  });
});

describe("formatTextOutput", () => {
  it("should format initial baseline with items", () => {
    const result = {
      exitCode: 0,
      hasImprovement: false,
      hasRegression: false,
      results: [
        {
          baseline: undefined,
          checkId: "eslint",
          hasImprovement: false,
          hasRegression: false,
          isInitial: true,
          newItems: [],
          removedItems: [],
          snapshot: {
            items: ["error1", "error2", "error3"],
            type: "items" as const,
          },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result));

    expect(output).toContain("eslint:");
    expect(output).toContain("Initial baseline created with 3 issue(s)");
    expect(output).toContain("error1");
    expect(output).toContain("error2");
    expect(output).toContain("error3");
    expect(output).toContain("Initial baseline created successfully.");
  });

  it("should format initial baseline with no items", () => {
    const result = {
      exitCode: 0,
      hasImprovement: false,
      hasRegression: false,
      results: [
        {
          baseline: undefined,
          checkId: "eslint",
          hasImprovement: false,
          hasRegression: false,
          isInitial: true,
          newItems: [],
          removedItems: [],
          snapshot: {
            items: [],
            type: "items" as const,
          },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result));

    expect(output).toContain("eslint:");
    expect(output).toContain("Initial baseline created with 0 issue(s)");
    expect(output).not.toContain("error");
    expect(output).toContain("Initial baseline created successfully.");
  });

  it("should format initial baseline with duration", () => {
    const result = {
      exitCode: 0,
      hasImprovement: false,
      hasRegression: false,
      results: [
        {
          baseline: undefined,
          checkId: "eslint",
          duration: 2500,
          hasImprovement: false,
          hasRegression: false,
          isInitial: true,
          newItems: [],
          removedItems: [],
          snapshot: {
            items: ["error1"],
            type: "items" as const,
          },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result));

    expect(output).toContain("eslint:");
    expect(output).toContain("Initial baseline created with 1 issue(s)");
    expect(output).toContain("Completed in");
  });

  it("should truncate initial baseline items over 10", () => {
    const items = Array.from({ length: 15 }, (_, i) => `error${i}`);
    const result = {
      exitCode: 0,
      hasImprovement: false,
      hasRegression: false,
      results: [
        {
          baseline: undefined,
          checkId: "eslint",
          hasImprovement: false,
          hasRegression: false,
          isInitial: true,
          newItems: [],
          removedItems: [],
          snapshot: { items, type: "items" as const },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result));

    expect(output).toContain("... and 5 more");
    expect(output).toContain("error9");
    expect(output).not.toContain("error10");
  });

  it("should format regressions", () => {
    const result = {
      exitCode: 1,
      hasImprovement: false,
      hasRegression: true,
      results: [
        {
          baseline: { items: [], type: "items" as const },
          checkId: "eslint",
          hasImprovement: false,
          hasRegression: true,
          isInitial: false,
          newItems: ["error1", "error2"],
          removedItems: [],
          snapshot: { items: ["error1", "error2"], type: "items" as const },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result));

    expect(output).toContain("eslint:");
    expect(output).toContain("2 new issue(s) (regressions):");
    expect(output).toContain("error1");
    expect(output).toContain("error2");
    expect(output).toContain("Regressions detected. Run failed.");
  });

  it("should format improvements", () => {
    const result = {
      exitCode: 0,
      hasImprovement: true,
      hasRegression: false,
      results: [
        {
          baseline: { items: ["error1", "error2"], type: "items" as const },
          checkId: "eslint",
          hasImprovement: true,
          hasRegression: false,
          isInitial: false,
          newItems: [],
          removedItems: ["error1", "error2"],
          snapshot: { items: [], type: "items" as const },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result));

    expect(output).toContain("eslint:");
    expect(output).toContain("2 issue(s) fixed (improvements):");
    expect(output).toContain("error1");
    expect(output).toContain("error2");
    expect(output).toContain("Improvements detected. Baseline updated.");
  });

  it("should format both regressions and improvements", () => {
    const result = {
      exitCode: 1,
      hasImprovement: true,
      hasRegression: true,
      results: [
        {
          baseline: { items: ["error1", "error2"], type: "items" as const },
          checkId: "eslint",
          hasImprovement: true,
          hasRegression: true,
          isInitial: false,
          newItems: ["error3"],
          removedItems: ["error1"],
          snapshot: { items: ["error2", "error3"], type: "items" as const },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result));

    expect(output).toContain("1 new issue(s) (regressions):");
    expect(output).toContain("error3");
    expect(output).toContain("1 issue(s) fixed (improvements):");
    expect(output).toContain("error1");
    expect(output).toContain("Regressions detected. Run failed.");
  });

  it("should format both regressions and improvements with duration", () => {
    const result = {
      exitCode: 1,
      hasImprovement: true,
      hasRegression: true,
      results: [
        {
          baseline: { items: ["error1", "error2"], type: "items" as const },
          checkId: "eslint",
          duration: 1800,
          hasImprovement: true,
          hasRegression: true,
          isInitial: false,
          newItems: ["error3"],
          removedItems: ["error1"],
          snapshot: { items: ["error2", "error3"], type: "items" as const },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result));

    expect(output).toContain("1 new issue(s) (regressions):");
    expect(output).toContain("error3");
    expect(output).toContain("1 issue(s) fixed (improvements):");
    expect(output).toContain("error1");
    expect(output).toContain("Completed in");
  });

  it("should format clean pass without double newlines", () => {
    const result = {
      exitCode: 0,
      hasImprovement: false,
      hasRegression: false,
      results: [
        {
          baseline: { items: [], type: "items" as const },
          checkId: "eslint",
          hasImprovement: false,
          hasRegression: false,
          isInitial: false,
          newItems: [],
          removedItems: [],
          snapshot: { items: [], type: "items" as const },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result));

    expect(output).toBe("All checks passed.");
    // Should not start with newline or have double newlines
    expect(output).not.toMatch(/^\n/);
    expect(output).not.toContain("\n\n");
  });

  it("should format clean pass with duration", () => {
    const result = {
      exitCode: 0,
      hasImprovement: false,
      hasRegression: false,
      results: [
        {
          baseline: { items: [], type: "items" as const },
          checkId: "eslint",
          duration: 1500,
          hasImprovement: false,
          hasRegression: false,
          isInitial: false,
          newItems: [],
          removedItems: [],
          snapshot: { items: [], type: "items" as const },
        },
      ],
      totalDuration: 1500,
    };

    const output = stripAnsi(formatTextOutput(result));

    expect(output).toContain("All checks passed.");
    expect(output).toContain("Completed in");
    // Should have exactly one newline between summary message and duration
    expect(output.split("\n")).toHaveLength(2);
  });

  it("should skip checks with no changes in text output", () => {
    const result = {
      exitCode: 0,
      hasImprovement: false,
      hasRegression: false,
      results: [
        {
          baseline: { items: ["error1"], type: "items" as const },
          checkId: "eslint",
          hasImprovement: false,
          hasRegression: false,
          isInitial: false,
          newItems: [],
          removedItems: [],
          snapshot: { items: ["error1"], type: "items" as const },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result));

    expect(output).not.toContain("eslint:");
    expect(output).toContain("All checks passed.");
  });

  it("should truncate regressions over 10", () => {
    const items = Array.from({ length: 15 }, (_, i) => `error${i}`);
    const result = {
      exitCode: 1,
      hasImprovement: false,
      hasRegression: true,
      results: [
        {
          baseline: { items: [], type: "items" as const },
          checkId: "eslint",
          hasImprovement: false,
          hasRegression: true,
          isInitial: false,
          newItems: items,
          removedItems: [],
          snapshot: { items, type: "items" as const },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result));

    expect(output).toContain("... and 5 more");
  });

  it("should truncate improvements over 10", () => {
    const items = Array.from({ length: 12 }, (_, i) => `error${i}`);
    const result = {
      exitCode: 0,
      hasImprovement: true,
      hasRegression: false,
      results: [
        {
          baseline: { items, type: "items" as const },
          checkId: "eslint",
          hasImprovement: true,
          hasRegression: false,
          isInitial: false,
          newItems: [],
          removedItems: items,
          snapshot: { items: [], type: "items" as const },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result));

    expect(output).toContain("... and 2 more");
  });

  it("should handle multiple checks", () => {
    const result = {
      exitCode: 1,
      hasImprovement: true,
      hasRegression: true,
      results: [
        {
          baseline: { items: [], type: "items" as const },
          checkId: "eslint",
          hasImprovement: false,
          hasRegression: true,
          isInitial: false,
          newItems: ["error1"],
          removedItems: [],
          snapshot: { items: ["error1"], type: "items" as const },
        },
        {
          baseline: { items: ["error2"], type: "items" as const },
          checkId: "typescript",
          hasImprovement: true,
          hasRegression: false,
          isInitial: false,
          newItems: [],
          removedItems: ["error2"],
          snapshot: { items: [], type: "items" as const },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result));

    expect(output).toContain("eslint:");
    expect(output).toContain("typescript:");
    expect(output).toContain("error1");
    expect(output).toContain("error2");
  });

  it("should not have leading newline for first check", () => {
    const result = {
      exitCode: 0,
      hasImprovement: false,
      hasRegression: false,
      results: [
        {
          baseline: undefined,
          checkId: "eslint",
          hasImprovement: false,
          hasRegression: false,
          isInitial: true,
          newItems: [],
          removedItems: [],
          snapshot: { items: [], type: "items" as const },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result));

    expect(output).toMatch(/^eslint:/);
  });

  it("should have newline between multiple checks", () => {
    const result = {
      exitCode: 0,
      hasImprovement: true,
      hasRegression: false,
      results: [
        {
          baseline: { items: ["error1"], type: "items" as const },
          checkId: "eslint",
          hasImprovement: true,
          hasRegression: false,
          isInitial: false,
          newItems: [],
          removedItems: ["error1"],
          snapshot: { items: [], type: "items" as const },
        },
        {
          baseline: { items: ["error2"], type: "items" as const },
          checkId: "typescript",
          hasImprovement: true,
          hasRegression: false,
          isInitial: false,
          newItems: [],
          removedItems: ["error2"],
          snapshot: { items: [], type: "items" as const },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result));

    expect(output).toMatch(/eslint:.*\n\ntypescript:/s);
  });

  it("should add newline prefix for second initial baseline", () => {
    const result = {
      exitCode: 0,
      hasImprovement: false,
      hasRegression: false,
      results: [
        {
          baseline: undefined,
          checkId: "eslint",
          hasImprovement: false,
          hasRegression: false,
          isInitial: true,
          newItems: [],
          removedItems: [],
          snapshot: { items: ["error1"], type: "items" as const },
        },
        {
          baseline: undefined,
          checkId: "typescript",
          hasImprovement: false,
          hasRegression: false,
          isInitial: true,
          newItems: [],
          removedItems: [],
          snapshot: { items: ["error2"], type: "items" as const },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result));
    const lines = output.split("\n");

    const typescriptIndex = lines.findIndex((line) => {
      return line.includes("typescript:");
    });

    expect(lines[typescriptIndex - 1]).toBe("");

    expect(lines[0]).toContain("eslint:");
  });
});
