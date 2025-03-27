import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library'
import { ConfigurationForm } from './ConfigurationForm'
import { jiraApi } from '@api/jiraApi'
import type { JiraConfiguration } from '@api/jiraApi'

// Mock the WorkflowStatesList component
vi.mock('./workflow/WorkflowStatesList', () => {
  return {
    WorkflowState: {},
    WorkflowStatesList: (props: {
      onChange: (
        states: Array<{ id: string; name: string; isStartPoint: boolean; isEndPoint: boolean }>
      ) => void
    }) => {
      return (
        <div data-testid="workflow-states-list">
          <button
            type="button"
            onClick={() =>
              props.onChange([
                { id: '1', name: 'Todo', isStartPoint: false, isEndPoint: false },
                { id: '2', name: 'In Progress', isStartPoint: false, isEndPoint: false },
                { id: '3', name: 'Done', isStartPoint: false, isEndPoint: false },
              ])
            }
            data-testid="mock-set-workflow-states"
          >
            Set workflow states
          </button>
        </div>
      )
    },
  }
})

// Mock the jiraApi module
vi.mock('@api/jiraApi', () => ({
  jiraApi: {
    createConfiguration: vi.fn().mockResolvedValue({ id: 1, name: 'Test Config' }),
    updateConfiguration: vi.fn().mockResolvedValue({ id: 1, name: 'Test Config' }),
    getProjects: vi.fn().mockResolvedValue([{ key: 'TEST', name: 'Test Project' }]),
  },
}))

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

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Super simplified helper function
  const fillMinimalForm = () => {
    // Fill just enough to make form valid
    fireEvent.input(screen.getByLabelText('Configuration Name'), {
      target: { value: 'Test Config' },
    })
    fireEvent.input(screen.getByLabelText('Jira Server URL'), {
      target: { value: 'https://test.atlassian.net' },
    })
    fireEvent.input(screen.getByLabelText('Jira Email'), { target: { value: 'test@example.com' } })
    fireEvent.input(screen.getByLabelText('Jira API Token'), { target: { value: 'test-token' } })
    fireEvent.input(screen.getByLabelText('Default JQL Query'), {
      target: { value: 'project = TEST' },
    })

    // Set workflow states
    fireEvent.click(screen.getByTestId('mock-set-workflow-states'))

    // Set all required dropdown values
    fireEvent.change(screen.getByLabelText('Lead Time Start State'), { target: { value: 'Todo' } })
    fireEvent.change(screen.getByLabelText('Lead Time End State'), { target: { value: 'Done' } })
    fireEvent.change(screen.getByLabelText('Cycle Time Start State'), {
      target: { value: 'In Progress' },
    })
    fireEvent.change(screen.getByLabelText('Cycle Time End State'), { target: { value: 'Done' } })
  }

  it('renders form fields and can be submitted', async () => {
    // Use the sampleConfig instead of a minimal mock response
    vi.mocked(jiraApi.createConfiguration).mockImplementation(() =>
      Promise.resolve({ ...sampleConfig, id: 1 })
    )

    // Setup the form with the mock handler
    render(() => <ConfigurationForm onConfigurationSaved={mockOnSaved} />)

    // Fill form with all required fields
    fillMinimalForm()

    // Wait for projects to load and then select a project
    await waitFor(() => {
      expect(screen.queryByLabelText('Jira Project')).not.toBeNull()
    })

    // Now that we know the project field exists, we can interact with it
    fireEvent.change(screen.getByLabelText('Jira Project'), { target: { value: 'TEST' } })

    // Get the form element and trigger a submit event directly
    const form = screen.getByRole('form')
    fireEvent.submit(form)

    // First verify the API call
    await waitFor(() => {
      expect(jiraApi.createConfiguration).toHaveBeenCalled()
    })

    // Now wait for the callback after the promise resolves
    await waitFor(
      () => {
        expect(mockOnSaved).toHaveBeenCalled()
      },
      { timeout: 5000 }
    )
  })

  it('handles edit mode properly', async () => {
    render(() => (
      <ConfigurationForm onConfigurationSaved={mockOnSaved} initialConfig={sampleConfig} />
    ))

    // Verify name is disabled in edit mode
    expect(screen.getByLabelText(/Configuration Name/i)).toBeDisabled()

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Update Configuration' }))

    // Wait for API call to be made
    await waitFor(() => {
      expect(jiraApi.updateConfiguration).toHaveBeenCalled()
    })

    expect(mockOnSaved).toHaveBeenCalled()
  })

  // Most important test for the specific issue we're facing
  it('handles loading state and projects fetching', async () => {
    // Setup the component
    render(() => <ConfigurationForm onConfigurationSaved={mockOnSaved} />)

    // Fill the required fields to enable the fetch button
    fireEvent.input(screen.getByLabelText('Configuration Name'), {
      target: { value: 'Test Config' },
    })
    fireEvent.input(screen.getByLabelText('Jira Server URL'), { target: { value: 'https://test' } })
    fireEvent.input(screen.getByLabelText('Jira Email'), { target: { value: 'test@test' } })
    fireEvent.input(screen.getByLabelText('Jira API Token'), { target: { value: 'token' } })

    // Get button by test id or by its initial text state
    // The component may start with "Loading..." state, so we need to handle that
    const fetchButtonInitial =
      screen.queryByText('Loading...') || screen.queryByText('Fetch Projects')

    expect(fetchButtonInitial).toBeInTheDocument()

    // First wait for createConfiguration to be called (happens before getProjects)
    await waitFor(() => {
      expect(jiraApi.createConfiguration).toHaveBeenCalled()
    })

    // Then wait for getProjects to be called with the right configuration name
    await waitFor(() => {
      expect(jiraApi.getProjects).toHaveBeenCalledWith('Test Config')
    })
  })

  // You might also want to test the error handling
  it('displays error message when projects fetching fails', async () => {
    // Setup error to be thrown
    vi.mocked(jiraApi.getProjects).mockRejectedValueOnce(new Error('API connection failed'))

    render(() => <ConfigurationForm onConfigurationSaved={mockOnSaved} />)

    // Fill the required fields
    fireEvent.input(screen.getByLabelText('Configuration Name'), {
      target: { value: 'Test Config' },
    })
    fireEvent.input(screen.getByLabelText('Jira Server URL'), { target: { value: 'https://test' } })
    fireEvent.input(screen.getByLabelText('Jira Email'), { target: { value: 'test@test' } })
    fireEvent.input(screen.getByLabelText('Jira API Token'), { target: { value: 'token' } })

    // The createEffect should trigger fetchProjects
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument()
    })

    expect(screen.getByTestId('error-message')).toHaveTextContent('API connection failed')
  })
})
