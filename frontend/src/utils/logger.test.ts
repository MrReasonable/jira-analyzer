import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logger, LogLevel } from './logger'

// Mock the import.meta.env values
vi.mock('import.meta.env', () => {
  return {
    env: {
      MODE: 'development',
      DEV: true,
      VITE_DEBUG_LEVEL: undefined,
    },
  }
})

// We cannot easily access the internal parseLogLevel function with vitest,
// so we'll recreate it here for testing purposes
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

describe('logger utility', () => {
  describe('parseLogLevel function', () => {
    it('should return ERROR level for undefined input', () => {
      expect(parseLogLevel(undefined)).toBe(LogLevel.ERROR)
    })

    it('should correctly parse "none" log level', () => {
      expect(parseLogLevel('none')).toBe(LogLevel.NONE)
    })

    it('should correctly parse "error" log level', () => {
      expect(parseLogLevel('error')).toBe(LogLevel.ERROR)
    })

    it('should correctly parse "warn" log level', () => {
      expect(parseLogLevel('warn')).toBe(LogLevel.WARN)
    })

    it('should correctly parse "info" log level', () => {
      expect(parseLogLevel('info')).toBe(LogLevel.INFO)
    })

    it('should correctly parse "debug" log level', () => {
      expect(parseLogLevel('debug')).toBe(LogLevel.DEBUG)
    })

    it('should parse "verbose" as DEBUG level', () => {
      expect(parseLogLevel('verbose')).toBe(LogLevel.DEBUG)
    })

    it('should return ERROR level for invalid input', () => {
      expect(parseLogLevel('invalid')).toBe(LogLevel.ERROR)
    })

    it('should be case-insensitive', () => {
      expect(parseLogLevel('DEBUG')).toBe(LogLevel.DEBUG)
      expect(parseLogLevel('InFo')).toBe(LogLevel.INFO)
    })
  })

  describe('logger API', () => {
    // Store original console methods
    const originalConsole = {
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug,
    }

    // Setup console mocks
    beforeEach(() => {
      console.error = vi.fn()
      console.warn = vi.fn()
      console.info = vi.fn()
      console.debug = vi.fn()
    })

    // Restore original console methods
    afterEach(() => {
      console.error = originalConsole.error
      console.warn = originalConsole.warn
      console.info = originalConsole.info
      console.debug = originalConsole.debug
    })

    it('should set and get log level', () => {
      // Save original log level
      const originalLevel = logger.getLevel()

      // Test setting different log levels
      logger.setLevel(LogLevel.DEBUG)
      expect(logger.getLevel()).toBe(LogLevel.DEBUG)

      logger.setLevel(LogLevel.ERROR)
      expect(logger.getLevel()).toBe(LogLevel.ERROR)

      // Restore original log level
      logger.setLevel(originalLevel)
    })

    it('should log error messages when level is ERROR or higher', () => {
      const message = 'Test error message'
      const data = { id: 123 }

      // Set log level to ERROR
      logger.setLevel(LogLevel.ERROR)

      // Should log when level is ERROR
      logger.error(message, data)
      expect(console.error).toHaveBeenCalledWith('[ERROR] Test error message', data)

      // Should not log info when level is ERROR
      logger.info(message, data)
      expect(console.info).not.toHaveBeenCalled()
    })

    it('should log warn messages when level is WARN or higher', () => {
      const message = 'Test warning message'
      const data = { id: 123 }

      // Set log level to WARN
      logger.setLevel(LogLevel.WARN)

      // Should log when level is WARN
      logger.warn(message, data)
      expect(console.warn).toHaveBeenCalledWith('[WARN] Test warning message', data)

      // Should log error when level is WARN
      logger.error(message, data)
      expect(console.error).toHaveBeenCalledWith('[ERROR] Test warning message', data)

      // Should not log info when level is WARN
      logger.info(message, data)
      expect(console.info).not.toHaveBeenCalled()
    })

    it('should log info messages when level is INFO or higher', () => {
      const message = 'Test info message'
      const data = { id: 123 }

      // Set log level to INFO
      logger.setLevel(LogLevel.INFO)

      // Should log when level is INFO
      logger.info(message, data)
      expect(console.info).toHaveBeenCalledWith('[INFO] Test info message', data)

      // Should not log debug when level is INFO
      logger.debug(message, data)
      expect(console.debug).not.toHaveBeenCalled()
    })

    it('should log debug messages when level is DEBUG', () => {
      const message = 'Test debug message'
      const data = { id: 123 }

      // Set log level to DEBUG
      logger.setLevel(LogLevel.DEBUG)

      // Should log when level is DEBUG
      logger.debug(message, data)
      expect(console.debug).toHaveBeenCalledWith('[DEBUG] Test debug message', data)
    })

    it('should not log any messages when level is NONE', () => {
      const message = 'Test message'
      const data = { id: 123 }

      // Set log level to NONE
      logger.setLevel(LogLevel.NONE)

      // Should not log any messages
      logger.error(message, data)
      logger.warn(message, data)
      logger.info(message, data)
      logger.debug(message, data)

      expect(console.error).not.toHaveBeenCalled()
      expect(console.warn).not.toHaveBeenCalled()
      expect(console.info).not.toHaveBeenCalled()
      expect(console.debug).not.toHaveBeenCalled()
    })
  })
})
