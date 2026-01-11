import { BASELINE_VERSION } from "@/constants";

import { resolveBaselineConflict } from "./conflict-resolver";

describe("resolveBaselineConflict", () => {
  it("should merge conflicts with union of items", () => {
    const item1 = {
      column: 1,
      file: "src/a.ts",
      id: "error1-id",
      line: 10,
      message: "error1",
      rule: "no-unused-vars",
    };
    const item2 = {
      column: 1,
      file: "src/b.ts",
      id: "error2-id",
      line: 20,
      message: "error2",
      rule: "no-undef",
    };
    const item3 = {
      column: 1,
      file: "src/c.ts",
      id: "error3-id",
      line: 30,
      message: "error3",
      rule: "semi",
    };

    const conflictContent = [
      "{",
      `  "version": ${BASELINE_VERSION},`,
      "<<<<<<< HEAD",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(item1)}, ${JSON.stringify(item2)}]`,
      "    }",
      "  }",
      "=======",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(item2)}, ${JSON.stringify(item3)}]`,
      "    }",
      "  }",
      ">>>>>>> feature",
      "}",
    ].join("\n");

    const result = resolveBaselineConflict(conflictContent);

    expect(result.checks.eslint?.items).toHaveLength(3);

    const ids = result.checks.eslint?.items.map((i) => i.id).toSorted();

    expect(ids).toStrictEqual(["error1-id", "error2-id", "error3-id"]);
  });

  it("should merge conflicts with different checks on each side", () => {
    const item1 = {
      column: 1,
      file: "src/a.ts",
      id: "error1-id",
      line: 10,
      message: "error1",
      rule: "no-unused-vars",
    };
    const item2 = {
      column: 1,
      file: "src/b.ts",
      id: "error2-id",
      line: 20,
      message: "error2",
      rule: "TS2304",
    };

    const conflictContent = [
      "{",
      `  "version": ${BASELINE_VERSION},`,
      "<<<<<<< HEAD",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(item1)}]`,
      "    }",
      "  }",
      "=======",
      '  "checks": {',
      '    "typescript": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(item2)}]`,
      "    }",
      "  }",
      ">>>>>>> feature",
      "}",
    ].join("\n");

    const result = resolveBaselineConflict(conflictContent);

    expect(result.checks.eslint?.items).toHaveLength(1);
    expect(result.checks.eslint?.items[0]?.id).toBe("error1-id");
    expect(result.checks.typescript?.items).toHaveLength(1);
    expect(result.checks.typescript?.items[0]?.id).toBe("error2-id");
  });

  it("should merge conflicts with overlapping items", () => {
    const item1 = {
      column: 1,
      file: "src/a.ts",
      id: "error1-id",
      line: 10,
      message: "error1",
      rule: "no-unused-vars",
    };
    const item2 = {
      column: 1,
      file: "src/b.ts",
      id: "error2-id",
      line: 20,
      message: "error2",
      rule: "no-undef",
    };
    const item3 = {
      column: 1,
      file: "src/c.ts",
      id: "error3-id",
      line: 30,
      message: "error3",
      rule: "semi",
    };
    const item4 = {
      code: "quotes",
      column: 1,
      file: "src/d.ts",
      id: "error4-id",
      line: 40,
      message: "error4",
    };

    const conflictContent = [
      "{",
      `  "version": ${BASELINE_VERSION},`,
      "<<<<<<< HEAD",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(item1)}, ${JSON.stringify(item2)}, ${JSON.stringify(item3)}]`,
      "    }",
      "  }",
      "=======",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(item2)}, ${JSON.stringify(item3)}, ${JSON.stringify(item4)}]`,
      "    }",
      "  }",
      ">>>>>>> feature",
      "}",
    ].join("\n");

    const result = resolveBaselineConflict(conflictContent);

    expect(result.checks.eslint?.items).toHaveLength(4);

    const ids = result.checks.eslint?.items.map((i) => i.id).toSorted();

    expect(ids).toStrictEqual([
      "error1-id",
      "error2-id",
      "error3-id",
      "error4-id",
    ]);
  });

  it("should sort merged items by ID", () => {
    const itemZ = {
      code: "z-error",
      column: 1,
      file: "src/z.ts",
      id: "z-error-id",
      line: 10,
      message: "z-error",
    };
    const itemA = {
      code: "a-error",
      column: 1,
      file: "src/a.ts",
      id: "a-error-id",
      line: 20,
      message: "a-error",
    };
    const itemM = {
      code: "m-error",
      column: 1,
      file: "src/m.ts",
      id: "m-error-id",
      line: 30,
      message: "m-error",
    };
    const itemB = {
      code: "b-error",
      column: 1,
      file: "src/b.ts",
      id: "b-error-id",
      line: 40,
      message: "b-error",
    };

    const conflictContent = [
      "{",
      `  "version": ${BASELINE_VERSION},`,
      "<<<<<<< HEAD",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(itemZ)}, ${JSON.stringify(itemA)}]`,
      "    }",
      "  }",
      "=======",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(itemM)}, ${JSON.stringify(itemB)}]`,
      "    }",
      "  }",
      ">>>>>>> feature",
      "}",
    ].join("\n");

    const result = resolveBaselineConflict(conflictContent);

    const ids = result.checks.eslint?.items.map((i) => i.id);

    expect(ids).toStrictEqual([
      "a-error-id",
      "b-error-id",
      "m-error-id",
      "z-error-id",
    ]);
  });

  it("should merge multiple checks with conflicts", () => {
    const eslintItem1 = {
      column: 1,
      file: "src/a.ts",
      id: "eslint-error1-id",
      line: 10,
      message: "error1",
      rule: "no-unused-vars",
    };
    const eslintItem2 = {
      column: 1,
      file: "src/b.ts",
      id: "eslint-error2-id",
      line: 20,
      message: "error2",
      rule: "no-undef",
    };
    const tsItem1 = {
      column: 1,
      file: "src/c.ts",
      id: "ts-error1-id",
      line: 30,
      message: "ts-error1",
      rule: "TS2304",
    };
    const tsItem2 = {
      code: "TS2345",
      column: 1,
      file: "src/d.ts",
      id: "ts-error2-id",
      line: 40,
      message: "ts-error2",
    };

    const conflictContent = [
      "{",
      `  "version": ${BASELINE_VERSION},`,
      "<<<<<<< HEAD",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(eslintItem1)}]`,
      "    },",
      '    "typescript": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(tsItem1)}]`,
      "    }",
      "  }",
      "=======",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(eslintItem2)}]`,
      "    },",
      '    "typescript": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(tsItem2)}]`,
      "    }",
      "  }",
      ">>>>>>> feature",
      "}",
    ].join("\n");

    const result = resolveBaselineConflict(conflictContent);

    expect(result.checks.eslint?.items).toHaveLength(2);

    const eslintIds = result.checks.eslint?.items.map((i) => i.id).toSorted();

    expect(eslintIds).toStrictEqual(["eslint-error1-id", "eslint-error2-id"]);

    expect(result.checks.typescript?.items).toHaveLength(2);

    const tsIds = result.checks.typescript?.items.map((i) => i.id).toSorted();

    expect(tsIds).toStrictEqual(["ts-error1-id", "ts-error2-id"]);
  });

  it("should preserve check type from either side", () => {
    const item1 = {
      column: 1,
      file: "src/a.ts",
      id: "error1-id",
      line: 10,
      message: "error1",
      rule: "no-unused-vars",
    };
    const item2 = {
      column: 1,
      file: "src/b.ts",
      id: "error2-id",
      line: 20,
      message: "error2",
      rule: "no-undef",
    };

    const conflictContent = [
      "{",
      `  "version": ${BASELINE_VERSION},`,
      "<<<<<<< HEAD",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(item1)}]`,
      "    }",
      "  }",
      "=======",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(item2)}]`,
      "    }",
      "  }",
      ">>>>>>> feature",
      "}",
    ].join("\n");

    const result = resolveBaselineConflict(conflictContent);

    expect(result.checks.eslint?.type).toBe("items");
  });

  it("should return baseline with correct version", () => {
    const conflictContent = [
      "{",
      `  "version": ${BASELINE_VERSION},`,
      "<<<<<<< HEAD",
      '  "checks": {}',
      "=======",
      '  "checks": {}',
      ">>>>>>> feature",
      "}",
    ].join("\n");

    const result = resolveBaselineConflict(conflictContent);

    expect(result.version).toBe(BASELINE_VERSION);
  });

  it("should throw error for malformed conflict markers", () => {
    const conflictContent = [
      "{",
      `  "version": ${BASELINE_VERSION},`,
      "<<<<<<< HEAD",
      '  "checks": {}',
      "  // Missing =======",
      ">>>>>>> feature",
      "}",
    ].join("\n");

    expect(() => resolveBaselineConflict(conflictContent)).toThrowError(
      "Could not parse conflict markers in baseline",
    );
  });

  it("should throw error for missing conflict markers", () => {
    const conflictContent = [
      "{",
      `  "version": ${BASELINE_VERSION},`,
      '  "checks": {}',
      "}",
    ].join("\n");

    expect(() => resolveBaselineConflict(conflictContent)).toThrowError(
      "Could not parse conflict markers in baseline",
    );
  });

  it("should throw error for invalid JSON in ours section", () => {
    const conflictContent = [
      "{",
      `  "version": ${BASELINE_VERSION},`,
      "<<<<<<< HEAD",
      '  "checks": { invalid json }',
      "=======",
      '  "checks": {}',
      ">>>>>>> feature",
      "}",
    ].join("\n");

    expect(() => resolveBaselineConflict(conflictContent)).toThrowError(
      "Failed to parse baseline during conflict resolution",
    );
  });

  it("should throw error for invalid JSON in theirs section", () => {
    const conflictContent = [
      "{",
      `  "version": ${BASELINE_VERSION},`,
      "<<<<<<< HEAD",
      '  "checks": {}',
      "=======",
      '  "checks": { invalid json }',
      ">>>>>>> feature",
      "}",
    ].join("\n");

    expect(() => resolveBaselineConflict(conflictContent)).toThrowError(
      "Failed to parse baseline during conflict resolution",
    );
  });

  it("should merge when one side has empty checks", () => {
    const item1 = {
      column: 1,
      file: "src/a.ts",
      id: "error1-id",
      line: 10,
      message: "error1",
      rule: "no-unused-vars",
    };

    const conflictContent = [
      "{",
      `  "version": ${BASELINE_VERSION},`,
      "<<<<<<< HEAD",
      '  "checks": {}',
      "=======",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(item1)}]`,
      "    }",
      "  }",
      ">>>>>>> feature",
      "}",
    ].join("\n");

    const result = resolveBaselineConflict(conflictContent);

    expect(result.checks.eslint?.items).toHaveLength(1);
    expect(result.checks.eslint?.items[0]?.id).toBe("error1-id");
  });

  it("should deduplicate items from both sides by ID", () => {
    const item1 = {
      column: 1,
      file: "src/a.ts",
      id: "error1-id",
      line: 10,
      message: "error1",
      rule: "no-unused-vars",
    };
    const item2 = {
      column: 1,
      file: "src/b.ts",
      id: "error2-id",
      line: 20,
      message: "error2",
      rule: "no-undef",
    };
    const item3 = {
      column: 1,
      file: "src/c.ts",
      id: "error3-id",
      line: 30,
      message: "error3",
      rule: "semi",
    };

    const conflictContent = [
      "{",
      `  "version": ${BASELINE_VERSION},`,
      "<<<<<<< HEAD",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(item1)}, ${JSON.stringify(item1)}, ${JSON.stringify(item2)}]`,
      "    }",
      "  }",
      "=======",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(item2)}, ${JSON.stringify(item2)}, ${JSON.stringify(item3)}]`,
      "    }",
      "  }",
      ">>>>>>> feature",
      "}",
    ].join("\n");

    const result = resolveBaselineConflict(conflictContent);

    expect(result.checks.eslint?.items).toHaveLength(3);

    const ids = result.checks.eslint?.items.map((i) => i.id).toSorted();

    expect(ids).toStrictEqual(["error1-id", "error2-id", "error3-id"]);
  });

  it("should include JSON parse error details in thrown error", () => {
    const conflictContent = [
      "{",
      `  "version": ${BASELINE_VERSION},`,
      "<<<<<<< HEAD",
      '  "checks": { invalid json }',
      "=======",
      '  "checks": {}',
      ">>>>>>> feature",
      "}",
    ].join("\n");

    expect(() => resolveBaselineConflict(conflictContent)).toThrowError(
      /Failed to parse baseline during conflict resolution:/,
    );
  });

  it("should use String(error) fallback when non-Error is thrown", () => {
    const originalParse = JSON.parse;

    JSON.parse = vi.fn().mockImplementation(() => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- this is intentional for the test
      throw "string error";
    });

    const conflictContent = [
      "{",
      `  "version": ${BASELINE_VERSION},`,
      "<<<<<<< HEAD",
      '  "checks": {}',
      "=======",
      '  "checks": {}',
      ">>>>>>> feature",
      "}",
    ].join("\n");

    try {
      expect(() => resolveBaselineConflict(conflictContent)).toThrowError(
        "Failed to parse baseline during conflict resolution: string error",
      );
    } finally {
      JSON.parse = originalParse;
    }
  });

  it("should default to 'items' type when both sides are missing type", () => {
    const item1 = {
      column: 1,
      file: "src/a.ts",
      id: "error1-id",
      line: 10,
      message: "error1",
      rule: "no-unused-vars",
    };
    const item2 = {
      column: 1,
      file: "src/b.ts",
      id: "error2-id",
      line: 20,
      message: "error2",
      rule: "no-undef",
    };

    const conflictContent = [
      "{",
      `  "version": ${BASELINE_VERSION},`,
      "<<<<<<< HEAD",
      '  "checks": {',
      '    "eslint": {',
      `      "items": [${JSON.stringify(item1)}]`,
      "    }",
      "  }",
      "=======",
      '  "checks": {',
      '    "eslint": {',
      `      "items": [${JSON.stringify(item2)}]`,
      "    }",
      "  }",
      ">>>>>>> feature",
      "}",
    ].join("\n");

    const result = resolveBaselineConflict(conflictContent);

    expect(result.checks.eslint?.type).toBe("items");
    expect(result.checks.eslint?.items).toHaveLength(2);

    const ids = result.checks.eslint?.items.map((i) => i.id).toSorted();

    expect(ids).toStrictEqual(["error1-id", "error2-id"]);
  });

  it("should merge multiple conflict blocks with different checks", () => {
    const eslintItem1 = {
      column: 1,
      file: "src/a.ts",
      id: "eslint-error1-id",
      line: 10,
      message: "error1",
      rule: "no-unused-vars",
    };
    const eslintItem2 = {
      column: 1,
      file: "src/b.ts",
      id: "eslint-error2-id",
      line: 20,
      message: "error2",
      rule: "no-undef",
    };
    const tsItem1 = {
      column: 1,
      file: "src/c.ts",
      id: "ts-error1-id",
      line: 30,
      message: "ts-error1",
      rule: "TS2304",
    };
    const tsItem2 = {
      code: "TS2345",
      column: 1,
      file: "src/d.ts",
      id: "ts-error2-id",
      line: 40,
      message: "ts-error2",
    };

    const conflictContent = [
      "{",
      `  "version": ${BASELINE_VERSION},`,
      "<<<<<<< HEAD",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(eslintItem1)}]`,
      "=======",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(eslintItem2)}]`,
      ">>>>>>> feature",
      ",",
      "<<<<<<< HEAD",
      '    "typescript": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(tsItem1)}]`,
      "    }",
      "  }",
      "=======",
      '    "typescript": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(tsItem2)}]`,
      "    }",
      "  }",
      ">>>>>>> feature",
      "}",
    ].join("\n");

    const result = resolveBaselineConflict(conflictContent);

    expect(result.checks.eslint?.items).toHaveLength(2);

    const eslintIds = result.checks.eslint?.items.map((i) => i.id).toSorted();

    expect(eslintIds).toStrictEqual(["eslint-error1-id", "eslint-error2-id"]);

    expect(result.checks.typescript?.items).toHaveLength(2);

    const tsIds = result.checks.typescript?.items.map((i) => i.id).toSorted();

    expect(tsIds).toStrictEqual(["ts-error1-id", "ts-error2-id"]);
  });

  it("should merge three conflict blocks", () => {
    const eslintItem1 = {
      column: 1,
      file: "src/a.ts",
      id: "eslint-error1-id",
      line: 10,
      message: "error1",
      rule: "no-unused-vars",
    };
    const eslintItem2 = {
      column: 1,
      file: "src/b.ts",
      id: "eslint-error2-id",
      line: 20,
      message: "error2",
      rule: "no-undef",
    };
    const tsItem1 = {
      column: 1,
      file: "src/c.ts",
      id: "ts-error1-id",
      line: 30,
      message: "ts-error1",
      rule: "TS2304",
    };
    const tsItem2 = {
      code: "TS2345",
      column: 1,
      file: "src/d.ts",
      id: "ts-error2-id",
      line: 40,
      message: "ts-error2",
    };
    const customItem1 = {
      code: "custom-rule",
      column: 1,
      file: "src/e.ts",
      id: "custom-error1-id",
      line: 50,
      message: "custom-error1",
    };
    const customItem2 = {
      code: "custom-rule",
      column: 1,
      file: "src/f.ts",
      id: "custom-error2-id",
      line: 60,
      message: "custom-error2",
    };

    const conflictContent = [
      "{",
      `  "version": ${BASELINE_VERSION},`,
      "<<<<<<< HEAD",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(eslintItem1)}]`,
      "    }",
      "=======",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(eslintItem2)}]`,
      "    }",
      ">>>>>>> feature",
      ",",
      "<<<<<<< HEAD",
      '    "typescript": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(tsItem1)}]`,
      "    }",
      "=======",
      '    "typescript": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(tsItem2)}]`,
      "    }",
      ">>>>>>> feature",
      ",",
      "<<<<<<< HEAD",
      '    "custom": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(customItem1)}]`,
      "    }",
      "  }",
      "=======",
      '    "custom": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(customItem2)}]`,
      "    }",
      "  }",
      ">>>>>>> feature",
      "}",
    ].join("\n");

    const result = resolveBaselineConflict(conflictContent);

    expect(result.checks.eslint?.items).toHaveLength(2);

    const eslintIds = result.checks.eslint?.items.map((i) => i.id).toSorted();

    expect(eslintIds).toStrictEqual(["eslint-error1-id", "eslint-error2-id"]);

    expect(result.checks.typescript?.items).toHaveLength(2);

    const tsIds = result.checks.typescript?.items.map((i) => i.id).toSorted();

    expect(tsIds).toStrictEqual(["ts-error1-id", "ts-error2-id"]);

    expect(result.checks.custom?.items).toHaveLength(2);

    const customIds = result.checks.custom?.items.map((i) => i.id).toSorted();

    expect(customIds).toStrictEqual(["custom-error1-id", "custom-error2-id"]);
  });

  it("should merge multiple conflict blocks without outer JSON structure", () => {
    const eslintItem1 = {
      column: 1,
      file: "src/a.ts",
      id: "eslint-error1-id",
      line: 10,
      message: "error1",
      rule: "no-unused-vars",
    };
    const eslintItem2 = {
      column: 1,
      file: "src/b.ts",
      id: "eslint-error2-id",
      line: 20,
      message: "error2",
      rule: "no-undef",
    };
    const tsItem1 = {
      column: 1,
      file: "src/c.ts",
      id: "ts-error1-id",
      line: 30,
      message: "ts-error1",
      rule: "TS2304",
    };
    const tsItem2 = {
      code: "TS2345",
      column: 1,
      file: "src/d.ts",
      id: "ts-error2-id",
      line: 40,
      message: "ts-error2",
    };

    const conflictContent = [
      "<<<<<<< HEAD",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(eslintItem1)}]`,
      "    }",
      "  }",
      "=======",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(eslintItem2)}]`,
      "    }",
      "  }",
      ">>>>>>> feature",
      ",",
      "<<<<<<< HEAD",
      '  "checks": {',
      '    "typescript": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(tsItem1)}]`,
      "    }",
      "  }",
      "=======",
      '  "checks": {',
      '    "typescript": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(tsItem2)}]`,
      "    }",
      "  }",
      ">>>>>>> feature",
    ].join("\n");

    const result = resolveBaselineConflict(conflictContent);

    expect(result.checks.eslint?.items).toHaveLength(2);

    const eslintIds = result.checks.eslint?.items.map((i) => i.id).toSorted();

    expect(eslintIds).toStrictEqual(["eslint-error1-id", "eslint-error2-id"]);

    expect(result.checks.typescript?.items).toHaveLength(2);

    const tsIds = result.checks.typescript?.items.map((i) => i.id).toSorted();

    expect(tsIds).toStrictEqual(["ts-error1-id", "ts-error2-id"]);

    expect(result.version).toBe(BASELINE_VERSION);
  });

  it("should merge when the same check appears in multiple conflict blocks", () => {
    const itemA = {
      column: 1,
      file: "src/a.ts",
      id: "a-id",
      line: 10,
      message: "a",
      rule: "no-unused-vars",
    };
    const itemB = {
      column: 1,
      file: "src/b.ts",
      id: "b-id",
      line: 20,
      message: "b",
      rule: "no-undef",
    };
    const itemC = {
      column: 1,
      file: "src/c.ts",
      id: "c-id",
      line: 30,
      message: "c",
      rule: "semi",
    };
    const itemD = {
      code: "quotes",
      column: 1,
      file: "src/d.ts",
      id: "d-id",
      line: 40,
      message: "d",
    };

    const conflictContent = [
      "<<<<<<< HEAD",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(itemA)}]`,
      "    }",
      "  }",
      "=======",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(itemB)}]`,
      "    }",
      "  }",
      ">>>>>>> feature",
      ",",
      "<<<<<<< HEAD",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(itemC)}]`,
      "    }",
      "  }",
      "=======",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      `      "items": [${JSON.stringify(itemD)}]`,
      "    }",
      "  }",
      ">>>>>>> feature",
    ].join("\n");

    const result = resolveBaselineConflict(conflictContent);

    expect(result.checks.eslint?.items).toHaveLength(4);

    const ids = result.checks.eslint?.items.map((i) => i.id).toSorted();

    expect(ids).toStrictEqual(["a-id", "b-id", "c-id", "d-id"]);
    expect(result.version).toBe(BASELINE_VERSION);
  });

  it("should merge conflict blocks that are check entries inside checks", () => {
    const eslintItemA = {
      column: 1,
      file: "src/a.ts",
      id: "a-id",
      line: 10,
      message: "a",
      rule: "no-unused-vars",
    };
    const eslintItemB = {
      column: 1,
      file: "src/b.ts",
      id: "b-id",
      line: 20,
      message: "b",
      rule: "no-undef",
    };
    const tsItemX = {
      column: 1,
      file: "src/x.ts",
      id: "x-id",
      line: 30,
      message: "x",
      rule: "TS2304",
    };
    const tsItemY = {
      code: "TS2345",
      column: 1,
      file: "src/y.ts",
      id: "y-id",
      line: 40,
      message: "y",
    };

    const conflictContent = [
      "{",
      `  "version": ${BASELINE_VERSION},`,
      '  "checks": {',
      "<<<<<<< HEAD",
      `    "eslint": { "type": "items", "items": [${JSON.stringify(eslintItemA)}] },`,
      "=======",
      `    "eslint": { "type": "items", "items": [${JSON.stringify(eslintItemB)}] },`,
      ">>>>>>> feature",
      "<<<<<<< HEAD",
      `    "typescript": { "type": "items", "items": [${JSON.stringify(tsItemX)}] }`,
      "=======",
      `    "typescript": { "type": "items", "items": [${JSON.stringify(tsItemY)}] }`,
      ">>>>>>> feature",
      "  }",
      "}",
    ].join("\n");

    const result = resolveBaselineConflict(conflictContent);

    expect(result.checks.eslint?.items).toHaveLength(2);

    const eslintIds = result.checks.eslint?.items.map((i) => i.id).toSorted();

    expect(eslintIds).toStrictEqual(["a-id", "b-id"]);

    expect(result.checks.typescript?.items).toHaveLength(2);

    const tsIds = result.checks.typescript?.items.map((i) => i.id).toSorted();

    expect(tsIds).toStrictEqual(["x-id", "y-id"]);
  });

  it("should throw error for fragments with no close braces", () => {
    const conflictContent = [
      "<<<<<<< HEAD",
      '  "checks": { "eslint": { "items": ["a"',
      "=======",
      '  "checks": {}',
      ">>>>>>> feature",
    ].join("\n");

    expect(() => resolveBaselineConflict(conflictContent)).toThrowError(
      /Failed to parse baseline during conflict resolution/,
    );
  });

  it("should merge conflict blocks and union items by id", () => {
    const content = [
      "<<<<<<< HEAD",
      `"eslint": { "type": "items", "items": [{ "id": "a", "file": "a", "line": 1, "column": 1, "message": "m", "rule": "r" }] },`,
      "=======",
      `"eslint": { "type": "items", "items": [{ "id": "b", "file": "b", "line": 2, "column": 1, "message": "m", "rule": "r" }] }`,
      ">>>>>>> branch",
      "",
      "<<<<<<< HEAD",
      `"tsc": { "type": "items", "items": [{ "id": "x", "file": "x", "line": 1, "column": 1, "message": "m", "rule": "TS" }] }`,
      "=======",
      `"eslint": { "type": "items", "items": [{ "id": "a", "file": "a2", "line": 99, "column": 1, "message": "m2", "rule": "r" }] }`,
      ">>>>>>> branch",
      "",
    ].join("\n");

    const merged = resolveBaselineConflict(content);

    expect(Object.keys(merged.checks).toSorted()).toStrictEqual([
      "eslint",
      "tsc",
    ]);

    expect(merged.checks.eslint?.items.map((i) => i.id)).toStrictEqual([
      "a",
      "b",
    ]);
    expect(merged.checks.tsc?.items.map((i) => i.id)).toStrictEqual(["x"]);
  });

  it("should parse full JSON baselines via the direct JSON fast-path", () => {
    const ours = JSON.stringify(
      {
        checks: {
          eslint: {
            items: [
              {
                column: 1,
                file: "a",
                id: "a",
                line: 1,
                message: "m",
                rule: "r",
              },
            ],
            type: "items",
          },
        },
        version: BASELINE_VERSION,
      },
      null,
      2,
    );

    const theirs = JSON.stringify(
      {
        checks: {
          eslint: {
            items: [
              {
                column: 1,
                file: "b",
                id: "b",
                line: 1,
                message: "m",
                rule: "r",
              },
            ],
            type: "items",
          },
        },
        version: BASELINE_VERSION,
      },
      null,
      2,
    );

    const content = [
      "<<<<<<< HEAD",
      ours,
      "=======",
      theirs,
      ">>>>>>> branch",
      "",
    ].join("\n");

    const merged = resolveBaselineConflict(content);

    expect(merged.checks.eslint?.items.map((i) => i.id)).toStrictEqual([
      "a",
      "b",
    ]);
  });

  it("should throw a wrapped error when a conflict side parses but is not an object", () => {
    const content = [
      "<<<<<<< HEAD",
      "true",
      "=======",
      "true",
      ">>>>>>> branch",
      "",
    ].join("\n");

    expect(() => resolveBaselineConflict(content)).toThrowError(
      /Failed to parse baseline during conflict resolution: Baseline must be an object/,
    );
  });

  it("should handle extra closing braces that cannot be removed when the fragment does not end with '}'", () => {
    // This is intentionally malformed:
    // - Starts with an extra "}" so closeCount > openCount
    // - Ends with "]" so removeCloseBraces() hits the `break` branch immediately
    const ours = `
} "eslint": { "type": "items", "items": [] ]
`.trim();

    const theirs = `
"eslint": { "type": "items", "items": [] }
`.trim();

    const content = [
      "<<<<<<< HEAD",
      ours,
      "=======",
      theirs,
      ">>>>>>> branch",
      "",
    ].join("\n");

    expect(() => resolveBaselineConflict(content)).toThrowError(
      /Failed to parse baseline during conflict resolution:/,
    );
  });

  it("should stop removing braces when fragment does not end with a closing brace", () => {
    // This fragment:
    // - has MORE closing braces than opening braces
    // - does NOT end with "}"
    // - forces removeCloseBraces() to hit the `break` branch
    const ours = `
} } "eslint": { "type": "items", "items": [] ]
`.trim();

    const theirs = `
"eslint": { "type": "items", "items": [] }
`.trim();

    const content = [
      "<<<<<<< HEAD",
      ours,
      "=======",
      theirs,
      ">>>>>>> branch",
      "",
    ].join("\n");

    expect(() => resolveBaselineConflict(content)).toThrowError(
      /Failed to parse baseline during conflict resolution:/,
    );
  });

  it("should skip checks with empty items during merge", () => {
    const start = `${"<".repeat(7)} ours`;
    const mid = "=".repeat(7);
    const end = `${">".repeat(7)} theirs`;

    const content = [
      start,
      `{`,
      `  "checks": {`,
      `    "eslint": { "type": "items", "items": [] }`,
      `  }`,
      `}`,
      mid,
      `{`,
      `  "checks": {`,
      `    "eslint": {`,
      `      "type": "items",`,
      `      "items": [`,
      `        {`,
      `          "id": "eslint-1",`,
      `          "file": "src/a.ts",`,
      `          "line": 1,`,
      `          "column": 1,`,
      `          "code": "no-unused-vars",`,
      `          "message": "unused"`,
      `        }`,
      `      ]`,
      `    }`,
      `  }`,
      `}`,
      end,
    ].join("\n");

    const result = resolveBaselineConflict(content);

    expect(result.checks.eslint?.items).toHaveLength(1);
    expect(result.checks.eslint?.items[0]?.id).toBe("eslint-1");
  });
});
