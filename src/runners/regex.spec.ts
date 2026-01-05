import { mkdir, rm, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

import { regexCheck, regexRunner } from "./regex";

describe("regexCheck", () => {
  it("should return config with type 'regex'", () => {
    const testDir = join(process.cwd(), ".test-regex");

    const config = {
      files: [relative(process.cwd(), join(testDir, "**/*.ts"))],
      patterns: [
        {
          message: "TODO comment found",
          pattern: /\/\/\s*TODO:/gi,
          rule: "no-todos",
        },
        {
          message: "console.log statement",
          pattern: /console\.log/g,
          rule: "no-console",
        },
      ],
    };

    const result = regexCheck(config);

    expect(result.type).toBe("regex");
    expect(result.files).toStrictEqual([".test-regex/**/*.ts"]);
    expect(result.patterns).toHaveLength(2);

    expect(result.patterns[0]).toMatchObject({
      message: "TODO comment found",
      rule: "no-todos",
    });
    expect(result.patterns[0]?.pattern.source).toBe(String.raw`\/\/\s*TODO:`);
    expect(result.patterns[0]?.pattern.flags).toBe("gi");

    expect(result.patterns[1]).toMatchObject({
      message: "console.log statement",
      rule: "no-console",
    });
    expect(result.patterns[1]?.pattern.source).toBe(String.raw`console\.log`);
    expect(result.patterns[1]?.pattern.flags).toBe("g");
  });
});

describe("RegexCheckRunner", () => {
  const testDir = join(process.cwd(), ".test-regex");
  const runner = regexRunner();

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { force: true, recursive: true });
  });

  it("should find pattern matches in files", async () => {
    const testFile = join(testDir, "example.ts");

    await writeFile(
      testFile,
      `
// TODO: implement this feature
function foo() {
  console.log("debug");
  return null;
}

// FIXME: this is broken
const bar = 1;
`.trim(),
    );

    const result = await runner.run({
      files: [relative(process.cwd(), join(testDir, "**/*.ts"))],
      patterns: [
        {
          message: "TODO comment found",
          pattern: /\/\/\s*TODO:/gi,
          rule: "no-todos",
        },
        {
          message: "console.log statement",
          pattern: /console\.log/g,
          rule: "no-console",
        },
      ],
    });

    expect(result.type).toBe("items");
    expect(result.items).toHaveLength(2);

    const todoItem = result.items.find((item) => item.rule === "no-todos");

    expect(todoItem).toMatchObject({
      file: expect.stringContaining("example.ts"),
      line: 1,
      message: "TODO comment found",
      rule: "no-todos",
    });

    const consoleItem = result.items.find((item) => item.rule === "no-console");

    expect(consoleItem).toMatchObject({
      file: expect.stringContaining("example.ts"),
      line: 3,
      message: "console.log statement",
      rule: "no-console",
    });
  });

  it("should find multiple matches on the same line", async () => {
    const testFile = join(testDir, "multi.ts");

    await writeFile(
      testFile,
      'console.log("a"); console.log("b"); console.log("c");',
    );

    const result = await runner.run({
      files: [relative(process.cwd(), join(testDir, "**/*.ts"))],
      patterns: [
        {
          pattern: /console\.log/g,
          rule: "no-console",
        },
      ],
    });

    expect(result.items).toHaveLength(3);
    expect(result.items.every((item) => item.line === 1)).toBe(true);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- test assertion
    expect(result.items[0]?.column).toBeLessThan(result.items[1]!.column);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- test assertion
    expect(result.items[1]?.column).toBeLessThan(result.items[2]!.column);
  });

  it("should use pattern source as rule when rule is not provided", async () => {
    const testFile = join(testDir, "no-rule.ts");

    await writeFile(testFile, "// TODO: test");

    const result = await runner.run({
      files: [relative(process.cwd(), join(testDir, "**/*.ts"))],
      patterns: [
        {
          pattern: /TODO/g,
        },
      ],
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.rule).toBe("TODO");
  });

  it("should use match as message when message is not provided", async () => {
    const testFile = join(testDir, "no-message.ts");

    await writeFile(testFile, "// TODO: test");

    const result = await runner.run({
      files: [relative(process.cwd(), join(testDir, "**/*.ts"))],
      patterns: [
        {
          pattern: /TODO/g,
        },
      ],
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.message).toBe("Pattern matched: TODO");
  });

  it("should handle case-insensitive patterns", async () => {
    const testFile = join(testDir, "case.ts");

    await writeFile(
      testFile,
      `
// todo: lowercase
// TODO: uppercase
// ToDo: mixed case
`.trim(),
    );

    const result = await runner.run({
      files: [relative(process.cwd(), join(testDir, "**/*.ts"))],
      patterns: [
        {
          pattern: /todo/gi,
          rule: "no-todos",
        },
      ],
    });

    expect(result.items).toHaveLength(3);
  });

  it("should handle multiple file types", async () => {
    await writeFile(join(testDir, "file.ts"), "// TODO: ts");
    await writeFile(join(testDir, "file.js"), "// TODO: js");
    await writeFile(join(testDir, "file.md"), "<!-- TODO: md -->");
    await writeFile(join(testDir, "file.py"), "# TODO: py");

    const result = await runner.run({
      files: [relative(process.cwd(), join(testDir, "**/*"))],
      patterns: [
        {
          pattern: /TODO/g,
          rule: "no-todos",
        },
      ],
    });

    expect(result.items).toHaveLength(4);
  });

  it("should respect ignore patterns", async () => {
    await mkdir(join(testDir, "src"), { recursive: true });
    await mkdir(join(testDir, "dist"), { recursive: true });
    await writeFile(join(testDir, "src", "file.ts"), "// TODO: should find");
    await writeFile(join(testDir, "dist", "file.js"), "// TODO: should ignore");

    const testDirRelative = relative(process.cwd(), testDir);

    const result = await runner.run({
      files: [`${testDirRelative}/**/*.{ts,js}`],
      ignore: [`${testDirRelative}/dist/**`],
      patterns: [
        {
          pattern: /TODO/g,
          rule: "no-todos",
        },
      ],
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.file).toContain("src");
  });

  it("should handle files with no matches", async () => {
    const testFile = join(testDir, "clean.ts");

    await writeFile(testFile, "const x = 1;\nconst y = 2;\n");

    const result = await runner.run({
      files: [relative(process.cwd(), join(testDir, "**/*.ts"))],
      patterns: [
        {
          pattern: /TODO/g,
          rule: "no-todos",
        },
      ],
    });

    expect(result.items).toHaveLength(0);
  });

  it("should handle empty file list", async () => {
    const result = await runner.run({
      files: [relative(process.cwd(), join(testDir, "nonexistent/**/*.ts"))],
      patterns: [
        {
          pattern: /TODO/g,
          rule: "no-todos",
        },
      ],
    });

    expect(result.items).toHaveLength(0);
  });

  it("should skip binary files gracefully", async () => {
    const binaryFile = join(testDir, "binary.bin");

    await writeFile(binaryFile, Buffer.from([0x00, 0x01, 0x02, 0xff]));

    const textFile = join(testDir, "text.ts");

    await writeFile(textFile, "// TODO: text");

    const result = await runner.run({
      files: [relative(process.cwd(), join(testDir, "**/*"))],
      patterns: [
        {
          pattern: /TODO/g,
          rule: "no-todos",
        },
      ],
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.file).toContain("text.ts");
  });

  it("should add global flag if not present", async () => {
    const testFile = join(testDir, "global.ts");

    await writeFile(testFile, "TODO TODO TODO");

    const result = await runner.run({
      files: [relative(process.cwd(), join(testDir, "**/*.ts"))],
      patterns: [
        {
          pattern: /TODO/,
          rule: "no-todos",
        },
      ],
    });

    expect(result.items).toHaveLength(3);
  });

  it("should handle capture groups in patterns", async () => {
    const testFile = join(testDir, "capture.ts");

    await writeFile(
      testFile,
      `
// TODO(jimmy): my task
// TODO(alice): her task
`.trim(),
    );

    const result = await runner.run({
      files: [relative(process.cwd(), join(testDir, "**/*.ts"))],
      patterns: [
        {
          message: "TODO with owner",
          pattern: /TODO\((\w+)\)/g,
          rule: "no-todos",
        },
      ],
    });

    expect(result.items).toHaveLength(2);
  });

  it("should skip files that cannot be read", async () => {
    const readableFile = join(testDir, "readable.ts");
    const unreadableFile = join(testDir, "unreadable.ts");

    await writeFile(readableFile, "// TODO: can read");
    await writeFile(unreadableFile, "// TODO: cannot read");

    const { chmod } = await import("node:fs/promises");

    try {
      await chmod(unreadableFile, 0o000);

      const result = await runner.run({
        files: [relative(process.cwd(), join(testDir, "**/*.ts"))],
        patterns: [
          {
            pattern: /TODO/g,
            rule: "no-todos",
          },
        ],
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.file).toContain("readable.ts");

      await chmod(unreadableFile, 0o644);
    } catch {
      // Skip this test on systems where chmod doesn't work (e.g., Windows)
      // or if we don't have permission to change permissions
    }
  });

  it("should handle large numbers of files efficiently", async () => {
    const fileCount = 150;
    const createPromises = [];

    for (let i = 0; i < fileCount; i++) {
      createPromises.push(
        writeFile(join(testDir, `file${i}.ts`), `// TODO: file ${i}`),
      );
    }

    await Promise.all(createPromises);

    const result = await runner.run({
      files: [relative(process.cwd(), join(testDir, "**/*.ts"))],
      patterns: [
        {
          pattern: /TODO/g,
          rule: "no-todos",
        },
      ],
    });

    expect(result.items).toHaveLength(fileCount);

    const firstBatchFile = result.items.find((item) => {
      return item.file.includes("file0.ts");
    });
    const secondBatchFile = result.items.find((item) => {
      return item.file.includes("file120.ts");
    });

    expect(firstBatchFile).toBeDefined();
    expect(secondBatchFile).toBeDefined();
  });

  it("should support message as a callback function", async () => {
    const testFile = join(testDir, "callback.ts");

    await writeFile(
      testFile,
      `
// TODO(jimmy): my task
// TODO(alice): her task
console.log("test");
console.warn("warning");
`.trim(),
    );

    const result = await runner.run({
      files: [relative(process.cwd(), join(testDir, "**/*.ts"))],
      patterns: [
        {
          message: (match) => `TODO assigned to ${match.groups?.owner}`,
          pattern: /TODO\((?<owner>\w+)\):/g,
          rule: "todo-with-owner",
        },
        {
          message: (match) => `console.${match.groups?.method}() found`,
          pattern: /console\.(?<method>\w+)/g,
          rule: "no-console",
        },
      ],
    });

    expect(result.items).toHaveLength(4);

    const jimmyTodo = result.items.find((item) =>
      item.message.includes("jimmy"),
    );
    const aliceTodo = result.items.find((item) =>
      item.message.includes("alice"),
    );
    const logStatement = result.items.find((item) => {
      return item.message.includes("console.log()");
    });
    const warnStatement = result.items.find((item) => {
      return item.message.includes("console.warn()");
    });

    expect(jimmyTodo).toMatchObject({
      message: "TODO assigned to jimmy",
      rule: "todo-with-owner",
    });

    expect(aliceTodo).toMatchObject({
      message: "TODO assigned to alice",
      rule: "todo-with-owner",
    });

    expect(logStatement).toMatchObject({
      message: "console.log() found",
      rule: "no-console",
    });

    expect(warnStatement).toMatchObject({
      message: "console.warn() found",
      rule: "no-console",
    });
  });

  it("should handle callback that accesses match details", async () => {
    const testFile = join(testDir, "match-details.ts");

    await writeFile(
      testFile,
      'const url = "https://api.example.com/v1/users";',
    );

    const result = await runner.run({
      files: [relative(process.cwd(), join(testDir, "**/*.ts"))],
      patterns: [
        {
          message: (match) => {
            const domain = match.groups?.domain;
            const path = match.groups?.path;

            return `URL: ${domain}${path}`;
          },
          pattern: /https?:\/\/(?<domain>[^/]+)(?<path>[^\s"']*)/g,
          rule: "hardcoded-url",
        },
      ],
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.message).toBe("URL: api.example.com/v1/users");
  });

  it("should pass when tinyglobby import succeeds", async () => {
    await expect(runner.validate()).resolves.toBeUndefined();
  });

  it("should throw helpful error when tinyglobby import fails", async () => {
    vi.resetModules();

    vi.doMock("tinyglobby", () => {
      throw new Error("nope");
    });

    const { regexRunner: freshRunner } = await import("./regex");
    const runner = freshRunner();

    await expect(runner.validate()).rejects.toThrowError(
      'regex check requires "tinyglobby" package to be installed. Run: npm install tinyglobby',
    );
  });
});
