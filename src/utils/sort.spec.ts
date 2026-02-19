import { sortById } from "./sort";

describe("sortById", () => {
  it("should return -1 when a.id comes before b.id", () => {
    expect(sortById({ id: "apple" }, { id: "banana" })).toBe(-1);
  });

  it("should return 1 when a.id comes after b.id", () => {
    expect(sortById({ id: "banana" }, { id: "apple" })).toBe(1);
  });

  it("should return 0 when ids are equal", () => {
    expect(sortById({ id: "apple" }, { id: "apple" })).toBe(0);
  });

  it("should sort an array correctly", () => {
    const items = [{ id: "c" }, { id: "a" }, { id: "b" }];

    expect(items.toSorted(sortById)).toStrictEqual([
      { id: "a" },
      { id: "b" },
      { id: "c" },
    ]);
  });

  it("should work with extra properties on objects", () => {
    const a = { id: "1", name: "Alice" };
    const b = { id: "2", name: "Bob" };

    expect(sortById(a, b)).toBe(-1);
  });
});
