import * as c from "./colors";

describe("colors", () => {
  const originalForceColor = process.env.FORCE_COLOR;

  beforeAll(() => {
    process.env.FORCE_COLOR = "1";
  });

  afterAll(() => {
    if (originalForceColor === undefined) {
      delete process.env.FORCE_COLOR;
    } else {
      process.env.FORCE_COLOR = originalForceColor;
    }
  });

  it("should return colorized text", () => {
    expect(c.blue("test")).toBe(`\u001B[34mtest\u001B[39m`);
    expect(c.blue(1234)).toBe(`\u001B[34m1234\u001B[39m`);
    expect(c.bold("test")).toBe(`\u001B[1mtest\u001B[22m`);
    expect(c.bold(1234)).toBe(`\u001B[1m1234\u001B[22m`);
    expect(c.cyan("test")).toBe(`\u001B[36mtest\u001B[39m`);
    expect(c.cyan(1234)).toBe(`\u001B[36m1234\u001B[39m`);
    expect(c.dim("test")).toBe(`\u001B[2mtest\u001B[22m`);
    expect(c.dim(1234)).toBe(`\u001B[2m1234\u001B[22m`);
    expect(c.green("test")).toBe(`\u001B[32mtest\u001B[39m`);
    expect(c.green(1234)).toBe(`\u001B[32m1234\u001B[39m`);
    expect(c.red("test")).toBe(`\u001B[31mtest\u001B[39m`);
    expect(c.red(1234)).toBe(`\u001B[31m1234\u001B[39m`);
    expect(c.gray("test")).toBe(`\u001B[90mtest\u001B[39m`);
    expect(c.gray(1234)).toBe(`\u001B[90m1234\u001B[39m`);
    expect(c.yellow("test")).toBe(`\u001B[33mtest\u001B[39m`);
  });
});
