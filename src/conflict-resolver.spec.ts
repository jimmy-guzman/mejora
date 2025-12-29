import { resolveBaselineConflict } from "./conflict-resolver";
import { BASELINE_VERSION } from "./constants";

describe("resolveBaselineConflict", () => {
  it("should merge conflicts with union of items", () => {
    const conflictContent = [
      "{",
      '  "version": 1,',
      "<<<<<<< HEAD",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      '      "items": ["error1", "error2"]',
      "    }",
      "  }",
      "=======",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      '      "items": ["error2", "error3"]',
      "    }",
      "  }",
      ">>>>>>> feature",
      "}",
    ].join("\n");

    const result = resolveBaselineConflict(conflictContent);

    expect(result.checks.eslint?.items).toStrictEqual([
      "error1",
      "error2",
      "error3",
    ]);
  });

  it("should merge conflicts with different checks on each side", () => {
    const conflictContent = [
      "{",
      '  "version": 1,',
      "<<<<<<< HEAD",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      '      "items": ["error1"]',
      "    }",
      "  }",
      "=======",
      '  "checks": {',
      '    "typescript": {',
      '      "type": "items",',
      '      "items": ["error2"]',
      "    }",
      "  }",
      ">>>>>>> feature",
      "}",
    ].join("\n");

    const result = resolveBaselineConflict(conflictContent);

    expect(result.checks.eslint?.items).toStrictEqual(["error1"]);
    expect(result.checks.typescript?.items).toStrictEqual(["error2"]);
  });

  it("should merge conflicts with overlapping items", () => {
    const conflictContent = [
      "{",
      '  "version": 1,',
      "<<<<<<< HEAD",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      '      "items": ["error1", "error2", "error3"]',
      "    }",
      "  }",
      "=======",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      '      "items": ["error2", "error3", "error4"]',
      "    }",
      "  }",
      ">>>>>>> feature",
      "}",
    ].join("\n");

    const result = resolveBaselineConflict(conflictContent);

    expect(result.checks.eslint?.items).toStrictEqual([
      "error1",
      "error2",
      "error3",
      "error4",
    ]);
  });

  it("should sort merged items alphabetically", () => {
    const conflictContent = [
      "{",
      '  "version": 1,',
      "<<<<<<< HEAD",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      '      "items": ["z-error", "a-error"]',
      "    }",
      "  }",
      "=======",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      '      "items": ["m-error", "b-error"]',
      "    }",
      "  }",
      ">>>>>>> feature",
      "}",
    ].join("\n");

    const result = resolveBaselineConflict(conflictContent);

    expect(result.checks.eslint?.items).toStrictEqual([
      "a-error",
      "b-error",
      "m-error",
      "z-error",
    ]);
  });

  it("should merge multiple checks with conflicts", () => {
    const conflictContent = [
      "{",
      '  "version": 1,',
      "<<<<<<< HEAD",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      '      "items": ["error1"]',
      "    },",
      '    "typescript": {',
      '      "type": "items",',
      '      "items": ["ts-error1"]',
      "    }",
      "  }",
      "=======",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      '      "items": ["error2"]',
      "    },",
      '    "typescript": {',
      '      "type": "items",',
      '      "items": ["ts-error2"]',
      "    }",
      "  }",
      ">>>>>>> feature",
      "}",
    ].join("\n");

    const result = resolveBaselineConflict(conflictContent);

    expect(result.checks.eslint?.items).toStrictEqual(["error1", "error2"]);
    expect(result.checks.typescript?.items).toStrictEqual([
      "ts-error1",
      "ts-error2",
    ]);
  });

  it("should preserve check type from either side", () => {
    const conflictContent = [
      "{",
      '  "version": 1,',
      "<<<<<<< HEAD",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      '      "items": ["error1"]',
      "    }",
      "  }",
      "=======",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      '      "items": ["error2"]',
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
      '  "version": 1,',
      "<<<<<<< HEAD",
      '  "checks": {}',
      "=======",
      '  "checks": {}',
      ">>>>>>> feature",
      "}",
    ].join("\n");

    const result = resolveBaselineConflict(conflictContent);

    expect(result.version).toBe(1);
  });

  it("should throw error for malformed conflict markers", () => {
    const conflictContent = [
      "{",
      '  "version": 1,',
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
      '  "version": 1,',
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
      '  "version": 1,',
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
      '  "version": 1,',
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
    const conflictContent = [
      "{",
      '  "version": 1,',
      "<<<<<<< HEAD",
      '  "checks": {}',
      "=======",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      '      "items": ["error1"]',
      "    }",
      "  }",
      ">>>>>>> feature",
      "}",
    ].join("\n");

    const result = resolveBaselineConflict(conflictContent);

    expect(result.checks.eslint?.items).toStrictEqual(["error1"]);
  });

  it("should deduplicate items from both sides", () => {
    const conflictContent = [
      "{",
      '  "version": 1,',
      "<<<<<<< HEAD",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      '      "items": ["error1", "error1", "error2"]',
      "    }",
      "  }",
      "=======",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      '      "items": ["error2", "error2", "error3"]',
      "    }",
      "  }",
      ">>>>>>> feature",
      "}",
    ].join("\n");

    const result = resolveBaselineConflict(conflictContent);

    expect(result.checks.eslint?.items).toStrictEqual([
      "error1",
      "error2",
      "error3",
    ]);
  });

  it("should include JSON parse error details in thrown error", () => {
    const conflictContent = [
      "{",
      '  "version": 1,',
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
      '  "version": 1,',
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
    const conflictContent = [
      "{",
      '  "version": 1,',
      "<<<<<<< HEAD",
      '  "checks": {',
      '    "eslint": {',
      '      "items": ["error1"]',
      "    }",
      "  }",
      "=======",
      '  "checks": {',
      '    "eslint": {',
      '      "items": ["error2"]',
      "    }",
      "  }",
      ">>>>>>> feature",
      "}",
    ].join("\n");

    const result = resolveBaselineConflict(conflictContent);

    expect(result.checks.eslint?.type).toBe("items");
    expect(result.checks.eslint?.items).toStrictEqual(["error1", "error2"]);
  });

  it("should merge multiple conflict blocks with different checks", () => {
    const conflictContent = [
      "{",
      '  "version": 1,',
      "<<<<<<< HEAD",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      '      "items": ["error1"]',
      "    }",
      "=======",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      '      "items": ["error2"]',
      "    }",
      ">>>>>>> feature",
      ",",
      "<<<<<<< HEAD",
      '    "typescript": {',
      '      "type": "items",',
      '      "items": ["ts-error1"]',
      "    }",
      "  }",
      "=======",
      '    "typescript": {',
      '      "type": "items",',
      '      "items": ["ts-error2"]',
      "    }",
      "  }",
      ">>>>>>> feature",
      "}",
    ].join("\n");

    const result = resolveBaselineConflict(conflictContent);

    expect(result.checks.eslint?.items).toStrictEqual(["error1", "error2"]);
    expect(result.checks.typescript?.items).toStrictEqual([
      "ts-error1",
      "ts-error2",
    ]);
  });

  it("should merge three conflict blocks", () => {
    const conflictContent = [
      "{",
      '  "version": 1,',
      "<<<<<<< HEAD",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      '      "items": ["error1"]',
      "    }",
      "=======",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      '      "items": ["error2"]',
      "    }",
      ">>>>>>> feature",
      ",",
      "<<<<<<< HEAD",
      '    "typescript": {',
      '      "type": "items",',
      '      "items": ["ts-error1"]',
      "    }",
      "=======",
      '    "typescript": {',
      '      "type": "items",',
      '      "items": ["ts-error2"]',
      "    }",
      ">>>>>>> feature",
      ",",
      "<<<<<<< HEAD",
      '    "custom": {',
      '      "type": "items",',
      '      "items": ["custom-error1"]',
      "    }",
      "  }",
      "=======",
      '    "custom": {',
      '      "type": "items",',
      '      "items": ["custom-error2"]',
      "    }",
      "  }",
      ">>>>>>> feature",
      "}",
    ].join("\n");

    const result = resolveBaselineConflict(conflictContent);

    expect(result.checks.eslint?.items).toStrictEqual(["error1", "error2"]);
    expect(result.checks.typescript?.items).toStrictEqual([
      "ts-error1",
      "ts-error2",
    ]);
    expect(result.checks.custom?.items).toStrictEqual([
      "custom-error1",
      "custom-error2",
    ]);
  });

  it("should merge multiple conflict blocks without outer JSON structure", () => {
    const conflictContent = [
      "<<<<<<< HEAD",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      '      "items": ["error1"]',
      "    }",
      "  }",
      "=======",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      '      "items": ["error2"]',
      "    }",
      "  }",
      ">>>>>>> feature",
      ",",
      "<<<<<<< HEAD",
      '  "checks": {',
      '    "typescript": {',
      '      "type": "items",',
      '      "items": ["ts-error1"]',
      "    }",
      "  }",
      "=======",
      '  "checks": {',
      '    "typescript": {',
      '      "type": "items",',
      '      "items": ["ts-error2"]',
      "    }",
      "  }",
      ">>>>>>> feature",
    ].join("\n");

    const result = resolveBaselineConflict(conflictContent);

    expect(result.checks.eslint?.items).toStrictEqual(["error1", "error2"]);
    expect(result.checks.typescript?.items).toStrictEqual([
      "ts-error1",
      "ts-error2",
    ]);
    expect(result.version).toBe(BASELINE_VERSION);
  });

  it("should merge when the same check appears in multiple conflict blocks", () => {
    const conflictContent = [
      "<<<<<<< HEAD",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      '      "items": ["a"]',
      "    }",
      "  }",
      "=======",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      '      "items": ["b"]',
      "    }",
      "  }",
      ">>>>>>> feature",
      ",",
      "<<<<<<< HEAD",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      '      "items": ["c"]',
      "    }",
      "  }",
      "=======",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      '      "items": ["d"]',
      "    }",
      "  }",
      ">>>>>>> feature",
    ].join("\n");

    const result = resolveBaselineConflict(conflictContent);

    expect(result.checks.eslint?.items).toStrictEqual(["a", "b", "c", "d"]);
    expect(result.version).toBe(BASELINE_VERSION);
  });

  it("should merge conflict blocks that are check entries inside checks", () => {
    const conflictContent = [
      "{",
      '  "version": 1,',
      '  "checks": {',
      "<<<<<<< HEAD",
      '    "eslint": { "type": "items", "items": ["a"] },',
      "=======",
      '    "eslint": { "type": "items", "items": ["b"] },',
      ">>>>>>> feature",
      "<<<<<<< HEAD",
      '    "typescript": { "type": "items", "items": ["x"] }',
      "=======",
      '    "typescript": { "type": "items", "items": ["y"] }',
      ">>>>>>> feature",
      "  }",
      "}",
    ].join("\n");

    const result = resolveBaselineConflict(conflictContent);

    expect(result.checks.eslint?.items).toStrictEqual(["a", "b"]);
    expect(result.checks.typescript?.items).toStrictEqual(["x", "y"]);
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
      "Failed to parse baseline during conflict resolution: Expected ',' or ']' after array element in JSON at position 60 (line 4 column 3)",
    );
  });
});
