/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import { createStepValidators, createConfigFromFormData } from './formValidators'
import { FormData } from '~types/configurationForm'

// Mock the JiraConfiguration type if needed
vi.mock('@api/jiraApi', () => ({
  // Empty mock, we just need the type
}))

describe('formValidators', () => {
  // Mock FormData for testing
  const createMockFormData = (overrides: Partial<FormData> = {}): FormData => ({
    name: 'Test Config',
    jira_server: 'https://test.atlassian.net',
    jira_email: 'test@example.com',
    jira_api_token: 'test-token',
    project_key: 'TEST',
    jql_query: 'project = TEST',
    lead_time_start_state: '',
    lead_time_end_state: '',
    cycle_time_start_state: '',
    cycle_time_end_state: '',
    ...overrides,
  })

  describe('createStepValidators', () => {
    describe('validateCredentialsStep', () => {
      it('should validate a valid configuration', () => {
        // Arrange
        const mockFormData = createMockFormData()
        const formDataFn = vi.fn().mockReturnValue(mockFormData)
        const isNameAvailable = vi.fn().mockReturnValue(true)
        const isEditMode = false

        // Act
        const validators = createStepValidators(formDataFn, isNameAvailable, isEditMode)
        const result = validators.validateCredentialsStep()

        // Assert
        expect(result.isValid).toBe(true)
        expect(result.errorMessage).toBeNull()
      })

      it('should return error when name is missing', () => {
        // Arrange
        const mockFormData = createMockFormData({ name: '' })
        const formDataFn = vi.fn().mockReturnValue(mockFormData)
        const isNameAvailable = vi.fn().mockReturnValue(true)
        const isEditMode = false

        // Act
        const validators = createStepValidators(formDataFn, isNameAvailable, isEditMode)
        const result = validators.validateCredentialsStep()

        // Assert
        expect(result.isValid).toBe(false)
        expect(result.errorMessage).toBe('Configuration name is required')
      })

      it('should return error when name is not available in non-edit mode', () => {
        // Arrange
        const mockFormData = createMockFormData()
        const formDataFn = vi.fn().mockReturnValue(mockFormData)
        const isNameAvailable = vi.fn().mockReturnValue(false)
        const isEditMode = false

        // Act
        const validators = createStepValidators(formDataFn, isNameAvailable, isEditMode)
        const result = validators.validateCredentialsStep()

        // Assert
        expect(result.isValid).toBe(false)
        expect(result.errorMessage).toBe(
          'A configuration with this name already exists. Please choose a different name.'
        )
      })

      it('should allow existing name in edit mode', () => {
        // Arrange
        const mockFormData = createMockFormData()
        const formDataFn = vi.fn().mockReturnValue(mockFormData)
        const isNameAvailable = vi.fn().mockReturnValue(false)
        const isEditMode = true

        // Act
        const validators = createStepValidators(formDataFn, isNameAvailable, isEditMode)
        const result = validators.validateCredentialsStep()

        // Assert
        expect(result.isValid).toBe(true)
        expect(result.errorMessage).toBeNull()
      })

      it('should return error when jira_server is missing', () => {
        // Arrange
        const mockFormData = createMockFormData({ jira_server: '' })
        const formDataFn = vi.fn().mockReturnValue(mockFormData)
        const isNameAvailable = vi.fn().mockReturnValue(true)
        const isEditMode = false

        // Act
        const validators = createStepValidators(formDataFn, isNameAvailable, isEditMode)
        const result = validators.validateCredentialsStep()

        // Assert
        expect(result.isValid).toBe(false)
        expect(result.errorMessage).toBe('Jira server URL is required')
      })

      it('should return error when jira_email is missing', () => {
        // Arrange
        const mockFormData = createMockFormData({ jira_email: '' })
        const formDataFn = vi.fn().mockReturnValue(mockFormData)
        const isNameAvailable = vi.fn().mockReturnValue(true)
        const isEditMode = false

        // Act
        const validators = createStepValidators(formDataFn, isNameAvailable, isEditMode)
        const result = validators.validateCredentialsStep()

        // Assert
        expect(result.isValid).toBe(false)
        expect(result.errorMessage).toBe('Jira email is required')
      })

      it('should return error when jira_api_token is missing', () => {
        // Arrange
        const mockFormData = createMockFormData({ jira_api_token: '' })
        const formDataFn = vi.fn().mockReturnValue(mockFormData)
        const isNameAvailable = vi.fn().mockReturnValue(true)
        const isEditMode = false

        // Act
        const validators = createStepValidators(formDataFn, isNameAvailable, isEditMode)
        const result = validators.validateCredentialsStep()

        // Assert
        expect(result.isValid).toBe(false)
        expect(result.errorMessage).toBe('Jira API token is required')
      })

      it('should handle null isNameAvailable value', () => {
        // Arrange
        const mockFormData = createMockFormData()
        const formDataFn = vi.fn().mockReturnValue(mockFormData)
        const isNameAvailable = vi.fn().mockReturnValue(null)
        const isEditMode = false

        // Act
        const validators = createStepValidators(formDataFn, isNameAvailable, isEditMode)
        const result = validators.validateCredentialsStep()

        // Assert
        expect(result.isValid).toBe(true)
        expect(result.errorMessage).toBeNull()
      })
    })

    describe('validateProjectStep', () => {
      it('should validate a valid project configuration', () => {
        // Arrange
        const mockFormData = createMockFormData()
        const formDataFn = vi.fn().mockReturnValue(mockFormData)
        const isNameAvailable = vi.fn().mockReturnValue(true)
        const isEditMode = false

        // Act
        const validators = createStepValidators(formDataFn, isNameAvailable, isEditMode)
        const result = validators.validateProjectStep()

        // Assert
        expect(result.isValid).toBe(true)
        expect(result.errorMessage).toBeNull()
      })

      it('should return error when project_key is missing', () => {
        // Arrange
        const mockFormData = createMockFormData({ project_key: '' })
        const formDataFn = vi.fn().mockReturnValue(mockFormData)
        const isNameAvailable = vi.fn().mockReturnValue(true)
        const isEditMode = false

        // Act
        const validators = createStepValidators(formDataFn, isNameAvailable, isEditMode)
        const result = validators.validateProjectStep()

        // Assert
        expect(result.isValid).toBe(false)
        expect(result.errorMessage).toBe('Project selection is required')
      })

      it('should return error when jql_query is missing', () => {
        // Arrange
        const mockFormData = createMockFormData({ jql_query: '' })
        const formDataFn = vi.fn().mockReturnValue(mockFormData)
        const isNameAvailable = vi.fn().mockReturnValue(true)
        const isEditMode = false

        // Act
        const validators = createStepValidators(formDataFn, isNameAvailable, isEditMode)
        const result = validators.validateProjectStep()

        // Assert
        expect(result.isValid).toBe(false)
        expect(result.errorMessage).toBe('JQL query is required')
      })
    })
  })

  describe('createConfigFromFormData', () => {
    it('should create a configuration object from form data', () => {
      // Arrange
      const formData = createMockFormData()

      // Act
      const result = createConfigFromFormData(formData)

      // Assert
      expect(result).toEqual({
        name: 'Test Config',
        jira_server: 'https://test.atlassian.net',
        jira_email: 'test@example.com',
        jira_api_token: 'test-token',
        project_key: 'TEST',
        jql_query: 'project = TEST',
        workflow_states: [],
        lead_time_start_state: '',
        lead_time_end_state: '',
        cycle_time_start_state: '',
        cycle_time_end_state: '',
      })
    })

    it('should set default values for missing fields', () => {
      // Arrange
      const minimalFormData: FormData = {
        name: 'Minimal Config',
        jira_server: 'https://minimal.atlassian.net',
        jira_email: 'minimal@example.com',
        jira_api_token: 'minimal-token',
        project_key: 'MIN',
        jql_query: 'project = MIN',
        lead_time_start_state: '',
        lead_time_end_state: '',
        cycle_time_start_state: '',
        cycle_time_end_state: '',
      }

      // Act
      const result = createConfigFromFormData(minimalFormData)

      // Assert
      expect(result).toEqual({
        name: 'Minimal Config',
        jira_server: 'https://minimal.atlassian.net',
        jira_email: 'minimal@example.com',
        jira_api_token: 'minimal-token',
        project_key: 'MIN',
        jql_query: 'project = MIN',
        workflow_states: [],
        lead_time_start_state: '',
        lead_time_end_state: '',
        cycle_time_start_state: '',
        cycle_time_end_state: '',
      })
    })

    it('should handle empty workflow states', () => {
      // Arrange
      const formData = createMockFormData()

      // Act
      const result = createConfigFromFormData(formData)

      // Assert
      expect(result.workflow_states).toEqual([])
    })
  })
})
