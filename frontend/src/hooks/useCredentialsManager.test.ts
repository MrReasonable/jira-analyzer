import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@solidjs/testing-library'
import { useCredentialsManager } from './useCredentialsManager'
import { jiraApi } from '@api/jiraApi'
import type { JiraConfiguration } from '@api/jiraApi'

// Mock the jiraApi
vi.mock('@api/jiraApi', () => ({
  jiraApi: {
    listConfigurations: vi.fn(),
    getProjectsWithCredentials: vi.fn(),
    validateCredentials: vi.fn(),
  },
}))

// Mock the logger
vi.mock('@utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock the handleApiRequest utility
vi.mock('@utils/apiErrorHandler', () => ({
  handleApiRequest: vi.fn(async (apiCall, errorMessage, setError, onSuccess, onError) => {
    try {
      const result = await apiCall()
      onSuccess(result)
      return result
    } catch (error: unknown) {
      if (error instanceof Error) {
        onError(error.message)
      }
      setError(errorMessage)
      throw error
    }
  }),
}))

describe('useCredentialsManager', () => {
  const mockFormData = vi.fn(() => ({
    name: 'Test Config',
    jira_server: 'https://test.atlassian.net',
    jira_email: 'test@example.com',
    jira_api_token: 'test-token',
    project_key: 'TEST',
    jql_query: 'project = TEST',
    lead_time_start_state: 'To Do',
    lead_time_end_state: 'Done',
    cycle_time_start_state: 'In Progress',
    cycle_time_end_state: 'Done',
  }))

  const mockSetError = vi.fn()
  const mockSetStepErrors = vi.fn()

  const mockConfig: JiraConfiguration = {
    name: 'Existing Config',
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

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() =>
      useCredentialsManager(mockFormData, mockSetError, mockSetStepErrors)
    )

    expect(result.isNameAvailable()).toBe(null)
    expect(result.isCheckingName()).toBe(false)
    expect(result.checkingCredentials()).toBe(false)
    expect(result.credentialsValid()).toBe(false)
  })

  describe('checkNameAvailability', () => {
    it('should set isNameAvailable to true when name is available', async () => {
      // Mock the API response
      vi.mocked(jiraApi.listConfigurations).mockResolvedValue([
        { ...mockConfig, name: 'Other Config' },
      ])

      const { result } = renderHook(() =>
        useCredentialsManager(mockFormData, mockSetError, mockSetStepErrors)
      )

      await result.checkNameAvailability('Test Config')

      expect(jiraApi.listConfigurations).toHaveBeenCalled()
      expect(result.isNameAvailable()).toBe(true)
      expect(result.isCheckingName()).toBe(false)
    })

    it('should set isNameAvailable to false when name is already taken', async () => {
      // Mock the API response
      vi.mocked(jiraApi.listConfigurations).mockResolvedValue([
        { ...mockConfig, name: 'Test Config' },
      ])

      const { result } = renderHook(() =>
        useCredentialsManager(mockFormData, mockSetError, mockSetStepErrors)
      )

      await result.checkNameAvailability('Test Config')

      expect(jiraApi.listConfigurations).toHaveBeenCalled()
      expect(result.isNameAvailable()).toBe(false)
      expect(result.isCheckingName()).toBe(false)
    })

    it('should handle API errors gracefully', async () => {
      // Mock the API error
      vi.mocked(jiraApi.listConfigurations).mockRejectedValue(new Error('API Error'))

      const { result } = renderHook(() =>
        useCredentialsManager(mockFormData, mockSetError, mockSetStepErrors)
      )

      await result.checkNameAvailability('Test Config')

      expect(jiraApi.listConfigurations).toHaveBeenCalled()
      expect(result.isNameAvailable()).toBe(null)
      expect(result.isCheckingName()).toBe(false)
    })

    it('should not check availability when initialConfig is provided', async () => {
      const { result } = renderHook(() =>
        useCredentialsManager(mockFormData, mockSetError, mockSetStepErrors, mockConfig)
      )

      await result.checkNameAvailability('Test Config')

      expect(jiraApi.listConfigurations).not.toHaveBeenCalled()
    })
  })

  describe('checkCredentials', () => {
    it('should call the API and handle success', async () => {
      const mockProjects = [{ key: 'TEST', name: 'Test Project' }]
      vi.mocked(jiraApi.getProjectsWithCredentials).mockResolvedValue(mockProjects)

      const mockOnSuccess = vi.fn()

      const { result } = renderHook(() =>
        useCredentialsManager(mockFormData, mockSetError, mockSetStepErrors)
      )

      await result.checkCredentials(mockOnSuccess)

      expect(jiraApi.getProjectsWithCredentials).toHaveBeenCalledWith({
        name: 'Test Config',
        jira_server: 'https://test.atlassian.net',
        jira_email: 'test@example.com',
        jira_api_token: 'test-token',
      })
      expect(mockOnSuccess).toHaveBeenCalledWith(mockProjects)
      expect(result.credentialsValid()).toBe(true)
      expect(mockSetError).toHaveBeenCalledWith(null)
      expect(mockSetStepErrors).toHaveBeenCalled()
    })

    it('should handle API errors', async () => {
      vi.mocked(jiraApi.getProjectsWithCredentials).mockRejectedValue(new Error('API Error'))

      const mockOnSuccess = vi.fn()

      const { result } = renderHook(() =>
        useCredentialsManager(mockFormData, mockSetError, mockSetStepErrors)
      )

      try {
        await result.checkCredentials(mockOnSuccess)
      } catch {
        // Expected error
      }

      expect(jiraApi.getProjectsWithCredentials).toHaveBeenCalled()
      expect(mockOnSuccess).not.toHaveBeenCalled()
      expect(result.credentialsValid()).toBe(false)
      expect(mockSetStepErrors).toHaveBeenCalled()
    })
  })

  describe('validateCredentials', () => {
    it('should call the API and handle success', async () => {
      vi.mocked(jiraApi.validateCredentials).mockResolvedValue({
        status: 'success',
        message: 'Credentials are valid',
      })

      const mockOnSuccess = vi.fn()

      const { result } = renderHook(() =>
        useCredentialsManager(mockFormData, mockSetError, mockSetStepErrors)
      )

      await result.validateCredentials(mockOnSuccess)

      expect(jiraApi.validateCredentials).toHaveBeenCalledWith({
        name: 'Test Config',
        jira_server: 'https://test.atlassian.net',
        jira_email: 'test@example.com',
        jira_api_token: 'test-token',
      })
      expect(mockOnSuccess).toHaveBeenCalled()
      expect(result.credentialsValid()).toBe(true)
      expect(mockSetError).toHaveBeenCalledWith(null)
      expect(mockSetStepErrors).toHaveBeenCalled()
    })

    it('should handle API errors', async () => {
      vi.mocked(jiraApi.validateCredentials).mockRejectedValue(new Error('API Error'))

      const mockOnSuccess = vi.fn()

      const { result } = renderHook(() =>
        useCredentialsManager(mockFormData, mockSetError, mockSetStepErrors)
      )

      try {
        await result.validateCredentials(mockOnSuccess)
      } catch {
        // Expected error
      }

      expect(jiraApi.validateCredentials).toHaveBeenCalled()
      expect(mockOnSuccess).not.toHaveBeenCalled()
      expect(result.credentialsValid()).toBe(false)
      expect(mockSetStepErrors).toHaveBeenCalled()
    })
  })
})
