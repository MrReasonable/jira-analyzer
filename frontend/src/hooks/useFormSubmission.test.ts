import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@solidjs/testing-library'
import { useFormSubmission } from './useFormSubmission'
import { jiraApi } from '@api/jiraApi'
import { handleApiRequest } from '@utils/apiErrorHandler'
import { createConfigFromFormData } from '@utils/formValidators'

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

vi.mock('@utils/apiErrorHandler', () => ({
  handleApiRequest: vi.fn(),
}))

vi.mock('@utils/formValidators', () => ({
  createConfigFromFormData: vi.fn(),
}))

describe('useFormSubmission', () => {
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

    // Mock createConfigFromFormData
    vi.mocked(createConfigFromFormData).mockReturnValue(sampleConfig)

    // Mock handleApiRequest to call the success callback
    vi.mocked(handleApiRequest).mockImplementation(
      async (_request, _errorMsg, _setError, onSuccess) => {
        if (onSuccess) {
          onSuccess(sampleConfig)
        }
        return sampleConfig
      }
    )
  })

  it('should move to next step if current step is valid and not the last step', async () => {
    const { result } = renderHook(() =>
      useFormSubmission(
        mockFormData,
        mockSetError,
        mockValidateStep,
        mockSetCurrentStep,
        mockIsLastStep,
        mockGoToNextStep,
        mockCheckNameAvailability,
        mockIsNameAvailable,
        mockOnConfigurationSaved
      )
    )

    const mockEvent = { preventDefault: vi.fn() }
    await result.handleSubmit(mockEvent as any)

    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(mockSetError).toHaveBeenCalledWith(null)
    expect(mockValidateStep).toHaveBeenCalled()
    expect(mockGoToNextStep).toHaveBeenCalled()
    expect(jiraApi.createConfiguration).not.toHaveBeenCalled()
    expect(jiraApi.updateConfiguration).not.toHaveBeenCalled()
  })

  it('should not proceed if current step validation fails', async () => {
    mockValidateStep.mockReturnValue(false)

    const { result } = renderHook(() =>
      useFormSubmission(
        mockFormData,
        mockSetError,
        mockValidateStep,
        mockSetCurrentStep,
        mockIsLastStep,
        mockGoToNextStep,
        mockCheckNameAvailability,
        mockIsNameAvailable,
        mockOnConfigurationSaved
      )
    )

    const mockEvent = { preventDefault: vi.fn() }
    await result.handleSubmit(mockEvent as any)

    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(mockSetError).toHaveBeenCalledWith(null)
    expect(mockValidateStep).toHaveBeenCalled()
    expect(mockGoToNextStep).not.toHaveBeenCalled()
    expect(jiraApi.createConfiguration).not.toHaveBeenCalled()
    expect(jiraApi.updateConfiguration).not.toHaveBeenCalled()
  })

  it('should create a new configuration when on the last step and all validations pass', async () => {
    mockIsLastStep.mockReturnValue(true)

    const { result } = renderHook(() =>
      useFormSubmission(
        mockFormData,
        mockSetError,
        mockValidateStep,
        mockSetCurrentStep,
        mockIsLastStep,
        mockGoToNextStep,
        mockCheckNameAvailability,
        mockIsNameAvailable,
        mockOnConfigurationSaved
      )
    )

    const mockEvent = { preventDefault: vi.fn() }
    await result.handleSubmit(mockEvent as any)

    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(mockSetError).toHaveBeenCalledWith(null)
    expect(mockValidateStep).toHaveBeenCalledTimes(3) // Once for current step, then for 'credentials' and 'project'
    expect(createConfigFromFormData).toHaveBeenCalledWith(sampleFormData)
    expect(handleApiRequest).toHaveBeenCalled()
    expect(mockOnConfigurationSaved).toHaveBeenCalledWith('Test Config')
  })

  it('should update an existing configuration when in edit mode', async () => {
    mockIsLastStep.mockReturnValue(true)
    const initialConfig = { ...sampleConfig }

    const { result } = renderHook(() =>
      useFormSubmission(
        mockFormData,
        mockSetError,
        mockValidateStep,
        mockSetCurrentStep,
        mockIsLastStep,
        mockGoToNextStep,
        mockCheckNameAvailability,
        mockIsNameAvailable,
        mockOnConfigurationSaved,
        initialConfig
      )
    )

    const mockEvent = { preventDefault: vi.fn() }
    await result.handleSubmit(mockEvent as any)

    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(mockSetError).toHaveBeenCalledWith(null)
    expect(mockValidateStep).toHaveBeenCalledTimes(3) // Once for current step, then for 'credentials' and 'project'
    expect(createConfigFromFormData).toHaveBeenCalledWith(sampleFormData)
    expect(handleApiRequest).toHaveBeenCalled()
    expect(mockOnConfigurationSaved).toHaveBeenCalledWith('Test Config')
  })

  it('should check name availability before submitting a new configuration', async () => {
    mockIsLastStep.mockReturnValue(true)
    mockIsNameAvailable.mockReturnValue(null) // Initial state before checking

    const { result } = renderHook(() =>
      useFormSubmission(
        mockFormData,
        mockSetError,
        mockValidateStep,
        mockSetCurrentStep,
        mockIsLastStep,
        mockGoToNextStep,
        mockCheckNameAvailability,
        mockIsNameAvailable,
        mockOnConfigurationSaved
      )
    )

    const mockEvent = { preventDefault: vi.fn() }
    await result.handleSubmit(mockEvent as any)

    expect(mockCheckNameAvailability).toHaveBeenCalledWith('Test Config')
  })

  it('should not proceed if name is not available for a new configuration', async () => {
    mockIsLastStep.mockReturnValue(true)
    mockIsNameAvailable.mockReturnValue(false) // Name is not available

    const { result } = renderHook(() =>
      useFormSubmission(
        mockFormData,
        mockSetError,
        mockValidateStep,
        mockSetCurrentStep,
        mockIsLastStep,
        mockGoToNextStep,
        mockCheckNameAvailability,
        mockIsNameAvailable,
        mockOnConfigurationSaved
      )
    )

    const mockEvent = { preventDefault: vi.fn() }
    await result.handleSubmit(mockEvent as any)

    expect(mockSetError).toHaveBeenCalledWith(
      'A configuration with this name already exists. Please choose a different name.'
    )
    expect(mockSetCurrentStep).toHaveBeenCalledWith('credentials')
    expect(createConfigFromFormData).not.toHaveBeenCalled()
    expect(handleApiRequest).not.toHaveBeenCalled()
  })

  it('should skip name availability check in edit mode', async () => {
    mockIsLastStep.mockReturnValue(true)
    const initialConfig = { ...sampleConfig }

    const { result } = renderHook(() =>
      useFormSubmission(
        mockFormData,
        mockSetError,
        mockValidateStep,
        mockSetCurrentStep,
        mockIsLastStep,
        mockGoToNextStep,
        mockCheckNameAvailability,
        mockIsNameAvailable,
        mockOnConfigurationSaved,
        initialConfig
      )
    )

    const mockEvent = { preventDefault: vi.fn() }
    await result.handleSubmit(mockEvent as any)

    expect(mockCheckNameAvailability).not.toHaveBeenCalled()
    expect(createConfigFromFormData).toHaveBeenCalledWith(sampleFormData)
    expect(handleApiRequest).toHaveBeenCalled()
  })

  it('should set current step to the first invalid step if any validation fails', async () => {
    mockIsLastStep.mockReturnValue(true)
    // Make the 'project' step validation fail
    mockValidateStep.mockImplementation(step => step !== 'project')

    const { result } = renderHook(() =>
      useFormSubmission(
        mockFormData,
        mockSetError,
        mockValidateStep,
        mockSetCurrentStep,
        mockIsLastStep,
        mockGoToNextStep,
        mockCheckNameAvailability,
        mockIsNameAvailable,
        mockOnConfigurationSaved
      )
    )

    const mockEvent = { preventDefault: vi.fn() }
    await result.handleSubmit(mockEvent as any)

    expect(mockSetCurrentStep).toHaveBeenCalledWith('project')
    expect(createConfigFromFormData).not.toHaveBeenCalled()
    expect(handleApiRequest).not.toHaveBeenCalled()
  })
})
