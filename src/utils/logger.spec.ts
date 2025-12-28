import type { MockInstance } from "vitest";

// logger.test.ts
import { logger } from "./logger";

describe("logger", () => {
  let consoleLogSpy: MockInstance;
  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {
      /* empty */
    });
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {
      /* empty */
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("log", () => {
    it("should log a simple string", () => {
      logger.log("hello world");

      expect(consoleLogSpy).toHaveBeenCalledWith("hello world");
    });

    it("should log multiple strings", () => {
      logger.log("hello", "world");

      expect(consoleLogSpy).toHaveBeenCalledWith("hello world");
    });

    it("should format objects as JSON", () => {
      logger.log({ foo: "bar" });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("foo"),
      );
    });

    it("should handle arrays", () => {
      logger.log([1, 2, 3]);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("["));
    });

    it("should format Error without stack", () => {
      const error = new Error("test error");

      delete error.stack;
      logger.log(error);
      const call = consoleLogSpy.mock.calls[0]?.[0] as string;

      expect(call).toContain("test error");
    });
  });

  describe("error", () => {
    it("should log error message in red", () => {
      logger.error("error message");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("error message"),
      );
    });

    it("should format Error objects with stack", () => {
      const error = new Error("test error");

      logger.error(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("test error"),
      );
    });

    it("should handle multiple arguments", () => {
      logger.error("prefix", { code: 500 });
      const call = consoleErrorSpy.mock.calls[0]?.[0] as string;

      expect(call).toContain("prefix");
      expect(call).toContain("code");
    });
  });
});
