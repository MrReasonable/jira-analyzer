/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCredentialsValidation } from './useCredentialsValidation'
import { jiraApi, JiraProject } from '../api/jiraApi'
import { FormData, StepError } from '../types/configurationForm'

// Mock the jiraApi and logger
vi.mock('../api/jiraApi', () => ({
  jiraApi: {
    validateCredentials: vi.fn(),
    getProjectsWithCredentials: vi.fn(),
  },
}))

vi.mock('@utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('useCredentialsValidation', () => {
  // Test data
  const mockFormData: FormData = {
    name: 'Test Config',
    jira_server: 'https://test.atlassian.net',
    jira_email: 'test@example.com',
    jira_api_token: 'test-token',
    jql_query: '',
    project_key: '',
    lead_time_start_state: '',
    lead_time_end_state: '',
    cycle_time_start_state: '',
    cycle_time_end_state: '',
  }

  const mockProjects: JiraProject[] = [
    { key: 'TEST', name: 'Test Project' },
    { key: 'DEV', name: 'Development Project' },
  ]

  // Setup functions
  let setError: (error: string | null) => void
  let setStepErrors: (updater: (prev: StepError) => StepError) => void
  let formDataSignal: () => FormData

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Setup mock functions
    setError = vi.fn()
    setStepErrors = vi.fn()
    formDataSignal = () => mockFormData

    // Setup API mock responses
    vi.mocked(jiraApi.validateCredentials).mockResolvedValue({
      status: 'success',
      message: 'Credentials valid',
    })

    vi.mocked(jiraApi.getProjectsWithCredentials).mockResolvedValue(mockProjects)
  })

  it('initializes with default values', () => {
    // Arrange & Act
    const { checkingCredentials, credentialsValid, projects } = useCredentialsValidation({
      formData: formDataSignal,
      setError,
      setStepErrors,
    })

    // Assert
    expect(checkingCredentials()).toBe(false)
    expect(credentialsValid()).toBe(false)
    expect(projects()).toEqual([])
  })

  // Note: We can't test getCredentials directly as it's not exposed by the hook

  it('validates credentials successfully', async () => {
    // Arrange
    const { validateCredentials, credentialsValid, projects } = useCredentialsValidation({
      formData: formDataSignal,
      setError,
      setStepErrors,
    })

    // Act
    await validateCredentials()

    // Assert
    expect(jiraApi.validateCredentials).toHaveBeenCalledWith({
      name: 'Test Config',
      jira_server: 'https://test.atlassian.net',
      jira_email: 'test@example.com',
      jira_api_token: 'test-token',
    })
    expect(jiraApi.getProjectsWithCredentials).toHaveBeenCalledWith({
      name: 'Test Config',
      jira_server: 'https://test.atlassian.net',
      jira_email: 'test@example.com',
      jira_api_token: 'test-token',
    })
    expect(credentialsValid()).toBe(true)
    expect(projects()).toEqual(mockProjects)
    expect(setError).toHaveBeenCalledWith(null)
  })

  it('handles validation failure', async () => {
    // Arrange
    vi.mocked(jiraApi.validateCredentials).mockResolvedValue({
      status: 'error',
      message: 'Invalid credentials',
    })

    const { validateCredentials, credentialsValid } = useCredentialsValidation({
      formData: formDataSignal,
      setError,
      setStepErrors,
    })

    // Act
    await validateCredentials()

    // Assert
    expect(credentialsValid()).toBe(false)
    expect(setStepErrors).toHaveBeenCalledWith(expect.any(Function))
    // Verify the updater function sets the credentials error
    const updater = vi.mocked(setStepErrors).mock.calls[0][0]
    const result = updater({ credentials: null, project: null })
    expect(result).toEqual({ credentials: 'Invalid credentials', project: null })
  })

  it('handles validation error', async () => {
    // Arrange
    const testError = new Error('API connection failed')
    vi.mocked(jiraApi.validateCredentials).mockRejectedValue(testError)

    const { validateCredentials } = useCredentialsValidation({
      formData: formDataSignal,
      setError,
      setStepErrors,
    })

    // Act & Assert
    await expect(validateCredentials()).rejects.toThrow('API connection failed')
    expect(setError).toHaveBeenCalledWith('API connection failed')
    expect(setStepErrors).toHaveBeenCalledWith(expect.any(Function))
  })

  it('calls onSuccess callback after successful validation', async () => {
    // Arrange
    const onSuccess = vi.fn()
    const { validateCredentials } = useCredentialsValidation({
      formData: formDataSignal,
      setError,
      setStepErrors,
    })

    // Act
    await validateCredentials(onSuccess)

    // Assert
    expect(onSuccess).toHaveBeenCalled()
  })

  it('checks credentials and fetches projects', async () => {
    // Arrange
    const { checkCredentials, projects } = useCredentialsValidation({
      formData: formDataSignal,
      setError,
      setStepErrors,
    })

    // Act
    await checkCredentials()

    // Assert
    expect(jiraApi.getProjectsWithCredentials).toHaveBeenCalledWith({
      name: 'Test Config',
      jira_server: 'https://test.atlassian.net',
      jira_email: 'test@example.com',
      jira_api_token: 'test-token',
    })
    expect(projects()).toEqual(mockProjects)
  })

  it('calls onSuccess callback with projects after checking credentials', async () => {
    // Arrange
    const onSuccess = vi.fn()
    const { checkCredentials } = useCredentialsValidation({
      formData: formDataSignal,
      setError,
      setStepErrors,
    })

    // Act
    await checkCredentials(onSuccess)

    // Assert
    expect(onSuccess).toHaveBeenCalledWith(mockProjects)
  })

  it('handles error when checking credentials', async () => {
    // Arrange
    const testError = new Error('Failed to fetch projects')
    vi.mocked(jiraApi.getProjectsWithCredentials).mockRejectedValue(testError)

    const { checkCredentials, checkingCredentials } = useCredentialsValidation({
      formData: formDataSignal,
      setError,
      setStepErrors,
    })

    // Act
    await checkCredentials()

    // Assert
    expect(setError).toHaveBeenCalledWith('Failed to fetch projects')
    expect(checkingCredentials()).toBe(false)
  })

  it('sets and resets checking credentials state', async () => {
    // Arrange
    // Create a delayed promise outside the nested functions
    const delayedPromise = new Promise<JiraProject[]>(resolve => {
      setTimeout(() => resolve(mockProjects), 100)
    })

    // Use the pre-created promise in the mock
    vi.mocked(jiraApi.getProjectsWithCredentials).mockReturnValue(delayedPromise)

    const { checkCredentials, checkingCredentials } = useCredentialsValidation({
      formData: formDataSignal,
      setError,
      setStepErrors,
    })

    // Act - Start checking
    const checkPromise = checkCredentials()

    // Assert - Should be checking
    expect(checkingCredentials()).toBe(true)

    // Wait for completion
    await checkPromise

    // Assert - Should be done checking
    expect(checkingCredentials()).toBe(false)
  })

  it('allows setting credentials valid state externally', () => {
    // Arrange
    const { credentialsValid, setCredentialsValid } = useCredentialsValidation({
      formData: formDataSignal,
      setError,
      setStepErrors,
    })

    // Initial state
    expect(credentialsValid()).toBe(false)

    // Act
    setCredentialsValid(true)

    // Assert
    expect(credentialsValid()).toBe(true)
  })

  it('allows setting projects externally', () => {
    // Arrange
    const customProjects: JiraProject[] = [{ key: 'CUSTOM', name: 'Custom Project' }]

    const { projects, setProjects } = useCredentialsValidation({
      formData: formDataSignal,
      setError,
      setStepErrors,
    })

    // Initial state
    expect(projects()).toEqual([])

    // Act
    setProjects(customProjects)

    // Assert
    expect(projects()).toEqual(customProjects)
  })
})
