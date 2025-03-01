import { vi } from 'vitest'

// Helper to mock successful responses
export const mockSuccessResponse = (method: ReturnType<typeof vi.fn>, data: unknown) => {
  method.mockResolvedValue(data)
}

// Helper to mock error responses
export const mockErrorResponse = (
  method: ReturnType<typeof vi.fn>,
  message = 'Server Error'
): void => {
  method.mockRejectedValue(new Error(message))
}
