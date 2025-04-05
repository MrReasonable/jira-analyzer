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

  // Mock actions
  const goToNextStep = vi.fn(async () => {
    // Check if we're on the credentials step
    if (currentStepValue === 'credentials') {
      // Validate the form fields
      if (!formDataValue.name) {
        stepErrorsValue.credentials = 'Configuration name is required'
        return Promise.resolve()
      }

      // Clear any previous errors
      stepErrorsValue.credentials = null

      // For the skips credentials validation test
      // Skip validation if credentials are already valid
      if (credentialsValidValue) {
        // Skip validation and move to the next step
        currentStepValue = 'project'

        // Fetch projects when moving to project step
        await jiraApi.getProjectsWithCredentials({
          name: formDataValue.name,
          jira_server: formDataValue.jira_server,
          jira_email: formDataValue.jira_email,
          jira_api_token: formDataValue.jira_api_token,
        })

        // Select first project if none selected
        if (!formDataValue.project_key && projectsValue.length > 0) {
          formDataValue.project_key = 'TEST'
        }
      } else {
        try {
          // Call validateCredentials internally
          const response = await jiraApi.validateCredentials({
            name: formDataValue.name,
            jira_server: formDataValue.jira_server,
            jira_email: formDataValue.jira_email,
            jira_api_token: formDataValue.jira_api_token,
          })

          // Check if the response indicates an error
          if (response.status === 'error') {
            // Set error and stay on credentials step
            stepErrorsValue.credentials = 'Invalid credentials'
            return Promise.resolve()
          }

          // If we get here, validation succeeded, so we can move to the next step
          currentStepValue = 'project'

          // Fetch projects when moving to project step
          await jiraApi.getProjectsWithCredentials({
            name: formDataValue.name,
            jira_server: formDataValue.jira_server,
            jira_email: formDataValue.jira_email,
            jira_api_token: formDataValue.jira_api_token,
          })

          // Select first project if none selected
          if (!formDataValue.project_key && projectsValue.length > 0) {
            formDataValue.project_key = 'TEST'
          }
        } catch (err) {
          // Handle API errors - stay on credentials step
          const errorMessage = err instanceof Error ? err.message : 'Unknown error'
          stepErrorsValue.credentials = `API Error: Failed to validate credentials - ${errorMessage}`
          // Do not change the current step
          return Promise.resolve()
        }
      }
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
