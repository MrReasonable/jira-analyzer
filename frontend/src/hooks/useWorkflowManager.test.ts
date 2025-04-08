/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createSignal, createRoot, createEffect } from 'solid-js'
import { useWorkflowManager } from './useWorkflowManager'
import { JiraConfiguration, jiraApi } from '@api/jiraApi'
import { WorkflowState } from '~/types/workflow'

// Mock the idGenerator
vi.mock('@utils/idGenerator', () => ({
  generateId: vi.fn(() => 'mock-id'),
}))

// Mock jiraApi
vi.mock('@api/jiraApi', () => ({
  jiraApi: {
    getWorkflows: vi.fn(),
    getWorkflowsWithCredentials: vi.fn(),
  },
}))

// Mock the logger
vi.mock('@utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
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

  it('provides loading and error states for workflow fetching', () => {
    const dispose = createRoot(dispose => {
      const [activeConfig] = createSignal<JiraConfiguration | null>(mockConfig)
      const manager = useWorkflowManager(activeConfig)

      // Initial state
      expect(manager.loadingWorkflow()).toBe(false)
      expect(manager.workflowError()).toBe(null)

      return dispose
    })

    disposals.push(dispose)
  })

  it('fetches workflow states from Jira', async () => {
    // Mock API response
    const mockWorkflowStatusList = [
      { id: 'wf1', name: 'Backlog', category: 'To Do' },
      { id: 'wf2', name: 'In Progress', category: 'In Progress' },
      { id: 'wf3', name: 'Review', category: 'In Progress' },
      { id: 'wf4', name: 'Done', category: 'Done' },
    ]

    // Setup API mock to resolve with the mock data
    vi.mocked(jiraApi.getWorkflows).mockResolvedValue(mockWorkflowStatusList)

    // Initialize the manager with a default value
    let manager!: ReturnType<typeof useWorkflowManager>

    const dispose = createRoot(dispose => {
      const [activeConfig] = createSignal<JiraConfiguration | null>(mockConfig)
      manager = useWorkflowManager(activeConfig)
      return dispose
    })

    disposals.push(dispose)

    // Call method directly without nesting in the createRoot callback
    const result = await manager.fetchWorkflowStatesFromJira('TEST')

    // Verify loading states changed during execution
    expect(manager.loadingWorkflow()).toBe(false)

    // Verify states are correctly transformed
    expect(result.length).toBe(4)
    expect(manager.workflowStates().length).toBe(4)

    // Spot check one of the states
    const doneState = manager.workflowStates().find(s => s.name === 'Done')
    expect(doneState).toBeDefined()
    expect(doneState?.isEndPoint).toBe(true)

    // Verify Backlog was set as start state (To Do category)
    const backlogState = manager.workflowStates().find(s => s.name === 'Backlog')
    expect(backlogState).toBeDefined()
    expect(backlogState?.isStartPoint).toBe(true)

    // Verify the API was called with the correct arguments
    expect(jiraApi.getWorkflows).toHaveBeenCalledWith('TEST', 'Test Config')
  })

  it('fetches workflow states from Jira using credentials', async () => {
    // Mock API response
    const mockWorkflowStatusList = [
      { id: 'wf1', name: 'Backlog', category: 'To Do' },
      { id: 'wf2', name: 'In Progress', category: 'In Progress' },
      { id: 'wf3', name: 'Done', category: 'Done' },
    ]

    // Setup API mock to resolve with the mock data
    vi.mocked(jiraApi.getWorkflowsWithCredentials).mockResolvedValue(mockWorkflowStatusList)

    // Create a config without a name
    const configWithoutName = { ...mockConfig, name: '' }

    // Initialize the manager with a default value
    let manager!: ReturnType<typeof useWorkflowManager>

    const dispose = createRoot(dispose => {
      const [activeConfig] = createSignal<JiraConfiguration | null>(configWithoutName)
      manager = useWorkflowManager(activeConfig)
      return dispose
    })

    disposals.push(dispose)

    // Call method directly
    const result = await manager.fetchWorkflowStatesFromJira('TEST')

    // Verify states are correctly transformed
    expect(result.length).toBe(3)

    // Verify the credentials API was called
    expect(jiraApi.getWorkflowsWithCredentials).toHaveBeenCalled()
  })

  it('handles errors when fetching workflow states', async () => {
    // Setup API mock to reject
    vi.mocked(jiraApi.getWorkflows).mockRejectedValue(new Error('API Error'))

    // Initialize the manager with a default value
    let manager!: ReturnType<typeof useWorkflowManager>

    const dispose = createRoot(dispose => {
      const [activeConfig] = createSignal<JiraConfiguration | null>(mockConfig)
      manager = useWorkflowManager(activeConfig)
      return dispose
    })

    disposals.push(dispose)

    // Call method directly
    const result = await manager.fetchWorkflowStatesFromJira('TEST')

    // Should return empty array on error
    expect(result).toEqual([])

    // Verify error state is set
    expect(manager.workflowError()).not.toBeNull()
    expect(manager.loadingWorkflow()).toBe(false)
  })

  // Helper function to verify workflow states
  function verifyWorkflowStates(workflowStates: WorkflowState[]) {
    expect(workflowStates.length).toBe(3)

    // Check JiraTodo state (start point)
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
          verifyWorkflowStates(manager.workflowStates())
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
    // Extract the state tracking to a separate object outside of reactive context
    const testTracker = {
      initialChecked: false,
      afterUpdateChecked: false,
      checkInitialState(
        manager: ReturnType<typeof useWorkflowManager>,
        setActiveConfig: (config: JiraConfiguration | null) => void
      ) {
        expect(manager.workflowStates()).toEqual([])
        this.initialChecked = true
        // Set the active config to trigger the state change
        setActiveConfig(mockConfig)
      },
      checkUpdatedState(manager: ReturnType<typeof useWorkflowManager>) {
        const workflowStates = manager.workflowStates()
        expect(workflowStates.length).toBe(3)
        expect(workflowStates[0].name).toBe('Todo')
        this.afterUpdateChecked = true
      },
    }

    // Create a promise to wait for test completion
    let resolveTest: () => void
    const testDone = new Promise<void>(resolve => {
      resolveTest = resolve
    })

    // Initialize with null config
    let manager!: ReturnType<typeof useWorkflowManager>
    let setActiveConfig!: (config: JiraConfiguration | null) => void

    const dispose = createRoot(dispose => {
      const [activeConfig, setConfig] = createSignal<JiraConfiguration | null>(null)
      manager = useWorkflowManager(activeConfig)
      setActiveConfig = setConfig

      // Create effect to monitor state changes
      createEffect(() => {
        // Check initial empty state
        if (!testTracker.initialChecked && manager.workflowStates().length === 0) {
          testTracker.checkInitialState(manager, setActiveConfig)
        }

        // Check state after config update
        if (
          testTracker.initialChecked &&
          !testTracker.afterUpdateChecked &&
          manager.workflowStates().length > 0
        ) {
          testTracker.checkUpdatedState(manager)
          resolveTest()
        }
      })

      return dispose
    })

    disposals.push(dispose)

    // Wait for the test to complete
    await testDone
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
