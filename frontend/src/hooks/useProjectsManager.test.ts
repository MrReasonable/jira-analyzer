import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@solidjs/testing-library'
import { useProjectsManager } from './useProjectsManager'
import { jiraApi } from '@api/jiraApi'
import type { JiraCredentials, JiraProject } from './useProjectsManager'

// Mock the jiraApi
vi.mock('@api/jiraApi', () => ({
  jiraApi: {
    getProjectsWithCredentials: vi.fn(),
  },
}))

// Mock the logger
vi.mock('@utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}))

describe('useProjectsManager', () => {
  const mockCredentials: JiraCredentials = {
    name: 'Test Config',
    jira_server: 'https://test.atlassian.net',
    jira_email: 'test@example.com',
    jira_api_token: 'test-token',
  }

  const mockProjects: JiraProject[] = [
    { key: 'TEST', name: 'Test Project' },
    { key: 'DEV', name: 'Development Project' },
  ]

  const mockOnProjectsFetched = vi.fn()
  const mockOnError = vi.fn()
  const mockOnProjectSelected = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() =>
      useProjectsManager({
        credentials: () => mockCredentials,
      })
    )

    expect(result.projects()).toEqual([])
    expect(result.isLoading()).toBe(false)
    expect(result.error()).toBeNull()
    expect(result.selectedProjectKey()).toBeNull()
  })

  it('should fetch projects successfully', async () => {
    // Mock the API response
    vi.mocked(jiraApi.getProjectsWithCredentials).mockResolvedValue(mockProjects)

    const { result } = renderHook(() =>
      useProjectsManager({
        credentials: () => mockCredentials,
        onProjectsFetched: mockOnProjectsFetched,
        onError: mockOnError,
      })
    )

    // Initial state
    expect(result.projects()).toEqual([])
    expect(result.isLoading()).toBe(false)

    // Fetch projects
    await result.fetchProjects()

    // Check that the projects were fetched
    expect(jiraApi.getProjectsWithCredentials).toHaveBeenCalledWith(mockCredentials)
    expect(result.projects()).toEqual(mockProjects)
    expect(result.isLoading()).toBe(false)
    expect(mockOnProjectsFetched).toHaveBeenCalledWith(mockProjects)
    expect(mockOnError).not.toHaveBeenCalled()
  })

  it('should handle API errors when fetching projects', async () => {
    // Mock the API error
    const error = new Error('API Error')
    vi.mocked(jiraApi.getProjectsWithCredentials).mockRejectedValue(error)

    const { result } = renderHook(() =>
      useProjectsManager({
        credentials: () => mockCredentials,
        onProjectsFetched: mockOnProjectsFetched,
        onError: mockOnError,
      })
    )

    // Fetch projects
    await result.fetchProjects()

    // Check that the error was handled
    expect(jiraApi.getProjectsWithCredentials).toHaveBeenCalledWith(mockCredentials)
    expect(result.projects()).toEqual([])
    expect(result.isLoading()).toBe(false)
    expect(result.error()).not.toBeNull()
    expect(mockOnProjectsFetched).not.toHaveBeenCalled()
    expect(mockOnError).toHaveBeenCalled()
  })

  it('should select a project', () => {
    const { result } = renderHook(() =>
      useProjectsManager({
        credentials: () => mockCredentials,
        onProjectSelected: mockOnProjectSelected,
      })
    )

    // Select a project
    result.selectProject('TEST')

    // Check that the project was selected
    expect(result.selectedProjectKey()).toBe('TEST')
    expect(mockOnProjectSelected).toHaveBeenCalledWith('TEST')
  })

  it('should not call onProjectSelected if not provided', () => {
    const { result } = renderHook(() =>
      useProjectsManager({
        credentials: () => mockCredentials,
      })
    )

    // Select a project
    result.selectProject('TEST')

    // Check that the project was selected
    expect(result.selectedProjectKey()).toBe('TEST')
  })

  it('should initialize with initial project key', async () => {
    // Mock the API response
    vi.mocked(jiraApi.getProjectsWithCredentials).mockResolvedValue(mockProjects)

    const { result } = renderHook(() =>
      useProjectsManager({
        credentials: () => mockCredentials,
        initialProjectKey: 'TEST',
      })
    )

    // Initial state should have the initial project key
    expect(result.selectedProjectKey()).toBe('TEST')

    // Fetch projects
    await result.fetchProjects()

    // Check that the projects were fetched
    expect(jiraApi.getProjectsWithCredentials).toHaveBeenCalledWith(mockCredentials)
    expect(result.projects()).toEqual(mockProjects)
    expect(result.selectedProjectKey()).toBe('TEST')
  })
})
