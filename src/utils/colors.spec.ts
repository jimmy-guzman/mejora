import * as c from "./colors";

describe("colors", () => {
  it("should return colorized text", () => {
    expect(c.blue("test")).toBe(`[34mtest[39m`);
    expect(c.bold("test")).toBe(`[1mtest[22m`);
    expect(c.cyan("test")).toBe(`[36mtest[39m`);
    expect(c.dim("test")).toBe(`[2mtest[22m`);
    expect(c.green("test")).toBe(`[32mtest[39m`);
    expect(c.red("test")).toBe(`[31mtest[39m`);
    expect(c.yellow("test")).toBe(`[33mtest[39m`);
  });
});
