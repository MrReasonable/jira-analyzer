import { vi } from 'vitest'
import { mockData } from '@test/testUtils'
// Removing unused JiraConfiguration import to fix linting error
import { logger } from '@utils/logger'

// Create mock functions for jiraApi
export const mockJiraApi = {
  // Credential operations
  validateCredentials: vi.fn().mockImplementation(() => {
    logger.debug('Validating Jira credentials', { name: 'test-config' })
    logger.info('Jira credentials validated successfully')
    return Promise.resolve({ status: 'success', message: 'Credentials valid' })
  }),

  // Projects operations
  getProjectsWithCredentials: vi.fn().mockImplementation(() => {
    logger.info('Jira projects fetched successfully with credentials')
    return Promise.resolve([
      { key: 'TEST', name: 'Test Project' },
      { key: 'DEV', name: 'Development Project' },
    ])
  }),

  getProjects: vi.fn().mockImplementation(() => {
    logger.info('Jira projects fetched successfully')
    return Promise.resolve([
      { key: 'TEST', name: 'Test Project' },
      { key: 'DEV', name: 'Development Project' },
    ])
  }),

  // Workflow operations
  getWorkflows: vi.fn().mockImplementation(() => {
    logger.info('Jira workflows fetched successfully')
    return Promise.resolve([
      { id: '1', name: 'Todo', category: 'To Do' },
      { id: '2', name: 'Done', category: 'Done' },
    ])
  }),

  getWorkflowsWithCredentials: vi.fn().mockImplementation(() => {
    logger.info('Jira workflows fetched successfully with credentials')
    return Promise.resolve([
      { id: '1', name: 'Todo', category: 'To Do' },
      { id: '2', name: 'Done', category: 'Done' },
    ])
  }),

  // Metrics operations
  getLeadTime: vi.fn().mockImplementation(() => {
    logger.info('Lead time metrics fetched successfully')
    return Promise.resolve(mockData.leadTime)
  }),

  getThroughput: vi.fn().mockImplementation(() => {
    logger.info('Throughput metrics fetched successfully')
    return Promise.resolve(mockData.throughput)
  }),

  getWip: vi.fn().mockImplementation(() => {
    logger.info('WIP metrics fetched successfully')
    return Promise.resolve(mockData.wip)
  }),

  getCycleTime: vi.fn().mockImplementation(() => {
    logger.info('Cycle time metrics fetched successfully')
    return Promise.resolve(mockData.leadTime) // Reuse leadTime data for cycleTime
  }),

  getCfd: vi.fn().mockImplementation(() => {
    logger.info('CFD metrics fetched successfully')
    return Promise.resolve(mockData.cfd)
  }),

  // Configuration operations
  createConfiguration: vi.fn().mockImplementation(config => {
    logger.info('Jira configuration created successfully', { name: 'test-config' })
    return Promise.resolve({ ...config, id: 1 })
  }),

  listConfigurations: vi.fn().mockImplementation(() => {
    logger.info('Jira configurations list fetched successfully')
    return Promise.resolve(mockData.configurations)
  }),

  getConfiguration: vi.fn().mockImplementation(name => {
    logger.info('Jira configuration fetched successfully', { name })
    return Promise.resolve(mockData.configuration)
  }),

  updateConfiguration: vi.fn().mockImplementation((name, config) => {
    logger.info('Jira configuration updated successfully', { name })
    return Promise.resolve(config)
  }),

  deleteConfiguration: vi.fn().mockImplementation(name => {
    logger.info('Jira configuration deleted successfully', { name })
    return Promise.resolve(undefined)
  }),
}

// Setup error cases for tests
mockJiraApi.validateCredentials.mockImplementationOnce(credentials => {
  logger.debug('Validating Jira credentials', { name: credentials.name })
  logger.info('Jira credentials validated successfully')
  return Promise.resolve({ status: 'success', message: 'Credentials valid' })
})

// Second call will reject for error test
mockJiraApi.validateCredentials.mockImplementationOnce(() => {
  logger.error('Failed to validate Jira credentials', new Error('Invalid credentials'))
  return Promise.reject(new Error('Invalid credentials'))
})

// Setup error handling for projects
mockJiraApi.getProjects.mockImplementationOnce(() => {
  logger.info('Jira projects fetched successfully')
  return Promise.resolve([
    { key: 'TEST', name: 'Test Project' },
    { key: 'DEV', name: 'Development Project' },
  ])
})

mockJiraApi.getProjects.mockImplementationOnce(() => {
  logger.error('Failed to fetch projects - API error', new Error('Server error'))
  return Promise.reject(new Error('Server error'))
})

// Setup error handling for projects with credentials
mockJiraApi.getProjectsWithCredentials.mockImplementationOnce(() => {
  logger.info('Jira projects fetched successfully with credentials')
  return Promise.resolve([
    { key: 'TEST', name: 'Test Project' },
    { key: 'DEV', name: 'Development Project' },
  ])
})

mockJiraApi.getProjectsWithCredentials.mockImplementationOnce(() => {
  logger.error(
    'Failed to fetch projects with credentials - API error',
    new Error('Invalid credentials')
  )
  return Promise.reject(new Error('Invalid credentials'))
})

// Setup error handling for workflows
mockJiraApi.getWorkflows.mockImplementationOnce(() => {
  logger.info('Jira workflows fetched successfully')
  return Promise.resolve([
    { id: '1', name: 'Todo', category: 'To Do' },
    { id: '2', name: 'Done', category: 'Done' },
  ])
})

mockJiraApi.getWorkflows.mockImplementationOnce(() => {
  logger.error('Failed to fetch Jira workflows', new Error('Server error'))
  return Promise.reject(new Error('Server error'))
})

// Setup error handling for workflows with credentials
mockJiraApi.getWorkflowsWithCredentials.mockImplementationOnce(() => {
  logger.info('Jira workflows fetched successfully with credentials')
  return Promise.resolve([
    { id: '1', name: 'Todo', category: 'To Do' },
    { id: '2', name: 'Done', category: 'Done' },
  ])
})

mockJiraApi.getWorkflowsWithCredentials.mockImplementationOnce(() => {
  logger.error('Failed to fetch Jira workflows with credentials', new Error('Server error'))
  return Promise.reject(new Error('Server error'))
})

// Setup error handling for metrics
mockJiraApi.getLeadTime.mockImplementationOnce(() => {
  logger.info('Lead time metrics fetched successfully')
  return Promise.resolve(mockData.leadTime)
})

mockJiraApi.getLeadTime.mockImplementationOnce(() => {
  logger.error('Failed to fetch lead time metrics', new Error('Server error'))
  return Promise.reject(new Error('Server error'))
})

mockJiraApi.getThroughput.mockImplementationOnce(() => {
  logger.info('Throughput metrics fetched successfully')
  return Promise.resolve(mockData.throughput)
})

mockJiraApi.getThroughput.mockImplementationOnce(() => {
  logger.error('Failed to fetch throughput metrics', new Error('Server error'))
  return Promise.reject(new Error('Server error'))
})

mockJiraApi.getWip.mockImplementationOnce(() => {
  logger.info('WIP metrics fetched successfully')
  return Promise.resolve(mockData.wip)
})

mockJiraApi.getWip.mockImplementationOnce(() => {
  logger.error('Failed to fetch WIP metrics', new Error('Server error'))
  return Promise.reject(new Error('Server error'))
})

mockJiraApi.getCycleTime.mockImplementationOnce(() => {
  logger.info('Cycle time metrics fetched successfully')
  return Promise.resolve(mockData.leadTime)
})

mockJiraApi.getCycleTime.mockImplementationOnce(() => {
  logger.error('Failed to fetch cycle time metrics', new Error('Server error'))
  return Promise.reject(new Error('Server error'))
})

mockJiraApi.getCfd.mockImplementationOnce(() => {
  logger.info('CFD metrics fetched successfully')
  return Promise.resolve(mockData.cfd)
})

mockJiraApi.getCfd.mockImplementationOnce(() => {
  logger.error('Failed to fetch CFD metrics', new Error('Server error'))
  return Promise.reject(new Error('Server error'))
})

// Setup error handling for configuration operations
mockJiraApi.createConfiguration.mockImplementationOnce(() => {
  logger.info('Jira configuration created successfully', { name: 'test-config' })
  return Promise.resolve({ ...mockData.configuration, name: 'test-config', id: 1 })
})

mockJiraApi.createConfiguration.mockImplementationOnce(() => {
  logger.error('Failed to create Jira configuration', new Error('Invalid configuration data'))
  return Promise.reject(new Error('Invalid configuration data'))
})

mockJiraApi.listConfigurations.mockImplementationOnce(() => {
  logger.info('Jira configurations list fetched successfully')
  return Promise.resolve(mockData.configurations)
})

mockJiraApi.listConfigurations.mockImplementationOnce(() => {
  logger.info('Jira configurations list fetched successfully')
  return Promise.resolve([])
})

mockJiraApi.listConfigurations.mockImplementationOnce(() => {
  logger.error('Failed to fetch Jira configurations list', new Error('Server error'))
  return Promise.reject(new Error('Server error'))
})

mockJiraApi.getConfiguration.mockImplementationOnce(() => {
  logger.info('Jira configuration fetched successfully', { name: 'test-config' })
  return Promise.resolve(mockData.configuration)
})

mockJiraApi.getConfiguration.mockImplementationOnce(() => {
  logger.error('Failed to fetch Jira configuration', new Error('Configuration not found'))
  return Promise.reject(new Error('Configuration not found'))
})

mockJiraApi.updateConfiguration.mockImplementationOnce(() => {
  logger.info('Jira configuration updated successfully', { name: 'test-config' })
  return Promise.resolve(mockData.configuration)
})

mockJiraApi.updateConfiguration.mockImplementationOnce(() => {
  logger.error('Failed to update Jira configuration', new Error('Invalid configuration data'))
  return Promise.reject(new Error('Invalid configuration data'))
})

mockJiraApi.deleteConfiguration.mockImplementationOnce(() => {
  logger.info('Jira configuration deleted successfully', { name: 'test-config' })
  return Promise.resolve(undefined)
})

mockJiraApi.deleteConfiguration.mockImplementationOnce(() => {
  logger.error('Failed to delete Jira configuration', new Error('Configuration not found'))
  return Promise.reject(new Error('Configuration not found'))
})

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
    mockJiraApi.getWorkflows.mockClear()
    mockJiraApi.getWorkflowsWithCredentials.mockClear()
    mockJiraApi.createConfiguration.mockClear()
    mockJiraApi.listConfigurations.mockClear()
    mockJiraApi.getConfiguration.mockClear()
    mockJiraApi.updateConfiguration.mockClear()
    mockJiraApi.deleteConfiguration.mockClear()
  },
}
