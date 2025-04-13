/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@solidjs/testing-library'
import { useNameAvailability } from './useNameAvailability'
import { jiraApi } from '@api/jiraApi'
import { logger } from '@utils/logger'

// Mock the jiraApi and logger
vi.mock('@api/jiraApi', () => ({
  jiraApi: {
    listConfigurations: vi.fn(),
  },
}))

vi.mock('@utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('useNameAvailability', () => {
  // Setup mock data
  const mockConfigs = [
    {
      name: 'Existing Config',
      jira_server: 'https://test.atlassian.net',
      jira_email: 'test@example.com',
    },
    {
      name: 'Another Config',
      jira_server: 'https://another.atlassian.net',
      jira_email: 'another@example.com',
    },
  ]

  // Setup for testing debounce behavior
  let timeoutCallback: Function | null = null
  let timeoutDelay: number | undefined
  let setTimeoutSpy: any
  let clearTimeoutSpy: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Spy on setTimeout and clearTimeout
    setTimeoutSpy = vi
      .spyOn(window, 'setTimeout')
      .mockImplementation((callback: any, delay?: number) => {
        timeoutCallback = callback as Function
        timeoutDelay = delay
        return 123 as any // Mock timeout ID
      })

    // Spy on clearTimeout
    clearTimeoutSpy = vi.spyOn(window, 'clearTimeout').mockImplementation(() => {})

    // Setup default mock implementation for listConfigurations
    vi.mocked(jiraApi.listConfigurations).mockResolvedValue(mockConfigs)
  })

  afterEach(() => {
    // Restore original setTimeout and clearTimeout
    setTimeoutSpy.mockRestore()
    clearTimeoutSpy.mockRestore()
  })

  it('initializes with default values', () => {
    // Render the hook
    const { result } = renderHook(() => useNameAvailability())

    // Verify initial state
    expect(result.isNameAvailable()).toBeNull()
    expect(result.isCheckingName()).toBe(false)
  })

  it('initializes with initial config in edit mode', () => {
    // Render the hook with initial config
    const initialConfig = { name: 'Test Config' }
    const { result } = renderHook(() => useNameAvailability(initialConfig))

    // Verify initial state in edit mode
    expect(result.isNameAvailable()).toBeNull()
    expect(result.isCheckingName()).toBe(false)
  })

  it('checks if a name is available', async () => {
    // Render the hook
    const { result } = renderHook(() => useNameAvailability())

    // Call the check function
    const checkPromise = result.checkNameAvailability('New Config')

    // Verify checking state is set
    expect(result.isCheckingName()).toBe(true)

    // Verify setTimeout was called with the correct delay
    // In test environment, debounce delay should be 0
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 0)

    // Simulate the timeout callback being called
    if (timeoutCallback) {
      await timeoutCallback()
    }

    // Wait for the promise to resolve
    await checkPromise

    // Verify API was called
    expect(jiraApi.listConfigurations).toHaveBeenCalled()

    // Verify state after check
    expect(result.isNameAvailable()).toBe(true)
    expect(result.isCheckingName()).toBe(false)
  })

  it('returns false for existing name', async () => {
    // Render the hook
    const { result } = renderHook(() => useNameAvailability())

    // Call the check function with an existing name
    const checkPromise = result.checkNameAvailability('Existing Config')

    // Simulate the timeout callback being called
    if (timeoutCallback) {
      await timeoutCallback()
    }

    // Wait for the promise to resolve
    await checkPromise

    // Verify API was called
    expect(jiraApi.listConfigurations).toHaveBeenCalled()

    // Verify state after check - name should not be available
    expect(result.isNameAvailable()).toBe(false)
    expect(result.isCheckingName()).toBe(false)
  })

  it('returns true for same name in edit mode', async () => {
    // Render the hook with initial config
    const initialConfig = { name: 'Existing Config' }
    const { result } = renderHook(() => useNameAvailability(initialConfig))

    // Call the check function with the same name as initial config
    const checkPromise = result.checkNameAvailability('Existing Config')

    // Simulate the timeout callback being called
    if (timeoutCallback) {
      await timeoutCallback()
    }

    // Wait for the promise to resolve
    await checkPromise

    // Verify state after check - name should be available (same as initial config)
    expect(result.isNameAvailable()).toBe(true)
    expect(result.isCheckingName()).toBe(false)
  })

  it('returns false for empty name', async () => {
    // Render the hook
    const { result } = renderHook(() => useNameAvailability())

    // Call the check function with empty name
    const checkPromise = result.checkNameAvailability('')

    // Simulate the timeout callback being called
    if (timeoutCallback) {
      await timeoutCallback()
    }

    // Wait for the promise to resolve
    await checkPromise

    // Verify API was not called for empty name
    expect(jiraApi.listConfigurations).not.toHaveBeenCalled()

    // Verify state after check - empty name should not be available
    expect(result.isNameAvailable()).toBe(false)
    expect(result.isCheckingName()).toBe(false)
  })

  it('handles API errors gracefully', async () => {
    // Mock API to throw an error
    const error = new Error('API error')
    vi.mocked(jiraApi.listConfigurations).mockRejectedValueOnce(error)

    // Render the hook
    const { result } = renderHook(() => useNameAvailability())

    // Call the check function
    const checkPromise = result.checkNameAvailability('New Config')

    // Simulate the timeout callback being called
    if (timeoutCallback) {
      await timeoutCallback()
    }

    // Wait for the promise to resolve
    await checkPromise

    // Verify error was logged
    expect(logger.error).toHaveBeenCalledWith('Error checking name availability:', error)

    // Verify state after error - name should not be available
    expect(result.isNameAvailable()).toBe(false)
    expect(result.isCheckingName()).toBe(false)
  })

  it('debounces multiple calls', async () => {
    // Render the hook
    const { result } = renderHook(() => useNameAvailability())

    // Call the check function multiple times in quick succession
    result.checkNameAvailability('Config 1')
    result.checkNameAvailability('Config 2')
    const finalCheckPromise = result.checkNameAvailability('Config 3')

    // Verify clearTimeout was called to cancel previous timeouts
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(2)

    // Simulate the timeout callback being called for the final check
    if (timeoutCallback) {
      await timeoutCallback()
    }

    // Wait for the promise to resolve
    await finalCheckPromise

    // Verify API was called only once with the final name
    expect(jiraApi.listConfigurations).toHaveBeenCalledTimes(1)

    // Verify state after check - should reflect the final check
    expect(result.isNameAvailable()).toBe(true)
    expect(result.isCheckingName()).toBe(false)
  })

  it('allows manually setting name availability state', () => {
    // Render the hook
    const { result } = renderHook(() => useNameAvailability())

    // Manually set name availability
    result.setIsNameAvailable(true)
    expect(result.isNameAvailable()).toBe(true)

    result.setIsNameAvailable(false)
    expect(result.isNameAvailable()).toBe(false)

    result.setIsNameAvailable(null)
    expect(result.isNameAvailable()).toBeNull()
  })

  it('uses correct debounce delay based on environment', () => {
    // Save original process.env
    const originalEnv = process.env

    // Test with NODE_ENV = 'test'
    process.env.NODE_ENV = 'test'
    renderHook(() => useNameAvailability())

    // Call the check function
    const testHook = renderHook(() => useNameAvailability())
    testHook.result.checkNameAvailability('Test Config')

    // Verify debounce delay is 0 in test environment
    expect(timeoutDelay).toBe(0)

    // Test with NODE_ENV = 'production'
    process.env.NODE_ENV = 'production'
    const prodHook = renderHook(() => useNameAvailability())
    prodHook.result.checkNameAvailability('Test Config')

    // Verify debounce delay is 500 in production environment
    expect(timeoutDelay).toBe(500)

    // Restore original process.env
    process.env = originalEnv
  })
})
