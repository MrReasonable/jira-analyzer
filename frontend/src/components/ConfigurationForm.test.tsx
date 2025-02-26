import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@solidjs/testing-library';
import { ConfigurationForm } from './ConfigurationForm';
import { jiraApi } from '../api/jiraApi';
import type { JiraConfiguration } from '../api/jiraApi';

// Mock the jiraApi module
vi.mock('../api/jiraApi', () => ({
  jiraApi: {
    createConfiguration: vi.fn(),
    updateConfiguration: vi.fn(),
  },
}));

describe('ConfigurationForm', () => {
  const mockOnSaved = vi.fn();

  // Sample configuration for testing
  const sampleConfig: JiraConfiguration = {
    name: 'Test Config',
    jira_server: 'https://test.atlassian.net',
    jira_email: 'test@example.com',
    jira_api_token: 'test-token',
    jql_query: 'project = TEST',
    workflow_states: ['Todo', 'In Progress', 'Done'],
    lead_time_start_state: 'Todo',
    lead_time_end_state: 'Done',
    cycle_time_start_state: 'In Progress',
    cycle_time_end_state: 'Done',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(jiraApi.createConfiguration).mockResolvedValue({ id: 1, ...sampleConfig });
    vi.mocked(jiraApi.updateConfiguration).mockResolvedValue({ id: 1, ...sampleConfig });
  });

  // Helper function to fill the form
  const fillForm = (config: JiraConfiguration) => {
    Object.entries({
      'Configuration Name': config.name,
      'Jira Server URL': config.jira_server,
      'Jira Email': config.jira_email,
      'Jira API Token': config.jira_api_token,
      'JQL Query': config.jql_query,
      'Workflow States (one per line)': config.workflow_states.join('\n'),
      'Lead Time Start State': config.lead_time_start_state,
      'Lead Time End State': config.lead_time_end_state,
      'Cycle Time Start State': config.cycle_time_start_state,
      'Cycle Time End State': config.cycle_time_end_state,
    }).forEach(([label, value]) => {
      const element = screen.getByLabelText(label);
      fireEvent.input(element, { target: { value } });
    });
  };

  it('renders all required form fields', () => {
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

  it('creates a new configuration when form is submitted', async () => {
    render(() => <ConfigurationForm onConfigurationSaved={mockOnSaved} />);

    // Fill the form
    fillForm(sampleConfig);

    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Create Configuration' });
    fireEvent.click(submitButton);

    // Verify API was called with correct data
    await vi.waitFor(() => {
      expect(jiraApi.createConfiguration).toHaveBeenCalledWith(sampleConfig);
      expect(mockOnSaved).toHaveBeenCalled();
    });
  });

  it('updates an existing configuration when in edit mode', async () => {
    // Render with initial config (edit mode)
    render(() => (
      <ConfigurationForm onConfigurationSaved={mockOnSaved} initialConfig={sampleConfig} />
    ));

    // Verify form is pre-filled
    expect(screen.getByLabelText(/Configuration Name/i)).toHaveValue(sampleConfig.name);
    expect(screen.getByLabelText(/Configuration Name/i)).toBeDisabled();

    // Update JQL field
    const updatedJql = 'project = UPDATED';
    fireEvent.input(screen.getByLabelText('JQL Query'), {
      target: { value: updatedJql },
    });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Update Configuration' });
    fireEvent.click(submitButton);

    // Verify API was called with correct data
    await vi.waitFor(() => {
      expect(jiraApi.updateConfiguration).toHaveBeenCalledWith(sampleConfig.name, {
        ...sampleConfig,
        jql_query: updatedJql,
      });
      expect(mockOnSaved).toHaveBeenCalled();
    });
  });

  it('displays error message when API call fails', async () => {
    const errorMessage = 'API connection failed';
    // Mock API to reject with a specific error message
    vi.mocked(jiraApi.createConfiguration).mockRejectedValueOnce(new Error(errorMessage));

    render(() => <ConfigurationForm onConfigurationSaved={mockOnSaved} />);

    // Fill and submit form
    fillForm(sampleConfig);
    fireEvent.click(screen.getByRole('button', { name: 'Create Configuration' }));

    // Verify error is displayed - use waitFor for more robust waiting
    await vi.waitFor(() => {
      const errorElement = screen.getByTestId('error-message');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement.textContent).toBe(errorMessage);
    });

    // Verify callback wasn't called
    expect(mockOnSaved).not.toHaveBeenCalled();
  });

  it('does not call API when form is submitted with empty fields', async () => {
    render(() => <ConfigurationForm onConfigurationSaved={mockOnSaved} />);

    // Submit empty form
    fireEvent.submit(screen.getByRole('button', { name: 'Create Configuration' }));

    // Wait a bit to ensure any async operations complete
    await vi.waitFor(() => {
      // Verify API wasn't called
      expect(jiraApi.createConfiguration).not.toHaveBeenCalled();
      expect(mockOnSaved).not.toHaveBeenCalled();
    });
  });
});
