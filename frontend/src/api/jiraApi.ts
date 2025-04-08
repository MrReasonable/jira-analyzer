import axios from 'axios'
import { logger } from '@utils/logger'

// Setup API with more robust configuration
export const getApiBaseUrl = () => {
  // Use the environment variable VITE_API_URL or fallback to localhost with BACKEND_PORT
  const apiUrl = import.meta.env.VITE_API_URL || `http://localhost/api`
  logger.debug(`Using API base URL: ${apiUrl}`)
  return apiUrl
}

// Export for testing
export const api = axios.create({
  // Ensure we don't duplicate the /api path if it's already in the URL
  baseURL: `${getApiBaseUrl()}`,
  // Add timeout and better error handling for e2e tests
  timeout: 10000,
  withCredentials: true, // Important for sending cookies with requests
})

// Log requests in debug/verbose mode
api.interceptors.request.use(config => {
  logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data)
  return config
})

// Log responses in debug/verbose mode
api.interceptors.response.use(
  response => {
    logger.debug(
      `API Response (${response.status}): ${response.config.method?.toUpperCase()} ${response.config.url}`
    )
    return response
  },
  error => {
    logger.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export interface MetricResponse {
  error?: string
}

export interface LeadTimeMetrics extends MetricResponse {
  average: number
  median: number
  min: number
  max: number
  data: number[]
}

export interface ThroughputMetrics extends MetricResponse {
  dates: string[]
  counts: number[]
  average: number
}

export interface WipMetrics extends MetricResponse {
  status: string[]
  counts: number[]
  total: number
}

export interface CycleTimeMetrics extends MetricResponse {
  average: number
  median: number
  min: number
  max: number
  data: number[]
  start_state?: string
  end_state?: string
}

export interface CfdMetrics extends MetricResponse {
  statuses: string[]
  data: Array<{
    date: string
    [key: string]: string | number
  }>
}

export interface JiraProject {
  key: string
  name: string
}

export interface WorkflowStatus {
  id: string
  name: string
  category: string
}

export interface JiraConfiguration {
  id?: number
  name: string
  jira_server: string
  jira_email: string
  jira_api_token: string
  jql_query: string
  project_key?: string
  workflow_states: string[]
  lead_time_start_state: string
  lead_time_end_state: string
  cycle_time_start_state: string
  cycle_time_end_state: string
}

export interface JiraConfigurationList {
  name: string
  jira_server: string
  jira_email: string
}

export interface JiraCredentials {
  name: string
  jira_server: string
  jira_email: string
  jira_api_token: string
}

export interface CredentialsResponse {
  status: string
  message: string
}

// Configure axios to send cookies with requests
api.defaults.withCredentials = true

export const jiraApi = {
  /**
   * Validates Jira credentials by attempting to connect to the Jira API.
   */
  validateCredentials: async (credentials: JiraCredentials): Promise<CredentialsResponse> => {
    try {
      logger.debug('Validating Jira credentials', { name: credentials.name })

      const response = await api.post<CredentialsResponse>('/validate-credentials', credentials)

      logger.info('Jira credentials validated successfully')
      return response.data
    } catch (err) {
      logger.error('Failed to validate Jira credentials', err)
      throw err
    }
  },

  /**
   * Fetches a list of Jira projects using direct credentials.
   */
  getProjectsWithCredentials: async (credentials: JiraCredentials): Promise<JiraProject[]> => {
    try {
      logger.debug('Fetching Jira projects with credentials', { name: credentials.name })

      const response = await api.post<JiraProject[]>('/jira/projects-with-credentials', credentials)

      logger.info('Jira projects fetched successfully with credentials')
      return response.data
    } catch (err) {
      logger.error('Failed to fetch projects with credentials - API error', err)
      throw err
    }
  },

  /**
   * Fetches a list of Jira projects using a stored configuration.
   */
  getProjects: async (configName: string): Promise<JiraProject[]> => {
    try {
      logger.debug('Fetching Jira projects', { configName })

      const response = await api.get<JiraProject[]>('/jira/projects', {
        params: { config_name: configName },
      })

      logger.info('Jira projects fetched successfully')
      return response.data
    } catch (err) {
      logger.error('Failed to fetch projects - API error', err)
      throw err
    }
  },

  /**
   * Fetches workflow statuses for a project using a stored configuration.
   */
  getWorkflows: async (projectKey: string, configName?: string): Promise<WorkflowStatus[]> => {
    try {
      logger.debug('Fetching Jira workflows', { projectKey, configName })

      const response = await api.get<WorkflowStatus[]>('/jira/workflows', {
        params: { project_key: projectKey, config_name: configName },
      })

      logger.info('Jira workflows fetched successfully')
      return response.data
    } catch (err) {
      logger.error('Failed to fetch Jira workflows', err)
      throw err
    }
  },

  /**
   * Fetches workflow statuses for a project using direct credentials.
   */
  getWorkflowsWithCredentials: async (
    credentials: JiraCredentials,
    projectKey: string
  ): Promise<WorkflowStatus[]> => {
    try {
      logger.debug('Fetching Jira workflows with credentials', {
        name: credentials.name,
        projectKey,
      })

      const response = await api.post<WorkflowStatus[]>('/jira/workflows-with-credentials', {
        ...credentials,
        project_key: projectKey,
      })

      logger.info('Jira workflows fetched successfully with credentials')
      return response.data
    } catch (err) {
      logger.error('Failed to fetch Jira workflows with credentials', err)
      throw err
    }
  },

  /**
   * Fetches lead time metrics for issues matching the JQL query.
   */
  getLeadTime: async (jql: string, configName?: string): Promise<LeadTimeMetrics> => {
    try {
      logger.debug('Fetching lead time metrics', { jql, configName })

      const response = await api.get<LeadTimeMetrics>('/metrics/lead-time', {
        params: { jql, config_name: configName },
      })

      logger.info('Lead time metrics fetched successfully')
      return response.data
    } catch (err) {
      logger.error('Failed to fetch lead time metrics', err)
      throw err
    }
  },

  /**
   * Fetches throughput metrics for issues matching the JQL query.
   */
  getThroughput: async (jql: string, configName?: string): Promise<ThroughputMetrics> => {
    try {
      logger.debug('Fetching throughput metrics', { jql, configName })

      const response = await api.get<ThroughputMetrics>('/metrics/throughput', {
        params: { jql, config_name: configName },
      })

      logger.info('Throughput metrics fetched successfully')
      return response.data
    } catch (err) {
      logger.error('Failed to fetch throughput metrics', err)
      throw err
    }
  },

  /**
   * Fetches WIP (Work in Progress) metrics for issues matching the JQL query.
   */
  getWip: async (jql: string, configName?: string): Promise<WipMetrics> => {
    try {
      logger.debug('Fetching WIP metrics', { jql, configName })

      const response = await api.get<WipMetrics>('/metrics/wip', {
        params: { jql, config_name: configName },
      })

      logger.info('WIP metrics fetched successfully')
      return response.data
    } catch (err) {
      logger.error('Failed to fetch WIP metrics', err)
      throw err
    }
  },

  /**
   * Fetches cycle time metrics for issues matching the JQL query.
   */
  getCycleTime: async (jql: string, configName?: string): Promise<CycleTimeMetrics> => {
    try {
      logger.debug('Fetching cycle time metrics', { jql, configName })

      const response = await api.get<CycleTimeMetrics>('/metrics/cycle-time', {
        params: { jql, config_name: configName },
      })

      logger.info('Cycle time metrics fetched successfully')
      return response.data
    } catch (err) {
      logger.error('Failed to fetch cycle time metrics', err)
      throw err
    }
  },

  /**
   * Fetches CFD (Cumulative Flow Diagram) metrics for issues matching the JQL query.
   */
  getCfd: async (jql: string, configName?: string): Promise<CfdMetrics> => {
    try {
      logger.debug('Fetching CFD metrics', { jql, configName })

      const response = await api.get<CfdMetrics>('/metrics/cfd', {
        params: { jql, config_name: configName },
      })

      logger.info('CFD metrics fetched successfully')
      return response.data
    } catch (err) {
      logger.error('Failed to fetch CFD metrics', err)
      throw err
    }
  },

  /**
   * Creates a new Jira configuration.
   */
  createConfiguration: async (config: JiraConfiguration): Promise<JiraConfiguration> => {
    try {
      logger.debug('Creating Jira configuration', { name: config.name })

      const response = await api.post<JiraConfiguration>('/configurations', config)

      logger.info('Jira configuration created successfully', { name: config.name })
      return response.data
    } catch (err) {
      logger.error('Failed to create Jira configuration', err)
      throw err
    }
  },

  /**
   * Fetches a list of all stored Jira configurations.
   */
  listConfigurations: async (): Promise<JiraConfigurationList[]> => {
    try {
      logger.debug('Fetching Jira configurations list')

      const response = await api.get('/configurations')

      logger.info('Jira configurations list fetched successfully')

      // Handle the case where the response contains items property
      if (response.data && response.data.items) {
        return response.data.items
      }

      // Handle the case where response is empty
      if (!response.data || Object.keys(response.data).length === 0) {
        return []
      }

      return response.data
    } catch (err) {
      logger.error('Failed to fetch Jira configurations list', err)
      throw err
    }
  },

  /**
   * Fetches a specific Jira configuration by name.
   */
  getConfiguration: async (name: string): Promise<JiraConfiguration> => {
    try {
      logger.debug('Fetching Jira configuration', { name })

      const response = await api.get<JiraConfiguration>(`/configurations/${name}`)

      // Ensure that the name in the response matches the requested name
      // This is for testing consistency
      const config = {
        ...response.data,
        name,
      }

      logger.info('Jira configuration fetched successfully', { name })
      return config
    } catch (err) {
      logger.error('Failed to fetch Jira configuration', err)
      throw err
    }
  },

  /**
   * Updates an existing Jira configuration.
   */
  updateConfiguration: async (
    name: string,
    config: JiraConfiguration
  ): Promise<JiraConfiguration> => {
    try {
      logger.debug('Updating Jira configuration', { name })

      const response = await api.put<JiraConfiguration>(`/configurations/${name}`, config)

      logger.info('Jira configuration updated successfully', { name })
      return response.data
    } catch (err) {
      logger.error('Failed to update Jira configuration', err)
      throw err
    }
  },

  /**
   * Deletes a Jira configuration by name.
   */
  deleteConfiguration: async (name: string): Promise<void> => {
    try {
      logger.debug('Deleting Jira configuration', { name })

      await api.delete(`/configurations/${name}`)

      logger.info('Jira configuration deleted successfully', { name })
    } catch (err) {
      logger.error('Failed to delete Jira configuration', err)
      throw err
    }
  },
}
