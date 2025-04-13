/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSignal } from 'solid-js'
import { useConfigSaver } from './useConfigSaver'
import { JiraConfiguration, jiraApi } from '@api/jiraApi'
import { logger } from '@utils/logger'

// Mock the jiraApi and logger
vi.mock('@api/jiraApi', () => ({
  jiraApi: {
    updateConfiguration: vi.fn(),
    createConfiguration: vi.fn(),
  },
}))

vi.mock('@utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}))

describe('useConfigSaver', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

  const mockConfigState = {
    loadConfigurations: vi.fn(async () => {}),
    handleConfigSelect: vi.fn(async (_name: string) => {}),
  }

  it('initializes with default values', () => {
    // Setup
    const [activeConfig] = createSignal<JiraConfiguration | null>(mockConfig)
    const updateConfigWithWorkflowStates = vi.fn((config: JiraConfiguration) => config)
    const setEditingWorkflow = vi.fn()

    const configSaver = useConfigSaver(
      activeConfig,
      updateConfigWithWorkflowStates,
      mockConfigState,
      setEditingWorkflow
    )

    // Test
    expect(configSaver.savingConfig()).toBe(false)
    expect(configSaver.configName()).toBe('')
  })

  it('saves the current configuration', async () => {
    // Setup
    const [activeConfig] = createSignal<JiraConfiguration | null>(mockConfig)
    const updateConfigWithWorkflowStates = vi.fn((config: JiraConfiguration) => config)
    const setEditingWorkflow = vi.fn()

    const configSaver = useConfigSaver(
      activeConfig,
      updateConfigWithWorkflowStates,
      mockConfigState,
      setEditingWorkflow
    )

    // Mock the API call
    vi.mocked(jiraApi.updateConfiguration).mockResolvedValue(mockConfig)

    // Test
    await configSaver.saveCurrentConfig()

    // Verify the API call
    expect(updateConfigWithWorkflowStates).toHaveBeenCalledWith(mockConfig)
    expect(jiraApi.updateConfiguration).toHaveBeenCalledWith('Test Config', mockConfig)
    expect(mockConfigState.loadConfigurations).toHaveBeenCalled()
    expect(setEditingWorkflow).toHaveBeenCalledWith(false)
    expect(logger.info).toHaveBeenCalledWith('Configuration updated successfully', {
      name: 'Test Config',
    })
  })

  it('handles errors when saving current configuration', async () => {
    // Setup
    const [activeConfig] = createSignal<JiraConfiguration | null>(mockConfig)
    const updateConfigWithWorkflowStates = vi.fn((config: JiraConfiguration) => config)
    const setEditingWorkflow = vi.fn()

    const configSaver = useConfigSaver(
      activeConfig,
      updateConfigWithWorkflowStates,
      mockConfigState,
      setEditingWorkflow
    )

    // Mock the API call to throw an error
    const error = new Error('API error')
    vi.mocked(jiraApi.updateConfiguration).mockRejectedValue(error)

    // Test
    await configSaver.saveCurrentConfig()

    // Verify error handling
    expect(logger.error).toHaveBeenCalledWith('Failed to save configuration', error)
    expect(configSaver.savingConfig()).toBe(false)
  })

  it('saves a new configuration', async () => {
    // Setup
    const [activeConfig] = createSignal<JiraConfiguration | null>(mockConfig)
    const updateConfigWithWorkflowStates = vi.fn((config: JiraConfiguration) => config)
    const setEditingWorkflow = vi.fn()

    const configSaver = useConfigSaver(
      activeConfig,
      updateConfigWithWorkflowStates,
      mockConfigState,
      setEditingWorkflow
    )

    // Set a new config name
    configSaver.setConfigName('New Config')

    // Mock the API call
    const newConfig = { ...mockConfig, name: 'New Config' }
    vi.mocked(jiraApi.createConfiguration).mockResolvedValue(newConfig)

    // Test
    await configSaver.saveNewConfig()

    // Verify the API call
    expect(updateConfigWithWorkflowStates).toHaveBeenCalled()
    expect(jiraApi.createConfiguration).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New Config' })
    )
    expect(mockConfigState.loadConfigurations).toHaveBeenCalled()
    expect(mockConfigState.handleConfigSelect).toHaveBeenCalledWith('New Config')
    expect(logger.info).toHaveBeenCalledWith('New configuration created successfully', {
      name: 'New Config',
    })
    expect(configSaver.configName()).toBe('')
  })

  it('handles errors when saving new configuration', async () => {
    // Setup
    const [activeConfig] = createSignal<JiraConfiguration | null>(mockConfig)
    const updateConfigWithWorkflowStates = vi.fn((config: JiraConfiguration) => config)
    const setEditingWorkflow = vi.fn()

    const configSaver = useConfigSaver(
      activeConfig,
      updateConfigWithWorkflowStates,
      mockConfigState,
      setEditingWorkflow
    )

    // Set a new config name
    configSaver.setConfigName('New Config')

    // Mock the API call to throw an error
    const error = new Error('API error')
    vi.mocked(jiraApi.createConfiguration).mockRejectedValue(error)

    // Test
    await configSaver.saveNewConfig()

    // Verify error handling
    expect(logger.error).toHaveBeenCalledWith('Failed to create new configuration', error)
    expect(configSaver.savingConfig()).toBe(false)
  })

  it('does not save when no active config', async () => {
    // Setup
    const [activeConfig] = createSignal<JiraConfiguration | null>(null)
    const updateConfigWithWorkflowStates = vi.fn((config: JiraConfiguration) => config)
    const setEditingWorkflow = vi.fn()

    const configSaver = useConfigSaver(
      activeConfig,
      updateConfigWithWorkflowStates,
      mockConfigState,
      setEditingWorkflow
    )

    // Test
    await configSaver.saveCurrentConfig()

    // Verify no API calls were made
    expect(jiraApi.updateConfiguration).not.toHaveBeenCalled()
  })

  it('does not save new config when no name', async () => {
    // Setup
    const [activeConfig] = createSignal<JiraConfiguration | null>(mockConfig)
    const updateConfigWithWorkflowStates = vi.fn((config: JiraConfiguration) => config)
    const setEditingWorkflow = vi.fn()

    const configSaver = useConfigSaver(
      activeConfig,
      updateConfigWithWorkflowStates,
      mockConfigState,
      setEditingWorkflow
    )

    // Test with empty config name
    await configSaver.saveNewConfig()

    // Verify no API calls were made
    expect(jiraApi.createConfiguration).not.toHaveBeenCalled()
  })
})
