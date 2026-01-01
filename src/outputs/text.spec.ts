import { formatTextOutput } from "./text";

function stripAnsi(str: string) {
  // eslint-disable-next-line no-control-regex -- this regex is to remove ANSI escape codes
  return str.replaceAll(/\u001B\[\d+m/g, "");
}

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

    expect(output).toMatchInlineSnapshot(`
      "eslint:
        Initial baseline created with 3 issues
           error1
           error2
           error3

        Duration  2.5s
          Issues  3

        Improvements  0
         Regressions  0
           Unchanged  0
             Initial  3
              Checks  1
              Issues  3

      ✔ Initial baseline created successfully"
    `);
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

    expect(output).toMatchInlineSnapshot(`
      "eslint:
        Initial baseline created with 0 issues

          Issues  0

        Improvements  0
         Regressions  0
           Unchanged  0
             Initial  0
              Checks  1
              Issues  0

      ✔ Initial baseline created successfully"
    `);
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

    expect(output).toMatchInlineSnapshot(`
      "eslint:
        Initial baseline created with 15 issues
           error0
           error1
           error2
           error3
           error4
           error5
           error6
           error7
           error8
           error9
           ... and 5 more

          Issues  15

        Improvements  0
         Regressions  0
           Unchanged  0
             Initial  15
              Checks  1
              Issues  15

      ✔ Initial baseline created successfully"
    `);
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

    expect(output).toMatchInlineSnapshot(`
      "eslint:
        2 new issues (regressions):
           error1
           error2

        Duration  1.5s
          Issues  2

        Improvements  0
         Regressions  2
           Unchanged  0
             Initial  0
              Checks  1
              Issues  2

      ✗ Regressions detected - Run failed"
    `);
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

    expect(output).toMatchInlineSnapshot(`
      "eslint:
        2 issues fixed (improvements):
           error1
           error2

        Duration  1.2s
          Issues  0

        Improvements  2
         Regressions  0
           Unchanged  0
             Initial  0
              Checks  1
              Issues  0

      ✔ Improvements detected - Baseline updated"
    `);
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

    expect(output).toMatchInlineSnapshot(`
      "eslint:
        1 new issue (regression):
           error3
        1 issue fixed (improvement):
           error1

        Duration  1.8s
          Issues  2

        Improvements  1
         Regressions  1
           Unchanged  0
             Initial  0
              Checks  1
              Issues  2

      ✗ Regressions detected - Run failed"
    `);
  });

  it("should show unchanged checks with compact inline format", () => {
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

    expect(output).toMatchInlineSnapshot(`
      "eslint (1) 1.5s

        Improvements  0
         Regressions  0
           Unchanged  1
             Initial  0
              Checks  1
              Issues  1

      ✔ All checks passed"
    `);
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

    expect(output).toMatchInlineSnapshot(`
      "eslint (1)

        Improvements  0
         Regressions  0
           Unchanged  1
             Initial  0
              Checks  1
              Issues  1

      ✔ All checks passed"
    `);
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

    expect(output).toMatchInlineSnapshot(`
      "eslint (0) 1s

      typescript (1) 1.5s

        Improvements  0
         Regressions  0
           Unchanged  1
             Initial  0
              Checks  2
              Issues  1

      ✔ All checks passed"
    `);
  });

  it("should format output with no checks run", () => {
    const result = {
      exitCode: 0,
      hasImprovement: false,
      hasRegression: false,
      results: [],
      totalDuration: 1500,
    };
    const output = stripAnsi(formatTextOutput(result));

    expect(output).toMatchInlineSnapshot(`
      "  Improvements  0
         Regressions  0
           Unchanged  0
             Initial  0
              Checks  0
              Issues  0

      ✔ All checks passed"
    `);
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

    expect(output).toMatchInlineSnapshot(`
      "eslint (0) 1.5s

        Improvements  0
         Regressions  0
           Unchanged  0
             Initial  0
              Checks  1
              Issues  0
            Duration  1.5s (avg 1.5s)

      ✔ All checks passed"
    `);
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

    expect(output).toMatchInlineSnapshot(`
      "eslint:
        15 new issues (regressions):
           error0
           error1
           error2
           error3
           error4
           error5
           error6
           error7
           error8
           error9
           ... and 5 more

          Issues  15

        Improvements  0
         Regressions  15
           Unchanged  0
             Initial  0
              Checks  1
              Issues  15

      ✗ Regressions detected - Run failed"
    `);
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

    expect(output).toMatchInlineSnapshot(`
      "eslint:
        12 issues fixed (improvements):
           error0
           error1
           error2
           error3
           error4
           error5
           error6
           error7
           error8
           error9
           ... and 2 more

          Issues  0

        Improvements  12
         Regressions  0
           Unchanged  0
             Initial  0
              Checks  1
              Issues  0

      ✔ Improvements detected - Baseline updated"
    `);
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

    expect(output).toMatchInlineSnapshot(`
      "eslint:
        1 new issue (regression):
           error1

        Duration  1s
          Issues  1

      typescript:
        1 issue fixed (improvement):
           error2

        Duration  1.5s
          Issues  0

        Improvements  1
         Regressions  1
           Unchanged  0
             Initial  0
              Checks  2
              Issues  1
            Duration  2.5s (avg 1.3s)

      ✗ Regressions detected - Run failed"
    `);
  });

  it("should format initial baseline without leading newline", () => {
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

  it("should format improvements without leading newline", () => {
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
      ],
    };
    const output = stripAnsi(formatTextOutput(result));

    expect(output).toMatch(/^eslint:/);
  });

  it("should format unchanged without leading newline", () => {
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

    expect(output).toMatch(/^eslint \(0\)/);
  });

  it("should format multiple initial baselines with newline between them", () => {
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

    expect(output).toMatch(/^eslint:[\s\S]*\n\ntypescript:/);
  });

  it("should format multiple improvements with newline between them", () => {
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

    expect(output).toMatch(/^eslint:[\s\S]*\n\ntypescript:/);
  });

  it("should count total issues in summary across all categories, not number of checks", () => {
    const result = {
      exitCode: 1,
      hasImprovement: true,
      hasRegression: true,
      results: [
        {
          baseline: {
            items: ["old1", "old2", "old3", "old4"],
            type: "items" as const,
          },
          checkId: "eslint",
          duration: 339,
          hasImprovement: true,
          hasRegression: false,
          isInitial: false,
          newItems: [],
          removedItems: ["old1", "old2", "old3", "old4"],
          snapshot: { items: [], type: "items" as const },
        },
        {
          baseline: { items: [], type: "items" as const },
          checkId: "typescript",
          duration: 514,
          hasImprovement: false,
          hasRegression: true,
          isInitial: false,
          newItems: ["new1", "new2", "new3"],
          removedItems: [],
          snapshot: {
            items: ["new1", "new2", "new3"],
            type: "items" as const,
          },
        },
        {
          baseline: {
            items: ["unchanged1", "unchanged2"],
            type: "items" as const,
          },
          checkId: "prettier",
          hasImprovement: false,
          hasRegression: false,
          isInitial: false,
          newItems: [],
          removedItems: [],
          snapshot: {
            items: ["unchanged1", "unchanged2"],
            type: "items" as const,
          },
        },
        {
          baseline: undefined,
          checkId: "markdownlint",
          hasImprovement: false,
          hasRegression: false,
          isInitial: true,
          newItems: [],
          removedItems: [],
          snapshot: {
            items: ["initial1", "initial2", "initial3", "initial4", "initial5"],
            type: "items" as const,
          },
        },
      ],
      totalDuration: 1500,
    };

    const output = stripAnsi(formatTextOutput(result));

    expect(output).toContain("Improvements  4");
    expect(output).toContain("Regressions  3");
    expect(output).toContain("Unchanged  2");
    expect(output).toContain("Initial  5");
    expect(output).toContain("Checks  4");
  });
});
