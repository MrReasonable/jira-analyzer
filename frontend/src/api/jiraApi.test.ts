import { describe, it, expect, vi, beforeEach } from 'vitest';
import { jiraApi } from './jiraApi';
import { mockData } from '../test/testUtils';

// Mock the entire jiraApi module
vi.mock('./jiraApi', () => {
  // Create a mock implementation with vi.fn() for each method
  const mockJiraApi = {
    getLeadTime: vi.fn(),
    getThroughput: vi.fn(),
    getWip: vi.fn(),
    getCfd: vi.fn(),
    getCycleTime: vi.fn(),
    createConfiguration: vi.fn(),
    listConfigurations: vi.fn(),
    getConfiguration: vi.fn(),
    updateConfiguration: vi.fn(),
    deleteConfiguration: vi.fn(),
  };

  return { jiraApi: mockJiraApi };
});

describe('jiraApi', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    vi.resetAllMocks();

    // Set default successful responses
    vi.mocked(jiraApi.getLeadTime).mockResolvedValue(mockData.leadTime);
    vi.mocked(jiraApi.getThroughput).mockResolvedValue(mockData.throughput);
    vi.mocked(jiraApi.getWip).mockResolvedValue(mockData.wip);
    vi.mocked(jiraApi.getCfd).mockResolvedValue(mockData.cfd);
    vi.mocked(jiraApi.createConfiguration).mockImplementation(config =>
      Promise.resolve({ id: 3, ...config })
    );
    vi.mocked(jiraApi.listConfigurations).mockResolvedValue(mockData.configurations);
    vi.mocked(jiraApi.getConfiguration).mockImplementation(name =>
      Promise.resolve({ ...mockData.configuration, name })
    );
    vi.mocked(jiraApi.updateConfiguration).mockImplementation((name, config) =>
      Promise.resolve({ ...config, name })
    );
    vi.mocked(jiraApi.deleteConfiguration).mockResolvedValue(undefined);
  });

  describe('Lead Time API', () => {
    it('returns lead time metrics when called with a JQL query', async () => {
      const jql = 'project = TEST';
      const result = await jiraApi.getLeadTime(jql);

      expect(jiraApi.getLeadTime).toHaveBeenCalledWith(jql);
      expect(result).toEqual(mockData.leadTime);
    });

    it('propagates errors when the API call fails', async () => {
      const error = new Error('API Error');
      vi.mocked(jiraApi.getLeadTime).mockRejectedValueOnce(error);

      await expect(jiraApi.getLeadTime('project = TEST')).rejects.toThrow('API Error');
    });
  });

  describe('Throughput API', () => {
    it('returns throughput metrics when called with a JQL query', async () => {
      const jql = 'project = TEST';
      const result = await jiraApi.getThroughput(jql);

      expect(jiraApi.getThroughput).toHaveBeenCalledWith(jql);
      expect(result).toEqual(mockData.throughput);
    });

    it('propagates errors when the API call fails', async () => {
      const error = new Error('API Error');
      vi.mocked(jiraApi.getThroughput).mockRejectedValueOnce(error);

      await expect(jiraApi.getThroughput('project = TEST')).rejects.toThrow('API Error');
    });
  });

  describe('WIP API', () => {
    it('returns WIP metrics when called with a JQL query', async () => {
      const jql = 'project = TEST';
      const result = await jiraApi.getWip(jql);

      expect(jiraApi.getWip).toHaveBeenCalledWith(jql);
      expect(result).toEqual(mockData.wip);
    });

    it('propagates errors when the API call fails', async () => {
      const error = new Error('API Error');
      vi.mocked(jiraApi.getWip).mockRejectedValueOnce(error);

      await expect(jiraApi.getWip('project = TEST')).rejects.toThrow('API Error');
    });
  });

  describe('CFD API', () => {
    it('returns CFD metrics when called with a JQL query', async () => {
      const jql = 'project = TEST';
      const result = await jiraApi.getCfd(jql);

      expect(jiraApi.getCfd).toHaveBeenCalledWith(jql);
      expect(result).toEqual(mockData.cfd);
    });

    it('propagates errors when the API call fails', async () => {
      const error = new Error('API Error');
      vi.mocked(jiraApi.getCfd).mockRejectedValueOnce(error);

      await expect(jiraApi.getCfd('project = TEST')).rejects.toThrow('API Error');
    });
  });

  describe('Configuration Management', () => {
    const testConfig = {
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
    };

    it('creates a new configuration', async () => {
      const result = await jiraApi.createConfiguration(testConfig);

      expect(jiraApi.createConfiguration).toHaveBeenCalledWith(testConfig);
      expect(result).toEqual({ id: 3, ...testConfig });
    });

    it('lists all configurations', async () => {
      const result = await jiraApi.listConfigurations();

      expect(jiraApi.listConfigurations).toHaveBeenCalled();
      expect(result).toEqual(mockData.configurations);
    });

    it('retrieves a specific configuration by name', async () => {
      const name = 'Test Config';
      const result = await jiraApi.getConfiguration(name);

      expect(jiraApi.getConfiguration).toHaveBeenCalledWith(name);
      expect(result).toEqual({ ...mockData.configuration, name });
    });

    it('updates an existing configuration', async () => {
      const name = 'Test Config';
      const updatedConfig = { ...testConfig, jql_query: 'project = UPDATED' };

      const result = await jiraApi.updateConfiguration(name, updatedConfig);

      expect(jiraApi.updateConfiguration).toHaveBeenCalledWith(name, updatedConfig);
      expect(result).toEqual({ ...updatedConfig, name });
    });

    it('deletes a configuration', async () => {
      const name = 'Test Config';
      await jiraApi.deleteConfiguration(name);

      expect(jiraApi.deleteConfiguration).toHaveBeenCalledWith(name);
    });

    it('propagates errors when configuration operations fail', async () => {
      const error = new Error('API Error');
      vi.mocked(jiraApi.createConfiguration).mockRejectedValueOnce(error);

      await expect(jiraApi.createConfiguration(testConfig)).rejects.toThrow('API Error');
    });
  });

  describe('Error Handling', () => {
    it('handles network errors', async () => {
      const networkError = new Error('Network Error');
      vi.mocked(jiraApi.getLeadTime).mockRejectedValueOnce(networkError);

      await expect(jiraApi.getLeadTime('project = TEST')).rejects.toThrow('Network Error');
    });

    it('handles server errors', async () => {
      const serverError = new Error('Server Error');
      vi.mocked(jiraApi.getLeadTime).mockRejectedValueOnce(serverError);

      await expect(jiraApi.getLeadTime('project = TEST')).rejects.toThrow('Server Error');
    });

    it('handles unexpected response formats', async () => {
      const formatError = new Error('Unexpected response format');
      vi.mocked(jiraApi.getLeadTime).mockRejectedValueOnce(formatError);

      await expect(jiraApi.getLeadTime('project = TEST')).rejects.toThrow(
        'Unexpected response format'
      );
    });
  });
});
