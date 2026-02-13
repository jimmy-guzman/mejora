import { loadConfig } from "@/core/config";

vi.mock("@/core/config");

const mockSnapshot = { status: "ok", timestamp: Date.now() };
const mockHttpRunner = {
  run: vi.fn().mockResolvedValue(mockSnapshot),
  type: "http",
};
const mockTcpRunner = {
  run: vi.fn().mockResolvedValue(mockSnapshot),
  type: "tcp",
};

const mockInit = vi.fn();
const mockGet = vi.fn((type: string) => {
  return type === "http" ? mockHttpRunner : mockTcpRunner;
});
const mockSetup = vi.fn().mockResolvedValue(undefined);
const mockValidate = vi.fn().mockResolvedValue(undefined);

vi.mock("@/core/check-registry", () => {
  return {
    CheckRegistry: class MockCheckRegistry {
      get = mockGet;
      init = mockInit;
      setup = mockSetup;
      validate = mockValidate;
    },
  };
});

describe("worker", () => {
  const mockConfig = {
    checks: {
      "check-1": { type: "http", url: "https://example.com" },
      "check-2": { host: "localhost", port: 3000, type: "tcp" },
    },
  };

  beforeEach(() => {
    vi.resetModules();

    mockHttpRunner.run.mockClear();
    mockTcpRunner.run.mockClear();
    mockInit.mockClear();
    mockGet.mockClear();
    mockSetup.mockClear();
    mockValidate.mockClear();

    vi.mocked(loadConfig).mockResolvedValue(mockConfig);
  });

  it("should load config on first call", async () => {
    const { checkWorker } = await import("./check");

    await checkWorker({ checkId: "check-1" });

    expect(loadConfig).toHaveBeenCalledOnce();
  });

  it("should throw when check not found", async () => {
    const { checkWorker } = await import("./check");

    await expect(checkWorker({ checkId: "nonexistent" })).rejects.toThrowError(
      "Check not found in config: nonexistent",
    );
  });

  it("should reuse registry for same check type", async () => {
    const { checkWorker } = await import("./check");

    await checkWorker({ checkId: "check-1" });

    expect(mockInit).toHaveBeenCalledOnce();

    await checkWorker({ checkId: "check-1" });

    expect(mockInit).toHaveBeenCalledOnce();

    await checkWorker({ checkId: "check-2" });

    expect(mockInit).toHaveBeenCalledTimes(2);
  });

  it("should run check and return duration and snapshot", async () => {
    const { checkWorker } = await import("./check");

    const result = await checkWorker({ checkId: "check-1" });

    expect(result).toMatchObject({
      duration: expect.any(Number),
      snapshot: mockSnapshot,
    });
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it("should call runner with check config", async () => {
    const { checkWorker } = await import("./check");

    await checkWorker({ checkId: "check-1" });

    expect(mockHttpRunner.run).toHaveBeenCalledWith(
      mockConfig.checks["check-1"],
    );
  });
});
