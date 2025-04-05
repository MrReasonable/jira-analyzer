// Mock data for tests
export const mockData = {
  leadTime: {
    average: 5.2,
    median: 4.0,
    min: 1,
    max: 15,
    data: [3, 4, 5, 6, 8],
  },

  throughput: {
    dates: ['2023-01-01', '2023-01-02', '2023-01-03'],
    counts: [5, 3, 7],
    average: 5,
  },

  wip: {
    status: ['To Do', 'In Progress', 'Done'],
    counts: [3, 5, 12],
    total: 20,
  },

  cfd: {
    statuses: ['To Do', 'In Progress', 'Done'],
    data: [
      { date: '2023-01-01', 'To Do': 5, 'In Progress': 3, Done: 0 },
      { date: '2023-01-02', 'To Do': 4, 'In Progress': 4, Done: 1 },
      { date: '2023-01-03', 'To Do': 3, 'In Progress': 3, Done: 3 },
    ],
  },

  configuration: {
    id: 1,
    name: 'Test Config',
    jira_server: 'https://test.atlassian.net',
    jira_email: 'test@example.com',
    jira_api_token: 'test-token',
    jql_query: 'project = TEST',
    workflow_states: ['To Do', 'In Progress', 'Done'],
    lead_time_start_state: 'To Do',
    lead_time_end_state: 'Done',
    cycle_time_start_state: 'In Progress',
    cycle_time_end_state: 'Done',
  },

  configurations: [
    {
      name: 'Test Config',
      jira_server: 'https://test.atlassian.net',
      jira_email: 'test@example.com',
    },
    {
      name: 'Another Config',
      jira_server: 'https://another.atlassian.net',
      jira_email: 'another@example.com',
    },
  ],
}

// Setup mock functions for jiraApi
export const setupJiraApiMocks = async () => {
  // Import the mocked jiraApi from handlers
  const { mockHandlers, mockJiraApi } = await import('./mocks/handlers')

  // Reset all mocks using the mockHandlers.resetMocks function
  mockHandlers.resetMocks()

  return mockJiraApi
}
