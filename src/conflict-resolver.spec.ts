import { resolveBaselineConflict } from "./conflict-resolver";

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

  it("should handle conflicts with different checks on each side", () => {
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

  it("should handle conflicts with overlapping items", () => {
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

  it("should handle multiple checks with conflicts", () => {
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

  it("should handle empty checks on one side", () => {
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

  it("should handle empty items arrays", () => {
    const conflictContent = [
      "{",
      '  "version": 1,',
      "<<<<<<< HEAD",
      '  "checks": {',
      '    "eslint": {',
      '      "type": "items",',
      '      "items": []',
      "    }",
      "  }",
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
});
