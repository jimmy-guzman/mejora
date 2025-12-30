import { duration } from "./duration";

describe("duration", () => {
  it("should format sub-millisecond durations as <1ms", () => {
    expect(duration(0)).toContain("<1ms");
    expect(duration(0.4)).toContain("<1ms");
  });

  it("should format milliseconds correctly", () => {
    expect(duration(1)).toContain("1ms");
    expect(duration(50)).toContain("50ms");
    expect(duration(999)).toContain("999ms");
  });

  it("should format whole seconds without decimal", () => {
    expect(duration(1000)).toContain("1s");
    expect(duration(5000)).toContain("5s");
    expect(duration(30_000)).toContain("30s");
  });

  it("should format fractional seconds with decimal", () => {
    expect(duration(1500)).toContain("1.5s");
    expect(duration(2300)).toContain("2.3s");
  });

  it("should format whole minutes without decimal", () => {
    expect(duration(60_000)).toContain("1m");
    expect(duration(120_000)).toContain("2m");
  });

  it("should format fractional minutes with decimal", () => {
    expect(duration(90_000)).toContain("1.5m");
    expect(duration(150_000)).toContain("2.5m");
  });

  it("should format whole hours without decimal", () => {
    expect(duration(3_600_000)).toContain("1h");
    expect(duration(7_200_000)).toContain("2h");
  });

  it("should format fractional hours with decimal", () => {
    expect(duration(5_400_000)).toContain("1.5h");
    expect(duration(9_000_000)).toContain("2.5h");
  });

  it("should round fractional milliseconds", () => {
    expect(duration(42.7)).toContain("43");
    expect(duration(50.5)).toContain("51");
  });
});
