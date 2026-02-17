const { CheckRegistry } = await import("./check-registry");

describe("CheckRegistry", () => {
  describe("register", () => {
    it("should register a check runner", () => {
      const mockRunner = {
        run: vi.fn(),
        type: "eslint",
      };
      const registry = new CheckRegistry();

      registry.register(mockRunner);

      expect(registry.has("eslint")).toBe(true);
      expect(registry.get("eslint")).toBe(mockRunner);
    });

    it("should silently skip when registering duplicate type", () => {
      const mockRunner1 = {
        run: vi.fn(),
        type: "eslint",
      };
      const mockRunner2 = {
        run: vi.fn(),
        type: "eslint",
      };
      const registry = new CheckRegistry();

      registry.register(mockRunner1);
      registry.register(mockRunner2);

      expect(registry.get("eslint")).toBe(mockRunner1);
    });

    it("should allow registering multiple different types", () => {
      const eslintRunner = {
        run: vi.fn(),
        type: "eslint",
      };
      const typescriptRunner = {
        run: vi.fn(),
        type: "typescript",
      };
      const registry = new CheckRegistry();

      registry.register(eslintRunner);
      registry.register(typescriptRunner);

      expect(registry.has("eslint")).toBe(true);
      expect(registry.has("typescript")).toBe(true);
    });
  });

  describe("get", () => {
    it("should retrieve registered runner", () => {
      const mockRunner = {
        run: vi.fn(),
        type: "eslint",
      };
      const registry = new CheckRegistry();

      registry.register(mockRunner);
      const retrieved = registry.get("eslint");

      expect(retrieved).toBe(mockRunner);
    });

    it("should throw error for unregistered type", () => {
      const registry = new CheckRegistry();

      expect(() => registry.get("nonexistent")).toThrowError(
        "Unknown check type: nonexistent",
      );
    });
  });

  describe("has", () => {
    it("should return true for registered type", () => {
      const mockRunner = {
        run: vi.fn(),
        type: "eslint",
      };
      const registry = new CheckRegistry();

      registry.register(mockRunner);

      expect(registry.has("eslint")).toBe(true);
    });

    it("should return false for unregistered type", () => {
      const registry = new CheckRegistry();

      expect(registry.has("eslint")).toBe(false);
    });
  });

  describe("getTypes", () => {
    it("should return empty set when no runners registered", () => {
      const registry = new CheckRegistry();
      const types = registry.getTypes();

      expect(types.size).toBe(0);
    });

    it("should return set of all registered types", () => {
      const eslintRunner = {
        run: vi.fn(),
        type: "eslint",
      };
      const typescriptRunner = {
        run: vi.fn(),
        type: "typescript",
      };
      const registry = new CheckRegistry();

      registry.register(eslintRunner);
      registry.register(typescriptRunner);
      const types = registry.getTypes();

      expect(types.size).toBe(2);
      expect(types.has("eslint")).toBe(true);
      expect(types.has("typescript")).toBe(true);
    });
  });

  describe("setup", () => {
    it("should call setup on all required runners", async () => {
      const eslintSetup = vi.fn().mockResolvedValue(undefined);
      const typescriptSetup = vi.fn().mockResolvedValue(undefined);
      const eslintRunner = {
        run: vi.fn(),
        setup: eslintSetup,
        type: "eslint",
      };
      const typescriptRunner = {
        run: vi.fn(),
        setup: typescriptSetup,
        type: "typescript",
      };
      const registry = new CheckRegistry();

      registry.register(eslintRunner);
      registry.register(typescriptRunner);
      await registry.setup(new Set(["eslint", "typescript"]));

      expect(eslintSetup).toHaveBeenCalledOnce();
      expect(typescriptSetup).toHaveBeenCalledOnce();
    });

    it("should skip setup for runners without setup method", async () => {
      const eslintRunner = {
        run: vi.fn(),
        type: "eslint",
      };
      const registry = new CheckRegistry();

      registry.register(eslintRunner);

      await expect(
        registry.setup(new Set(["eslint"])),
      ).resolves.toBeUndefined();
    });

    it("should only call setup for requested types", async () => {
      const eslintSetup = vi.fn().mockResolvedValue(undefined);
      const typescriptSetup = vi.fn().mockResolvedValue(undefined);
      const eslintRunner = {
        run: vi.fn(),
        setup: eslintSetup,
        type: "eslint",
      };
      const typescriptRunner = {
        run: vi.fn(),
        setup: typescriptSetup,
        type: "typescript",
      };
      const registry = new CheckRegistry();

      registry.register(eslintRunner);
      registry.register(typescriptRunner);
      await registry.setup(new Set(["eslint"]));

      expect(eslintSetup).toHaveBeenCalledOnce();
      expect(typescriptSetup).not.toHaveBeenCalled();
    });

    it("should run setup in parallel", async () => {
      const setupOrder: string[] = [];
      const eslintSetup = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 10);
        });
        setupOrder.push("eslint");
      });
      const typescriptSetup = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 10);
        });
        setupOrder.push("typescript");
      });
      const eslintRunner = {
        run: vi.fn(),
        setup: eslintSetup,
        type: "eslint",
      };
      const typescriptRunner = {
        run: vi.fn(),
        setup: typescriptSetup,
        type: "typescript",
      };
      const registry = new CheckRegistry();

      registry.register(eslintRunner);
      registry.register(typescriptRunner);
      await registry.setup(new Set(["eslint", "typescript"]));

      expect(eslintSetup).toHaveBeenCalledOnce();
      expect(typescriptSetup).toHaveBeenCalledOnce();
      expect(setupOrder).toHaveLength(2);
    });

    it("should propagate setup errors", async () => {
      const eslintSetup = vi.fn().mockRejectedValue(new Error("Setup failed"));
      const eslintRunner = {
        run: vi.fn(),
        setup: eslintSetup,
        type: "eslint",
      };
      const registry = new CheckRegistry();

      registry.register(eslintRunner);

      await expect(registry.setup(new Set(["eslint"]))).rejects.toThrowError(
        "Setup failed",
      );
    });

    it("should throw error for unregistered type", async () => {
      const registry = new CheckRegistry();

      await expect(
        registry.setup(new Set(["nonexistent"])),
      ).rejects.toThrowError("Unknown check type: nonexistent");
    });

    it("should maintain runner context when calling setup", async () => {
      const setupSpy = vi.fn();

      class TestRunner {
        readonly type = "test-runner";
        private readonly instanceData = "runner-instance";

        // eslint-disable-next-line class-methods-use-this, @typescript-eslint/require-await -- testing
        async run() {
          return { items: [], type: "items" as const };
        }

        // eslint-disable-next-line @typescript-eslint/require-await -- testing
        async setup() {
          setupSpy(this.type, this.instanceData);
        }
      }

      const mockRunner = new TestRunner();
      const registry = new CheckRegistry();

      registry.register(mockRunner);

      await registry.setup(new Set(["test-runner"]));

      expect(setupSpy).toHaveBeenCalledWith("test-runner", "runner-instance");
    });

    it("should allow setup to access instance properties from class", async () => {
      class TestRunner {
        readonly type = "test-runner";
        private instanceData = "sensitive-data";

        // eslint-disable-next-line class-methods-use-this, @typescript-eslint/require-await -- testing
        async run() {
          return { items: [], type: "items" as const };
        }

        // eslint-disable-next-line @typescript-eslint/require-await -- testing
        async setup() {
          // This will fail if `this` is not properly bound
          expect(this.type).toBe("test-runner");
          expect(this.instanceData).toBe("sensitive-data");
        }
      }

      const mockRunner = new TestRunner();
      const registry = new CheckRegistry();

      registry.register(mockRunner);

      await registry.setup(new Set(["test-runner"]));
    });
  });

  describe("validate", () => {
    it("should call validate on all required runners", async () => {
      const eslintValidate = vi.fn().mockResolvedValue(undefined);
      const typescriptValidate = vi.fn().mockResolvedValue(undefined);
      const eslintRunner = {
        run: vi.fn(),
        type: "eslint",
        validate: eslintValidate,
      };
      const typescriptRunner = {
        run: vi.fn(),
        type: "typescript",
        validate: typescriptValidate,
      };
      const registry = new CheckRegistry();

      registry.register(eslintRunner);
      registry.register(typescriptRunner);
      await registry.validate(new Set(["eslint", "typescript"]));

      expect(eslintValidate).toHaveBeenCalledOnce();
      expect(typescriptValidate).toHaveBeenCalledOnce();
    });

    it("should skip validation for runners without validate method", async () => {
      const eslintRunner = {
        run: vi.fn(),
        type: "eslint",
      };
      const registry = new CheckRegistry();

      registry.register(eslintRunner);

      await expect(
        registry.validate(new Set(["eslint"])),
      ).resolves.toBeUndefined();
    });

    it("should only validate requested types", async () => {
      const eslintValidate = vi.fn().mockResolvedValue(undefined);
      const typescriptValidate = vi.fn().mockResolvedValue(undefined);
      const eslintRunner = {
        run: vi.fn(),
        type: "eslint",
        validate: eslintValidate,
      };
      const typescriptRunner = {
        run: vi.fn(),
        type: "typescript",
        validate: typescriptValidate,
      };
      const registry = new CheckRegistry();

      registry.register(eslintRunner);
      registry.register(typescriptRunner);
      await registry.validate(new Set(["eslint"]));

      expect(eslintValidate).toHaveBeenCalledOnce();
      expect(typescriptValidate).not.toHaveBeenCalled();
    });

    it("should run validations in parallel", async () => {
      const validateOrder: string[] = [];
      const eslintValidate = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 10);
        });
        validateOrder.push("eslint");
      });
      const typescriptValidate = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 10);
        });
        validateOrder.push("typescript");
      });
      const eslintRunner = {
        run: vi.fn(),
        type: "eslint",
        validate: eslintValidate,
      };
      const typescriptRunner = {
        run: vi.fn(),
        type: "typescript",
        validate: typescriptValidate,
      };
      const registry = new CheckRegistry();

      registry.register(eslintRunner);
      registry.register(typescriptRunner);
      await registry.validate(new Set(["eslint", "typescript"]));

      expect(eslintValidate).toHaveBeenCalledOnce();
      expect(typescriptValidate).toHaveBeenCalledOnce();
      expect(validateOrder).toHaveLength(2);
    });

    it("should propagate validation errors", async () => {
      const eslintValidate = vi
        .fn()
        .mockRejectedValue(new Error("ESLint not installed"));
      const eslintRunner = {
        run: vi.fn(),
        type: "eslint",
        validate: eslintValidate,
      };
      const registry = new CheckRegistry();

      registry.register(eslintRunner);

      await expect(registry.validate(new Set(["eslint"]))).rejects.toThrowError(
        "ESLint not installed",
      );
    });

    it("should throw error for unregistered type", async () => {
      const registry = new CheckRegistry();

      await expect(
        registry.validate(new Set(["nonexistent"])),
      ).rejects.toThrowError("Unknown check type: nonexistent");
    });

    it("should maintain runner context when calling validate", async () => {
      const validateSpy = vi.fn();

      class TestRunner {
        readonly type = "test-runner";
        private readonly instanceData = "runner-instance";

        // eslint-disable-next-line class-methods-use-this, @typescript-eslint/require-await -- testing
        async run() {
          return { items: [], type: "items" as const };
        }

        // eslint-disable-next-line @typescript-eslint/require-await -- testing
        async validate() {
          validateSpy(this.type, this.instanceData);
        }
      }

      const mockRunner = new TestRunner();
      const registry = new CheckRegistry();

      registry.register(mockRunner);

      await registry.validate(new Set(["test-runner"]));

      expect(validateSpy).toHaveBeenCalledWith(
        "test-runner",
        "runner-instance",
      );
    });
  });

  describe("getRequiredTypes", () => {
    it("should extract unique types from check configs", () => {
      const checks = [
        { config: { type: "eslint" }, id: "check1" },
        { config: { type: "typescript" }, id: "check2" },
        { config: { type: "eslint" }, id: "check3" },
      ];
      const types = CheckRegistry.getRequiredTypes(checks);

      expect(types.size).toBe(2);
      expect(types.has("eslint")).toBe(true);
      expect(types.has("typescript")).toBe(true);
    });

    it("should return empty set for empty config", () => {
      const types = CheckRegistry.getRequiredTypes([]);

      expect(types.size).toBe(0);
    });

    it("should handle single check", () => {
      const checks = [{ config: { type: "eslint" }, id: "check1" }];
      const types = CheckRegistry.getRequiredTypes(checks);

      expect(types.size).toBe(1);
      expect(types.has("eslint")).toBe(true);
    });
  });
});
