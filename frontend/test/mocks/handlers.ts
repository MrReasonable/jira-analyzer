import { vi } from 'vitest'
import { mockData } from '@test/testUtils'
import { jiraApi, JiraConfiguration } from '@api/jiraApi'

// Mock the jiraApi module for tests
vi.mock('@api/jiraApi', () => {
  return {
    jiraApi: {
      getLeadTime: vi.fn().mockResolvedValue(mockData.leadTime),
      getThroughput: vi.fn().mockResolvedValue(mockData.throughput),
      getWip: vi.fn().mockResolvedValue(mockData.wip),
      getCfd: vi.fn().mockResolvedValue(mockData.cfd),
      getCycleTime: vi.fn().mockResolvedValue(mockData.leadTime), // Reuse leadTime data for cycleTime

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
    },
  }
})

// Export for use in tests
export const mockHandlers = {
  resetMocks: () => {
    vi.mocked(jiraApi.getLeadTime).mockClear()
    vi.mocked(jiraApi.getThroughput).mockClear()
    vi.mocked(jiraApi.getWip).mockClear()
    vi.mocked(jiraApi.getCfd).mockClear()
    vi.mocked(jiraApi.getCycleTime).mockClear()
    vi.mocked(jiraApi.createConfiguration).mockClear()
    vi.mocked(jiraApi.listConfigurations).mockClear()
    vi.mocked(jiraApi.getConfiguration).mockClear()
    vi.mocked(jiraApi.updateConfiguration).mockClear()
    vi.mocked(jiraApi.deleteConfiguration).mockClear()
  },
}
