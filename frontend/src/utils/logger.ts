/**
 * Simple logger utility with support for different log levels
 */

// Define log levels
export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
}

// Helper to parse string log level
const parseLogLevel = (level: string | undefined): LogLevel => {
  if (!level) return LogLevel.ERROR

  switch (level.toLowerCase()) {
    case 'none':
      return LogLevel.NONE
    case 'error':
      return LogLevel.ERROR
    case 'warn':
      return LogLevel.WARN
    case 'info':
      return LogLevel.INFO
    case 'debug':
      return LogLevel.DEBUG
    case 'verbose':
      return LogLevel.DEBUG // Alias for DEBUG
    default:
      return LogLevel.ERROR
  }
}

// Default log level based on environment
const DEFAULT_LOG_LEVEL =
  // First check for explicit debug level in env vars
  import.meta.env.VITE_DEBUG_LEVEL
    ? parseLogLevel(import.meta.env.VITE_DEBUG_LEVEL as string)
    : import.meta.env.MODE === 'test'
      ? LogLevel.NONE
      : import.meta.env.DEV
        ? LogLevel.DEBUG
        : LogLevel.ERROR

// Current log level
let currentLogLevel = DEFAULT_LOG_LEVEL

// Logger functions
export const logger = {
  /**
   * Set the current log level
   */
  setLevel(level: LogLevel) {
    currentLogLevel = level
  },

  /**
   * Get the current log level
   */
  getLevel(): LogLevel {
    return currentLogLevel
  },

  /**
   * Log an error message
   */
  error(message: string, ...args: unknown[]) {
    if (currentLogLevel >= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, ...args)
    }
  },

  /**
   * Log a warning message
   */
  warn(message: string, ...args: unknown[]) {
    if (currentLogLevel >= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args)
    }
  },

  /**
   * Log an info message
   */
  info(message: string, ...args: unknown[]) {
    if (currentLogLevel >= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...args)
    }
  },

  /**
   * Log a debug message
   */
  debug(message: string, ...args: unknown[]) {
    if (currentLogLevel >= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args)
    }
  },
}
