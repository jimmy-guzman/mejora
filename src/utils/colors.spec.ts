import * as c from "./colors";

describe("colors", () => {
  it("should return colorized text", () => {
    expect(c.blue("test")).toBe(`[34mtest[39m`);
    expect(c.blue(1234)).toBe(`[34m1234[39m`);
    expect(c.bold("test")).toBe(`[1mtest[22m`);
    expect(c.bold(1234)).toBe(`[1m1234[22m`);
    expect(c.cyan("test")).toBe(`[36mtest[39m`);
    expect(c.cyan(1234)).toBe(`[36m1234[39m`);
    expect(c.dim("test")).toBe(`[2mtest[22m`);
    expect(c.dim(1234)).toBe(`[2m1234[22m`);
    expect(c.green("test")).toBe(`[32mtest[39m`);
    expect(c.green(1234)).toBe(`[32m1234[39m`);
    expect(c.red("test")).toBe(`[31mtest[39m`);
    expect(c.red(1234)).toBe(`[31m1234[39m`);
    expect(c.gray("test")).toBe(`[90mtest[39m`);
    expect(c.gray(1234)).toBe(`[90m1234[39m`);
    expect(c.yellow("test")).toBe(`[33mtest[39m`);
  });
});
