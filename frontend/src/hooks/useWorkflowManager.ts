import { createSignal, createEffect } from 'solid-js'
import { WorkflowState } from '~/types/workflow'
import { JiraConfiguration } from '@api/jiraApi'
import { generateId } from '@utils/idGenerator'

/**
 * Custom hook for managing workflow states
 */
export const useWorkflowManager = (activeConfig: () => JiraConfiguration | null) => {
  // Track workflow states for the current configuration
  const [workflowStates, setWorkflowStates] = createSignal<WorkflowState[]>([])

  // Track if we're in workflow editing mode
  const [editingWorkflow, setEditingWorkflow] = createSignal(false)

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
    if (config && config.workflow_states) {
      setWorkflowStates(configToWorkflowStates(config))
    } else {
      setWorkflowStates([])
    }
  })

  return {
    workflowStates,
    setWorkflowStates,
    editingWorkflow,
    setEditingWorkflow,
    configToWorkflowStates,
    updateConfigWithWorkflowStates,
  }
}
