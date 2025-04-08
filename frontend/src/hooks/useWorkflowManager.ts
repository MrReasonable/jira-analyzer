import { createSignal, createEffect } from 'solid-js'
import { WorkflowState } from '~/types/workflow'
import { JiraConfiguration, jiraApi } from '@api/jiraApi'
import { generateId } from '@utils/idGenerator'
import { logger } from '@utils/logger'

/**
 * Custom hook for managing workflow states
 */
export const useWorkflowManager = (activeConfig: () => JiraConfiguration | null) => {
  // Track workflow states for the current configuration
  const [workflowStates, setWorkflowStates] = createSignal<WorkflowState[]>([])

  // Track if we're in workflow editing mode
  const [editingWorkflow, setEditingWorkflow] = createSignal(false)

  // Track loading state for workflow states
  const [loadingWorkflow, setLoadingWorkflow] = createSignal(false)

  // Track error state
  const [workflowError, setWorkflowError] = createSignal<string | null>(null)

  // Function to convert configuration workflow states to UI workflow states
  const configToWorkflowStates = (config: JiraConfiguration): WorkflowState[] => {
    return config.workflow_states.map(name => ({
      id: generateId(),
      name,
      isStartPoint: name === config.lead_time_start_state || name === config.cycle_time_start_state,
      isEndPoint: name === config.lead_time_end_state || name === config.cycle_time_end_state,
    }))
  }

  // Function to update configuration with workflow states
  const updateConfigWithWorkflowStates = (config: JiraConfiguration): JiraConfiguration => {
    const updatedConfig = { ...config }

    // Update workflow states
    updatedConfig.workflow_states = workflowStates().map(state => state.name)

    // Find start and end states
    const startStates = workflowStates()
      .filter(s => s.isStartPoint)
      .map(s => s.name)
    const endStates = workflowStates()
      .filter(s => s.isEndPoint)
      .map(s => s.name)

    if (startStates.length > 0) {
      updatedConfig.lead_time_start_state = startStates[0]
      updatedConfig.cycle_time_start_state = startStates[0]
    }

    if (endStates.length > 0) {
      updatedConfig.lead_time_end_state = endStates[0]
      updatedConfig.cycle_time_end_state = endStates[0]
    }

    return updatedConfig
  }

  // Update workflow states when active config changes
  createEffect(() => {
    const config = activeConfig()
    if (config?.workflow_states) {
      setWorkflowStates(configToWorkflowStates(config))
    } else {
      setWorkflowStates([])
    }
  })

  // Fetch workflow states from Jira
  const fetchWorkflowStatesFromJira = async (projectKey: string) => {
    setLoadingWorkflow(true)
    setWorkflowError(null)

    try {
      const config = activeConfig()

      if (!projectKey) {
        throw new Error('Project key is required to fetch workflow states')
      }

      logger.info(`Fetching workflow states for project: ${projectKey}`)

      let workflowStatusList

      if (config?.name) {
        // Use existing configuration
        workflowStatusList = await jiraApi.getWorkflows(projectKey, config.name)
      } else if (config) {
        // Use credentials from the current form
        workflowStatusList = await jiraApi.getWorkflowsWithCredentials(
          {
            name: config.name || 'temp-config',
            jira_server: config.jira_server,
            jira_email: config.jira_email,
            jira_api_token: config.jira_api_token,
          },
          projectKey
        )
      } else {
        throw new Error('No configuration available to fetch workflow states')
      }

      // Convert API response to workflow states
      const states = workflowStatusList.map(status => ({
        id: generateId(),
        name: status.name,
        isStartPoint: false,
        isEndPoint: false,
      }))

      logger.info(`Fetched ${states.length} workflow states from Jira`)

      // Update workflow states
      setWorkflowStates(states)

      // Auto-set start and end points based on category if available
      const startState = workflowStatusList.find(
        s => s.category === 'To Do' || s.category === 'New'
      )
      const endState = workflowStatusList.find(
        s => s.category === 'Done' || s.category === 'Completed'
      )

      if (startState || endState) {
        setWorkflowStates(current =>
          current.map(state => ({
            ...state,
            isStartPoint: startState ? state.name === startState.name : state.isStartPoint,
            isEndPoint: endState ? state.name === endState.name : state.isEndPoint,
          }))
        )
      }

      return states
    } catch (error) {
      logger.error('Error fetching workflow states from Jira:', error)
      setWorkflowError(error instanceof Error ? error.message : 'Failed to fetch workflow states')
      return []
    } finally {
      setLoadingWorkflow(false)
    }
  }

  return {
    workflowStates,
    setWorkflowStates,
    editingWorkflow,
    setEditingWorkflow,
    loadingWorkflow,
    workflowError,
    configToWorkflowStates,
    updateConfigWithWorkflowStates,
    fetchWorkflowStatesFromJira,
  }
}
