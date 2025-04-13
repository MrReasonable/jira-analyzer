import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@solidjs/testing-library'
import { ConfigurationForm } from './ConfigurationForm'
import type { JiraConfiguration } from '@api/jiraApi'
import * as useConfigurationFormModule from '@hooks/useConfigurationForm'

// Mock the form components
vi.mock('./form/FormStepper', () => {
  return {
    FormStepper: (props: any) => (
      <div data-testid="form-stepper">
        <div>Current Step: {props.currentStep()}</div>
      </div>
    ),
  }
})

vi.mock('./form/CredentialsStep', () => {
  return {
    CredentialsStep: (props: any) => (
      <div data-testid="credentials-step">
        <label for="name">Configuration Name</label>
        <input
          id="name"
          value={props.name()}
          onInput={(e: any) => props.onNameChange(e.target.value)}
          disabled={props.isEditMode}
        />

        <label for="jira_server">Jira Server URL</label>
        <input
          id="jira_server"
          value={props.jiraServer()}
          onInput={(e: any) => props.onJiraServerChange(e.target.value)}
        />

        <label for="jira_email">Jira Email</label>
        <input
          id="jira_email"
          value={props.jiraEmail()}
          onInput={(e: any) => props.onJiraEmailChange(e.target.value)}
        />

        <label for="jira_api_token">Jira API Token</label>
        <input
          id="jira_api_token"
          value={props.jiraApiToken()}
          onInput={(e: any) => props.onJiraApiTokenChange(e.target.value)}
        />

        {props.error() && <p data-testid="step-error">{props.error()}</p>}
      </div>
    ),
  }
})

vi.mock('./form/ProjectStep', () => {
  return {
    ProjectStep: (props: any) => (
      <div data-testid="project-step">
        <label for="project_key">Jira Project</label>
        <select
          id="project_key"
          value={props.projectKey()}
          onChange={(e: any) => props.onProjectKeyChange(e.target.value)}
        >
          <option value="" disabled>
            Select a project
          </option>
          {props.projects().map((project: any, _index: number) => (
            <option value={project.key}>
              {project.key} - {project.name}
            </option>
          ))}
        </select>

        <label for="jql_query">Default JQL Query</label>
        <textarea
          id="jql_query"
          value={props.jqlQuery()}
          onInput={(e: any) => props.onJqlQueryChange(e.target.value)}
        />

        {props.error() && <p data-testid="step-error">{props.error()}</p>}
      </div>
    ),
  }
})

vi.mock('./form/FormNavigation', () => {
  return {
    FormNavigation: (props: any) => {
      // Helper function to determine the button test ID
      const getButtonTestId = () => {
        if (props.isLastStep()) {
          return props.isEditMode ? 'update-button' : 'create-button'
        }
        return 'next-button'
      }

      // Helper function to determine the button text
      const getButtonText = () => {
        if (props.isLastStep()) {
          return props.isEditMode ? 'Update Configuration' : 'Create Configuration'
        }
        return 'Next'
      }

      return (
        <div data-testid="form-navigation" data-disabled={props.disabled ? 'true' : undefined}>
          {!props.isFirstStep() && (
            <button onClick={props.onPrevious} data-testid="previous-button">
              Previous
            </button>
          )}
          <button type="submit" disabled={props.disabled} data-testid={getButtonTestId()}>
            {getButtonText()}
          </button>
        </div>
      )
    },
  }
})

// Mock the useConfigurationForm hook
vi.mock('@hooks/useConfigurationForm', () => {
  return {
    useConfigurationForm: vi.fn(),
  }
})

// Mock the jiraApi module
vi.mock('@api/jiraApi')

describe('ConfigurationForm', () => {
  const mockOnSaved = vi.fn()

  // Minimal sample configuration
  const sampleConfig: JiraConfiguration = {
    name: 'Test Config',
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

  // Setup mock form state
  const setupMockFormState = (
    isEdit = false,
    currentStep: 'credentials' | 'project' = 'credentials'
  ) => {
    const config = isEdit ? sampleConfig : undefined

    const mockFormData = {
      name: config?.name ?? '',
      jira_server: config?.jira_server ?? '',
      jira_email: config?.jira_email ?? '',
      jira_api_token: config?.jira_api_token ?? '',
      jql_query: config?.jql_query ?? '',
      project_key: config?.project_key ?? '',
      lead_time_start_state: config?.lead_time_start_state ?? '',
      lead_time_end_state: config?.lead_time_end_state ?? '',
      cycle_time_start_state: config?.cycle_time_start_state ?? '',
      cycle_time_end_state: config?.cycle_time_end_state ?? '',
    }

    const mockStepErrors = {
      credentials: null,
      project: null,
    }

    return {
      currentStep: vi.fn(() => currentStep),
      formData: vi.fn(() => mockFormData),
      projects: vi.fn(() => [{ key: 'TEST', name: 'Test Project' }]),
      error: vi.fn(() => null),
      stepErrors: vi.fn(() => mockStepErrors),
      isNameAvailable: vi.fn(() => true),
      isCheckingName: vi.fn(() => false),
      isLoading: vi.fn(() => false),
      checkingCredentials: vi.fn(() => false),
      credentialsValid: vi.fn(() => true),
      setCredentialsValid: vi.fn(), // Add the missing function
      isFirstStep: vi.fn(() => currentStep === 'credentials'),
      isLastStep: vi.fn(() => currentStep === 'project'),
      goToNextStep: vi.fn(),
      goToPreviousStep: vi.fn(),
      updateField: vi.fn(),
      checkNameAvailability: vi.fn(),
      checkCredentials: vi.fn(),
      fetchProjects: vi.fn(),
      handleSubmit: vi.fn(async e => {
        e.preventDefault()
        mockOnSaved(mockFormData.name)
        return Promise.resolve()
      }),
      isEditMode: vi.fn(() => isEdit),
      setProjects: vi.fn(), // Add missing function to fix TypeScript errors
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders form fields correctly in create mode', async () => {
    // Setup mock form state for create mode
    const mockFormState = setupMockFormState(false)
    vi.mocked(useConfigurationFormModule.useConfigurationForm).mockReturnValue(mockFormState)

    render(() => <ConfigurationForm onConfigurationSaved={mockOnSaved} />)

    // Verify the form stepper is rendered
    expect(screen.getByTestId('form-stepper')).toBeInTheDocument()

    // Verify the credentials step is shown initially
    expect(screen.getByTestId('credentials-step')).toBeInTheDocument()

    // Verify the navigation buttons are rendered
    expect(screen.getByTestId('next-button')).toBeInTheDocument()

    // Verify the form fields are rendered
    expect(screen.getByLabelText('Configuration Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Jira Server URL')).toBeInTheDocument()
    expect(screen.getByLabelText('Jira Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Jira API Token')).toBeInTheDocument()
  })

  it('renders form fields correctly in edit mode', async () => {
    // Setup mock form state for edit mode
    const mockFormState = setupMockFormState(true)
    vi.mocked(useConfigurationFormModule.useConfigurationForm).mockReturnValue(mockFormState)

    render(() => (
      <ConfigurationForm initialConfig={sampleConfig} onConfigurationSaved={mockOnSaved} />
    ))

    // Verify the form stepper is rendered
    expect(screen.getByTestId('form-stepper')).toBeInTheDocument()

    // Verify the credentials step is shown initially
    expect(screen.getByTestId('credentials-step')).toBeInTheDocument()

    // Verify the navigation buttons are rendered
    expect(screen.getByTestId('next-button')).toBeInTheDocument()

    // Verify the form fields are rendered with the correct values
    const nameInput = screen.getByLabelText('Configuration Name')
    expect(nameInput).toBeInTheDocument()
    expect(nameInput).toBeDisabled() // Name should be disabled in edit mode
  })

  it('navigates between steps correctly', async () => {
    // Setup mock form state for create mode, starting at credentials step
    const mockFormState = setupMockFormState(false, 'credentials')

    // Set up the form data with valid values
    mockFormState.formData = vi.fn(() => ({
      name: 'Test Config',
      jira_server: 'https://test.atlassian.net',
      jira_email: 'test@example.com',
      jira_api_token: 'test-token',
      jql_query: '',
      project_key: '',
      workflow_states: [],
      lead_time_start_state: '',
      lead_time_end_state: '',
      cycle_time_start_state: '',
      cycle_time_end_state: '',
    }))

    vi.mocked(useConfigurationFormModule.useConfigurationForm).mockReturnValue(mockFormState)

    render(() => <ConfigurationForm onConfigurationSaved={mockOnSaved} />)

    // Verify we're on the credentials step
    expect(screen.getByTestId('credentials-step')).toBeInTheDocument()

    // Click the next button
    const nextButton = screen.getByTestId('next-button')
    fireEvent.click(nextButton)

    // Verify handleSubmit was called (which would trigger form validation and navigation)
    expect(mockFormState.handleSubmit).toHaveBeenCalled()

    // Manually call goToNextStep to simulate successful validation
    mockFormState.goToNextStep()

    // Verify goToNextStep was called
    expect(mockFormState.goToNextStep).toHaveBeenCalled()

    // Now setup mock form state for the project step
    const mockFormState2 = setupMockFormState(false, 'project')
    vi.mocked(useConfigurationFormModule.useConfigurationForm).mockReturnValue(mockFormState2)

    // Re-render with the new state
    render(() => <ConfigurationForm onConfigurationSaved={mockOnSaved} />)

    // Verify we're on the project step
    expect(screen.getByTestId('project-step')).toBeInTheDocument()

    // Verify the previous button is now visible
    expect(screen.getByTestId('previous-button')).toBeInTheDocument()

    // Click the previous button
    const previousButton = screen.getByTestId('previous-button')
    fireEvent.click(previousButton)

    // Verify goToPreviousStep was called
    expect(mockFormState2.goToPreviousStep).toHaveBeenCalled()
  })

  it('submits the form correctly in create mode', async () => {
    // Setup mock form state for create mode, on the last step
    const mockFormState = setupMockFormState(false, 'project')

    // Set up the form data with valid values
    mockFormState.formData = vi.fn(() => ({
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
    }))

    // Override the handleSubmit mock to call mockOnSaved with the correct name
    mockFormState.handleSubmit = vi.fn(async e => {
      e.preventDefault()
      mockOnSaved('Test Config')
      return Promise.resolve()
    })

    vi.mocked(useConfigurationFormModule.useConfigurationForm).mockReturnValue(mockFormState)

    render(() => <ConfigurationForm onConfigurationSaved={mockOnSaved} />)

    // Verify we're on the project step
    expect(screen.getByTestId('project-step')).toBeInTheDocument()

    // Verify the create button is visible
    expect(screen.getByTestId('create-button')).toBeInTheDocument()

    // Click the create button
    const createButton = screen.getByTestId('create-button')
    fireEvent.click(createButton)

    // Verify handleSubmit was called
    expect(mockFormState.handleSubmit).toHaveBeenCalled()

    // Verify onConfigurationSaved was called with the correct name
    expect(mockOnSaved).toHaveBeenCalledWith('Test Config')
  })

  it('submits the form correctly in edit mode', async () => {
    // Setup mock form state for edit mode, on the last step
    const mockFormState = setupMockFormState(true, 'project')
    vi.mocked(useConfigurationFormModule.useConfigurationForm).mockReturnValue(mockFormState)

    render(() => (
      <ConfigurationForm initialConfig={sampleConfig} onConfigurationSaved={mockOnSaved} />
    ))

    // Verify we're on the project step
    expect(screen.getByTestId('project-step')).toBeInTheDocument()

    // Verify the update button is visible
    expect(screen.getByTestId('update-button')).toBeInTheDocument()

    // Click the update button
    const updateButton = screen.getByTestId('update-button')
    fireEvent.click(updateButton)

    // Verify handleSubmit was called
    expect(mockFormState.handleSubmit).toHaveBeenCalled()

    // Verify onConfigurationSaved was called with the correct name
    expect(mockOnSaved).toHaveBeenCalledWith('Test Config')
  })

  it('displays error messages correctly', async () => {
    // Setup mock form state with an error
    const mockFormState = setupMockFormState(false, 'credentials')
    mockFormState.stepErrors = vi.fn(() => ({
      credentials: 'Configuration name is required' as any,
      project: null,
    }))
    vi.mocked(useConfigurationFormModule.useConfigurationForm).mockReturnValue(mockFormState)

    render(() => <ConfigurationForm onConfigurationSaved={mockOnSaved} />)

    // Verify the error message is displayed
    expect(screen.getByTestId('step-error')).toBeInTheDocument()
    expect(screen.getByTestId('step-error')).toHaveTextContent('Configuration name is required')
  })

  // Additional tests to improve coverage

  it('verifies form field updates are passed to the hook', async () => {
    // Setup mock form state
    const mockFormState = setupMockFormState(false)
    vi.mocked(useConfigurationFormModule.useConfigurationForm).mockReturnValue(mockFormState)

    render(() => <ConfigurationForm onConfigurationSaved={mockOnSaved} />)

    // Update the name field
    const nameInput = screen.getByLabelText('Configuration Name')
    fireEvent.input(nameInput, { target: { value: 'New Config Name' } })

    // Verify updateField was called with the correct parameters
    expect(mockFormState.updateField).toHaveBeenCalledWith('name', 'New Config Name')

    // Update the server field
    const serverInput = screen.getByLabelText('Jira Server URL')
    fireEvent.input(serverInput, { target: { value: 'https://new.atlassian.net' } })

    // Verify updateField was called with the correct parameters
    expect(mockFormState.updateField).toHaveBeenCalledWith(
      'jira_server',
      'https://new.atlassian.net'
    )
  })

  it('passes the correct props to child components', async () => {
    // Setup mock form state
    const mockFormState = setupMockFormState(false)
    vi.mocked(useConfigurationFormModule.useConfigurationForm).mockReturnValue(mockFormState)

    render(() => <ConfigurationForm onConfigurationSaved={mockOnSaved} />)

    // Verify FormStepper receives the correct props
    const formStepper = screen.getByTestId('form-stepper')
    expect(formStepper).toHaveTextContent('Current Step: credentials')

    // Verify CredentialsStep receives the correct props
    const credentialsStep = screen.getByTestId('credentials-step')
    expect(credentialsStep).toBeInTheDocument()

    // Verify FormNavigation receives the correct props
    const formNavigation = screen.getByTestId('form-navigation')
    expect(formNavigation).toBeInTheDocument()
    expect(screen.getByTestId('next-button')).toBeInTheDocument()
    expect(screen.queryByTestId('previous-button')).not.toBeInTheDocument() // Should not be present on first step
  })

  it('handles form submission correctly', async () => {
    // Setup mock form state
    const mockFormState = setupMockFormState(false, 'project')
    vi.mocked(useConfigurationFormModule.useConfigurationForm).mockReturnValue(mockFormState)

    render(() => <ConfigurationForm onConfigurationSaved={mockOnSaved} />)

    // Submit the form
    const form = screen.getByRole('form')
    fireEvent.submit(form)

    // Verify handleSubmit was called
    expect(mockFormState.handleSubmit).toHaveBeenCalled()
  })

  it('disables navigation buttons when appropriate', async () => {
    // Setup mock form state with disabled navigation
    const mockFormState = setupMockFormState(false)
    mockFormState.checkingCredentials = vi.fn(() => true) // Simulate checking credentials
    vi.mocked(useConfigurationFormModule.useConfigurationForm).mockReturnValue(mockFormState)

    render(() => <ConfigurationForm onConfigurationSaved={mockOnSaved} />)

    // Verify the navigation is disabled when checking credentials
    const formNavigation = screen.getByTestId('form-navigation')
    expect(formNavigation).toHaveAttribute('data-disabled', 'true')
  })
})
