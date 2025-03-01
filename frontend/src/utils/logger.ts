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

// Default log level based on environment
const DEFAULT_LOG_LEVEL =
  import.meta.env.MODE === 'test'
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
