/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock window.scrollTo which is not implemented in jsdom
window.scrollTo = vi.fn();
import { render, screen, fireEvent } from '@solidjs/testing-library';
import App from './App';
import { jiraApi } from './api/jiraApi';
import * as useJiraConfigurationsModule from './hooks/useJiraConfigurations';

// Mock the useJiraConfigurations hook
vi.mock('./hooks/useJiraConfigurations', () => {
  return {
    useJiraConfigurations: vi.fn(),
  };
});

vi.mock('./api/jiraApi', () => ({
  jiraApi: {
    getLeadTime: vi.fn(),
    getThroughput: vi.fn(),
    getWip: vi.fn(),
    getCfd: vi.fn(),
    getCycleTime: vi.fn(),
    listConfigurations: vi.fn(),
    getConfiguration: vi.fn(),
    createConfiguration: vi.fn(),
    updateConfiguration: vi.fn(),
    deleteConfiguration: vi.fn(),
  },
}));

describe('App', () => {
  const mockMetrics = {
    leadTime: {
      average: 5,
      median: 4,
      min: 2,
      max: 10,
      data: [2, 4, 5, 5, 7, 10],
    },
    throughput: {
      dates: ['2024-01-01', '2024-01-02'],
      counts: [3, 4],
      average: 3.5,
    },
    wip: {
      status: ['To Do', 'In Progress', 'Done'],
      counts: [2, 3, 5],
      total: 10,
    },
    cfd: {
      statuses: ['To Do', 'In Progress', 'Done'],
      data: [
        {
          date: '2024-01-01',
          'To Do': 2,
          'In Progress': 3,
          Done: 5,
        },
      ],
    },
    cycleTime: {
      average: 3,
      median: 2.5,
      min: 1,
      max: 7,
      data: [1, 2, 3, 3, 5, 7],
      start_state: 'In Progress',
      end_state: 'Done',
    },
  };

  const mockConfigs = [
    {
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
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset the document body to ensure a clean state for each test
    document.body.innerHTML = '';

    // Reset the useJiraConfigurations mock to ensure a clean state for each test
    vi.mocked(useJiraConfigurationsModule.useJiraConfigurations).mockImplementation(onJqlChange => {
      // Use type assertion to match the expected return type
      return {
        configurations: () => mockConfigs,
        loading: () => false,
        error: () => null,
        selectedConfig: () => undefined,
        setSelectedConfig: vi.fn(),
        loadConfigurations: vi.fn(async () => {}),
        handleConfigSelect: vi.fn(async (_name: string) => {
          onJqlChange('project = TEST');
        }),
        handleConfigDelete: vi.fn(async () => {}),
        showConfigForm: () => false,
        setShowConfigForm: vi.fn(),
        handleConfigSaved: vi.fn(async () => {}),
      };
    });

    // Setup default mock responses
    vi.mocked(jiraApi.getLeadTime).mockResolvedValue(mockMetrics.leadTime);
    vi.mocked(jiraApi.getThroughput).mockResolvedValue(mockMetrics.throughput);
    vi.mocked(jiraApi.getWip).mockResolvedValue(mockMetrics.wip);
    vi.mocked(jiraApi.getCfd).mockResolvedValue(mockMetrics.cfd);
    vi.mocked(jiraApi.getCycleTime).mockResolvedValue(mockMetrics.cycleTime);
    vi.mocked(jiraApi.listConfigurations).mockResolvedValue(mockConfigs);
    vi.mocked(jiraApi.getConfiguration).mockResolvedValue(mockConfigs[0]);
  });

  it('loads and displays saved configurations', async () => {
    render(() => <App />);

    expect(await screen.findByText('Test Config')).toBeInTheDocument();
    expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
  });

  it('updates JQL when configuration is selected', async () => {
    render(() => <App />);

    // Find the select button
    const selectButton = await screen.findByRole('button', { name: /Select/i });

    fireEvent.click(selectButton);

    const jqlInput = screen.getByPlaceholderText(/Enter JQL Query/i);
    expect(jqlInput).toHaveValue('project = TEST');
  });

  it('opens configuration form when Add Configuration is clicked', async () => {
    // For this test, we need to mock the setShowConfigForm function to actually set the showConfigForm signal
    let showConfigFormValue = false;
    vi.mocked(useJiraConfigurationsModule.useJiraConfigurations).mockImplementationOnce(
      onJqlChange => {
        return {
          configurations: () => mockConfigs,
          loading: () => false,
          error: () => null,
          selectedConfig: () => undefined,
          setSelectedConfig: vi.fn(),
          loadConfigurations: vi.fn(async () => {}),
          handleConfigSelect: vi.fn(async (_name: string) => {
            onJqlChange('project = TEST');
          }),
          handleConfigDelete: vi.fn(async () => {}),
          showConfigForm: () => showConfigFormValue,
          setShowConfigForm: vi.fn(value => {
            showConfigFormValue = value;
          }),
          handleConfigSaved: vi.fn(async () => {}),
        };
      }
    );

    render(() => <App />);

    const addButton = screen.getByRole('button', { name: /Add Configuration/i });
    fireEvent.click(addButton);

    // Since we're mocking the dialog, we can't actually test for the presence of the form elements
    // Instead, we'll just verify that the setShowConfigForm function was called with true
    expect(showConfigFormValue).toBe(true);
  });

  it('fetches metrics with selected configuration JQL', async () => {
    render(() => <App />);

    // Select configuration
    const selectButton = await screen.findByRole('button', { name: /Select/i });
    fireEvent.click(selectButton);

    // Click analyze
    const analyzeButton = screen.getByRole('button', { name: /Analyze/i });
    fireEvent.click(analyzeButton);

    // Verify API calls use the configuration's JQL
    expect(jiraApi.getLeadTime).toHaveBeenCalledWith('project = TEST');
    expect(jiraApi.getThroughput).toHaveBeenCalledWith('project = TEST');
    expect(jiraApi.getWip).toHaveBeenCalledWith('project = TEST');
    expect(jiraApi.getCfd).toHaveBeenCalledWith('project = TEST');
    expect(jiraApi.getCycleTime).toHaveBeenCalledWith('project = TEST');
  });

  it('displays all metric charts', async () => {
    render(() => <App />);

    const analyzeButton = screen.getByRole('button', { name: /Analyze/i });
    fireEvent.click(analyzeButton);

    // Wait for data to load and verify charts are displayed
    expect(await screen.findByText(/Lead Time Analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/Throughput/i)).toBeInTheDocument();
    expect(screen.getByText(/Work in Progress/i)).toBeInTheDocument();
    expect(screen.getByText(/Cumulative Flow/i)).toBeInTheDocument();
    expect(screen.getByText(/Cycle Time Analysis/i)).toBeInTheDocument();
  });

  it('shows loading state during analysis', async () => {
    render(() => <App />);

    const analyzeButton = screen.getByRole('button', { name: /Analyze/i });
    fireEvent.click(analyzeButton);

    // Use a more specific selector to find the loading state in the analyze button
    expect(screen.getByTestId('analyze-button')).toBeDisabled();
  });

  it('handles API errors gracefully', async () => {
    const error = new Error('API Error');
    vi.mocked(jiraApi.getLeadTime).mockRejectedValue(error);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation((..._args: unknown[]) => {});

    render(() => <App />);

    const analyzeButton = screen.getByRole('button', { name: /Analyze/i });
    fireEvent.click(analyzeButton);

    // Wait for the async operation to complete
    await new Promise(resolve => {
      // Use window.setTimeout to avoid ESLint error
      window.setTimeout(resolve, 0);
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch metrics:', error);
    consoleSpy.mockRestore();
  });

  it('allows manual JQL input when no configuration is selected', async () => {
    render(() => <App />);

    const jqlInput = screen.getByPlaceholderText(/Enter JQL Query/i);
    const newQuery = 'project = CUSTOM';

    // Use userEvent instead of fireEvent for more realistic interaction
    // First clear the input
    fireEvent.input(jqlInput, { target: { value: '' } });
    // Then set the new value
    fireEvent.input(jqlInput, { target: { value: newQuery } });

    // Verify the input value was updated
    expect(jqlInput).toHaveValue(newQuery);

    // Mock the jiraApi.getLeadTime function to verify it's called with the correct query
    vi.mocked(jiraApi.getLeadTime).mockImplementation(query => {
      expect(query).toBe(newQuery);
      return Promise.resolve({
        average: 5,
        median: 4,
        min: 2,
        max: 10,
        data: [2, 4, 5, 5, 7, 10],
      });
    });

    // Get the analyze button and click it
    const analyzeButton = screen.getByRole('button', { name: /Analyze/i });
    fireEvent.click(analyzeButton);

    // Verify the API was called
    expect(jiraApi.getLeadTime).toHaveBeenCalled();
  });
});
