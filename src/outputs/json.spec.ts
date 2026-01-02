import { formatJsonOutput } from "./json";

describe("formatJsonOutput", () => {
  it("should format result with regressions", () => {
    const error1 = {
      column: 1,
      file: "src/a.ts",
      id: "abc123def456",
      line: 10,
      message: "error1",
      rule: "no-unused-vars",
    };
    const error2 = {
      column: 1,
      file: "src/b.ts",
      id: "111aaa222bbb",
      line: 20,
      message: "error2",
      rule: "no-undef",
    };

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
          hasRelocation: false,
          isInitial: false,
          newItems: [error1, error2],
          removedItems: [],
          snapshot: {
            items: [error1, error2],
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
          newItems: [error1, error2],
        }),
      ],
      exitCode: 1,
      hasRegression: true,
      summary: expect.objectContaining({
        regressionChecks: ["eslint"],
        regressions: 2,
      }),
    });
  });

  it("should format result with improvements", () => {
    const error1 = {
      column: 1,
      file: "src/a.ts",
      id: "abc123def456",
      line: 10,
      message: "error1",
      rule: "no-unused-vars",
    };
    const error2 = {
      column: 1,
      file: "src/b.ts",
      id: "111aaa222bbb",
      line: 20,
      message: "error2",
      rule: "no-undef",
    };

    const result = {
      exitCode: 0,
      hasImprovement: true,
      hasRegression: false,
      results: [
        {
          baseline: { items: [error1, error2], type: "items" as const },
          checkId: "eslint",
          hasImprovement: true,
          hasRegression: false,
          hasRelocation: false,
          isInitial: false,
          newItems: [],
          removedItems: [error1],
          snapshot: { items: [error2], type: "items" as const },
        },
      ],
    };
    const output = formatJsonOutput(result);
    const parsed = JSON.parse(output);

    expect(parsed).toMatchObject({
      checks: [
        expect.objectContaining({
          removedItems: [error1],
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
    const error1 = {
      column: 1,
      file: "src/a.ts",
      id: "abc123def456",
      line: 10,
      message: "error1",
      rule: "no-unused-vars",
    };

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
          hasRelocation: false,
          isInitial: true,
          newItems: [],
          removedItems: [],
          snapshot: { items: [error1], type: "items" as const },
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
          hasRelocation: false,
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
        unchanged: 0,
        unchangedChecks: ["eslint"],
      }),
    });
  });

  it("should format multiple checks", () => {
    const error1 = {
      column: 1,
      file: "src/a.ts",
      id: "abc123def456",
      line: 10,
      message: "error1",
      rule: "no-unused-vars",
    };
    const error2 = {
      column: 1,
      file: "src/b.ts",
      id: "789xyz012tuv",
      line: 20,
      message: "error2",
      rule: "TS2304",
    };

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
          hasRelocation: false,
          isInitial: false,
          newItems: [error1],
          removedItems: [],
          snapshot: { items: [error1], type: "items" as const },
        },
        {
          baseline: { items: [error2], type: "items" as const },
          checkId: "typescript",
          hasImprovement: true,
          hasRegression: false,
          hasRelocation: false,
          isInitial: false,
          newItems: [],
          removedItems: [error2],
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
          hasRelocation: false,
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
          hasRelocation: false,
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

  it("should count a check as both improvement and regression when both flags are true", () => {
    const itemA = {
      column: 1,
      file: "src/a.ts",
      id: "abc123def456",
      line: 10,
      message: "a",
      rule: "no-unused-vars",
    };
    const itemB = {
      column: 1,
      file: "src/b.ts",
      id: "111aaa222bbb",
      line: 20,
      message: "b",
      rule: "no-undef",
    };

    const result = {
      exitCode: 1,
      hasImprovement: true,
      hasRegression: true,
      results: [
        {
          baseline: { items: [itemA], type: "items" as const },
          checkId: "eslint",
          hasImprovement: true,
          hasRegression: true,
          hasRelocation: false,
          isInitial: false,
          newItems: [itemB],
          removedItems: [itemA],
          snapshot: { items: [itemB], type: "items" as const },
        },
      ],
    };

    const parsed = JSON.parse(formatJsonOutput(result));

    expect(parsed).toMatchObject({
      summary: expect.objectContaining({
        checksRun: 1,
        improvementChecks: ["eslint"],
        improvements: 1,
        initial: 0,
        initialChecks: [],
        regressionChecks: ["eslint"],
        regressions: 1,
        totalIssues: 1,
        unchanged: 0,
        unchangedChecks: [],
      }),
    });
  });

  it("should treat initial checks as initial only even if improvement/regression flags are true", () => {
    const itemA = {
      column: 1,
      file: "src/a.ts",
      id: "abc123def456",
      line: 10,
      message: "a",
      rule: "no-unused-vars",
    };
    const itemB = {
      column: 1,
      file: "src/b.ts",
      id: "111aaa222bbb",
      line: 20,
      message: "b",
      rule: "no-undef",
    };

    const result = {
      exitCode: 0,
      hasImprovement: true,
      hasRegression: true,
      results: [
        {
          baseline: undefined,
          checkId: "eslint",
          hasImprovement: true,
          hasRegression: true,
          hasRelocation: false,
          isInitial: true,
          newItems: [itemB],
          removedItems: [itemA],
          snapshot: { items: [itemB], type: "items" as const },
        },
      ],
    };

    const parsed = JSON.parse(formatJsonOutput(result));

    expect(parsed).toMatchObject({
      summary: expect.objectContaining({
        checksRun: 1,
        improvementChecks: [],
        improvements: 0,
        initial: 1,
        initialChecks: ["eslint"],
        regressionChecks: [],
        regressions: 0,
        unchanged: 0,
        unchangedChecks: [],
      }),
    });
  });
});
