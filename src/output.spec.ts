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
        expect.objectContaining({
          newItems: ["error1", "error2"],
        }),
      ],
      exitCode: 1,
      hasRegression: true,
      summary: expect.objectContaining({
        regressionChecks: ["eslint"],
        regressions: 1,
      }),
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

    expect(parsed).toMatchObject({
      checks: [
        expect.objectContaining({
          removedItems: ["error1"],
        }),
      ],
      exitCode: 0,
      hasImprovement: true,
      summary: expect.objectContaining({
        improvementChecks: ["eslint"],
        improvements: 1,
      }),
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

    expect(parsed).toMatchObject({
      checks: [
        expect.objectContaining({
          isInitial: true,
        }),
      ],
      summary: expect.objectContaining({
        initial: 1,
        initialChecks: ["eslint"],
      }),
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

    expect(parsed).toMatchObject({
      checks: [
        expect.objectContaining({
          totalIssues: 0,
        }),
      ],
      summary: expect.objectContaining({
        totalIssues: 0,
        unchanged: 1,
        unchangedChecks: ["eslint"],
      }),
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

    expect(parsed).toMatchObject({
      checks: expect.arrayContaining([
        expect.objectContaining({ checkId: "eslint" }),
        expect.objectContaining({ checkId: "typescript" }),
      ]),
      summary: expect.objectContaining({
        checksRun: 2,
        improvements: 1,
        regressions: 1,
        totalIssues: 1,
      }),
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

    expect(parsed).toMatchObject({
      summary: expect.objectContaining({
        avgDuration: 1250,
      }),
    });
  });

  it("should set avgDuration to undefined in JSON when results array is empty", () => {
    const result = {
      exitCode: 0,
      hasImprovement: false,
      hasRegression: false,
      results: [],
      totalDuration: 1500,
    };
    const output = formatJsonOutput(result);
    const parsed = JSON.parse(output);

    expect(parsed).toMatchObject(
      expect.objectContaining({
        summary: expect.not.objectContaining({
          avgDuration: expect.any(Number),
        }),
      }),
    );
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

    expect(output).toMatchInlineSnapshot(`
      "eslint:
        Initial baseline created with 3 issue(s)
           error1
           error2
           error3
        Duration  2.5s
          Issues  3

      Summary
        Improvements  0
         Regressions  0
           Unchanged  0
             Initial  1
              Checks  1
              Issues  3

      ✓ Initial baseline created successfully"
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
        Initial baseline created with 0 issue(s)
          Issues  0

      Summary
        Improvements  0
         Regressions  0
           Unchanged  0
             Initial  1
              Checks  1
              Issues  0

      ✓ Initial baseline created successfully"
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
        Initial baseline created with 15 issue(s)
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

      Summary
        Improvements  0
         Regressions  0
           Unchanged  0
             Initial  1
              Checks  1
              Issues  15

      ✓ Initial baseline created successfully"
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
        2 new issue(s) (regressions):
           error1
           error2
        Duration  1.5s
          Issues  2

      Summary
        Improvements  0
         Regressions  1
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
        2 issue(s) fixed (improvements):
           error1
           error2
        Duration  1.2s
          Issues  0

      Summary
        Improvements  1
         Regressions  0
           Unchanged  0
             Initial  0
              Checks  1
              Issues  0

      ✓ Improvements detected - Baseline updated"
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
        1 new issue(s) (regressions):
           error3
        1 issue(s) fixed (improvements):
           error1
        Duration  1.8s
          Issues  2

      Summary
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
      "eslint (1 issue) 1.5s

      Summary
        Improvements  0
         Regressions  0
           Unchanged  1
             Initial  0
              Checks  1
              Issues  1

      ✓ All checks passed"
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
      "eslint (1 issue)

      Summary
        Improvements  0
         Regressions  0
           Unchanged  1
             Initial  0
              Checks  1
              Issues  1

      ✓ All checks passed"
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
      "eslint (0 issues) 1s

      typescript (1 issue) 1.5s

      Summary
        Improvements  0
         Regressions  0
           Unchanged  2
             Initial  0
              Checks  2
              Issues  1

      ✓ All checks passed"
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
      "Summary
        Improvements  0
         Regressions  0
           Unchanged  0
             Initial  0
              Checks  0
              Issues  0

      ✓ All checks passed"
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
      "eslint (0 issues) 1.5s

      Summary
        Improvements  0
         Regressions  0
           Unchanged  1
             Initial  0
              Checks  1
              Issues  0
            Duration  1.5s (avg 1.5s)

      ✓ All checks passed"
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
        15 new issue(s) (regressions):
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

      Summary
        Improvements  0
         Regressions  1
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
        12 issue(s) fixed (improvements):
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

      Summary
        Improvements  1
         Regressions  0
           Unchanged  0
             Initial  0
              Checks  1
              Issues  0

      ✓ Improvements detected - Baseline updated"
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
        1 new issue(s) (regressions):
           error1
        Duration  1s
          Issues  1

      typescript:
        1 issue(s) fixed (improvements):
           error2
        Duration  1.5s
          Issues  0

      Summary
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

    expect(output).toMatch(/^eslint \(0 issues\)/);
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
});
