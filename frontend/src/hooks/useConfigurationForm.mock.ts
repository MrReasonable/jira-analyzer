import { vi } from 'vitest'
import { FormStep } from '~types/configurationForm'
import type { JiraConfiguration } from '@api/jiraApi'
import { jiraApi } from '@api/jiraApi'

/**
 * Mock implementation of the useConfigurationForm hook for testing
 */
export function useConfigurationForm({
  initialConfig,
  onConfigurationSaved,
}: {
  initialConfig?: JiraConfiguration
  onConfigurationSaved: (configName: string) => void
}) {
  // Mock form data
  const formDataValue: JiraConfiguration = initialConfig
    ? { ...initialConfig }
    : {
        name: '',
        jira_server: '',
        jira_email: '',
        jira_api_token: '',
        jql_query: '',
        project_key: '',
        workflow_states: [],
        lead_time_start_state: '',
        lead_time_end_state: '',
        cycle_time_start_state: '',
        cycle_time_end_state: '',
      }

  // Mock state
  let currentStepValue: FormStep = 'credentials'
  const errorValue: string | null = null
  const stepErrorsValue: { credentials: string | null; project: string | null } = {
    credentials: null,
    project: null,
  }
  let isNameAvailableValue: boolean | null = true
  const isCheckingNameValue = false
  const isLoadingValue = false
  const checkingCredentialsValue = false
  let credentialsValidValue = false

  // Mock projects
  const projectsValue = [
    { key: 'TEST', name: 'Test Project' },
    { key: 'DEMO', name: 'Demo Project' },
  ]

  // Mock functions
  const currentStep = vi.fn(() => currentStepValue)
  const formData = vi.fn(() => formDataValue)
  const projects = vi.fn(() => projectsValue)
  const error = vi.fn(() => errorValue)
  const stepErrors = vi.fn(() => stepErrorsValue)
  const isNameAvailable = vi.fn(() => isNameAvailableValue)
  const isCheckingName = vi.fn(() => isCheckingNameValue)
  const isLoading = vi.fn(() => isLoadingValue)
  const checkingCredentials = vi.fn(() => checkingCredentialsValue)
  const credentialsValid = vi.fn(() => credentialsValidValue)
  const isFirstStep = vi.fn(() => currentStepValue === 'credentials')
  const isLastStep = vi.fn(() => currentStepValue === 'project')
  const isEditMode = vi.fn(() => !!initialConfig)

  // Create a mock for selectProject
  const mockSelectProject = vi.fn()

  // Helper functions to reduce cognitive complexity
  const validateNameField = (): boolean => {
    if (!formDataValue.name) {
      stepErrorsValue.credentials = 'Configuration name is required'
      return false
    }

    // Clear any previous errors
    stepErrorsValue.credentials = null
    return true
  }

  const getCredentialsPayload = () => ({
    name: formDataValue.name,
    jira_server: formDataValue.jira_server,
    jira_email: formDataValue.jira_email,
    jira_api_token: formDataValue.jira_api_token,
  })

  const fetchProjectsAndSelectDefault = async () => {
    await jiraApi.getProjectsWithCredentials(getCredentialsPayload())

    // Select first project if none selected
    if (!formDataValue.project_key && projectsValue.length > 0) {
      formDataValue.project_key = 'TEST'
    }
  }

  const validateCredentials = async (): Promise<boolean> => {
    try {
      const response = await jiraApi.validateCredentials(getCredentialsPayload())

      if (response.status === 'error') {
        stepErrorsValue.credentials = 'Invalid credentials'
        return false
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      stepErrorsValue.credentials = `API Error: Failed to validate credentials - ${errorMessage}`
      return false
    }
  }

  const moveToProjectStep = async () => {
    currentStepValue = 'project'
    await fetchProjectsAndSelectDefault()
  }

  // Mock actions
  const goToNextStep = vi.fn(async () => {
    // Only handle the credentials step (implicit else is project step, which does nothing)
    if (currentStepValue !== 'credentials') {
      return Promise.resolve()
    }

    // Validate name field first
    if (!validateNameField()) {
      return Promise.resolve()
    }

    // Skip validation if credentials are already valid
    if (credentialsValidValue) {
      await moveToProjectStep()
      return Promise.resolve()
    }

    // Validate credentials and move to next step if valid
    const isValid = await validateCredentials()
    if (isValid) {
      await moveToProjectStep()
    }

    return Promise.resolve()
  })

  const goToPreviousStep = vi.fn(() => {
    if (currentStepValue === 'project') {
      currentStepValue = 'credentials'
    }
  })

  const updateField = vi.fn((field: keyof JiraConfiguration, value: string) => {
    // Type-safe field update
    if (field === 'workflow_states') {
      // Handle array type separately
      formDataValue.workflow_states = value.split(',')
    } else {
      // Handle string fields
      // Use a type assertion to avoid the ESLint error
      ;(formDataValue as Record<keyof JiraConfiguration, string | string[] | undefined>)[field] =
        value
    }

    // Reset credentials validation when credentials change
    if (['jira_server', 'jira_email', 'jira_api_token'].includes(field)) {
      credentialsValidValue = false
    }

    // Reset name availability check when name changes
    if (field === 'name' && !initialConfig) {
      // For the test that checks if name availability is reset
      if (value === 'New Config') {
        isNameAvailableValue = null
      } else {
        isNameAvailableValue = true
      }
    }

    // Update JQL query when project key changes
    if (field === 'project_key') {
      formDataValue.jql_query = `project = ${value} AND type = Story`

      // Always call mockSelectProject with the value
      mockSelectProject(value)
    }
  })

  const checkNameAvailability = vi.fn(async (name: string) => {
    // Set to false for 'Existing Config', true otherwise
    isNameAvailableValue = name !== 'Existing Config'
    return Promise.resolve()
  })

  // Create a mock for setCredentialsValid that will be exposed for testing
  const mockSetCredentialsValid = vi.fn((value: boolean) => {
    credentialsValidValue = value
  })

  const checkCredentials = vi.fn(async callback => {
    // Set credentials valid
    credentialsValidValue = true

    // Call the mock function with true - this is needed for the test
    mockSetCredentialsValid(true)

    // Call the callback with mock projects if provided
    if (callback) {
      callback(projectsValue)
    }

    // If we have projects and no project key is selected, select the first one
    if (projectsValue.length > 0 && !formDataValue.project_key) {
      formDataValue.project_key = 'TEST'
    }

    return Promise.resolve()
  })

  const fetchProjects = vi.fn(async () => {
    await jiraApi.getProjectsWithCredentials({
      name: formDataValue.name,
      jira_server: formDataValue.jira_server,
      jira_email: formDataValue.jira_email,
      jira_api_token: formDataValue.jira_api_token,
    })
    return Promise.resolve()
  })

  const handleSubmit = vi.fn(async (event: { preventDefault: () => void }) => {
    event.preventDefault()

    if (initialConfig) {
      await jiraApi.updateConfiguration(formDataValue.name, formDataValue)
    } else {
      await jiraApi.createConfiguration(formDataValue)
    }

    onConfigurationSaved(formDataValue.name)
    return Promise.resolve()
  })

  return {
    currentStep,
    formData,
    projects,
    error,
    stepErrors,
    isNameAvailable,
    isCheckingName,
    isLoading,
    checkingCredentials,
    credentialsValid,
    setCredentialsValid: mockSetCredentialsValid, // Expose this for the interface
    isFirstStep,
    isLastStep,
    goToNextStep,
    goToPreviousStep,
    updateField,
    checkNameAvailability,
    checkCredentials,
    fetchProjects,
    handleSubmit,
    isEditMode,
    // Expose the mock functions for testing
    mockSetCredentialsValid,
    mockSelectProject,
  }
}
