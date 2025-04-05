import { createSignal } from 'solid-js'
import { jiraApi } from '@api/jiraApi'
import { logger } from '@utils/logger'
import { FormData } from '~types/configurationForm'
import type { JiraConfiguration } from '@api/jiraApi'

/**
 * Hook for managing Jira credentials
 */
export function useCredentialsManager(
  formData: () => FormData,
  setError: (error: string | null) => void,
  setStepErrors: (
    updater: (prev: Record<string, string | null>) => Record<string, string | null>
  ) => void,
  initialConfig?: JiraConfiguration
) {
  const [isNameAvailable, setIsNameAvailable] = createSignal<boolean | null>(null)
  const [isCheckingName, setIsCheckingName] = createSignal(false)
  const [checkingCredentials, setCheckingCredentials] = createSignal(false)
  const [credentialsValid, setCredentialsValid] = createSignal(false)

  // Check if a configuration name is already in use
  const checkNameAvailability = async (name: string): Promise<void> => {
    if (!name || initialConfig) return

    setIsCheckingName(true)
    try {
      logger.debug('Checking if configuration name is available:', name)
      const configs = await jiraApi.listConfigurations()
      const nameExists = configs.some(config => config.name.toLowerCase() === name.toLowerCase())
      setIsNameAvailable(!nameExists)
      logger.debug(`Configuration name "${name}" is ${nameExists ? 'already taken' : 'available'}`)
    } catch (err) {
      logger.error('Failed to check configuration name availability:', err)
      // Don't set an error state here, just leave isNameAvailable as null
    } finally {
      setIsCheckingName(false)
    }
  }

  // Check credentials and fetch projects
  const checkCredentials = async (
    onSuccess: (result: Array<{ key: string; name: string }>) => void
  ): Promise<void> => {
    // Show loading state
    setCheckingCredentials(true)
    setError(null)
    setStepErrors(prev => ({ ...prev, credentials: null }))

    // Prepare the credentials
    const credentials = {
      name: formData().name,
      jira_server: formData().jira_server,
      jira_email: formData().jira_email,
      jira_api_token: formData().jira_api_token,
    }

    // Log what we're about to do
    logger.info('Checking credentials and fetching projects in one step')

    try {
      // Directly call the API
      const result = await jiraApi.getProjectsWithCredentials(credentials)

      // Mark credentials as valid
      setCredentialsValid(true)

      // Process the projects
      logger.info(`Received ${result.length} projects directly after validation`)

      // Call the success callback with the projects
      onSuccess(result)
    } catch (err) {
      // Handle errors
      let errorMessage = 'Failed to validate credentials'

      // Check for common error types
      if (err && typeof err === 'object' && 'response' in err && err.response) {
        const response = err.response as { status?: number }
        if (response.status === 401) {
          errorMessage = 'Invalid credentials. Please check your email and API token.'
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to access this Jira instance.'
        } else if (response.status === 404) {
          errorMessage = 'Jira server not found. Please check the server URL.'
        }
      }

      // Set error states
      setError(errorMessage)
      setStepErrors(prev => ({ ...prev, credentials: errorMessage }))
      setCredentialsValid(false)
      logger.error('Failed to validate credentials', err)
    } finally {
      setCheckingCredentials(false)
    }
  }

  // Validate credentials only (without fetching projects)
  const validateCredentials = async (onSuccess: () => void): Promise<void> => {
    // Show loading state
    setCheckingCredentials(true)
    setError(null)
    setStepErrors(prev => ({ ...prev, credentials: null }))

    try {
      // Directly call the API
      const response = await jiraApi.validateCredentials({
        name: formData().name,
        jira_server: formData().jira_server,
        jira_email: formData().jira_email,
        jira_api_token: formData().jira_api_token,
      })

      // Check if the response indicates valid credentials
      if (response && response.status === 'success') {
        // Mark credentials as valid
        setCredentialsValid(true)
        onSuccess()
      } else {
        // If the response doesn't indicate valid credentials, set error and throw
        const errorMessage = response?.message || 'Invalid credentials'
        setStepErrors(prev => ({ ...prev, credentials: errorMessage }))
        throw new Error(errorMessage)
      }
    } catch (err) {
      // Handle errors
      let errorMessage = 'Failed to validate credentials'

      // Check for common error types
      if (err && typeof err === 'object' && 'response' in err && err.response) {
        const response = err.response as { status?: number }
        if (response.status === 401) {
          errorMessage = 'Invalid credentials. Please check your email and API token.'
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to access this Jira instance.'
        } else if (response.status === 404) {
          errorMessage = 'Jira server not found. Please check the server URL.'
        }
      }

      // Set error states
      setError(errorMessage)
      setStepErrors(prev => ({ ...prev, credentials: errorMessage }))
      setCredentialsValid(false)
      logger.error('Failed to validate credentials', err)

      // Re-throw the error to be caught by the caller
      throw err
    } finally {
      setCheckingCredentials(false)
    }
  }

  return {
    isNameAvailable,
    setIsNameAvailable,
    isCheckingName,
    checkingCredentials,
    credentialsValid,
    setCredentialsValid,
    checkNameAvailability,
    checkCredentials,
    validateCredentials,
  }
}
