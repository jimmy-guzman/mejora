import type { Config, RunOptions, RunResult } from "@/types";

const mockLoadConfig = vi.fn();
const mockRegistryInit = vi.fn();
const mockRunnerRun = vi.fn();

vi.mock("./core/config", () => ({
  loadConfig: mockLoadConfig,
}));

vi.mock("./core/check-registry", () => {
  return {
    CheckRegistry: vi.fn(function (this: { init: typeof mockRegistryInit }) {
      this.init = mockRegistryInit;
    }),
  };
});

vi.mock("./core/runner", () => {
  return {
    Runner: vi.fn(function (this: { run: typeof mockRunnerRun }) {
      this.run = mockRunnerRun;
    }),
  };
});

const { run } = await import("./run");

const mockConfig: Config = {
  checks: [],
  runners: [],
};

const mockResult: RunResult = {
  exitCode: 0,
  hasImprovement: false,
  hasRegression: false,
  results: [],
  totalDuration: 42,
};

describe("run()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadConfig.mockResolvedValue(mockConfig);
    mockRunnerRun.mockResolvedValue(mockResult);
  });

  it("should call loadConfig() when no config is provided", async () => {
    await run();

    expect(mockLoadConfig).toHaveBeenCalledOnce();
  });

  it("should skip loadConfig() when config is provided", async () => {
    await run(mockConfig);

    expect(mockLoadConfig).not.toHaveBeenCalled();
  });

  it("should initialise registry with the resolved config", async () => {
    await run();

    expect(mockRegistryInit).toHaveBeenCalledWith(mockConfig);
  });

  it("should initialise registry with the provided config", async () => {
    const customConfig: Config = { checks: [], runners: [] };

    await run(customConfig);

    expect(mockRegistryInit).toHaveBeenCalledWith(customConfig);
  });

  it("should pass options through to runner.run()", async () => {
    const options: RunOptions = { force: true, only: "eslint.*", skip: "ts.*" };

    await run(undefined, options);

    expect(mockRunnerRun).toHaveBeenCalledWith(mockConfig, options);
  });

  it("should return the RunResult from runner.run()", async () => {
    const result = await run(mockConfig);

    expect(result).toBe(mockResult);
  });

  it("should return the correct RunResult shape", async () => {
    const result = await run();

    expect(result).toMatchObject({
      exitCode: expect.any(Number),
      hasImprovement: expect.any(Boolean),
      hasRegression: expect.any(Boolean),
      results: expect.any(Array),
    });
  });
});
