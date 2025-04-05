import { describe, it, expect } from 'vitest'
import { renderHook } from '@solidjs/testing-library'
import { useFormDataManager } from './useFormDataManager'
import type { JiraConfiguration } from '@api/jiraApi'

describe('useFormDataManager', () => {
  const mockInitialConfig: JiraConfiguration = {
    name: 'Test Config',
    jira_server: 'https://test.atlassian.net',
    jira_email: 'test@example.com',
    jira_api_token: 'test-token',
    project_key: 'TEST',
    jql_query: 'project = TEST',
    workflow_states: ['Todo', 'In Progress', 'Done'],
    lead_time_start_state: 'Todo',
    lead_time_end_state: 'Done',
    cycle_time_start_state: 'In Progress',
    cycle_time_end_state: 'Done',
  }

  it('should initialize with default values when no initial config is provided', () => {
    const { result } = renderHook(() => useFormDataManager())

    // Check that the form data has default values
    expect(result.formData().name).toBe('')
    expect(result.formData().jira_server).toBe('')
    expect(result.formData().jira_email).toBe('')
    expect(result.formData().jira_api_token).toBe('')
    expect(result.formData().project_key).toBe('')
    expect(result.formData().jql_query).toBe('')
    expect(result.formData().lead_time_start_state).toBe('')
    expect(result.formData().lead_time_end_state).toBe('')
    expect(result.formData().cycle_time_start_state).toBe('')
    expect(result.formData().cycle_time_end_state).toBe('')
  })

  it('should initialize with values from initial config when provided', () => {
    const { result } = renderHook(() => useFormDataManager(mockInitialConfig))

    // Check that the form data matches the initial config
    expect(result.formData().name).toBe(mockInitialConfig.name)
    expect(result.formData().jira_server).toBe(mockInitialConfig.jira_server)
    expect(result.formData().jira_email).toBe(mockInitialConfig.jira_email)
    expect(result.formData().jira_api_token).toBe(mockInitialConfig.jira_api_token)
    expect(result.formData().project_key).toBe(mockInitialConfig.project_key)
    expect(result.formData().jql_query).toBe(mockInitialConfig.jql_query)
    expect(result.formData().lead_time_start_state).toBe(mockInitialConfig.lead_time_start_state)
    expect(result.formData().lead_time_end_state).toBe(mockInitialConfig.lead_time_end_state)
    expect(result.formData().cycle_time_start_state).toBe(mockInitialConfig.cycle_time_start_state)
    expect(result.formData().cycle_time_end_state).toBe(mockInitialConfig.cycle_time_end_state)
  })

  it('should update a field value', () => {
    const { result } = renderHook(() => useFormDataManager())

    // Update the name field
    result.updateField('name', 'New Name')
    expect(result.formData().name).toBe('New Name')

    // Update the jira_server field
    result.updateField('jira_server', 'https://new-server.atlassian.net')
    expect(result.formData().jira_server).toBe('https://new-server.atlassian.net')

    // Update the jira_email field
    result.updateField('jira_email', 'new-email@example.com')
    expect(result.formData().jira_email).toBe('new-email@example.com')

    // Update the jira_api_token field
    result.updateField('jira_api_token', 'new-token')
    expect(result.formData().jira_api_token).toBe('new-token')

    // Update the project_key field
    result.updateField('project_key', 'NEW')
    expect(result.formData().project_key).toBe('NEW')

    // Update the jql_query field
    result.updateField('jql_query', 'project = NEW')
    expect(result.formData().jql_query).toBe('project = NEW')

    // Update the lead_time_start_state field
    result.updateField('lead_time_start_state', 'Backlog')
    expect(result.formData().lead_time_start_state).toBe('Backlog')

    // Update the lead_time_end_state field
    result.updateField('lead_time_end_state', 'Released')
    expect(result.formData().lead_time_end_state).toBe('Released')

    // Update the cycle_time_start_state field
    result.updateField('cycle_time_start_state', 'Development')
    expect(result.formData().cycle_time_start_state).toBe('Development')

    // Update the cycle_time_end_state field
    result.updateField('cycle_time_end_state', 'Released')
    expect(result.formData().cycle_time_end_state).toBe('Released')
  })

  it('should not modify other fields when updating a specific field', () => {
    const { result } = renderHook(() => useFormDataManager(mockInitialConfig))

    // Update only the name field
    result.updateField('name', 'New Name')

    // Check that only the name field was updated
    expect(result.formData().name).toBe('New Name')
    expect(result.formData().jira_server).toBe(mockInitialConfig.jira_server)
    expect(result.formData().jira_email).toBe(mockInitialConfig.jira_email)
    expect(result.formData().jira_api_token).toBe(mockInitialConfig.jira_api_token)
    expect(result.formData().project_key).toBe(mockInitialConfig.project_key)
    expect(result.formData().jql_query).toBe(mockInitialConfig.jql_query)
    expect(result.formData().lead_time_start_state).toBe(mockInitialConfig.lead_time_start_state)
    expect(result.formData().lead_time_end_state).toBe(mockInitialConfig.lead_time_end_state)
    expect(result.formData().cycle_time_start_state).toBe(mockInitialConfig.cycle_time_start_state)
    expect(result.formData().cycle_time_end_state).toBe(mockInitialConfig.cycle_time_end_state)
  })
})
