import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@solidjs/testing-library'
import { useJiraConfigurations } from './useJiraConfigurations'
import { jiraApi } from '../api/jiraApi'

// Mock the jiraApi module
vi.mock('../api/jiraApi', () => ({
  jiraApi: {
    listConfigurations: vi.fn(),
    getConfiguration: vi.fn(),
    createConfiguration: vi.fn(),
    updateConfiguration: vi.fn(),
    deleteConfiguration: vi.fn(),
  },
}))

describe('useJiraConfigurations', () => {
  const mockJqlChange = vi.fn()
  const mockConfigs = [
    {
      name: 'Config 1',
      jira_server: 'https://jira1.atlassian.net',
      jira_email: 'user1@example.com',
    },
    {
      name: 'Config 2',
      jira_server: 'https://jira2.atlassian.net',
      jira_email: 'user2@example.com',
    },
  ]

  const mockConfig = {
    name: 'Config 1',
    jira_server: 'https://jira1.atlassian.net',
    jira_email: 'user1@example.com',
    jira_api_token: 'token1',
    jql_query: 'project = TEST',
    workflow_states: ['Backlog', 'In Progress', 'Done'],
    lead_time_start_state: 'Backlog',
    lead_time_end_state: 'Done',
    cycle_time_start_state: 'In Progress',
    cycle_time_end_state: 'Done',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(jiraApi.listConfigurations).mockResolvedValue(mockConfigs)
    vi.mocked(jiraApi.getConfiguration).mockResolvedValue(mockConfig)
  })

  it('loads configurations on initialization', async () => {
    const { result } = renderHook(() => useJiraConfigurations(mockJqlChange))

    // Wait for the effect to run
    await vi.waitFor(() => {
      expect(jiraApi.listConfigurations).toHaveBeenCalled()
    })

    // Check that configurations are set
    expect(result.configurations()).toEqual(mockConfigs)
  })

  it('selects a configuration and updates JQL', async () => {
    const { result } = renderHook(() => useJiraConfigurations(mockJqlChange))

    // Call handleConfigSelect
    await result.handleConfigSelect('Config 1')

    // Check that the API was called
    expect(jiraApi.getConfiguration).toHaveBeenCalledWith('Config 1')

    // Check that the selected config was set
    expect(result.selectedConfig()).toBe('Config 1')

    // Check that the JQL change callback was called
    expect(mockJqlChange).toHaveBeenCalledWith(mockConfig.jql_query)
  })

  it('deletes a configuration and clears selection if it was selected', async () => {
    const { result } = renderHook(() => useJiraConfigurations(mockJqlChange))

    // First select a configuration
    await result.handleConfigSelect('Config 1')
    expect(result.selectedConfig()).toBe('Config 1')

    // Then delete it
    await result.handleConfigDelete('Config 1')

    // Check that the API was called
    expect(jiraApi.deleteConfiguration).toHaveBeenCalledWith('Config 1')

    // Check that the selected config was cleared
    expect(result.selectedConfig()).toBeUndefined()

    // Check that configurations were reloaded
    expect(jiraApi.listConfigurations).toHaveBeenCalledTimes(2)
  })

  it('automatically selects a newly created configuration', async () => {
    const { result } = renderHook(() => useJiraConfigurations(mockJqlChange))

    // Call handleConfigSaved
    await result.handleConfigSaved('Config 1')

    // Check that the form was closed
    expect(result.showConfigForm()).toBe(false)

    // Check that configurations were reloaded
    expect(jiraApi.listConfigurations).toHaveBeenCalledTimes(2)

    // Check that the configuration was selected
    expect(jiraApi.getConfiguration).toHaveBeenCalledWith('Config 1')
    expect(result.selectedConfig()).toBe('Config 1')
  })
})
