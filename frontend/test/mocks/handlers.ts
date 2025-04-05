import { vi } from 'vitest'
import { mockData } from '@test/testUtils'
import type { JiraConfiguration } from '@api/jiraApi'

// Create mock functions for jiraApi
export const mockJiraApi = {
  getLeadTime: vi.fn().mockResolvedValue(mockData.leadTime),
  getThroughput: vi.fn().mockResolvedValue(mockData.throughput),
  getWip: vi.fn().mockResolvedValue(mockData.wip),
  getCfd: vi.fn().mockResolvedValue(mockData.cfd),
  getCycleTime: vi.fn().mockResolvedValue(mockData.leadTime), // Reuse leadTime data for cycleTime

  // Add missing methods for useConfigurationForm tests
  validateCredentials: vi
    .fn()
    .mockResolvedValue({ status: 'success', message: 'Valid credentials' }),
  getProjectsWithCredentials: vi.fn().mockResolvedValue([
    { key: 'TEST', name: 'Test Project' },
    { key: 'DEMO', name: 'Demo Project' },
  ]),
  getProjects: vi.fn().mockResolvedValue([
    { key: 'TEST', name: 'Test Project' },
    { key: 'DEMO', name: 'Demo Project' },
  ]),

  createConfiguration: vi.fn().mockImplementation((config: JiraConfiguration) => {
    return Promise.resolve({ id: 3, ...config })
  }),

  listConfigurations: vi.fn().mockResolvedValue(mockData.configurations),

  getConfiguration: vi.fn().mockImplementation((name: string) => {
    return Promise.resolve({ ...mockData.configuration, name })
  }),

  updateConfiguration: vi.fn().mockImplementation((name: string, config: JiraConfiguration) => {
    return Promise.resolve({ ...config, name })
  }),

  deleteConfiguration: vi.fn().mockResolvedValue(undefined),
}

// Mock the jiraApi module for tests
vi.mock('@api/jiraApi', () => {
  // Create a mock axios instance
  const mockAxios = {
    create: vi.fn().mockReturnValue({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
      defaults: {},
    }),
  }

  return {
    api: mockAxios.create(),
    getApiBaseUrl: vi.fn().mockReturnValue('http://localhost/api'),
    jiraApi: mockJiraApi,
  }
})

// Export for use in tests
export const mockHandlers = {
  resetMocks: () => {
    mockJiraApi.getLeadTime.mockClear()
    mockJiraApi.getThroughput.mockClear()
    mockJiraApi.getWip.mockClear()
    mockJiraApi.getCfd.mockClear()
    mockJiraApi.getCycleTime.mockClear()
    mockJiraApi.validateCredentials.mockClear()
    mockJiraApi.getProjectsWithCredentials.mockClear()
    mockJiraApi.getProjects.mockClear()
    mockJiraApi.createConfiguration.mockClear()
    mockJiraApi.listConfigurations.mockClear()
    mockJiraApi.getConfiguration.mockClear()
    mockJiraApi.updateConfiguration.mockClear()
    mockJiraApi.deleteConfiguration.mockClear()
  },
}
