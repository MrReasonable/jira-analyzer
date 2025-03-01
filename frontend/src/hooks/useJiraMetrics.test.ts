import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@solidjs/testing-library'
import { useJiraMetrics } from './useJiraMetrics'
import { jiraApi } from '../api/jiraApi'

// Mock the jiraApi module
vi.mock('../api/jiraApi', () => ({
  jiraApi: {
    getLeadTime: vi.fn(),
    getThroughput: vi.fn(),
    getWip: vi.fn(),
    getCfd: vi.fn(),
    getCycleTime: vi.fn(),
  },
}))

describe('useJiraMetrics', () => {
  // Sample mock data for each metric type
  const mockLeadTimeData = {
    average: 5.5,
    median: 5,
    min: 2,
    max: 10,
    data: [2, 5, 7, 8, 10],
  }

  const mockThroughputData = {
    dates: ['2023-01-01', '2023-01-02', '2023-01-03'],
    counts: [3, 5, 2],
    average: 3.33,
  }

  const mockWipData = {
    status: ['Backlog', 'In Progress', 'Done'],
    counts: [5, 3, 10],
    total: 18,
  }

  const mockCfdData = {
    statuses: ['Backlog', 'In Progress', 'Done'],
    data: [
      { date: '2023-01-01', Backlog: 5, 'In Progress': 3, Done: 2 },
      { date: '2023-01-02', Backlog: 4, 'In Progress': 4, Done: 3 },
    ],
  }

  const mockCycleTimeData = {
    average: 3.5,
    median: 3,
    min: 1,
    max: 7,
    data: [1, 3, 3, 7],
    start_state: 'In Progress',
    end_state: 'Done',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Set up mock implementations
    vi.mocked(jiraApi.getLeadTime).mockResolvedValue(mockLeadTimeData)
    vi.mocked(jiraApi.getThroughput).mockResolvedValue(mockThroughputData)
    vi.mocked(jiraApi.getWip).mockResolvedValue(mockWipData)
    vi.mocked(jiraApi.getCfd).mockResolvedValue(mockCfdData)
    vi.mocked(jiraApi.getCycleTime).mockResolvedValue(mockCycleTimeData)
  })

  it('initializes with default JQL', () => {
    const { result } = renderHook(() => useJiraMetrics())
    expect(result.jql()).toBe('project = "DEMO" AND type = Story')
  })

  it('initializes with custom JQL when provided', () => {
    const customJql = 'project = TEST AND type = Bug'
    const { result } = renderHook(() => useJiraMetrics(customJql))
    expect(result.jql()).toBe(customJql)
  })

  it('updates JQL when setJql is called', () => {
    const { result } = renderHook(() => useJiraMetrics())
    const newJql = 'project = UPDATED AND type = Task'

    result.setJql(newJql)
    expect(result.jql()).toBe(newJql)
  })

  it('updates configName when setConfigName is called', () => {
    const { result } = renderHook(() => useJiraMetrics())

    // Initially configName should be undefined
    expect(result.configName()).toBeUndefined()

    const newConfigName = 'Test Configuration'
    result.setConfigName(newConfigName)
    expect(result.configName()).toBe(newConfigName)
  })

  it('passes configName to API calls when set', async () => {
    const { result } = renderHook(() => useJiraMetrics())
    const configName = 'Test Configuration'

    // Set the configuration name
    result.setConfigName(configName)

    // Call fetchMetrics
    await result.fetchMetrics()

    // Verify all API methods were called with the correct JQL and configName
    const expectedJql = 'project = "DEMO" AND type = Story'
    expect(jiraApi.getLeadTime).toHaveBeenCalledWith(expectedJql, configName)
    expect(jiraApi.getThroughput).toHaveBeenCalledWith(expectedJql, configName)
    expect(jiraApi.getWip).toHaveBeenCalledWith(expectedJql, configName)
    expect(jiraApi.getCfd).toHaveBeenCalledWith(expectedJql, configName)
    expect(jiraApi.getCycleTime).toHaveBeenCalledWith(expectedJql, configName)
  })

  it('fetches all metrics when fetchMetrics is called', async () => {
    const { result } = renderHook(() => useJiraMetrics())

    // Initially all metrics should be null
    expect(result.leadTimeData()).toBeNull()
    expect(result.throughputData()).toBeNull()
    expect(result.wipData()).toBeNull()
    expect(result.cfdData()).toBeNull()
    expect(result.cycleTimeData()).toBeNull()

    // Call fetchMetrics
    await result.fetchMetrics()

    // Verify all API methods were called with the correct JQL and undefined configName
    const expectedJql = 'project = "DEMO" AND type = Story'
    expect(jiraApi.getLeadTime).toHaveBeenCalledWith(expectedJql, undefined)
    expect(jiraApi.getThroughput).toHaveBeenCalledWith(expectedJql, undefined)
    expect(jiraApi.getWip).toHaveBeenCalledWith(expectedJql, undefined)
    expect(jiraApi.getCfd).toHaveBeenCalledWith(expectedJql, undefined)
    expect(jiraApi.getCycleTime).toHaveBeenCalledWith(expectedJql, undefined)

    // Verify all metrics were set
    expect(result.leadTimeData()).toEqual(mockLeadTimeData)
    expect(result.throughputData()).toEqual(mockThroughputData)
    expect(result.wipData()).toEqual(mockWipData)
    expect(result.cfdData()).toEqual(mockCfdData)
    expect(result.cycleTimeData()).toEqual(mockCycleTimeData)
  })

  it('handles API errors during fetchMetrics', async () => {
    const errorMessage = 'API connection failed'
    vi.mocked(jiraApi.getLeadTime).mockRejectedValueOnce(new Error(errorMessage))

    const { result } = renderHook(() => useJiraMetrics())

    await result.fetchMetrics()

    // Verify error was set
    expect(result.error()).toBeInstanceOf(Error)
    expect(result.error()?.message).toBe(errorMessage)

    // Verify loading state was reset
    expect(result.loading()).toBe(false)
  })

  it('sets loading state during fetchMetrics', async () => {
    const { result } = renderHook(() => useJiraMetrics())

    // Mock a delay in the API call to test loading state
    vi.mocked(jiraApi.getLeadTime).mockImplementationOnce(() => {
      return new Promise(resolve => {
        // Use global setTimeout
        global.setTimeout(() => resolve(mockLeadTimeData), 100)
      })
    })

    // Start fetching metrics
    const fetchPromise = result.fetchMetrics()

    // Loading should be true immediately after calling fetchMetrics
    expect(result.loading()).toBe(true)

    // Wait for fetch to complete
    await fetchPromise

    // Loading should be false after fetch completes
    expect(result.loading()).toBe(false)
  })
})
