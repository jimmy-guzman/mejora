import { formatDuration } from "./duration";

describe("formatDuration", () => {
  it("should format sub-millisecond durations as <1ms", () => {
    expect(formatDuration(0)).toContain("<1ms");
    expect(formatDuration(0.4)).toContain("<1ms");
  });

  it("should format milliseconds correctly", () => {
    expect(formatDuration(1)).toContain("1ms");
    expect(formatDuration(50)).toContain("50ms");
    expect(formatDuration(999)).toContain("999ms");
  });

  it("should format whole seconds without decimal", () => {
    expect(formatDuration(1000)).toContain("1s");
    expect(formatDuration(5000)).toContain("5s");
    expect(formatDuration(30_000)).toContain("30s");
  });

  it("should format fractional seconds with decimal", () => {
    expect(formatDuration(1500)).toContain("1.5s");
    expect(formatDuration(2300)).toContain("2.3s");
  });

  it("should format whole minutes without decimal", () => {
    expect(formatDuration(60_000)).toContain("1m");
    expect(formatDuration(120_000)).toContain("2m");
  });

  it("should format fractional minutes with decimal", () => {
    expect(formatDuration(90_000)).toContain("1.5m");
    expect(formatDuration(150_000)).toContain("2.5m");
  });

  it("should format whole hours without decimal", () => {
    expect(formatDuration(3_600_000)).toContain("1h");
    expect(formatDuration(7_200_000)).toContain("2h");
  });

  it("should format fractional hours with decimal", () => {
    expect(formatDuration(5_400_000)).toContain("1.5h");
    expect(formatDuration(9_000_000)).toContain("2.5h");
  });

  it("should round fractional milliseconds", () => {
    expect(formatDuration(42.7)).toContain("43");
    expect(formatDuration(50.5)).toContain("51");
  });

  it("should apply dim color for sub-millisecond durations", () => {
    // eslint-disable-next-line no-control-regex -- testing for color codes
    expect(formatDuration(0)).toMatch(/\u001B\[90m/);
  });

  it("should apply bright green color for fast durations (<100ms)", () => {
    // eslint-disable-next-line no-control-regex -- testing for color codes
    expect(formatDuration(50)).toMatch(/\u001B\[32m\u001B\[1m/);
  });

  it("should apply yellow color for medium durations (100-999ms)", () => {
    // eslint-disable-next-line no-control-regex -- testing for color codes
    expect(formatDuration(500)).toMatch(/\u001B\[33m/);
  });

  it("should apply red color for slow durations (1000ms+)", () => {
    // eslint-disable-next-line no-control-regex -- testing for color codes
    expect(formatDuration(5000)).toMatch(/\u001B\[31m/);
  });
});
