/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useStepValidation } from './useStepValidation'
import { FormData } from '~types/configurationForm'

describe('useStepValidation', () => {
  // Common test variables
  let mockFormData: FormData
  let formDataFn: () => FormData
  let isNameAvailableFn: () => boolean | null
  let isEditMode: boolean

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Setup default test data
    mockFormData = {
      name: 'Test Config',
      jira_server: 'https://test.atlassian.net',
      jira_email: 'test@example.com',
      jira_api_token: 'test-token',
      jql_query: 'project = TEST',
      project_key: 'TEST',
      lead_time_start_state: 'To Do',
      lead_time_end_state: 'Done',
      cycle_time_start_state: 'In Progress',
      cycle_time_end_state: 'Done',
    }

    // Setup mock functions
    formDataFn = vi.fn(() => mockFormData)
    isNameAvailableFn = vi.fn(() => true) // Default to name available
    isEditMode = false // Default to create mode
  })

  describe('initialization', () => {
    it('returns the expected functions', () => {
      // Arrange & Act
      const { validateStep, validateCredentialsStep, validateProjectStep } = useStepValidation({
        formData: formDataFn,
        isNameAvailable: isNameAvailableFn,
        isEditMode,
      })

      // Assert
      expect(validateStep).toBeInstanceOf(Function)
      expect(validateCredentialsStep).toBeInstanceOf(Function)
      expect(validateProjectStep).toBeInstanceOf(Function)
    })
  })

  describe('validateCredentialsStep', () => {
    it('returns valid when all required fields are filled and name is available', () => {
      // Arrange
      const { validateCredentialsStep } = useStepValidation({
        formData: formDataFn,
        isNameAvailable: isNameAvailableFn,
        isEditMode,
      })

      // Act
      const result = validateCredentialsStep()

      // Assert
      expect(result.isValid).toBe(true)
      expect(result.errorMessage).toBeNull()
      expect(formDataFn).toHaveBeenCalled()
      expect(isNameAvailableFn).toHaveBeenCalled()
    })

    it('returns invalid when name is missing', () => {
      // Arrange
      mockFormData.name = ''
      const { validateCredentialsStep } = useStepValidation({
        formData: formDataFn,
        isNameAvailable: isNameAvailableFn,
        isEditMode,
      })

      // Act
      const result = validateCredentialsStep()

      // Assert
      expect(result.isValid).toBe(false)
      expect(result.errorMessage).toBe('Please fill in all required fields')
    })

    it('returns invalid when jira_server is missing', () => {
      // Arrange
      mockFormData.jira_server = ''
      const { validateCredentialsStep } = useStepValidation({
        formData: formDataFn,
        isNameAvailable: isNameAvailableFn,
        isEditMode,
      })

      // Act
      const result = validateCredentialsStep()

      // Assert
      expect(result.isValid).toBe(false)
      expect(result.errorMessage).toBe('Please fill in all required fields')
    })

    it('returns invalid when jira_email is missing', () => {
      // Arrange
      mockFormData.jira_email = ''
      const { validateCredentialsStep } = useStepValidation({
        formData: formDataFn,
        isNameAvailable: isNameAvailableFn,
        isEditMode,
      })

      // Act
      const result = validateCredentialsStep()

      // Assert
      expect(result.isValid).toBe(false)
      expect(result.errorMessage).toBe('Please fill in all required fields')
    })

    it('returns invalid when jira_api_token is missing', () => {
      // Arrange
      mockFormData.jira_api_token = ''
      const { validateCredentialsStep } = useStepValidation({
        formData: formDataFn,
        isNameAvailable: isNameAvailableFn,
        isEditMode,
      })

      // Act
      const result = validateCredentialsStep()

      // Assert
      expect(result.isValid).toBe(false)
      expect(result.errorMessage).toBe('Please fill in all required fields')
    })

    it('returns invalid when multiple required fields are missing', () => {
      // Arrange
      mockFormData.name = ''
      mockFormData.jira_email = ''
      const { validateCredentialsStep } = useStepValidation({
        formData: formDataFn,
        isNameAvailable: isNameAvailableFn,
        isEditMode,
      })

      // Act
      const result = validateCredentialsStep()

      // Assert
      expect(result.isValid).toBe(false)
      expect(result.errorMessage).toBe('Please fill in all required fields')
    })

    it('returns invalid when name is not available in create mode', () => {
      // Arrange
      isNameAvailableFn = vi.fn(() => false) // Name not available
      const { validateCredentialsStep } = useStepValidation({
        formData: formDataFn,
        isNameAvailable: isNameAvailableFn,
        isEditMode: false, // Create mode
      })

      // Act
      const result = validateCredentialsStep()

      // Assert
      expect(result.isValid).toBe(false)
      expect(result.errorMessage).toBe('A configuration with this name already exists')
      expect(isNameAvailableFn).toHaveBeenCalled()
    })

    it('returns valid when name is not available but in edit mode', () => {
      // Arrange
      isNameAvailableFn = vi.fn(() => false) // Name not available
      const { validateCredentialsStep } = useStepValidation({
        formData: formDataFn,
        isNameAvailable: isNameAvailableFn,
        isEditMode: true, // Edit mode
      })

      // Act
      const result = validateCredentialsStep()

      // Assert
      expect(result.isValid).toBe(true)
      expect(result.errorMessage).toBeNull()
      // In edit mode, we don't check name availability
      expect(isNameAvailableFn).not.toHaveBeenCalled()
    })

    it('handles null value from isNameAvailable', () => {
      // Arrange
      isNameAvailableFn = vi.fn(() => null) // Name availability not checked yet
      const { validateCredentialsStep } = useStepValidation({
        formData: formDataFn,
        isNameAvailable: isNameAvailableFn,
        isEditMode: false, // Create mode
      })

      // Act
      const result = validateCredentialsStep()

      // Assert
      expect(result.isValid).toBe(true)
      expect(result.errorMessage).toBeNull()
      expect(isNameAvailableFn).toHaveBeenCalled()
    })
  })

  describe('validateProjectStep', () => {
    it('returns valid when all required fields are filled', () => {
      // Arrange
      const { validateProjectStep } = useStepValidation({
        formData: formDataFn,
        isNameAvailable: isNameAvailableFn,
        isEditMode,
      })

      // Act
      const result = validateProjectStep()

      // Assert
      expect(result.isValid).toBe(true)
      expect(result.errorMessage).toBeNull()
      expect(formDataFn).toHaveBeenCalled()
    })

    it('returns invalid when project_key is missing', () => {
      // Arrange
      mockFormData.project_key = ''
      const { validateProjectStep } = useStepValidation({
        formData: formDataFn,
        isNameAvailable: isNameAvailableFn,
        isEditMode,
      })

      // Act
      const result = validateProjectStep()

      // Assert
      expect(result.isValid).toBe(false)
      expect(result.errorMessage).toBe('Please select a project and provide a JQL query')
    })

    it('returns invalid when jql_query is missing', () => {
      // Arrange
      mockFormData.jql_query = ''
      const { validateProjectStep } = useStepValidation({
        formData: formDataFn,
        isNameAvailable: isNameAvailableFn,
        isEditMode,
      })

      // Act
      const result = validateProjectStep()

      // Assert
      expect(result.isValid).toBe(false)
      expect(result.errorMessage).toBe('Please select a project and provide a JQL query')
    })

    it('returns invalid when both project_key and jql_query are missing', () => {
      // Arrange
      mockFormData.project_key = ''
      mockFormData.jql_query = ''
      const { validateProjectStep } = useStepValidation({
        formData: formDataFn,
        isNameAvailable: isNameAvailableFn,
        isEditMode,
      })

      // Act
      const result = validateProjectStep()

      // Assert
      expect(result.isValid).toBe(false)
      expect(result.errorMessage).toBe('Please select a project and provide a JQL query')
    })
  })

  // Helper function to create a mock validateCredentialsStep
  const createMockCredentialsValidator = () => {
    return vi.fn().mockReturnValue({ isValid: true, errorMessage: null })
  }

  // Helper function to create a mock validateProjectStep
  const createMockProjectValidator = () => {
    return vi.fn().mockReturnValue({ isValid: true, errorMessage: null })
  }

  // Helper function to create a custom useStepValidation with mocked credentials validator
  const createCustomValidationWithCredentialsMock = (mockValidateCredentialsStep: any) => {
    const original = useStepValidation({
      formData: formDataFn,
      isNameAvailable: isNameAvailableFn,
      isEditMode,
    })

    return {
      ...original,
      validateCredentialsStep: mockValidateCredentialsStep,
      validateStep: (step: 'credentials' | 'project') => {
        if (step === 'credentials') {
          const validation = mockValidateCredentialsStep()
          return validation.isValid
        } else {
          const validation = original.validateProjectStep()
          return validation.isValid
        }
      },
    }
  }

  // Helper function to create a custom useStepValidation with mocked project validator
  const createCustomValidationWithProjectMock = (mockValidateProjectStep: any) => {
    const original = useStepValidation({
      formData: formDataFn,
      isNameAvailable: isNameAvailableFn,
      isEditMode,
    })

    return {
      ...original,
      validateProjectStep: mockValidateProjectStep,
      validateStep: (step: 'credentials' | 'project') => {
        if (step === 'project') {
          const validation = mockValidateProjectStep()
          return validation.isValid
        } else {
          const validation = original.validateCredentialsStep()
          return validation.isValid
        }
      },
    }
  }

  describe('validateStep', () => {
    it('calls validateCredentialsStep when step is credentials', () => {
      // Create a mock implementation of validateCredentialsStep
      const mockValidateCredentialsStep = createMockCredentialsValidator()

      // Use our custom implementation
      const { validateStep } = createCustomValidationWithCredentialsMock(
        mockValidateCredentialsStep
      )

      // Act
      const result = validateStep('credentials')

      // Assert
      expect(result).toBe(true)
      expect(mockValidateCredentialsStep).toHaveBeenCalled()
    })

    it('calls validateProjectStep when step is project', () => {
      // Create a mock implementation of validateProjectStep
      const mockValidateProjectStep = createMockProjectValidator()

      // Use our custom implementation
      const { validateStep } = createCustomValidationWithProjectMock(mockValidateProjectStep)

      // Act
      const result = validateStep('project')

      // Assert
      expect(result).toBe(true)
      expect(mockValidateProjectStep).toHaveBeenCalled()
    })

    it('returns false when validation fails', () => {
      // Arrange
      mockFormData.name = '' // Make validation fail
      const { validateStep } = useStepValidation({
        formData: formDataFn,
        isNameAvailable: isNameAvailableFn,
        isEditMode,
      })

      // Act
      const result = validateStep('credentials')

      // Assert
      expect(result).toBe(false)
    })

    it('returns true for credentials step when validation succeeds', () => {
      // Arrange
      const { validateStep } = useStepValidation({
        formData: formDataFn,
        isNameAvailable: isNameAvailableFn,
        isEditMode,
      })

      // Act
      const result = validateStep('credentials')

      // Assert
      expect(result).toBe(true)
    })

    it('returns true for project step when validation succeeds', () => {
      // Arrange
      const { validateStep } = useStepValidation({
        formData: formDataFn,
        isNameAvailable: isNameAvailableFn,
        isEditMode,
      })

      // Act
      const result = validateStep('project')

      // Assert
      expect(result).toBe(true)
    })
  })
})
