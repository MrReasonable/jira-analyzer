import { createSignal } from 'solid-js'
import { jiraApi } from '@api/jiraApi'
import { logger } from '@utils/logger'

export type JiraCredentials = {
  name: string
  jira_server: string
  jira_email: string
  jira_api_token: string
}

export type JiraProject = {
  key: string
  name: string
}

export type ProjectsManagerProps = {
  credentials: () => JiraCredentials
  onProjectsFetched?: (projects: JiraProject[]) => void
  onError?: (error: string) => void
  onProjectSelected?: (projectKey: string) => void
  initialProjectKey?: string
}

/**
 * Hook for managing Jira projects
 * This hook is responsible for fetching and managing projects from Jira
 */
export function useProjectsManager({
  credentials,
  onProjectsFetched,
  onError,
  onProjectSelected,
  initialProjectKey,
}: ProjectsManagerProps) {
  // Internal state
  const [projects, setProjects] = createSignal<JiraProject[]>([])
  const [isLoading, setIsLoading] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)
  const [selectedProjectKey, setSelectedProjectKey] = createSignal<string | null>(
    initialProjectKey ?? null
  )

  // Function to fetch projects
  const fetchProjects = async (): Promise<JiraProject[]> => {
    logger.debug('useProjectsManager.fetchProjects called')

    // Create a unique ID for this fetch call to track it in logs
    const fetchId = Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
    logger.debug(`[${fetchId}] Starting fetch projects operation`)

    setIsLoading(true)
    setError(null)

    // Log what we're about to do
    logger.debug(`[${fetchId}] Fetching projects with credentials:`, {
      name: credentials().name,
      server: credentials().jira_server,
      // Don't log sensitive data like email and API token
    })

    try {
      logger.debug(`[${fetchId}] About to call jiraApi.getProjectsWithCredentials`)

      // Directly call the API
      const result = await jiraApi.getProjectsWithCredentials(credentials())

      // Log the response for debugging
      logger.debug(`[${fetchId}] Received ${result.length} projects from API`)

      // Update internal state
      logger.debug(`[${fetchId}] Updating projects state with ${result.length} projects`)
      setProjects(result)

      // If we have projects and no project is selected, select the first one
      if (result.length > 0 && !selectedProjectKey()) {
        logger.debug(`[${fetchId}] No project selected, selecting first project: ${result[0].key}`)
        selectProject(result[0].key)
      }

      // Notify parent component
      if (onProjectsFetched) {
        logger.debug(`[${fetchId}] Calling onProjectsFetched callback`)
        onProjectsFetched(result)
      }

      logger.debug(`[${fetchId}] Fetch projects operation completed successfully`)
      return result
    } catch (err) {
      // Handle errors with a simple approach
      logger.error(`[${fetchId}] Error fetching projects:`, err)

      let errorMessage = 'Failed to fetch projects'

      // Check for common error types
      if (err && typeof err === 'object' && 'response' in err && err.response) {
        const response = err.response as { status?: number }
        logger.debug(`[${fetchId}] Error response status:`, response.status)

        if (response.status === 401) {
          errorMessage = 'Invalid credentials. Please check your email and API token.'
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to access this Jira instance.'
        } else if (response.status === 404) {
          errorMessage = 'Jira server not found. Please check the server URL.'
        }
      }

      // Set error state
      logger.debug(`[${fetchId}] Setting error state:`, errorMessage)
      setError(errorMessage)
      logger.error('Failed to fetch projects', err)

      // Notify parent component
      if (onError) {
        logger.debug(`[${fetchId}] Calling onError callback`)
        onError(errorMessage)
      }

      logger.debug(`[${fetchId}] Fetch projects operation failed, returning empty array`)
      return []
    } finally {
      logger.debug(`[${fetchId}] Setting isLoading to false`)
      setIsLoading(false)
    }
  }

  // Function to select a project
  const selectProject = (projectKey: string): void => {
    logger.debug('useProjectsManager.selectProject called with:', projectKey)

    setSelectedProjectKey(projectKey)

    // Notify parent component with the default JQL query for this project
    if (onProjectSelected) {
      logger.debug('Calling onProjectSelected callback with:', projectKey)
      onProjectSelected(projectKey)
    }
  }

  // Return the public API
  return {
    projects,
    isLoading,
    error,
    selectedProjectKey,
    fetchProjects,
    selectProject,
  }
}
