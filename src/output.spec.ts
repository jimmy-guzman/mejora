import { formatJsonOutput, formatTextOutput } from "./output";

function stripAnsi(str: string) {
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

    expect(parsed).toMatchObject({
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
      summary: {
        checksRun: 1,
        improvementChecks: [],
        improvements: 0,
        initial: 0,
        initialChecks: [],
        regressionChecks: ["eslint"],
        regressions: 1,
        totalIssues: 2,
        unchanged: 0,
        unchangedChecks: [],
      },
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- this is to check the output structure
    expect(parsed.summary).toMatchObject({
      checksRun: 1,
      improvementChecks: ["eslint"],
      improvements: 1,
      regressions: 0,
      totalIssues: 1,
      unchanged: 0,
    });
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- this is to check the output structure
    expect(parsed.summary).toMatchObject({
      checksRun: 1,
      improvements: 0,
      initial: 1,
      initialChecks: ["eslint"],
      regressions: 0,
      totalIssues: 1,
      unchanged: 0,
    });
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- this is to check the output structure
    expect(parsed.summary).toMatchObject({
      checksRun: 1,
      improvements: 0,
      regressions: 0,
      totalIssues: 0,
      unchanged: 1,
      unchangedChecks: ["eslint"],
    });
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- this is to check the output structure
    expect(parsed.summary).toMatchObject({
      checksRun: 2,
      improvementChecks: ["typescript"],
      improvements: 1,
      regressionChecks: ["eslint"],
      regressions: 1,
      totalIssues: 1,
      unchanged: 0,
    });
  });

  it("should include avgDuration in JSON summary when totalDuration is present", () => {
    const result = {
      exitCode: 0,
      hasImprovement: false,
      hasRegression: false,
      results: [
        {
          baseline: { items: [], type: "items" as const },
          checkId: "eslint",
          duration: 1000,
          hasImprovement: false,
          hasRegression: false,
          isInitial: false,
          newItems: [],
          removedItems: [],
          snapshot: { items: [], type: "items" as const },
        },
        {
          baseline: { items: [], type: "items" as const },
          checkId: "typescript",
          duration: 1500,
          hasImprovement: false,
          hasRegression: false,
          isInitial: false,
          newItems: [],
          removedItems: [],
          snapshot: { items: [], type: "items" as const },
        },
      ],
      totalDuration: 2500,
    };

    const output = formatJsonOutput(result);
    const parsed = JSON.parse(output);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- this is to check the output structure
    expect(parsed.summary.avgDuration).toBe(1250);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- this is to check the output structure
    expect(parsed.summary.totalIssues).toBe(0);
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
          duration: 2500,
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
    expect(output).toContain("Completed in");
    expect(output).toContain("3 issues");
    expect(output).toContain("Summary");
    expect(output).toContain("Checks run: 1");
    expect(output).toContain("Initial: 1 (eslint)");
    expect(output).toContain("Total issues: 3");
    expect(output).toContain("✓ Initial baseline created successfully");
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
    expect(output).toContain("Summary");
    expect(output).toContain("Total issues: 0");
    expect(output).toContain("✓ Initial baseline created successfully");
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
    expect(output).toContain("1 issue");
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
          duration: 1500,
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
    expect(output).toContain("Completed in");
    expect(output).toContain("2 issues");
    expect(output).toContain("Summary");
    expect(output).toContain("Regressions: 1 (eslint)");
    expect(output).toContain("Total issues: 2");
    expect(output).toContain("Initial: 0");
    expect(output).toContain("✗ Regressions detected - Run failed");
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
          duration: 1200,
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
    expect(output).toContain("Completed in");
    expect(output).toContain("0 issues");
    expect(output).toContain("Summary");
    expect(output).toContain("Improvements: 1 (eslint)");
    expect(output).toContain("Total issues: 0");
    expect(output).toContain("Initial: 0");
    expect(output).toContain("✓ Improvements detected - Baseline updated");
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
    expect(output).toContain("2 issues");
    expect(output).toContain("Summary");
    expect(output).toContain("Improvements: 1 (eslint)");
    expect(output).toContain("Regressions: 1 (eslint)");
    expect(output).toContain("Total issues: 2");
    expect(output).toContain("Initial: 0");
    expect(output).toContain("✗ Regressions detected - Run failed");
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
    expect(output).toContain("2 issues");
  });

  it("should show unchanged checks with duration and issue count", () => {
    const result = {
      exitCode: 0,
      hasImprovement: false,
      hasRegression: false,
      results: [
        {
          baseline: { items: ["error1"], type: "items" as const },
          checkId: "eslint",
          duration: 1500,
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

    expect(output).toContain("eslint:");
    expect(output).toContain("Completed in");
    expect(output).toContain("1 issue");
    expect(output).toContain("Summary");
    expect(output).toContain("Checks run: 1");
    expect(output).toContain("Unchanged: 1 (eslint)");
    expect(output).toContain("Total issues: 1");
    expect(output).toContain("Initial: 0");
    expect(output).toContain("✓ All checks passed");
  });

  it("should show unchanged checks without duration", () => {
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

    expect(output).toContain("eslint:");
    expect(output).not.toContain("Completed in");
    expect(output).toContain("Summary");
    expect(output).toContain("Unchanged: 1 (eslint)");
    expect(output).toContain("✓ All checks passed");
  });

  it("should format unchanged check as first check without leading newline", () => {
    const result = {
      exitCode: 0,
      hasImprovement: false,
      hasRegression: false,
      results: [
        {
          baseline: { items: [], type: "items" as const },
          checkId: "eslint",
          duration: 1000,
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

    expect(output).toMatch(/^eslint:/);
    expect(output).toContain("Completed in");
    expect(output).toContain("0 issues");
  });

  it("should format multiple unchanged checks with newline between them", () => {
    const result = {
      exitCode: 0,
      hasImprovement: false,
      hasRegression: false,
      results: [
        {
          baseline: { items: [], type: "items" as const },
          checkId: "eslint",
          duration: 1000,
          hasImprovement: false,
          hasRegression: false,
          isInitial: false,
          newItems: [],
          removedItems: [],
          snapshot: { items: [], type: "items" as const },
        },
        {
          baseline: { items: ["error1"], type: "items" as const },
          checkId: "typescript",
          duration: 1500,
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

    expect(output).toMatch(/eslint:.*\n\ntypescript:/s);
    expect(output).toContain("Completed in");
    expect(output).toContain("Checks run: 2");
    expect(output).toContain("Unchanged: 2 (eslint, typescript)");
  });

  it("should format output with no checks run", () => {
    const result = {
      exitCode: 0,
      hasImprovement: false,
      hasRegression: false,
      results: [],
    };

    const output = stripAnsi(formatTextOutput(result));

    expect(output).toContain("Summary");
    expect(output).toContain("Checks run: 0");
    expect(output).toContain("✓ All checks passed");
    expect(output).not.toMatch(/\n\nSummary/);
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

    expect(output).toContain("eslint:");
    expect(output).toContain("Completed in");
    expect(output).toContain("0 issues");
    expect(output).toContain("Summary");
    expect(output).toContain("Total issues: 0");
    expect(output).toContain("Duration:");
    expect(output).toContain("avg");
    expect(output).toContain("✓ All checks passed");
    expect(output).toContain("Initial: 0");
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
          duration: 1000,
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
          duration: 1500,
          hasImprovement: true,
          hasRegression: false,
          isInitial: false,
          newItems: [],
          removedItems: ["error2"],
          snapshot: { items: [], type: "items" as const },
        },
      ],
      totalDuration: 2500,
    };

    const output = stripAnsi(formatTextOutput(result));

    expect(output).toContain("eslint:");
    expect(output).toContain("typescript:");
    expect(output).toContain("error1");
    expect(output).toContain("error2");
    expect(output).toContain("Summary");
    expect(output).toContain("Checks run: 2");
    expect(output).toContain("Improvements: 1 (typescript)");
    expect(output).toContain("Regressions: 1 (eslint)");
    expect(output).toContain("Total issues: 1");
    expect(output).toContain("Duration:");
    expect(output).toContain("avg");
    expect(output).toContain("Initial: 0");
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
