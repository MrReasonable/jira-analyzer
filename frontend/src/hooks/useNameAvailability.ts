import { createSignal } from 'solid-js'
import { jiraApi } from '../api/jiraApi'
import { logger } from '../utils/logger'

/**
 * Hook for checking if a configuration name is available
 */
export function useNameAvailability(initialConfig?: { name: string }) {
  const [isNameAvailable, setIsNameAvailable] = createSignal<boolean | null>(null)
  const [isCheckingName, setIsCheckingName] = createSignal(false)

  /**
   * Check if a name is available
   */
  const checkNameAvailability = async (name: string): Promise<void> => {
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

  return {
    isNameAvailable,
    setIsNameAvailable,
    isCheckingName,
    checkNameAvailability,
  }
}
