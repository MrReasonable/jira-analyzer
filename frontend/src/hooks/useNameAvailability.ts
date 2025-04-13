import { createSignal } from 'solid-js'
import { jiraApi } from '../api/jiraApi'
import { logger } from '../utils/logger'

/**
 * Debounce utility function
 * Creates a debounced version of the provided function that delays execution
 * until after the specified wait time has elapsed since the last invocation
 *
 * Returns a Promise that resolves when the debounced function has executed
 */
function debounce<T extends (name: string) => Promise<void>>(
  func: T,
  wait: number
): (name: string) => Promise<void> {
  let timeout: number | undefined
  let resolvePromise: (() => void) | null = null
  let lastCallName: string | null = null

  return (name: string): Promise<void> => {
    // Only clear timeout if we have a new call
    if (timeout !== undefined) {
      clearTimeout(timeout)
    }

    lastCallName = name
    return new Promise<void>(resolve => {
      resolvePromise = resolve
      timeout = window.setTimeout(async () => {
        await func(lastCallName!)
        if (resolvePromise) resolvePromise()
        timeout = undefined
      }, wait)
    })
  }
}

/**
 * Hook for checking if a configuration name is available
 */
export function useNameAvailability(initialConfig?: { name: string }) {
  const [isNameAvailable, setIsNameAvailable] = createSignal<boolean | null>(null)
  const [isCheckingName, setIsCheckingName] = createSignal(false)

  /**
   * Check if a name is available
   */
  const checkNameAvailabilityImpl = async (name: string): Promise<void> => {
    if (!name) {
      setIsNameAvailable(false)
      return
    }

    setIsCheckingName(true)
    try {
      // In edit mode, if the name hasn't changed, it's available
      if (initialConfig && initialConfig.name === name) {
        setIsNameAvailable(true)
        return
      }

      // Check if the name is available by fetching existing configurations
      const configs = await jiraApi.listConfigurations()
      const nameExists = configs.some(config => config.name === name)
      setIsNameAvailable(!nameExists)
    } catch (err) {
      logger.error('Error checking name availability:', err)
      setIsNameAvailable(false)
    } finally {
      setIsCheckingName(false)
    }
  }

  // Determine the debounce delay - 0 for test environment, 500ms for production
  const debounceDelay = typeof process !== 'undefined' && process.env.NODE_ENV === 'test' ? 0 : 500

  // Debounced version of the check function with appropriate delay
  const debouncedCheck = debounce(checkNameAvailabilityImpl, debounceDelay)

  // Wrapper function that sets isCheckingName to true before calling the debounced function
  const checkNameAvailability = (name: string): Promise<void> => {
    if (!name) {
      setIsNameAvailable(false)
      setIsCheckingName(false)
      return Promise.resolve()
    }
    setIsCheckingName(true)
    return debouncedCheck(name)
  }

  return {
    isNameAvailable,
    setIsNameAvailable,
    isCheckingName,
    checkNameAvailability,
  }
}
