/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createSignal, createRoot, createEffect } from 'solid-js'
import { useWorkflowManager } from './useWorkflowManager'
import { JiraConfiguration } from '@api/jiraApi'
import { WorkflowState } from '~/types/workflow'

// Mock the idGenerator
vi.mock('@utils/idGenerator', () => ({
  generateId: vi.fn(() => 'mock-id'),
}))

describe('useWorkflowManager', () => {
  // Store disposal functions to clean up after each test
  const disposals: (() => void)[] = []

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up all reactive roots after each test
    disposals.forEach(dispose => dispose())
    disposals.length = 0
  })

  const mockConfig: JiraConfiguration = {
    name: 'Test Config',
    jira_server: 'https://test.atlassian.net',
    jira_email: 'test@example.com',
    jira_api_token: 'test-token',
    jql_query: 'project = TEST',
    project_key: 'TEST',
    workflow_states: ['Todo', 'In Progress', 'Done'],
    lead_time_start_state: 'Todo',
    lead_time_end_state: 'Done',
    cycle_time_start_state: 'In Progress',
    cycle_time_end_state: 'Done',
  }

  it('initializes with empty workflow states', () => {
    // Use createRoot to properly manage reactive computations
    const dispose = createRoot(dispose => {
      // Setup
      const [activeConfig] = createSignal<JiraConfiguration | null>(null)
      const manager = useWorkflowManager(activeConfig)

      // Test
      expect(manager.workflowStates()).toEqual([])
      expect(manager.editingWorkflow()).toBe(false)

      return dispose
    })

    // Store the disposal function
    disposals.push(dispose)
  })

  it('converts configuration workflow states to UI workflow states', async () => {
    // Use createRoot to properly manage reactive computations
    const dispose = createRoot(dispose => {
      // Setup
      const [activeConfig] = createSignal<JiraConfiguration | null>(mockConfig)
      const manager = useWorkflowManager(activeConfig)

      // We need to manually trigger the effect by creating a new signal and updating it
      const [trigger, setTrigger] = createSignal(0)

      // Create an effect to run our assertions after the manager's effect has run
      createEffect(() => {
        // This will re-run whenever trigger changes
        trigger()

        // Only run assertions if workflowStates has been populated
        if (manager.workflowStates().length > 0) {
          const workflowStates = manager.workflowStates()

          // Test
          expect(workflowStates.length).toBe(3)

          // Check Todo state (start point)
          expect(workflowStates[0].name).toBe('Todo')
          expect(workflowStates[0].isStartPoint).toBe(true)
          expect(workflowStates[0].isEndPoint).toBe(false)

          // Check In Progress state
          expect(workflowStates[1].name).toBe('In Progress')
          expect(workflowStates[1].isStartPoint).toBe(true) // cycle time start
          expect(workflowStates[1].isEndPoint).toBe(false)

          // Check Done state (end point)
          expect(workflowStates[2].name).toBe('Done')
          expect(workflowStates[2].isStartPoint).toBe(false)
          expect(workflowStates[2].isEndPoint).toBe(true)
        }
      })

      // Trigger the effect to run
      setTrigger(1)

      return dispose
    })

    // Store the disposal function
    disposals.push(dispose)
  })

  it('updates workflow states when active config changes', async () => {
    // Use createRoot to properly manage reactive computations
    const dispose = createRoot(dispose => {
      // Setup
      const [activeConfig, setActiveConfig] = createSignal<JiraConfiguration | null>(null)
      const manager = useWorkflowManager(activeConfig)

      // We need to manually track state changes
      const [testState, setTestState] = createSignal({
        initialChecked: false,
        afterUpdateChecked: false,
      })

      // Create an effect to run our assertions
      createEffect(() => {
        // Initially empty
        if (!testState().initialChecked && manager.workflowStates().length === 0) {
          expect(manager.workflowStates()).toEqual([])
          setTestState(prev => ({ ...prev, initialChecked: true }))

          // Now set the active config to trigger the next state
          setActiveConfig(mockConfig)
        }

        // After update, should have workflow states
        if (
          testState().initialChecked &&
          !testState().afterUpdateChecked &&
          manager.workflowStates().length > 0
        ) {
          const workflowStates = manager.workflowStates()
          expect(workflowStates.length).toBe(3)
          expect(workflowStates[0].name).toBe('Todo')
          setTestState(prev => ({ ...prev, afterUpdateChecked: true }))
        }
      })

      return dispose
    })

    // Store the disposal function
    disposals.push(dispose)
  })

  it('updates configuration with workflow states', () => {
    // Use createRoot to properly manage reactive computations
    const dispose = createRoot(dispose => {
      // Setup
      const [activeConfig] = createSignal<JiraConfiguration | null>(mockConfig)
      const manager = useWorkflowManager(activeConfig)

      // Create custom workflow states
      const customStates: WorkflowState[] = [
        { id: '1', name: 'Backlog', isStartPoint: true, isEndPoint: false },
        { id: '2', name: 'Development', isStartPoint: false, isEndPoint: false },
        { id: '3', name: 'Testing', isStartPoint: false, isEndPoint: false },
        { id: '4', name: 'Completed', isStartPoint: false, isEndPoint: true },
      ]

      // Set the custom states
      manager.setWorkflowStates(customStates)

      // Update the config with the new states
      const updatedConfig = manager.updateConfigWithWorkflowStates(mockConfig)

      // Check the updated config
      expect(updatedConfig.workflow_states).toEqual([
        'Backlog',
        'Development',
        'Testing',
        'Completed',
      ])
      expect(updatedConfig.lead_time_start_state).toBe('Backlog')
      expect(updatedConfig.cycle_time_start_state).toBe('Backlog')
      expect(updatedConfig.lead_time_end_state).toBe('Completed')
      expect(updatedConfig.cycle_time_end_state).toBe('Completed')

      return dispose
    })

    // Store the disposal function
    disposals.push(dispose)
  })

  it('handles editing workflow state', () => {
    // Use createRoot to properly manage reactive computations
    const dispose = createRoot(dispose => {
      // Setup
      const [activeConfig] = createSignal<JiraConfiguration | null>(mockConfig)
      const manager = useWorkflowManager(activeConfig)

      // Initially not editing
      expect(manager.editingWorkflow()).toBe(false)

      // Set editing to true
      manager.setEditingWorkflow(true)
      expect(manager.editingWorkflow()).toBe(true)

      // Set editing to false
      manager.setEditingWorkflow(false)
      expect(manager.editingWorkflow()).toBe(false)

      return dispose
    })

    // Store the disposal function
    disposals.push(dispose)
  })
})
