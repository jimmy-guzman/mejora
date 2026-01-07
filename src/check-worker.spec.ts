import { CheckRegistry } from "./check-registry";
import worker from "./check-worker";
import { loadConfig } from "./config";
import { registerRunners } from "./registry";

vi.mock("./config");
vi.mock("./registry");

describe("worker", () => {
  const mockConfig = {
    checks: {
      "check-1": { type: "http", url: "https://example.com" },
      "check-2": { host: "localhost", port: 3000, type: "tcp" },
    },
  };

  const mockSnapshot = { status: "ok", timestamp: Date.now() };
  const mockRunner = {
    run: vi.fn().mockResolvedValue(mockSnapshot),
    type: "http",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.mocked(loadConfig).mockResolvedValue(mockConfig);

    vi.spyOn(CheckRegistry.prototype, "setup").mockResolvedValue(undefined);
    vi.spyOn(CheckRegistry.prototype, "validate").mockResolvedValue(undefined);
    vi.spyOn(CheckRegistry.prototype, "get").mockReturnValue(mockRunner);
  });

  it("should load config on first call", async () => {
    await worker({ checkId: "check-1" });

    expect(loadConfig).toHaveBeenCalledOnce();
  });

  it("should throw when check not found", async () => {
    await expect(worker({ checkId: "nonexistent" })).rejects.toThrowError(
      "Check not found in config: nonexistent",
    );
  });

  it("should reuse registry for same check type", async () => {
    await worker({ checkId: "check-1" });
    const firstCallCount = vi.mocked(registerRunners).mock.calls.length;

    await worker({ checkId: "check-1" });
    const secondCallCount = vi.mocked(registerRunners).mock.calls.length;

    expect(secondCallCount).toBe(firstCallCount);
  });

  it("should run check and return duration and snapshot", async () => {
    const result = await worker({ checkId: "check-1" });

    expect(result).toMatchObject({
      duration: expect.any(Number),
      snapshot: mockSnapshot,
    });
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it("should call runner with check config", async () => {
    await worker({ checkId: "check-1" });

    expect(mockRunner.run).toHaveBeenCalledWith(mockConfig.checks["check-1"]);
  });
});
