import { createSignal } from 'solid-js'
import { jiraApi, JiraProject, JiraCredentials } from '../api/jiraApi'
import { FormData, StepError } from '../types/configurationForm'
import { logger } from '../utils/logger'

export interface UseProjectsManagementProps {
  formData: () => FormData
  setError: (error: string | null) => void
  setStepErrors: (updater: (prev: StepError) => StepError) => void
  updateField: (field: string, value: string) => void
  initialConfig?: { project_key?: string }
}

/**
 * Hook for managing Jira projects
 */
export function useProjectsManagement({
  formData,
  setError,
  setStepErrors,
  updateField,
  initialConfig,
}: UseProjectsManagementProps) {
  const [projects, setProjects] = createSignal<Array<JiraProject>>([])
  const [isLoading, setIsLoading] = createSignal(false)
  const [projectsFetched, setProjectsFetched] = createSignal(false)

  // Prevent circular references by creating a safe copy of form data
  const getCredentialsData = () => {
    const data = formData()
    return {
      name: data.name || 'Temporary Config',
      jira_server: data.jira_server || '',
      jira_email: data.jira_email || '',
      jira_api_token: data.jira_api_token || '',
    }
  }

  /**
   * Fetch projects
   */
  const fetchProjects = async (): Promise<void> => {
    // Guard against concurrent fetches
    if (isLoading()) {
      logger.debug('Projects already being fetched, skipping fetch')
      return
    }

    // Skip if projects are already loaded
    if (projectsFetched() && projects().length > 0) {
      logger.debug('Projects already fetched, skipping fetch')
      return
    }

    // Set loading state
    setIsLoading(true)

    try {
      // Get credentials data safely
      const credentialsData = getCredentialsData()

      // Create credentials object
      const credentials: JiraCredentials = {
        name: credentialsData.name,
        jira_server: credentialsData.jira_server,
        jira_email: credentialsData.jira_email,
        jira_api_token: credentialsData.jira_api_token,
      }

      // Fetch projects
      const result = await jiraApi.getProjectsWithCredentials(credentials)

      // Update state
      setProjects(result)
      logger.debug(`Received ${result.length} projects`)
      setProjectsFetched(true)

      // Handle project key selection
      if (initialConfig?.project_key) {
        updateField('project_key', initialConfig.project_key)
      } else if (result.length > 0) {
        // Get current form data safely
        const currentData = formData()
        if (!currentData.project_key) {
          updateField('project_key', result[0].key)
          updateField('jql_query', `project = ${result[0].key} AND type = Story`)
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch projects'
      setError(errorMessage)
      setStepErrors(prev => ({ ...prev, project: errorMessage }))
    } finally {
      setIsLoading(false)
    }
  }

  return {
    projects,
    setProjects,
    isLoading,
    projectsFetched,
    setProjectsFetched,
    fetchProjects,
  }
}
