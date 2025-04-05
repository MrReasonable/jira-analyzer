import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@solidjs/testing-library'
import { useFormValidation } from './useFormValidation'
import { FormData } from '~types/configurationForm'

// Mock the formValidators module
vi.mock('@utils/formValidators', () => ({
  createStepValidators: vi.fn().mockImplementation((formData, isNameAvailable, isEditMode) => ({
    validateCredentialsStep: vi.fn().mockImplementation(() => {
      // Basic validation logic for testing
      if (!formData().name) {
        return { isValid: false, errorMessage: 'Configuration name is required' }
      }
      if (!isEditMode && isNameAvailable() === false) {
        return { isValid: false, errorMessage: 'A configuration with this name already exists' }
      }
      if (!formData().jira_server) {
        return { isValid: false, errorMessage: 'Jira server URL is required' }
      }
      if (!formData().jira_email) {
        return { isValid: false, errorMessage: 'Jira email is required' }
      }
      if (!formData().jira_api_token) {
        return { isValid: false, errorMessage: 'Jira API token is required' }
      }
      return { isValid: true, errorMessage: null }
    }),
    validateProjectStep: vi.fn().mockImplementation(() => {
      if (!formData().project_key) {
        return { isValid: false, errorMessage: 'Project selection is required' }
      }
      if (!formData().jql_query) {
        return { isValid: false, errorMessage: 'JQL query is required' }
      }
      return { isValid: true, errorMessage: null }
    }),
  })),
}))

describe('useFormValidation', () => {
  // Create a mock formData function
  const createMockFormData = (overrides: Partial<FormData> = {}) => {
    const defaultFormData: FormData = {
      name: '',
      jira_server: '',
      jira_email: '',
      jira_api_token: '',
      jql_query: '',
      project_key: '',
      lead_time_start_state: '',
      lead_time_end_state: '',
      cycle_time_start_state: '',
      cycle_time_end_state: '',
    }

    return () => ({ ...defaultFormData, ...overrides })
  }

  it('should initialize with default values', () => {
    const mockFormData = createMockFormData()
    const mockIsNameAvailable = () => null

    const { result } = renderHook(() => useFormValidation(mockFormData, mockIsNameAvailable, false))

    expect(result.error()).toBeNull()
    expect(result.stepErrors().credentials).toBeNull()
    expect(result.stepErrors().project).toBeNull()
  })

  it('should validate credentials step correctly - invalid case', () => {
    const mockFormData = createMockFormData() // Empty form data
    const mockIsNameAvailable = () => null

    const { result } = renderHook(() => useFormValidation(mockFormData, mockIsNameAvailable, false))

    // Validate the credentials step
    const isValid = result.validateStep('credentials')

    expect(isValid).toBe(false)
    expect(result.stepErrors().credentials).toBe('Configuration name is required')
  })

  it('should validate credentials step correctly - valid case', () => {
    const mockFormData = createMockFormData({
      name: 'Test Config',
      jira_server: 'https://test.atlassian.net',
      jira_email: 'test@example.com',
      jira_api_token: 'test-token',
    })
    const mockIsNameAvailable = () => true

    const { result } = renderHook(() => useFormValidation(mockFormData, mockIsNameAvailable, false))

    // Validate the credentials step
    const isValid = result.validateStep('credentials')

    expect(isValid).toBe(true)
    expect(result.stepErrors().credentials).toBeNull()
  })

  it('should validate project step correctly - invalid case', () => {
    const mockFormData = createMockFormData() // Empty form data
    const mockIsNameAvailable = () => null

    const { result } = renderHook(() => useFormValidation(mockFormData, mockIsNameAvailable, false))

    // Validate the project step
    const isValid = result.validateStep('project')

    expect(isValid).toBe(false)
    expect(result.stepErrors().project).toBe('Project selection is required')
  })

  it('should validate project step correctly - valid case', () => {
    const mockFormData = createMockFormData({
      project_key: 'TEST',
      jql_query: 'project = TEST',
    })
    const mockIsNameAvailable = () => null

    const { result } = renderHook(() => useFormValidation(mockFormData, mockIsNameAvailable, false))

    // Validate the project step
    const isValid = result.validateStep('project')

    expect(isValid).toBe(true)
    expect(result.stepErrors().project).toBeNull()
  })

  it('should handle name availability check in edit mode', () => {
    const mockFormData = createMockFormData({
      name: 'Test Config',
      jira_server: 'https://test.atlassian.net',
      jira_email: 'test@example.com',
      jira_api_token: 'test-token',
    })
    const mockIsNameAvailable = () => false // Name is not available

    // In edit mode, name availability should be ignored
    const { result } = renderHook(() => useFormValidation(mockFormData, mockIsNameAvailable, true))

    // Validate the credentials step
    const isValid = result.validateStep('credentials')

    expect(isValid).toBe(true)
    expect(result.stepErrors().credentials).toBeNull()
  })

  it('should handle name availability check in create mode', () => {
    const mockFormData = createMockFormData({
      name: 'Test Config',
      jira_server: 'https://test.atlassian.net',
      jira_email: 'test@example.com',
      jira_api_token: 'test-token',
    })
    const mockIsNameAvailable = () => false // Name is not available

    // In create mode, name availability should be checked
    const { result } = renderHook(() => useFormValidation(mockFormData, mockIsNameAvailable, false))

    // Validate the credentials step
    const isValid = result.validateStep('credentials')

    expect(isValid).toBe(false)
    expect(result.stepErrors().credentials).toBe('A configuration with this name already exists')
  })

  it('should update error state correctly', () => {
    const mockFormData = createMockFormData()
    const mockIsNameAvailable = () => null

    const { result } = renderHook(() => useFormValidation(mockFormData, mockIsNameAvailable, false))

    // Set an error
    result.setError('Test error message')

    expect(result.error()).toBe('Test error message')

    // Clear the error
    result.setError(null)

    expect(result.error()).toBeNull()
  })

  it('should update step errors correctly', () => {
    const mockFormData = createMockFormData()
    const mockIsNameAvailable = () => null

    const { result } = renderHook(() => useFormValidation(mockFormData, mockIsNameAvailable, false))

    // Set step errors
    result.setStepErrors({ credentials: 'Credentials error', project: 'Project error' })

    expect(result.stepErrors().credentials).toBe('Credentials error')
    expect(result.stepErrors().project).toBe('Project error')

    // Update just one step error
    result.setStepErrors(prev => ({ ...prev, credentials: null }))

    expect(result.stepErrors().credentials).toBeNull()
    expect(result.stepErrors().project).toBe('Project error')
  })
})
