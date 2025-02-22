import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@solidjs/testing-library';
import { ConfigurationForm } from './ConfigurationForm';
import { jiraApi } from '../api/jiraApi';

vi.mock('../api/jiraApi', () => ({
  jiraApi: {
    createConfiguration: vi.fn(),
    updateConfiguration: vi.fn()
  }
}));

describe('ConfigurationForm', () => {
  const mockOnSaved = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields', () => {
    render(() => <ConfigurationForm onConfigurationSaved={mockOnSaved} />);

    // Check for all required fields
    expect(screen.getByLabelText(/Configuration Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Jira Server URL/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Jira Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Jira API Token/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/JQL Query/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Workflow States/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Lead Time Start State/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Lead Time End State/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Cycle Time Start State/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Cycle Time End State/i)).toBeInTheDocument();
  });

  it('creates new configuration when form is submitted', async () => {
    const newConfig = {
      name: 'Test Config',
      jira_server: 'https://test.atlassian.net',
      jira_email: 'test@example.com',
      jira_api_token: 'test-token',
      jql_query: 'project = TEST',
      workflow_states: ['Todo', 'In Progress', 'Done'],
      lead_time_start_state: 'Todo',
      lead_time_end_state: 'Done',
      cycle_time_start_state: 'In Progress',
      cycle_time_end_state: 'Done'
    };

    vi.mocked(jiraApi.createConfiguration).mockResolvedValue(newConfig);

    render(() => <ConfigurationForm onConfigurationSaved={mockOnSaved} />);

    // Fill out the form
    fireEvent.input(screen.getByLabelText(/Configuration Name/i), { target: { value: newConfig.name } });
    fireEvent.input(screen.getByLabelText(/Jira Server URL/i), { target: { value: newConfig.jira_server } });
    fireEvent.input(screen.getByLabelText(/Jira Email/i), { target: { value: newConfig.jira_email } });
    fireEvent.input(screen.getByLabelText(/Jira API Token/i), { target: { value: newConfig.jira_api_token } });
    fireEvent.input(screen.getByLabelText(/JQL Query/i), { target: { value: newConfig.jql_query } });
    fireEvent.input(screen.getByLabelText(/Workflow States/i), { target: { value: newConfig.workflow_states.join('\n') } });
    fireEvent.input(screen.getByLabelText(/Lead Time Start State/i), { target: { value: newConfig.lead_time_start_state } });
    fireEvent.input(screen.getByLabelText(/Lead Time End State/i), { target: { value: newConfig.lead_time_end_state } });
    fireEvent.input(screen.getByLabelText(/Cycle Time Start State/i), { target: { value: newConfig.cycle_time_start_state } });
    fireEvent.input(screen.getByLabelText(/Cycle Time End State/i), { target: { value: newConfig.cycle_time_end_state } });

    // Submit the form
    fireEvent.submit(screen.getByRole('button', { name: /Create Configuration/i }));

    // Verify API call
    expect(jiraApi.createConfiguration).toHaveBeenCalledWith(expect.objectContaining({
      ...newConfig,
      workflow_states: ['Todo', 'In Progress', 'Done']
    }));

    // Verify callback
    expect(mockOnSaved).toHaveBeenCalled();
  });

  it('updates existing configuration when in edit mode', async () => {
    const existingConfig = {
      name: 'Existing Config',
      jira_server: 'https://test.atlassian.net',
      jira_email: 'test@example.com',
      jira_api_token: 'test-token',
      jql_query: 'project = TEST',
      workflow_states: ['Todo', 'In Progress', 'Done'],
      lead_time_start_state: 'Todo',
      lead_time_end_state: 'Done',
      cycle_time_start_state: 'In Progress',
      cycle_time_end_state: 'Done'
    };

    vi.mocked(jiraApi.updateConfiguration).mockResolvedValue(existingConfig);

    render(() => <ConfigurationForm onConfigurationSaved={mockOnSaved} initialConfig={existingConfig} />);

    // Verify form is pre-filled
    expect(screen.getByLabelText(/Configuration Name/i)).toHaveValue(existingConfig.name);
    expect(screen.getByLabelText(/Configuration Name/i)).toBeDisabled();

    // Update some fields
    const updatedJql = 'project = UPDATED';
    fireEvent.input(screen.getByLabelText(/JQL Query/i), { target: { value: updatedJql } });

    // Submit the form
    fireEvent.submit(screen.getByRole('button', { name: /Update Configuration/i }));

    // Verify API call
    expect(jiraApi.updateConfiguration).toHaveBeenCalledWith(
      existingConfig.name,
      expect.objectContaining({
        ...existingConfig,
        jql_query: updatedJql
      })
    );

    // Verify callback
    expect(mockOnSaved).toHaveBeenCalled();
  });

  it('displays error message when API call fails', async () => {
    const error = new Error('API Error');
    vi.mocked(jiraApi.createConfiguration).mockRejectedValue(error);

    render(() => <ConfigurationForm onConfigurationSaved={mockOnSaved} />);

    // Fill required fields
    fireEvent.input(screen.getByLabelText(/Configuration Name/i), { target: { value: 'Test' } });
    fireEvent.input(screen.getByLabelText(/Jira Server URL/i), { target: { value: 'https://test.atlassian.net' } });
    fireEvent.input(screen.getByLabelText(/Jira Email/i), { target: { value: 'test@example.com' } });
    fireEvent.input(screen.getByLabelText(/Jira API Token/i), { target: { value: 'token' } });

    // Submit form
    fireEvent.submit(screen.getByRole('button', { name: /Create Configuration/i }));

    // Verify error is displayed
    expect(await screen.findByText(/API Error/i)).toBeInTheDocument();
    expect(mockOnSaved).not.toHaveBeenCalled();
  });

  it('validates required fields', async () => {
    render(() => <ConfigurationForm onConfigurationSaved={mockOnSaved} />);

    // Submit empty form
    fireEvent.submit(screen.getByRole('button', { name: /Create Configuration/i }));

    // Check that API wasn't called
    expect(jiraApi.createConfiguration).not.toHaveBeenCalled();
    expect(mockOnSaved).not.toHaveBeenCalled();
  });
});
