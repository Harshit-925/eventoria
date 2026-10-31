import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatError, logger } from "@/lib/logger";

describe("formatError", () => {
  it("formats standard Error instance", () => {
    const error = new Error("Test error message");
    const formatted = formatError(error);

    expect(formatted.name).toBe("Error");
    expect(formatted.message).toBe("Test error message");
  });

  it("handles string errors", () => {
    const formatted = formatError("Custom error string");
    expect(formatted.name).toBe("UnknownError");
    expect(formatted.message).toBe("Custom error string");
  });

  it("handles unknown object error values safely", () => {
    const formatted = formatError({ code: 500, detail: "Server issue" });
    expect(formatted.name).toBe("UnknownError");
    expect(formatted.message).toContain("Server issue");
  });
});

describe("logger", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("emits info logs when called", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    vi.stubEnv("DEBUG", "true");

    logger.info("Test info message", { eventId: "123" });
    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy.mock.calls[0][0]).toContain("[Eventoria][INFO] Test info message");
  });

  it("emits warn logs with context", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("DEBUG", "true");

    logger.warn("Test warn message", { warningType: "quota" });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain("[Eventoria][WARN] Test warn message");
  });

  it("emits error logs with standardized error formatting", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("DEBUG", "true");

    const error = new Error("Database timeout");
    logger.error("Operation failed", error, { retryCount: 2 });
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0][0]).toContain("[Eventoria][ERROR] Operation failed");
  });

  it("emits debug logs in development environment", () => {
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "development");

    logger.debug("Debug step trace", { step: 1 });
    expect(debugSpy).toHaveBeenCalledTimes(1);
    expect(debugSpy.mock.calls[0][0]).toContain("[Eventoria][DEBUG] Debug step trace");
  });
});
