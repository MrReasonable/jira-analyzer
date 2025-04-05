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
    initialProjectKey || null
  )

  // Function to fetch projects
  const fetchProjects = async (): Promise<JiraProject[]> => {
    setIsLoading(true)
    setError(null)

    // Log what we're about to do
    logger.info('Fetching projects using credentials directly')

    try {
      // Directly call the API
      const result = await jiraApi.getProjectsWithCredentials(credentials())

      // Log the response for debugging
      logger.info(`Received ${result.length} projects directly with credentials`)

      // Update internal state
      setProjects(result)

      // If we have projects and no project is selected, select the first one
      if (result.length > 0 && !selectedProjectKey()) {
        selectProject(result[0].key)
      }

      // Notify parent component
      if (onProjectsFetched) {
        onProjectsFetched(result)
      }

      return result
    } catch (err) {
      // Handle errors with a simple approach
      let errorMessage = 'Failed to fetch projects'

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

      // Set error state
      setError(errorMessage)
      logger.error('Failed to fetch projects', err)

      // Notify parent component
      if (onError) {
        onError(errorMessage)
      }

      return []
    } finally {
      setIsLoading(false)
    }
  }

  // Function to select a project
  const selectProject = (projectKey: string): void => {
    setSelectedProjectKey(projectKey)

    // Notify parent component with the default JQL query for this project
    if (onProjectSelected) {
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
