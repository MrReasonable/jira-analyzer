import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateId } from './idGenerator'

describe('idGenerator', () => {
  const mockRandomUUID = vi.fn(() => 'mocked-uuid-value')

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks()
  })

  afterEach(() => {
    // Restore original implementation
    if (typeof window !== 'undefined' && window.crypto) {
      vi.unstubAllGlobals()
    }
  })

  it('should use window.crypto.randomUUID in browser environment', () => {
    // Mock window.crypto.randomUUID
    vi.stubGlobal('crypto', {
      randomUUID: mockRandomUUID,
    })

    // Also mock the 'in' check to pass
    // This is a workaround for the idGenerator's check: 'randomUUID' in window.crypto
    Object.defineProperty(Object.prototype, 'randomUUID', {
      configurable: true,
      get: () => true,
    })

    const id = generateId()

    // Clean up the prototype modification
    delete (Object.prototype as any).randomUUID

    expect(mockRandomUUID).toHaveBeenCalledTimes(1)
    expect(id).toBe('mocked-uuid-value')
  })

  it('should use fallback method when crypto API is not available', () => {
    // Ensure crypto.randomUUID is not available by setting null
    vi.stubGlobal('crypto', null)

    // Mock Math.random to make the test predictable
    const mockRandom = vi.spyOn(Math, 'random')
    mockRandom.mockReturnValue(0.5)

    const id = generateId()

    expect(mockRandom).toHaveBeenCalled()
    // With Math.random always returning 0.5, the fallback should produce a predictable UUID
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    expect(id).toBe('88888888-8888-4888-8888-888888888888')

    mockRandom.mockRestore()
  })

  it('should generate valid UUID format', () => {
    // Mock the crypto API to return null to force fallback
    vi.stubGlobal('crypto', null)

    // Mock Math.random
    const mockRandom = vi.spyOn(Math, 'random')
    mockRandom.mockImplementation(() => 0.1) // Different value to test format

    const id = generateId()

    // Format: 8-4-4-4-12 hexadecimal characters
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/)

    mockRandom.mockRestore()
  })
})
