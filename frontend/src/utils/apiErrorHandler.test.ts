/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleApiError, handleApiRequest, ApiRequest } from './apiErrorHandler'
import { logger } from '@utils/logger'

// Mock the logger
vi.mock('@utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('apiErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isHttpStatusError (via handleApiError)', () => {
    it('should identify HTTP status errors correctly', () => {
      // Arrange
      const httpError = {
        response: {
          status: 401,
        },
      }

      // Act
      const result = handleApiError(httpError, 'Default message')

      // Assert
      expect(result).toBe('Invalid credentials. Please check your email and API token.')
    })

    it('should return null for non-HTTP status errors', () => {
      // Arrange
      const nonHttpError = {
        message: 'Some error',
      }

      // Act
      const result = handleApiError(nonHttpError, 'Default message')

      // Assert
      expect(result).toBe('Default message')
    })

    it('should handle null and undefined', () => {
      // Act & Assert
      expect(handleApiError(null, 'Default message')).toBe('Default message')
      expect(handleApiError(undefined, 'Default message')).toBe('Default message')
    })

    it('should handle non-object errors', () => {
      // Act & Assert
      expect(handleApiError('string error', 'Default message')).toBe('Default message')
      expect(handleApiError(123, 'Default message')).toBe('Default message')
    })
  })

  describe('getHttpStatusErrorMessage (via handleApiError)', () => {
    it('should return correct message for 401 status', () => {
      // Arrange
      const error = { response: { status: 401 } }

      // Act
      const result = handleApiError(error, 'Default message')

      // Assert
      expect(result).toBe('Invalid credentials. Please check your email and API token.')
    })

    it('should return correct message for 403 status', () => {
      // Arrange
      const error = { response: { status: 403 } }

      // Act
      const result = handleApiError(error, 'Default message')

      // Assert
      expect(result).toBe('You do not have permission to access this Jira instance.')
    })

    it('should return correct message for 404 status', () => {
      // Arrange
      const error = { response: { status: 404 } }

      // Act
      const result = handleApiError(error, 'Default message')

      // Assert
      expect(result).toBe('Jira server not found. Please check the server URL.')
    })

    it('should return correct message for 409 status', () => {
      // Arrange
      const error = { response: { status: 409 } }

      // Act
      const result = handleApiError(error, 'Default message')

      // Assert
      expect(result).toBe(
        'A configuration with this name already exists. Please choose a different name.'
      )
    })

    it('should return correct message for 500+ status', () => {
      // Arrange
      const error500 = { response: { status: 500 } }
      const error502 = { response: { status: 502 } }
      const error503 = { response: { status: 503 } }

      // Act & Assert
      expect(handleApiError(error500, 'Default message')).toBe(
        'Jira server error. Please try again later.'
      )
      expect(handleApiError(error502, 'Default message')).toBe(
        'Jira server error. Please try again later.'
      )
      expect(handleApiError(error503, 'Default message')).toBe(
        'Jira server error. Please try again later.'
      )
    })

    it('should handle string status codes', () => {
      // Arrange
      const error = { response: { status: '401' } }

      // Act
      const result = handleApiError(error, 'Default message')

      // Assert
      expect(result).toBe('Invalid credentials. Please check your email and API token.')
    })

    it('should return default message for unhandled status codes', () => {
      // Arrange
      const error = { response: { status: 422 } }

      // Act
      const result = handleApiError(error, 'Default message')

      // Assert
      expect(result).toBe('Default message')
    })
  })

  describe('isNetworkError (via handleApiError)', () => {
    it('should identify network errors with ERR_NETWORK code', () => {
      // Arrange
      const networkError = {
        code: 'ERR_NETWORK',
      }

      // Act
      const result = handleApiError(networkError, 'Default message')

      // Assert
      expect(result).toBe(
        'Unable to connect to the Jira server. Please check your internet connection and server URL.'
      )
    })

    it('should identify network errors with ECONNREFUSED code', () => {
      // Arrange
      const networkError = {
        code: 'ECONNREFUSED',
      }

      // Act
      const result = handleApiError(networkError, 'Default message')

      // Assert
      expect(result).toBe(
        'Unable to connect to the Jira server. Please check your internet connection and server URL.'
      )
    })

    it('should identify network errors with "Network Error" in message', () => {
      // Arrange
      const networkError = {
        message: 'Network Error occurred',
      }

      // Act
      const result = handleApiError(networkError, 'Default message')

      // Assert
      expect(result).toBe(
        'Unable to connect to the Jira server. Please check your internet connection and server URL.'
      )
    })

    it('should not identify non-network errors', () => {
      // Arrange
      const nonNetworkError = {
        code: 'OTHER_ERROR',
        message: 'Some other error',
      }

      // Act
      const result = handleApiError(nonNetworkError, 'Default message')

      // Assert
      expect(result).toBe('Default message')
    })
  })

  describe('isBadGatewayError (via handleApiError)', () => {
    it('should identify bad gateway errors', () => {
      // Arrange
      const badGatewayError = {
        code: 'ERR_BAD_RESPONSE',
        status: 502,
      }

      // Act
      const result = handleApiError(badGatewayError, 'Default message')

      // Assert
      expect(result).toBe(
        'Unable to connect to the Jira API. Please check your server URL and credentials, or try again later.'
      )
    })

    it('should not identify non-bad-gateway errors', () => {
      // Arrange
      const nonBadGatewayError1 = {
        code: 'ERR_BAD_RESPONSE',
        status: 500, // Wrong status
      }
      const nonBadGatewayError2 = {
        code: 'OTHER_ERROR', // Wrong code
        status: 502,
      }

      // Act & Assert
      expect(handleApiError(nonBadGatewayError1, 'Default message')).toBe('Default message')
      expect(handleApiError(nonBadGatewayError2, 'Default message')).toBe('Default message')
    })
  })

  describe('isJiraAuthError (via handleApiError)', () => {
    it('should identify Jira authentication errors', () => {
      // Arrange
      const jiraAuthError = {
        message: 'JiraError HTTP 401: Unauthorized',
      }

      // Act
      const result = handleApiError(jiraAuthError, 'Default message')

      // Assert
      expect(result).toBe('Invalid credentials. Please check your email and API token.')
    })

    it('should not identify non-Jira-auth errors', () => {
      // Arrange
      const nonJiraAuthError = {
        message: 'Some other error',
      }

      // Act
      const result = handleApiError(nonJiraAuthError, 'Default message')

      // Assert
      expect(result).toBe('Default message')
    })
  })

  describe('handleApiError', () => {
    it('should prioritize HTTP status errors', () => {
      // Arrange
      const error = {
        response: { status: 401 },
        code: 'ERR_NETWORK', // This would be a network error too, but HTTP status should take precedence
      }

      // Act
      const result = handleApiError(error, 'Default message')

      // Assert
      expect(result).toBe('Invalid credentials. Please check your email and API token.')
    })

    it('should check error types in the correct order', () => {
      // Arrange
      const error = {
        code: 'ERR_NETWORK',
        message: 'JiraError HTTP 401', // This would be a Jira auth error too, but network error check comes first
      }

      // Act
      const result = handleApiError(error, 'Default message')

      // Assert
      expect(result).toBe(
        'Unable to connect to the Jira server. Please check your internet connection and server URL.'
      )
    })

    it('should return default message for unknown errors', () => {
      // Arrange
      const unknownError = {
        someProperty: 'value',
      }

      // Act
      const result = handleApiError(unknownError, 'Default message')

      // Assert
      expect(result).toBe('Default message')
    })
  })

  describe('handleApiRequest', () => {
    it('should return result and call onSuccess on successful request', async () => {
      // Arrange
      const mockResult = { data: 'test' }
      const mockRequest: ApiRequest<typeof mockResult> = vi.fn().mockResolvedValue(mockResult)
      const setError = vi.fn()
      const onSuccess = vi.fn()
      const onError = vi.fn()

      // Act
      const result = await handleApiRequest(
        mockRequest,
        'Error fetching data',
        setError,
        onSuccess,
        onError
      )

      // Assert
      expect(mockRequest).toHaveBeenCalled()
      expect(result).toEqual(mockResult)
      expect(onSuccess).toHaveBeenCalledWith(mockResult)
      expect(onError).not.toHaveBeenCalled()
      expect(setError).not.toHaveBeenCalled()
      expect(logger.error).not.toHaveBeenCalled()
    })

    it('should handle errors and call onError', async () => {
      // Arrange
      const mockError = new Error('API error')
      const mockRequest: ApiRequest<any> = vi.fn().mockRejectedValue(mockError)
      const setError = vi.fn()
      const onSuccess = vi.fn()
      const onError = vi.fn()
      const defaultErrorMessage = 'Error fetching data'

      // Act
      const result = await handleApiRequest(
        mockRequest,
        defaultErrorMessage,
        setError,
        onSuccess,
        onError
      )

      // Assert
      expect(mockRequest).toHaveBeenCalled()
      expect(result).toBeNull()
      expect(onSuccess).not.toHaveBeenCalled()
      expect(onError).toHaveBeenCalledWith(defaultErrorMessage)
      expect(setError).toHaveBeenCalledWith(defaultErrorMessage)
      expect(logger.error).toHaveBeenCalledWith(defaultErrorMessage, mockError)
    })

    it('should work without optional callbacks', async () => {
      // Arrange
      const mockResult = { data: 'test' }
      const mockRequest: ApiRequest<typeof mockResult> = vi.fn().mockResolvedValue(mockResult)
      const setError = vi.fn()

      // Act
      const result = await handleApiRequest(mockRequest, 'Error fetching data', setError)

      // Assert
      expect(result).toEqual(mockResult)
      expect(setError).not.toHaveBeenCalled()
    })

    it('should handle HTTP status errors correctly', async () => {
      // Arrange
      const httpError = {
        response: {
          status: 401,
        },
      }
      const mockRequest: ApiRequest<any> = vi.fn().mockRejectedValue(httpError)
      const setError = vi.fn()
      const onError = vi.fn()
      const defaultErrorMessage = 'Error fetching data'

      // Act
      const result = await handleApiRequest(
        mockRequest,
        defaultErrorMessage,
        setError,
        undefined,
        onError
      )

      // Assert
      expect(result).toBeNull()
      expect(setError).toHaveBeenCalledWith(
        'Invalid credentials. Please check your email and API token.'
      )
      expect(onError).toHaveBeenCalledWith(
        'Invalid credentials. Please check your email and API token.'
      )
      expect(logger.error).toHaveBeenCalledWith(defaultErrorMessage, httpError)
    })

    it('should handle network errors correctly', async () => {
      // Arrange
      const networkError = {
        code: 'ERR_NETWORK',
      }
      const mockRequest: ApiRequest<any> = vi.fn().mockRejectedValue(networkError)
      const setError = vi.fn()
      const defaultErrorMessage = 'Error fetching data'

      // Act
      const result = await handleApiRequest(mockRequest, defaultErrorMessage, setError)

      // Assert
      expect(result).toBeNull()
      expect(setError).toHaveBeenCalledWith(
        'Unable to connect to the Jira server. Please check your internet connection and server URL.'
      )
      expect(logger.error).toHaveBeenCalledWith(defaultErrorMessage, networkError)
    })
  })
})
