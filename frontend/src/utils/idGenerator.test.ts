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
    // Create a proper mock of window.crypto with the randomUUID property
    // This ensures the 'randomUUID' in window.crypto check passes without modifying Object.prototype
    const cryptoMock = {
      randomUUID: mockRandomUUID,
      // Using a custom property descriptor to properly handle 'in' operator checks
      hasOwnProperty: (prop: string) => prop === 'randomUUID',
    }

    // Make the mock properly handle the 'in' operator check
    Object.defineProperty(cryptoMock, Symbol.hasInstance, {
      value: () => true,
    })

    vi.stubGlobal('crypto', cryptoMock)

    const id = generateId()

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
