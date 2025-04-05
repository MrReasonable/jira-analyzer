import { createSignal } from 'solid-js'
import { jiraApi, JiraProject, JiraCredentials } from '../api/jiraApi'
import { FormData, StepError } from '../types/configurationForm'

export interface UseCredentialsValidationProps {
  formData: () => FormData
  setError: (error: string | null) => void
  setStepErrors: (updater: (prev: StepError) => StepError) => void
}

/**
 * Hook for validating Jira credentials
 */
export function useCredentialsValidation({
  formData,
  setError,
  setStepErrors,
}: UseCredentialsValidationProps) {
  const [checkingCredentials, setCheckingCredentials] = createSignal(false)
  const [credentialsValid, setCredentialsValid] = createSignal(false)
  const [projects, setProjects] = createSignal<Array<JiraProject>>([])

  /**
   * Create credentials object from form data
   */
  const getCredentials = (): JiraCredentials => ({
    name: formData().name || 'Temporary Config',
    jira_server: formData().jira_server,
    jira_email: formData().jira_email,
    jira_api_token: formData().jira_api_token,
  })

  /**
   * Validate credentials
   */
  const validateCredentials = async (onSuccess?: () => void): Promise<void> => {
    setCheckingCredentials(true)
    setError(null)

    try {
      const credentials = getCredentials()

      // First validate credentials
      const result = await jiraApi.validateCredentials(credentials)

      if (result.status === 'success') {
        // Then fetch projects with the same credentials
        const projects = await jiraApi.getProjectsWithCredentials(credentials)
        setProjects(projects)
        setCredentialsValid(true)
        if (onSuccess) onSuccess()
      } else {
        setStepErrors(prev => ({ ...prev, credentials: 'Invalid credentials' }))
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate credentials'
      setStepErrors(prev => ({ ...prev, credentials: errorMessage }))
      setError(errorMessage)
      throw err
    } finally {
      setCheckingCredentials(false)
    }
  }

  /**
   * Check credentials and fetch projects
   */
  const checkCredentials = async (
    onSuccess?: (projects: Array<JiraProject>) => void
  ): Promise<void> => {
    setCheckingCredentials(true)
    setError(null)

    try {
      const credentials = getCredentials()
      const result = await jiraApi.getProjectsWithCredentials(credentials)
      setProjects(result)

      if (onSuccess) onSuccess(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch projects'
      setError(errorMessage)
    } finally {
      setCheckingCredentials(false)
    }
  }

  return {
    checkingCredentials,
    credentialsValid,
    setCredentialsValid,
    projects,
    setProjects,
    validateCredentials,
    checkCredentials,
  }
}
