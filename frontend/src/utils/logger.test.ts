import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logger, LogLevel } from './logger'

describe('logger', () => {
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
