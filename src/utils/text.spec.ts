import { plural } from "./text";

describe("plural", () => {
  it("should return singular form for count of 1", () => {
    expect(plural(1, "issue")).toBe("issue");
  });

  it("should return plural form for count of 0", () => {
    expect(plural(0, "issue")).toBe("issues");
  });

  it("should return plural form for count greater than 1", () => {
    expect(plural(5, "issue")).toBe("issues");
  });
});
