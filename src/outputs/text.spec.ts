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
          hasRelocation: false,
          isInitial: true,
          newIssues: [],
          removedIssues: [],
          snapshot: {
            items: [
              {
                column: 1,
                file: "src/a.ts",
                id: "abc123def456",
                line: 10,
                message: "error1",
                rule: "no-unused-vars",
              },
              {
                column: 1,
                file: "src/b.ts",
                id: "111aaa222bbb",
                line: 20,
                message: "error2",
                rule: "no-undef",
              },
              {
                column: 1,
                file: "src/c.ts",
                id: "333ccc444ddd",
                line: 30,
                message: "error3",
                rule: "semi",
              },
            ],
            type: "items" as const,
          },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result, false));

    expect(output).toMatchInlineSnapshot(`
      "ℹ eslint:
        Initial baseline created with 3 issues
           → src/a.ts:10:1  no-unused-vars
             error1
           → src/b.ts:20:1  no-undef
             error2
           → src/c.ts:30:1  semi
             error3

        Duration  2.5s
          Issues  3

        Improvements  0
         Regressions  0
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
          hasRelocation: false,
          isInitial: true,
          newIssues: [],
          removedIssues: [],
          snapshot: {
            items: [],
            type: "items" as const,
          },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result, false));

    expect(output).toMatchInlineSnapshot(`
      "ℹ eslint:
        Initial baseline created with 0 issues

          Issues  0

        Improvements  0
         Regressions  0
             Initial  0
              Checks  1
              Issues  0

      ✔ Initial baseline created successfully"
    `);
  });

  it("should truncate initial baseline items over 10", () => {
    const items = Array.from({ length: 15 }, (_, i) => {
      return {
        column: 1,
        file: `src/file${i}.ts`,
        id: `hash${i.toString().padStart(3, "0")}abc`,
        line: i + 1,
        message: `error${i}`,
        rule: "error",
      };
    });

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
          newIssues: [],
          removedIssues: [],
          snapshot: { items, type: "items" as const },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result, false));

    expect(output).toContain("Initial baseline created with 15 issues");
    expect(output).toContain("src/file0.ts:1:1");
    expect(output).toContain("src/file9.ts:10:1");
    expect(output).toContain("... and 5 more");
    expect(output).not.toContain("src/file10.ts");
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
          hasRelocation: false,
          isInitial: false,
          newIssues: [
            {
              column: 1,
              file: "src/a.ts",
              id: "abc123def456",
              line: 10,
              message: "error1",
              rule: "no-unused-vars",
            },
            {
              column: 1,
              file: "src/b.ts",
              id: "111aaa222bbb",
              line: 20,
              message: "error2",
              rule: "no-undef",
            },
          ],
          removedIssues: [],
          snapshot: {
            items: [
              {
                column: 1,
                file: "src/a.ts",
                id: "abc123def456",
                line: 10,
                message: "error1",
                rule: "no-unused-vars",
              },
              {
                column: 1,
                file: "src/b.ts",
                id: "111aaa222bbb",
                line: 20,
                message: "error2",
                rule: "no-undef",
              },
            ],
            type: "items" as const,
          },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result, false));

    expect(output).toMatchInlineSnapshot(`
      "✖ eslint:
        2 new issues (regressions):
           ↓ src/a.ts:10:1  no-unused-vars
             error1
           ↓ src/b.ts:20:1  no-undef
             error2

        Duration  1.5s
          Issues  2

        Improvements  0
         Regressions  2
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
          baseline: {
            items: [
              {
                column: 1,
                file: "src/a.ts",
                id: "abc123def456",
                line: 10,
                message: "error1",
                rule: "no-unused-vars",
              },
              {
                column: 1,
                file: "src/b.ts",
                id: "111aaa222bbb",
                line: 20,
                message: "error2",
                rule: "no-undef",
              },
            ],
            type: "items" as const,
          },
          checkId: "eslint",
          duration: 1200,
          hasImprovement: true,
          hasRegression: false,
          hasRelocation: false,
          isInitial: false,
          newIssues: [],
          removedIssues: [
            {
              column: 1,
              file: "src/a.ts",
              id: "abc123def456",
              line: 10,
              message: "error1",
              rule: "no-unused-vars",
            },
            {
              column: 1,
              file: "src/b.ts",
              id: "111aaa222bbb",
              line: 20,
              message: "error2",
              rule: "no-undef",
            },
          ],
          snapshot: { items: [], type: "items" as const },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result, false));

    expect(output).toMatchInlineSnapshot(`
      "✔ eslint:
        2 issues fixed (improvements):
           ↑ src/a.ts:10:1  no-unused-vars
             error1
           ↑ src/b.ts:20:1  no-undef
             error2

        Duration  1.2s
          Issues  0

        Improvements  2
         Regressions  0
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
          baseline: {
            items: [
              {
                column: 1,
                file: "src/a.ts",
                id: "abc123def456",
                line: 10,
                message: "error1",
                rule: "no-unused-vars",
              },
              {
                column: 1,
                file: "src/b.ts",
                id: "111aaa222bbb",
                line: 20,
                message: "error2",
                rule: "no-undef",
              },
            ],
            type: "items" as const,
          },
          checkId: "eslint",
          duration: 1800,
          hasImprovement: true,
          hasRegression: true,
          hasRelocation: false,
          isInitial: false,
          newIssues: [
            {
              column: 1,
              file: "src/c.ts",
              id: "333ccc444ddd",
              line: 30,
              message: "error3",
              rule: "semi",
            },
          ],
          removedIssues: [
            {
              column: 1,
              file: "src/a.ts",
              id: "abc123def456",
              line: 10,
              message: "error1",
              rule: "no-unused-vars",
            },
          ],
          snapshot: {
            items: [
              {
                column: 1,
                file: "src/b.ts",
                id: "111aaa222bbb",
                line: 20,
                message: "error2",
                rule: "no-undef",
              },
              {
                column: 1,
                file: "src/c.ts",
                id: "333ccc444ddd",
                line: 30,
                message: "error3",
                rule: "semi",
              },
            ],
            type: "items" as const,
          },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result, false));

    expect(output).toMatchInlineSnapshot(`
      "✖ eslint:
        1 new issue (regression):
           ↓ src/c.ts:30:1  semi
             error3
        1 issue fixed (improvement):
           ↑ src/a.ts:10:1  no-unused-vars
             error1

        Duration  1.8s
          Issues  2

        Improvements  1
         Regressions  1
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
          baseline: {
            items: [
              {
                column: 1,
                file: "src/a.ts",
                id: "abc123def456",
                line: 10,
                message: "error1",
                rule: "no-unused-vars",
              },
            ],
            type: "items" as const,
          },
          checkId: "eslint",
          duration: 1500,
          hasImprovement: false,
          hasRegression: false,
          hasRelocation: false,
          isInitial: false,
          newIssues: [],
          removedIssues: [],
          snapshot: {
            items: [
              {
                column: 1,
                file: "src/a.ts",
                id: "abc123def456",
                line: 10,
                message: "error1",
                rule: "no-unused-vars",
              },
            ],
            type: "items" as const,
          },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result, false));

    expect(output).toMatchInlineSnapshot(`
      "ℹ eslint (1) 1.5s

        Improvements  0
         Regressions  0
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
          baseline: {
            items: [
              {
                column: 1,
                file: "src/a.ts",
                id: "abc123def456",
                line: 10,
                message: "error1",
                rule: "no-unused-vars",
              },
            ],
            type: "items" as const,
          },
          checkId: "eslint",
          hasImprovement: false,
          hasRegression: false,
          hasRelocation: false,
          isInitial: false,
          newIssues: [],
          removedIssues: [],
          snapshot: {
            items: [
              {
                column: 1,
                file: "src/a.ts",
                id: "abc123def456",
                line: 10,
                message: "error1",
                rule: "no-unused-vars",
              },
            ],
            type: "items" as const,
          },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result, false));

    expect(output).toMatchInlineSnapshot(`
      "ℹ eslint (1)

        Improvements  0
         Regressions  0
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
          hasRelocation: false,
          isInitial: false,
          newIssues: [],
          removedIssues: [],
          snapshot: { items: [], type: "items" as const },
        },
        {
          baseline: {
            items: [
              {
                column: 1,
                file: "src/a.ts",
                id: "789xyz012tuv",
                line: 10,
                message: "error1",
                rule: "TS2304",
              },
            ],
            type: "items" as const,
          },
          checkId: "typescript",
          duration: 1500,
          hasImprovement: false,
          hasRegression: false,
          hasRelocation: false,
          isInitial: false,
          newIssues: [],
          removedIssues: [],
          snapshot: {
            items: [
              {
                column: 1,
                file: "src/a.ts",
                id: "789xyz012tuv",
                line: 10,
                message: "error1",
                rule: "TS2304",
              },
            ],
            type: "items" as const,
          },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result, false));

    expect(output).toMatchInlineSnapshot(`
      "ℹ eslint (0) 1s

      ℹ typescript (1) 1.5s

        Improvements  0
         Regressions  0
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

    const output = stripAnsi(formatTextOutput(result, false));

    expect(output).toMatchInlineSnapshot(`
      "  Improvements  0
         Regressions  0
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
          hasRelocation: false,
          isInitial: false,
          newIssues: [],
          removedIssues: [],
          snapshot: { items: [], type: "items" as const },
        },
      ],
      totalDuration: 1500,
    };

    const output = stripAnsi(formatTextOutput(result, false));

    expect(output).toMatchInlineSnapshot(`
      "ℹ eslint (0) 1.5s

        Improvements  0
         Regressions  0
             Initial  0
              Checks  1
              Issues  0
            Duration  1.5s (avg 1.5s)

      ✔ All checks passed"
    `);
  });

  it("should truncate regressions over 10", () => {
    const items = Array.from({ length: 15 }, (_, i) => {
      return {
        column: 1,
        file: `src/file${i}.ts`,
        id: `hash${i.toString().padStart(3, "0")}abc`,
        line: i + 1,
        message: `error${i}`,
        rule: "error",
      };
    });

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
          newIssues: items,
          removedIssues: [],
          snapshot: { items, type: "items" as const },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result, false));

    expect(output).toContain("15 new issues (regressions)");
    expect(output).toContain("src/file0.ts:1:1");
    expect(output).toContain("src/file9.ts:10:1");
    expect(output).toContain("... and 5 more");
    expect(output).not.toContain("src/file10.ts");
  });

  it("should truncate improvements over 10", () => {
    const items = Array.from({ length: 12 }, (_, i) => {
      return {
        column: 1,
        file: `src/file${i}.ts`,
        id: `hash${i.toString().padStart(3, "0")}abc`,
        line: i + 1,
        message: `error${i}`,
        rule: "error",
      };
    });

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
          hasRelocation: false,
          isInitial: false,
          newIssues: [],
          removedIssues: items,
          snapshot: { items: [], type: "items" as const },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result, false));

    expect(output).toContain("12 issues fixed (improvements)");
    expect(output).toContain("src/file0.ts:1:1");
    expect(output).toContain("src/file9.ts:10:1");
    expect(output).toContain("... and 2 more");
    expect(output).toMatchInlineSnapshot(`
      "✔ eslint:
        12 issues fixed (improvements):
           ↑ src/file0.ts:1:1  error
             error0
           ↑ src/file1.ts:2:1  error
             error1
           ↑ src/file2.ts:3:1  error
             error2
           ↑ src/file3.ts:4:1  error
             error3
           ↑ src/file4.ts:5:1  error
             error4
           ↑ src/file5.ts:6:1  error
             error5
           ↑ src/file6.ts:7:1  error
             error6
           ↑ src/file7.ts:8:1  error
             error7
           ↑ src/file8.ts:9:1  error
             error8
           ↑ src/file9.ts:10:1  error
             error9
           ... and 2 more

          Issues  0

        Improvements  12
         Regressions  0
             Initial  0
              Checks  1
              Issues  0

      ✔ Improvements detected - Baseline updated"
    `);
    expect(output).not.toContain("src/file10.ts");
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
          hasRelocation: false,
          isInitial: false,
          newIssues: [
            {
              column: 1,
              file: "src/a.ts",
              id: "abc123def456",
              line: 10,
              message: "error1",
              rule: "no-unused-vars",
            },
          ],
          removedIssues: [],
          snapshot: {
            items: [
              {
                column: 1,
                file: "src/a.ts",
                id: "abc123def456",
                line: 10,
                message: "error1",
                rule: "no-unused-vars",
              },
            ],
            type: "items" as const,
          },
        },
        {
          baseline: {
            items: [
              {
                column: 1,
                file: "src/b.ts",
                id: "789xyz012tuv",
                line: 20,
                message: "error2",
                rule: "TS2304",
              },
            ],
            type: "items" as const,
          },
          checkId: "typescript",
          duration: 1500,
          hasImprovement: true,
          hasRegression: false,
          hasRelocation: false,
          isInitial: false,
          newIssues: [],
          removedIssues: [
            {
              column: 1,
              file: "src/b.ts",
              id: "789xyz012tuv",
              line: 20,
              message: "error2",
              rule: "TS2304",
            },
          ],
          snapshot: { items: [], type: "items" as const },
        },
      ],
      totalDuration: 2500,
    };

    const output = stripAnsi(formatTextOutput(result, false));

    expect(output).toMatchInlineSnapshot(`
      "✖ eslint:
        1 new issue (regression):
           ↓ src/a.ts:10:1  no-unused-vars
             error1

        Duration  1s
          Issues  1

      ✔ typescript:
        1 issue fixed (improvement):
           ↑ src/b.ts:20:1  TS2304
             error2

        Duration  1.5s
          Issues  0

        Improvements  1
         Regressions  1
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
          hasRelocation: false,
          isInitial: true,
          newIssues: [],
          removedIssues: [],
          snapshot: { items: [], type: "items" as const },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result, false));

    expect(output).toMatch(/^ℹ eslint:/);
  });

  it("should format improvements without leading newline", () => {
    const result = {
      exitCode: 0,
      hasImprovement: true,
      hasRegression: false,
      results: [
        {
          baseline: {
            items: [
              {
                column: 1,
                file: "src/a.ts",
                id: "abc123def456",
                line: 10,
                message: "error1",
                rule: "no-unused-vars",
              },
            ],
            type: "items" as const,
          },
          checkId: "eslint",
          hasImprovement: true,
          hasRegression: false,
          hasRelocation: false,
          isInitial: false,
          newIssues: [],
          removedIssues: [
            {
              column: 1,
              file: "src/a.ts",
              id: "abc123def456",
              line: 10,
              message: "error1",
              rule: "no-unused-vars",
            },
          ],
          snapshot: { items: [], type: "items" as const },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result, false));

    expect(output).toMatch(/^✔ eslint:/);
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
          hasRelocation: false,
          isInitial: false,
          newIssues: [],
          removedIssues: [],
          snapshot: { items: [], type: "items" as const },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result, false));

    expect(output).toMatch(/^ℹ eslint \(0\)/);
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
          hasRelocation: false,
          isInitial: true,
          newIssues: [],
          removedIssues: [],
          snapshot: {
            items: [
              {
                column: 1,
                file: "src/a.ts",
                id: "abc123def456",
                line: 10,
                message: "error1",
                rule: "no-unused-vars",
              },
            ],
            type: "items" as const,
          },
        },
        {
          baseline: undefined,
          checkId: "typescript",
          hasImprovement: false,
          hasRegression: false,
          hasRelocation: false,
          isInitial: true,
          newIssues: [],
          removedIssues: [],
          snapshot: {
            items: [
              {
                column: 1,
                file: "src/b.ts",
                id: "789xyz012tuv",
                line: 20,
                message: "error2",
                rule: "TS2304",
              },
            ],
            type: "items" as const,
          },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result, false));

    expect(output).toMatch(/^ℹ eslint:[\s\S]*\n\nℹ typescript:/);
  });

  it("should format multiple improvements with newline between them", () => {
    const result = {
      exitCode: 0,
      hasImprovement: true,
      hasRegression: false,
      results: [
        {
          baseline: {
            items: [
              {
                column: 1,
                file: "src/a.ts",
                id: "abc123def456",
                line: 10,
                message: "error1",
                rule: "no-unused-vars",
              },
            ],
            type: "items" as const,
          },
          checkId: "eslint",
          hasImprovement: true,
          hasRegression: false,
          hasRelocation: false,
          isInitial: false,
          newIssues: [],
          removedIssues: [
            {
              column: 1,
              file: "src/a.ts",
              id: "abc123def456",
              line: 10,
              message: "error1",
              rule: "no-unused-vars",
            },
          ],
          snapshot: { items: [], type: "items" as const },
        },
        {
          baseline: {
            items: [
              {
                column: 1,
                file: "src/b.ts",
                id: "789xyz012tuv",
                line: 20,
                message: "error2",
                rule: "TS2304",
              },
            ],
            type: "items" as const,
          },
          checkId: "typescript",
          hasImprovement: true,
          hasRegression: false,
          hasRelocation: false,
          isInitial: false,
          newIssues: [],
          removedIssues: [
            {
              column: 1,
              file: "src/b.ts",
              id: "789xyz012tuv",
              line: 20,
              message: "error2",
              rule: "TS2304",
            },
          ],
          snapshot: { items: [], type: "items" as const },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result, false));

    expect(output).toMatch(/^✔ eslint:[\s\S]*\n\n✔ typescript:/);
  });

  it("should count total issues in summary across all categories, not number of checks", () => {
    const result = {
      exitCode: 1,
      hasImprovement: true,
      hasRegression: true,
      results: [
        {
          baseline: {
            items: [
              {
                column: 1,
                file: "src/a.ts",
                id: "aaa111",
                line: 1,
                message: "old1",
                rule: "old1",
              },
              {
                column: 1,
                file: "src/a.ts",
                id: "aaa222",
                line: 2,
                message: "old2",
                rule: "old2",
              },
              {
                column: 1,
                file: "src/a.ts",
                id: "aaa333",
                line: 3,
                message: "old3",
                rule: "old3",
              },
              {
                column: 1,
                file: "src/a.ts",
                id: "aaa444",
                line: 4,
                message: "old4",
                rule: "old4",
              },
            ],
            type: "items" as const,
          },
          checkId: "eslint",
          duration: 339,
          hasImprovement: true,
          hasRegression: false,
          hasRelocation: false,
          isInitial: false,
          newIssues: [],
          removedIssues: [
            {
              column: 1,
              file: "src/a.ts",
              id: "aaa111",
              line: 1,
              message: "old1",
              rule: "old1",
            },
            {
              column: 1,
              file: "src/a.ts",
              id: "aaa222",
              line: 2,
              message: "old2",
              rule: "old2",
            },
            {
              column: 1,
              file: "src/a.ts",
              id: "aaa333",
              line: 3,
              message: "old3",
              rule: "old3",
            },
            {
              column: 1,
              file: "src/a.ts",
              id: "aaa444",
              line: 4,
              message: "old4",
              rule: "old4",
            },
          ],
          snapshot: { items: [], type: "items" as const },
        },
        {
          baseline: { items: [], type: "items" as const },
          checkId: "typescript",
          duration: 514,
          hasImprovement: false,
          hasRegression: true,
          hasRelocation: false,
          isInitial: false,
          newIssues: [
            {
              column: 1,
              file: "src/b.ts",
              id: "bbb111",
              line: 1,
              message: "new1",
              rule: "TS2304",
            },
            {
              column: 1,
              file: "src/b.ts",
              id: "bbb222",
              line: 2,
              message: "new2",
              rule: "TS2304",
            },
            {
              column: 1,
              file: "src/b.ts",
              id: "bbb333",
              line: 3,
              message: "new3",
              rule: "TS2304",
            },
          ],
          removedIssues: [],
          snapshot: {
            items: [
              {
                column: 1,
                file: "src/b.ts",
                id: "bbb111",
                line: 1,
                message: "new1",
                rule: "TS2304",
              },
              {
                column: 1,
                file: "src/b.ts",
                id: "bbb222",
                line: 2,
                message: "new2",
                rule: "TS2304",
              },
              {
                column: 1,
                file: "src/b.ts",
                id: "bbb333",
                line: 3,
                message: "new3",
                rule: "TS2304",
              },
            ],
            type: "items" as const,
          },
        },
        {
          baseline: {
            items: [
              {
                column: 1,
                file: "src/c.ts",
                id: "ccc111",
                line: 1,
                message: "unchanged1",
                rule: "unchanged1",
              },
              {
                column: 1,
                file: "src/c.ts",
                id: "ccc222",
                line: 2,
                message: "unchanged2",
                rule: "unchanged2",
              },
            ],
            type: "items" as const,
          },
          checkId: "prettier",
          hasImprovement: false,
          hasRegression: false,
          hasRelocation: false,
          isInitial: false,
          newIssues: [],
          removedIssues: [],
          snapshot: {
            items: [
              {
                column: 1,
                file: "src/c.ts",
                id: "ccc111",
                line: 1,
                message: "unchanged1",
                rule: "unchanged1",
              },
              {
                column: 1,
                file: "src/c.ts",
                id: "ccc222",
                line: 2,
                message: "unchanged2",
                rule: "unchanged2",
              },
            ],
            type: "items" as const,
          },
        },
        {
          baseline: undefined,
          checkId: "markdownlint",
          hasImprovement: false,
          hasRegression: false,
          hasRelocation: false,
          isInitial: true,
          newIssues: [],
          removedIssues: [],
          snapshot: {
            items: [
              {
                column: 1,
                file: "src/d.ts",
                id: "ddd111",
                line: 1,
                message: "initial1",
                rule: "initial1",
              },
              {
                column: 1,
                file: "src/d.ts",
                id: "ddd222",
                line: 2,
                message: "initial2",
                rule: "initial2",
              },
              {
                column: 1,
                file: "src/d.ts",
                id: "ddd333",
                line: 3,
                message: "initial3",
                rule: "initial3",
              },
              {
                column: 1,
                file: "src/d.ts",
                id: "ddd444",
                line: 4,
                message: "initial4",
                rule: "initial4",
              },
              {
                column: 1,
                file: "src/d.ts",
                id: "ddd555",
                line: 5,
                message: "initial5",
                rule: "initial5",
              },
            ],
            type: "items" as const,
          },
        },
      ],
      totalDuration: 1500,
    };

    const output = stripAnsi(formatTextOutput(result, false));

    expect(output).toContain("Improvements  4");
    expect(output).toContain("Regressions  3");
    expect(output).toContain("Initial  5");
    expect(output).toContain("Checks  4");
  });

  it("should format items without line numbers", () => {
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
          newIssues: [
            {
              column: 0,
              file: "(global)",
              id: "global1hash",
              line: 0,
              message: "Invalid configuration",
              rule: "config-error",
            },
          ],
          removedIssues: [],
          snapshot: {
            items: [
              {
                column: 0,
                file: "(global)",
                id: "global1hash",
                line: 0,
                message: "Invalid configuration",
                rule: "config-error",
              },
            ],
            type: "items" as const,
          },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result, false));

    expect(output).toMatchInlineSnapshot(`
      "✖ eslint:
        1 new issue (regression):
           ↓ (global)  config-error
             Invalid configuration

          Issues  1

        Improvements  0
         Regressions  1
             Initial  0
              Checks  1
              Issues  1

      ✗ Regressions detected - Run failed"
    `);
    expect(output).not.toContain(":0");
  });

  it("should default column to 1 when column is 0", () => {
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
          newIssues: [],
          removedIssues: [],
          snapshot: {
            items: [
              {
                column: 0,
                file: "src/a.ts",
                id: "abc123def456",
                line: 10,
                message: "error1",
                rule: "no-unused-vars",
              },
            ],
            type: "items" as const,
          },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result, false));

    expect(output).toContain("→ src/a.ts:10:1  no-unused-vars");
    expect(output).not.toContain("src/a.ts:10:0");
  });

  it("should format regressions with force flag", () => {
    const result = {
      exitCode: 0,
      hasImprovement: false,
      hasRegression: true,
      results: [
        {
          baseline: { items: [], type: "items" as const },
          checkId: "eslint",
          duration: 1500,
          hasImprovement: false,
          hasRegression: true,
          hasRelocation: false,
          isInitial: false,
          newIssues: [
            {
              column: 1,
              file: "src/a.ts",
              id: "abc123def456",
              line: 10,
              message: "error1",
              rule: "no-unused-vars",
            },
            {
              column: 1,
              file: "src/b.ts",
              id: "111aaa222bbb",
              line: 20,
              message: "error2",
              rule: "no-undef",
            },
          ],
          removedIssues: [],
          snapshot: {
            items: [
              {
                column: 1,
                file: "src/a.ts",
                id: "abc123def456",
                line: 10,
                message: "error1",
                rule: "no-unused-vars",
              },
              {
                column: 1,
                file: "src/b.ts",
                id: "111aaa222bbb",
                line: 20,
                message: "error2",
                rule: "no-undef",
              },
            ],
            type: "items" as const,
          },
        },
      ],
    };

    const output = stripAnsi(formatTextOutput(result, true));

    expect(output).toMatchInlineSnapshot(`
    "✖ eslint:
      2 new issues (regressions):
         ↓ src/a.ts:10:1  no-unused-vars
           error1
         ↓ src/b.ts:20:1  no-undef
           error2

      Duration  1.5s
        Issues  2

      Improvements  0
       Regressions  2
           Initial  0
            Checks  1
            Issues  2

    ⚠ Regressions detected (forced)"
  `);
  });
});
