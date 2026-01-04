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
});
