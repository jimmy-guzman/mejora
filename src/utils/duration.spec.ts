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

  it("should format seconds correctly", () => {
    expect(formatDuration(1000)).toContain("1s");
    expect(formatDuration(5000)).toContain("5s");
  });

  it("should round fractional milliseconds", () => {
    expect(formatDuration(42.7)).toContain("43");
    expect(formatDuration(50.5)).toContain("51");
  });

  it("should apply bright green color for fast durations (<100ms)", () => {
    // eslint-disable-next-line no-control-regex -- testing for color codes
    expect(formatDuration(50)).toMatch(/\u001B\[92m/);
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
