/**
 * Tests for the jiraApi module using axios-mock-adapter
 * This approach tests the actual HTTP interactions and behavior.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import { api, jiraApi } from './jiraApi'
import { mockData } from '@test/testUtils'

// We don't need to test logging, so we'll just mock it to avoid polluting test output
vi.mock('@utils/logger')

describe('jiraApi', () => {
  // Create a mock adapter for axios
  let mockAxios: MockAdapter

  beforeEach(() => {
    mockAxios = new MockAdapter(api)
    vi.clearAllMocks()
  })

  afterEach(() => {
    mockAxios.reset()
  })

  it('should export the jiraApi object', () => {
    expect(jiraApi).toBeDefined()
    expect(typeof jiraApi).toBe('object')
  })

  describe('credentials management', () => {
    const mockCredentials = {
      name: 'test-config',
      jira_server: 'https://test.atlassian.net',
      jira_email: 'test@example.com',
      jira_api_token: 'token123',
    }

    describe('validateCredentials', () => {
      it('should call the correct endpoint and return response data', async () => {
        // Setup mock response
        const mockResponse = { status: 'success', message: 'Credentials valid' }
        mockAxios.onPost('/validate-credentials', mockCredentials).reply(200, mockResponse)

        // Execute
        const result = await jiraApi.validateCredentials(mockCredentials)

        // Verify
        expect(result).toEqual(mockResponse)
      })

      it('should handle validation errors correctly', async () => {
        // Setup - simulate a 401 error
        mockAxios.onPost('/validate-credentials').reply(401, { error: 'Invalid credentials' })

        // Execute & Verify
        await expect(jiraApi.validateCredentials(mockCredentials)).rejects.toThrow()
      })
    })
  })

  describe('project operations', () => {
    describe('getProjects', () => {
      const mockProjects = [
        { key: 'TEST', name: 'Test Project' },
        { key: 'DEV', name: 'Development Project' },
      ]

      it('should fetch projects with the given config name', async () => {
        // Setup - match the URL with query parameters
        mockAxios
          .onGet('/jira/projects', { params: { config_name: 'test-config' } })
          .reply(200, mockProjects)

        // Execute
        const result = await jiraApi.getProjects('test-config')

        // Verify
        expect(result).toEqual(mockProjects)
      })

      it('should handle errors when fetching projects fails', async () => {
        // Setup - simulate a 500 error
        mockAxios.onGet('/jira/projects').reply(500, { error: 'Server error' })

        // Execute & Verify
        await expect(jiraApi.getProjects('test-config')).rejects.toThrow()
      })
    })

    describe('getProjectsWithCredentials', () => {
      const mockCredentials = {
        name: 'test-config',
        jira_server: 'https://test.atlassian.net',
        jira_email: 'test@example.com',
        jira_api_token: 'token123',
      }

      const mockProjects = [
        { key: 'TEST', name: 'Test Project' },
        { key: 'DEV', name: 'Development Project' },
      ]

      it('should call the correct endpoint with credentials', async () => {
        // Setup
        mockAxios
          .onPost('/jira/projects-with-credentials', mockCredentials)
          .reply(200, mockProjects)

        // Execute
        const result = await jiraApi.getProjectsWithCredentials(mockCredentials)

        // Verify
        expect(result).toEqual(mockProjects)
      })

      it('should handle API errors with detailed logging', async () => {
        // Setup - simulate a 401 error with response data
        mockAxios.onPost('/jira/projects-with-credentials').reply(401, {
          message: 'Invalid credentials',
        })

        // Execute & Verify
        await expect(jiraApi.getProjectsWithCredentials(mockCredentials)).rejects.toThrow()
      })
    })
  })

  describe('workflow operations', () => {
    describe('getWorkflows', () => {
      const mockWorkflows = [
        { id: '1', name: 'Todo', category: 'To Do' },
        { id: '2', name: 'Done', category: 'Done' },
      ]

      it('should call the correct endpoint when fetching workflows', async () => {
        // Setup
        mockAxios
          .onGet('/jira/workflows', {
            params: { project_key: 'TEST-1', config_name: 'test-config' },
          })
          .reply(200, mockWorkflows)

        // Execute
        const result = await jiraApi.getWorkflows('TEST-1', 'test-config')

        // Verify
        expect(result).toEqual(mockWorkflows)
      })

      it('should handle errors when fetching workflows fails', async () => {
        // Setup
        mockAxios.onGet('/jira/workflows').reply(500, { error: 'Server error' })

        // Execute & Verify
        await expect(jiraApi.getWorkflows('TEST-1')).rejects.toThrow()
      })
    })

    describe('getWorkflowsWithCredentials', () => {
      const mockCredentials = {
        name: 'test-config',
        jira_server: 'https://test.atlassian.net',
        jira_email: 'test@example.com',
        jira_api_token: 'token123',
      }

      const mockWorkflows = [
        { id: '1', name: 'Todo', category: 'To Do' },
        { id: '2', name: 'Done', category: 'Done' },
      ]

      it('should call the correct endpoint when using credentials', async () => {
        // Setup
        mockAxios.onPost('/jira/workflows-with-credentials').reply(200, mockWorkflows)

        // Execute
        const result = await jiraApi.getWorkflowsWithCredentials(mockCredentials, 'TEST-1')

        // Verify
        expect(result).toEqual(mockWorkflows)
      })

      it('should handle errors when fetching workflows with credentials fails', async () => {
        // Setup
        mockAxios.onPost('/jira/workflows-with-credentials').reply(500, { error: 'Server error' })

        // Execute & Verify
        await expect(
          jiraApi.getWorkflowsWithCredentials(mockCredentials, 'TEST-1')
        ).rejects.toThrow()
      })
    })
  })

  describe('metrics operations', () => {
    describe('getLeadTime', () => {
      it('should call the correct endpoint with parameters', async () => {
        // Setup
        mockAxios
          .onGet('/metrics/lead-time', {
            params: { jql: 'project = TEST', config_name: 'test-config' },
          })
          .reply(200, mockData.leadTime)

        // Execute
        const result = await jiraApi.getLeadTime('project = TEST', 'test-config')

        // Verify
        expect(result).toEqual(mockData.leadTime)
      })

      it('should handle errors when fetching lead time metrics fails', async () => {
        // Setup
        mockAxios.onGet('/metrics/lead-time').reply(500, { error: 'Server error' })

        // Execute & Verify
        await expect(jiraApi.getLeadTime('project = TEST')).rejects.toThrow()
      })
    })

    describe('getThroughput', () => {
      it('should call the correct endpoint with parameters', async () => {
        // Setup
        mockAxios
          .onGet('/metrics/throughput', {
            params: { jql: 'project = TEST', config_name: 'test-config' },
          })
          .reply(200, mockData.throughput)

        // Execute
        const result = await jiraApi.getThroughput('project = TEST', 'test-config')

        // Verify
        expect(result).toEqual(mockData.throughput)
      })

      it('should handle errors when fetching throughput metrics fails', async () => {
        // Setup
        mockAxios.onGet('/metrics/throughput').reply(500, { error: 'Server error' })

        // Execute & Verify
        await expect(jiraApi.getThroughput('project = TEST')).rejects.toThrow()
      })
    })

    describe('getWip', () => {
      it('should call the correct endpoint with parameters', async () => {
        // Setup
        mockAxios
          .onGet('/metrics/wip', {
            params: { jql: 'project = TEST', config_name: 'test-config' },
          })
          .reply(200, mockData.wip)

        // Execute
        const result = await jiraApi.getWip('project = TEST', 'test-config')

        // Verify
        expect(result).toEqual(mockData.wip)
      })

      it('should handle errors when fetching WIP metrics fails', async () => {
        // Setup
        mockAxios.onGet('/metrics/wip').reply(500, { error: 'Server error' })

        // Execute & Verify
        await expect(jiraApi.getWip('project = TEST')).rejects.toThrow()
      })
    })

    describe('getCycleTime', () => {
      it('should call the correct endpoint with parameters', async () => {
        // Setup
        mockAxios
          .onGet('/metrics/cycle-time', {
            params: { jql: 'project = TEST', config_name: 'test-config' },
          })
          .reply(200, mockData.leadTime)

        // Execute
        const result = await jiraApi.getCycleTime('project = TEST', 'test-config')

        // Verify
        expect(result).toEqual(mockData.leadTime)
      })

      it('should handle errors when fetching cycle time metrics fails', async () => {
        // Setup
        mockAxios.onGet('/metrics/cycle-time').reply(500, { error: 'Server error' })

        // Execute & Verify
        await expect(jiraApi.getCycleTime('project = TEST')).rejects.toThrow()
      })
    })

    describe('getCfd', () => {
      it('should call the correct endpoint with parameters', async () => {
        // Setup
        mockAxios
          .onGet('/metrics/cfd', {
            params: { jql: 'project = TEST', config_name: 'test-config' },
          })
          .reply(200, mockData.cfd)

        // Execute
        const result = await jiraApi.getCfd('project = TEST', 'test-config')

        // Verify
        expect(result).toEqual(mockData.cfd)
      })

      it('should handle errors when fetching CFD metrics fails', async () => {
        // Setup
        mockAxios.onGet('/metrics/cfd').reply(500, { error: 'Server error' })

        // Execute & Verify
        await expect(jiraApi.getCfd('project = TEST')).rejects.toThrow()
      })
    })
  })

  describe('configuration operations', () => {
    describe('createConfiguration', () => {
      const mockConfig = {
        name: 'test-config',
        jira_server: 'https://test.atlassian.net',
        jira_email: 'test@example.com',
        jira_api_token: 'token123',
        jql_query: 'project = TEST',
        workflow_states: ['To Do', 'In Progress', 'Done'],
        lead_time_start_state: 'To Do',
        lead_time_end_state: 'Done',
        cycle_time_start_state: 'In Progress',
        cycle_time_end_state: 'Done',
      }

      it('should call the correct endpoint with configuration data', async () => {
        // Setup
        const responseConfig = {
          ...mockConfig,
          id: 1,
          jira_api_token: 'test-token', // API returns different token format
        }
        mockAxios.onPost('/configurations', mockConfig).reply(201, responseConfig)

        // Execute
        const result = await jiraApi.createConfiguration(mockConfig)

        // Verify
        expect(result).toEqual(responseConfig)
      })

      it('should handle errors when creating configuration fails', async () => {
        // Setup
        mockAxios.onPost('/configurations').reply(400, { error: 'Invalid configuration data' })

        // Execute & Verify
        await expect(jiraApi.createConfiguration(mockConfig)).rejects.toThrow()
      })
    })

    describe('listConfigurations', () => {
      it('should call the correct endpoint and return configuration list', async () => {
        // Setup
        mockAxios.onGet('/configurations').reply(200, { items: mockData.configurations })

        // Execute
        const result = await jiraApi.listConfigurations()

        // Verify
        expect(result).toEqual(mockData.configurations)
      })

      it('should handle empty response data', async () => {
        // Setup
        mockAxios.onGet('/configurations').reply(200, {})

        // Execute
        const result = await jiraApi.listConfigurations()

        // Verify
        expect(result).toEqual([])
      })

      it('should handle errors when listing configurations fails', async () => {
        // Setup
        mockAxios.onGet('/configurations').reply(500, { error: 'Server error' })

        // Execute & Verify
        await expect(jiraApi.listConfigurations()).rejects.toThrow()
      })
    })

    describe('getConfiguration', () => {
      it('should call the correct endpoint with configuration name', async () => {
        // Setup - Create a response with the correct name format as returned by API
        const mockResponse = {
          id: 1,
          name: 'Test Config', // API returns a different capitalization
          jira_server: 'https://test.atlassian.net',
          jira_email: 'test@example.com',
          jira_api_token: 'test-token',
          jql_query: 'project = TEST',
          workflow_states: ['To Do', 'In Progress', 'Done'],
          lead_time_start_state: 'To Do',
          lead_time_end_state: 'Done',
          cycle_time_start_state: 'In Progress',
          cycle_time_end_state: 'Done',
        }
        mockAxios.onGet('/configurations/test-config').reply(200, mockResponse)

        // Execute
        const result = await jiraApi.getConfiguration('test-config')

        // Verify - Expect exactly what the API returns
        expect(result).toEqual(mockResponse)
      })

      it('should handle errors when getting configuration fails', async () => {
        // Setup
        mockAxios
          .onGet('/configurations/test-config')
          .reply(404, { error: 'Configuration not found' })

        // Execute & Verify
        await expect(jiraApi.getConfiguration('test-config')).rejects.toThrow()
      })
    })

    describe('updateConfiguration', () => {
      const mockConfig = {
        name: 'test-config',
        jira_server: 'https://test.atlassian.net',
        jira_email: 'test@example.com',
        jira_api_token: 'token123',
        jql_query: 'project = TEST',
        workflow_states: ['To Do', 'In Progress', 'Done'],
        lead_time_start_state: 'To Do',
        lead_time_end_state: 'Done',
        cycle_time_start_state: 'In Progress',
        cycle_time_end_state: 'Done',
      }

      it('should call the correct endpoint with configuration data', async () => {
        // Setup - Create a response with the format that API returns
        const responseConfig = {
          id: 1,
          name: 'Test Config', // API uses different capitalization
          jira_server: 'https://test.atlassian.net',
          jira_email: 'test@example.com',
          jira_api_token: 'test-token', // API returns different token format
          jql_query: 'project = TEST',
          workflow_states: ['To Do', 'In Progress', 'Done'],
          lead_time_start_state: 'To Do',
          lead_time_end_state: 'Done',
          cycle_time_start_state: 'In Progress',
          cycle_time_end_state: 'Done',
        }
        mockAxios.onPut('/configurations/test-config', mockConfig).reply(200, responseConfig)

        // Execute
        const result = await jiraApi.updateConfiguration('test-config', mockConfig)

        // Verify - Expect exactly what the API returns
        expect(result).toEqual(responseConfig)
      })

      it('should handle errors when updating configuration fails', async () => {
        // Setup
        mockAxios
          .onPut('/configurations/test-config')
          .reply(400, { error: 'Invalid configuration data' })

        // Execute & Verify
        await expect(jiraApi.updateConfiguration('test-config', mockConfig)).rejects.toThrow()
      })
    })

    describe('deleteConfiguration', () => {
      it('should call the correct endpoint with configuration name', async () => {
        // Setup
        mockAxios.onDelete('/configurations/test-config').reply(204)

        // Execute
        await jiraApi.deleteConfiguration('test-config')

        // Verify - Just check that the execution completes successfully
      })

      it('should handle errors when deleting configuration fails', async () => {
        // Setup
        mockAxios
          .onDelete('/configurations/test-config')
          .reply(404, { error: 'Configuration not found' })

        // Execute & Verify
        await expect(jiraApi.deleteConfiguration('test-config')).rejects.toThrow()
      })
    })
  })
})
