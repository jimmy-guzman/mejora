import { balanceBraces } from "./brace-balancer";

describe("balanceBraces", () => {
  it("should return unchanged when braces are balanced", () => {
    expect(balanceBraces('{"a": 1}')).toBe('{"a": 1}');
  });

  it("should add missing closing braces", () => {
    expect(balanceBraces('{"a": 1')).toBe('{"a": 1\n}');
  });

  it("should remove extra closing braces", () => {
    expect(balanceBraces('{"a": 1}}}')).toBe('{"a": 1}');
  });

  it("should handle strings with no braces", () => {
    expect(balanceBraces("no braces here")).toBe("no braces here");
  });

  it("should handle empty strings", () => {
    expect(balanceBraces("")).toBe("");
  });

  it("should handle balanced nested braces", () => {
    expect(balanceBraces('{"a": {"b": 1}}')).toBe('{"a": {"b": 1}}');
  });

  it("should add multiple missing closing braces for deeply nested objects", () => {
    expect(balanceBraces('{"a": {"b": 1')).toBe('{"a": {"b": 1\n}\n}');
  });

  it("should remove multiple extra closing braces", () => {
    expect(balanceBraces('{"a": 1}}}}')).toBe('{"a": 1}');
  });

  it("should naively count braces inside string values", () => {
    // Both the open and close braces inside the string value are counted,
    // so the overall delta is still 0 and the string is returned unchanged.
    expect(balanceBraces('{"a": "{b}"}')).toBe('{"a": "{b}"}');
  });

  it("should count an unmatched open brace inside a string value as needing a close", () => {
    // The `{` inside the string value is counted naively, making delta = 1.
    // Input has 2 `{` and 1 `}`, so one closing brace is appended.
    expect(balanceBraces('{"a": "{b"}')).toBe('{"a": "{b"}\n}');
  });
});
