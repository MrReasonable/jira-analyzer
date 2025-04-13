import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@solidjs/testing-library'
import { useFormSubmissionHandler } from './useFormSubmissionHandler'
import { jiraApi } from '@api/jiraApi'
import { FormStep, StepError } from '~types/configurationForm'

// Mock dependencies
vi.mock('@api/jiraApi', () => ({
  jiraApi: {
    createConfiguration: vi.fn(),
    updateConfiguration: vi.fn(),
  },
}))

vi.mock('@utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('useFormSubmissionHandler', () => {
  // Mock props
  const mockFormData = vi.fn()
  const mockSetError = vi.fn()
  const mockValidateStep = vi.fn()
  const mockSetCurrentStep = vi.fn()
  const mockIsLastStep = vi.fn()
  const mockGoToNextStep = vi.fn()
  const mockCheckNameAvailability = vi.fn()
  const mockIsNameAvailable = vi.fn()
  const mockOnConfigurationSaved = vi.fn()
  const mockSetStepErrors = vi.fn()

  // Sample form data
  const sampleFormData = {
    name: 'Test Config',
    jira_server: 'https://test.atlassian.net',
    jira_email: 'test@example.com',
    jira_api_token: 'test-token',
    jql_query: 'project = TEST',
    project_key: 'TEST',
    lead_time_start_state: '',
    lead_time_end_state: '',
    cycle_time_start_state: '',
    cycle_time_end_state: '',
  }

  // Sample configuration
  const sampleConfig = {
    name: 'Test Config',
    jira_server: 'https://test.atlassian.net',
    jira_email: 'test@example.com',
    jira_api_token: 'test-token',
    jql_query: 'project = TEST',
    project_key: 'TEST',
    workflow_states: [],
    lead_time_start_state: '',
    lead_time_end_state: '',
    cycle_time_start_state: '',
    cycle_time_end_state: '',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mock implementations
    mockFormData.mockReturnValue(sampleFormData)
    mockValidateStep.mockReturnValue(true)
    mockIsLastStep.mockReturnValue(false)
    mockGoToNextStep.mockResolvedValue(undefined)
    mockIsNameAvailable.mockReturnValue(true)
    mockSetStepErrors.mockImplementation(updater => {
      const prev: StepError = { credentials: null, project: null }
      return updater(prev)
    })

    // Mock API methods
    vi.mocked(jiraApi.createConfiguration).mockResolvedValue(sampleConfig)
    vi.mocked(jiraApi.updateConfiguration).mockResolvedValue(sampleConfig)
  })

  it('should move to next step if current step is valid and not the last step', async () => {
    const { result } = renderHook(() =>
      useFormSubmissionHandler({
        formData: mockFormData,
        setError: mockSetError,
        validateStep: mockValidateStep,
        currentStep: () => 'credentials' as FormStep,
        setCurrentStep: mockSetCurrentStep,
        isLastStep: mockIsLastStep,
        goToNextStep: mockGoToNextStep,
        checkNameAvailability: mockCheckNameAvailability,
        isNameAvailable: mockIsNameAvailable,
        onConfigurationSaved: mockOnConfigurationSaved,
        setStepErrors: mockSetStepErrors,
      })
    )

    const mockEvent = { preventDefault: vi.fn() }
    await result.handleSubmit(mockEvent as any)

    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(mockValidateStep).toHaveBeenCalledWith('credentials')
    expect(mockGoToNextStep).toHaveBeenCalled()
    expect(jiraApi.createConfiguration).not.toHaveBeenCalled()
    expect(jiraApi.updateConfiguration).not.toHaveBeenCalled()
  })

  it('should not proceed if current step validation fails', async () => {
    mockValidateStep.mockReturnValue(false)

    const { result } = renderHook(() =>
      useFormSubmissionHandler({
        formData: mockFormData,
        setError: mockSetError,
        validateStep: mockValidateStep,
        currentStep: () => 'credentials' as FormStep,
        setCurrentStep: mockSetCurrentStep,
        isLastStep: mockIsLastStep,
        goToNextStep: mockGoToNextStep,
        checkNameAvailability: mockCheckNameAvailability,
        isNameAvailable: mockIsNameAvailable,
        onConfigurationSaved: mockOnConfigurationSaved,
        setStepErrors: mockSetStepErrors,
      })
    )

    const mockEvent = { preventDefault: vi.fn() }
    await result.handleSubmit(mockEvent as any)

    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(mockValidateStep).toHaveBeenCalledWith('credentials')
    expect(mockGoToNextStep).not.toHaveBeenCalled()
    expect(jiraApi.createConfiguration).not.toHaveBeenCalled()
    expect(jiraApi.updateConfiguration).not.toHaveBeenCalled()
  })

  it('should create a new configuration when on the last step and all validations pass', async () => {
    mockIsLastStep.mockReturnValue(true)

    const { result } = renderHook(() =>
      useFormSubmissionHandler({
        formData: mockFormData,
        setError: mockSetError,
        validateStep: mockValidateStep,
        currentStep: () => 'project' as FormStep,
        setCurrentStep: mockSetCurrentStep,
        isLastStep: mockIsLastStep,
        goToNextStep: mockGoToNextStep,
        checkNameAvailability: mockCheckNameAvailability,
        isNameAvailable: mockIsNameAvailable,
        onConfigurationSaved: mockOnConfigurationSaved,
        setStepErrors: mockSetStepErrors,
      })
    )

    const mockEvent = { preventDefault: vi.fn() }
    await result.handleSubmit(mockEvent as any)

    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(mockValidateStep).toHaveBeenCalledWith('project')
    expect(mockCheckNameAvailability).toHaveBeenCalledWith('Test Config')
    expect(jiraApi.createConfiguration).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Config',
        jira_server: 'https://test.atlassian.net',
      })
    )
    expect(mockOnConfigurationSaved).toHaveBeenCalledWith('Test Config')
  })

  it('should update an existing configuration when in edit mode', async () => {
    mockIsLastStep.mockReturnValue(true)
    const initialConfig = { ...sampleConfig }

    const { result } = renderHook(() =>
      useFormSubmissionHandler({
        formData: mockFormData,
        setError: mockSetError,
        validateStep: mockValidateStep,
        currentStep: () => 'project' as FormStep,
        setCurrentStep: mockSetCurrentStep,
        isLastStep: mockIsLastStep,
        goToNextStep: mockGoToNextStep,
        checkNameAvailability: mockCheckNameAvailability,
        isNameAvailable: mockIsNameAvailable,
        onConfigurationSaved: mockOnConfigurationSaved,
        initialConfig,
        setStepErrors: mockSetStepErrors,
      })
    )

    const mockEvent = { preventDefault: vi.fn() }
    await result.handleSubmit(mockEvent as any)

    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(mockValidateStep).toHaveBeenCalledWith('project')
    expect(mockCheckNameAvailability).not.toHaveBeenCalled() // Should skip name check in edit mode
    expect(jiraApi.updateConfiguration).toHaveBeenCalledWith(
      'Test Config',
      expect.objectContaining({
        name: 'Test Config',
        jira_server: 'https://test.atlassian.net',
      })
    )
    expect(mockOnConfigurationSaved).toHaveBeenCalledWith('Test Config')
  })

  it('should not proceed if name is not available for a new configuration', async () => {
    mockIsLastStep.mockReturnValue(true)
    mockIsNameAvailable.mockReturnValue(false) // Name is not available

    const { result } = renderHook(() =>
      useFormSubmissionHandler({
        formData: mockFormData,
        setError: mockSetError,
        validateStep: mockValidateStep,
        currentStep: () => 'project' as FormStep,
        setCurrentStep: mockSetCurrentStep,
        isLastStep: mockIsLastStep,
        goToNextStep: mockGoToNextStep,
        checkNameAvailability: mockCheckNameAvailability,
        isNameAvailable: mockIsNameAvailable,
        onConfigurationSaved: mockOnConfigurationSaved,
        setStepErrors: mockSetStepErrors,
      })
    )

    const mockEvent = { preventDefault: vi.fn() }
    await result.handleSubmit(mockEvent as any)

    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(mockValidateStep).toHaveBeenCalledWith('project')
    expect(mockCheckNameAvailability).toHaveBeenCalledWith('Test Config')
    expect(mockSetStepErrors).toHaveBeenCalled()
    expect(mockSetCurrentStep).toHaveBeenCalledWith('credentials')
    expect(jiraApi.createConfiguration).not.toHaveBeenCalled()
  })

  it('should handle API errors when creating a configuration', async () => {
    mockIsLastStep.mockReturnValue(true)
    const error = new Error('API Error')
    vi.mocked(jiraApi.createConfiguration).mockRejectedValueOnce(error)

    const { result } = renderHook(() =>
      useFormSubmissionHandler({
        formData: mockFormData,
        setError: mockSetError,
        validateStep: mockValidateStep,
        currentStep: () => 'project' as FormStep,
        setCurrentStep: mockSetCurrentStep,
        isLastStep: mockIsLastStep,
        goToNextStep: mockGoToNextStep,
        checkNameAvailability: mockCheckNameAvailability,
        isNameAvailable: mockIsNameAvailable,
        onConfigurationSaved: mockOnConfigurationSaved,
        setStepErrors: mockSetStepErrors,
      })
    )

    const mockEvent = { preventDefault: vi.fn() }
    await result.handleSubmit(mockEvent as any)

    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(mockValidateStep).toHaveBeenCalledWith('project')
    expect(jiraApi.createConfiguration).toHaveBeenCalled()
    expect(mockSetError).toHaveBeenCalledWith('API Error')
    expect(mockOnConfigurationSaved).not.toHaveBeenCalled()
  })

  it('should handle API errors when updating a configuration', async () => {
    mockIsLastStep.mockReturnValue(true)
    const initialConfig = { ...sampleConfig }
    const error = new Error('API Error')
    vi.mocked(jiraApi.updateConfiguration).mockRejectedValueOnce(error)

    const { result } = renderHook(() =>
      useFormSubmissionHandler({
        formData: mockFormData,
        setError: mockSetError,
        validateStep: mockValidateStep,
        currentStep: () => 'project' as FormStep,
        setCurrentStep: mockSetCurrentStep,
        isLastStep: mockIsLastStep,
        goToNextStep: mockGoToNextStep,
        checkNameAvailability: mockCheckNameAvailability,
        isNameAvailable: mockIsNameAvailable,
        onConfigurationSaved: mockOnConfigurationSaved,
        initialConfig,
        setStepErrors: mockSetStepErrors,
      })
    )

    const mockEvent = { preventDefault: vi.fn() }
    await result.handleSubmit(mockEvent as any)

    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(mockValidateStep).toHaveBeenCalledWith('project')
    expect(jiraApi.updateConfiguration).toHaveBeenCalled()
    expect(mockSetError).toHaveBeenCalledWith('API Error')
    expect(mockOnConfigurationSaved).not.toHaveBeenCalled()
  })
})
