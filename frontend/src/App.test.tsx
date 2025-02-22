import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@solidjs/testing-library';
import App from './App';
import { jiraApi } from './api/jiraApi';

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
    deleteConfiguration: vi.fn()
  }
}));

describe('App', () => {
  const mockMetrics = {
    leadTime: {
      average: 5,
      median: 4,
      min: 2,
      max: 10,
      data: [2, 4, 5, 5, 7, 10]
    },
    throughput: {
      dates: ['2024-01-01', '2024-01-02'],
      counts: [3, 4],
      average: 3.5
    },
    wip: {
      status: ['To Do', 'In Progress', 'Done'],
      counts: [2, 3, 5],
      total: 10
    },
    cfd: {
      statuses: ['To Do', 'In Progress', 'Done'],
      data: [
        {
          date: '2024-01-01',
          'To Do': 2,
          'In Progress': 3,
          'Done': 5
        }
      ]
    },
    cycleTime: {
      average: 3,
      median: 2.5,
      min: 1,
      max: 7,
      data: [1, 2, 3, 3, 5, 7],
      start_state: "In Progress",
      end_state: "Done"
    }
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
      cycle_time_end_state: 'Done'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
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
    
    const selectButton = await screen.findByRole('button', { name: /Select/i });
    fireEvent.click(selectButton);

    const jqlInput = screen.getByPlaceholderText(/Enter JQL Query/i);
    expect(jqlInput).toHaveValue('project = TEST');
  });

  it('opens configuration form when Add Configuration is clicked', async () => {
    render(() => <App />);
    
    const addButton = screen.getByRole('button', { name: /Add Configuration/i });
    fireEvent.click(addButton);

    expect(screen.getByText(/Add Configuration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Configuration Name/i)).toBeInTheDocument();
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

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    const error = new Error('API Error');
    vi.mocked(jiraApi.getLeadTime).mockRejectedValue(error);
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(() => <App />);
    fireEvent.click(screen.getByRole('button', { name: /Analyze/i }));
    
    expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch metrics:', error);
    consoleSpy.mockRestore();
  });

  it('allows manual JQL input when no configuration is selected', () => {
    render(() => <App />);
    
    const jqlInput = screen.getByPlaceholderText(/Enter JQL Query/i);
    const newQuery = 'project = CUSTOM';
    
    fireEvent.input(jqlInput, { target: { value: newQuery } });
    fireEvent.click(screen.getByRole('button', { name: /Analyze/i }));
    
    expect(jiraApi.getLeadTime).toHaveBeenCalledWith(newQuery);
  });
});
