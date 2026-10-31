/**
 * @file lib/logger.ts
 * Centralized, structured logging utility for server and client execution.
 * Standardizes log format, captures error metadata safely, and prevents console pollution.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  readonly level: LogLevel;
  readonly message: string;
  readonly timestamp: string;
  readonly context?: Record<string, unknown>;
  readonly error?: {
    readonly name: string;
    readonly message: string;
    readonly stack?: string;
  };
}

/**
 * Extracts a safe, serialized error summary from unknown caught exceptions.
 *
 * @param error - The caught error of unknown type
 * @returns Standardized error information object
 */
export function formatError(error: unknown): { name: string; message: string; stack?: string } {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    };
  }
  return {
    name: "UnknownError",
    message: typeof error === "string" ? error : JSON.stringify(error),
  };
}

function emit(level: LogLevel, message: string, context?: Record<string, unknown>, error?: unknown): void {
  // Silence verbose logs in test environment unless DEBUG is set
  if (process.env.NODE_ENV === "test" && !process.env.DEBUG) {
    return;
  }

  const payload: LogPayload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context && { context }),
    ...(error ? { error: formatError(error) } : {}),
  };

  const formattedMsg = `[Eventoria][${level.toUpperCase()}] ${message}`;

  switch (level) {
    case "error":
      console.error(formattedMsg, payload.error ?? "", payload.context ?? "");
      break;
    case "warn":
      console.warn(formattedMsg, payload.context ?? "");
      break;
    case "info":
      console.info(formattedMsg, payload.context ?? "");
      break;
    case "debug":
      if (process.env.NODE_ENV === "development") {
        console.debug(formattedMsg, payload.context ?? "");
      }
      break;
  }
}

/**
 * Production-ready application logger.
 */
export const logger = {
  /**
   * Logs informational messages.
   *
   * @param message - Summary message
   * @param context - Optional key-value metadata
   */
  info(message: string, context?: Record<string, unknown>): void {
    emit("info", message, context);
  },

  /**
   * Logs warnings for recoverable or fallback states.
   *
   * @param message - Warning description
   * @param context - Optional metadata or caught error
   */
  warn(message: string, context?: Record<string, unknown> | unknown): void {
    if (context instanceof Error || (typeof context === "object" && context !== null && "message" in context)) {
      emit("warn", message, undefined, context);
    } else {
      emit("warn", message, context as Record<string, unknown> | undefined);
    }
  },

  /**
   * Logs unhandled exceptions or critical failures.
   *
   * @param message - Error description
   * @param error - The caught exception
   * @param context - Optional contextual data
   */
  error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    emit("error", message, context, error);
  },

  /**
   * Logs debug diagnostics in development environments.
   *
   * @param message - Diagnostic message
   * @param context - Optional diagnostic data
   */
  debug(message: string, context?: Record<string, unknown>): void {
    emit("debug", message, context);
  },
};
