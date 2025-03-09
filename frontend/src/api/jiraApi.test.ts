import { describe, it, expect, vi, beforeEach } from 'vitest'
import { jiraApi } from './jiraApi'

// Mock dependencies - simplified approach
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn().mockResolvedValue({ data: {} }),
      post: vi.fn().mockResolvedValue({ data: {} }),
      put: vi.fn().mockResolvedValue({ data: {} }),
      delete: vi.fn().mockResolvedValue({}),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
  },
}))

vi.mock('@utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

describe('jiraApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should export the jiraApi object', () => {
    expect(jiraApi).toBeDefined()
    expect(typeof jiraApi).toBe('object')
  })
})
