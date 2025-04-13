import { logger } from '@utils/logger'

/**
 * Helper function to check if an error is an HTTP status error
 */
const isHttpStatusError = (
  err: unknown
): err is {
  response: { status: number | string }
} => {
  return Boolean(
    err &&
      typeof err === 'object' &&
      'response' in err &&
      err.response &&
      typeof err.response === 'object' &&
      'status' in err.response
  )
}

/**
 * Helper function to get an error message based on HTTP status code
 */
const getHttpStatusErrorMessage = (err: unknown): string | null => {
  if (!isHttpStatusError(err)) return null

  const status = Number(err.response.status)

  if (status === 401) {
    return 'Invalid credentials. Please check your email and API token.'
  } else if (status === 403) {
    return 'You do not have permission to access this Jira instance.'
  } else if (status === 404) {
    return 'Jira server not found. Please check the server URL.'
  } else if (status === 409) {
    return 'A configuration with this name already exists. Please choose a different name.'
  } else if (status >= 500) {
    return 'Jira server error. Please try again later.'
  }

  return null
}

/**
 * Helper function to check if an error is a network error
 */
const isNetworkError = (
  err: unknown
): err is {
  code?: string
  message?: string
} => {
  return Boolean(
    err &&
      typeof err === 'object' &&
      (('code' in err && err.code === 'ERR_NETWORK') ||
        ('code' in err && err.code === 'ECONNREFUSED') ||
        ('message' in err &&
          typeof err.message === 'string' &&
          err.message.includes('Network Error')))
  )
}

/**
 * Helper function to check if an error is a bad gateway error
 */
const isBadGatewayError = (
  err: unknown
): err is {
  code: string
  status: number
} => {
  return Boolean(
    err &&
      typeof err === 'object' &&
      'code' in err &&
      err.code === 'ERR_BAD_RESPONSE' &&
      'status' in err &&
      err.status === 502
  )
}

/**
 * Helper function to check if an error is a Jira authentication error
 */
const isJiraAuthError = (
  err: unknown
): err is {
  message: string
} => {
  return Boolean(
    err &&
      typeof err === 'object' &&
      'message' in err &&
      typeof err.message === 'string' &&
      err.message.includes('JiraError HTTP 401')
  )
}

/**
 * Function to handle API errors consistently
 */
export const handleApiError = (err: unknown, defaultMessage: string): string => {
  // Check for HTTP status errors
  const statusErrorMessage = getHttpStatusErrorMessage(err)
  if (statusErrorMessage) {
    return statusErrorMessage
  }

  // Check for network errors
  if (isNetworkError(err)) {
    return 'Unable to connect to the Jira server. Please check your internet connection and server URL.'
  }

  // Check for bad gateway errors
  if (isBadGatewayError(err)) {
    return 'Unable to connect to the Jira API. Please check your server URL and credentials, or try again later.'
  }

  // Check for Jira authentication errors
  if (isJiraAuthError(err)) {
    return 'Invalid credentials. Please check your email and API token.'
  }

  // Default error message
  return defaultMessage
}

export type ApiRequest<T> = () => Promise<T>

/**
 * Function that handles API requests with error handling and state updates
 */
export const handleApiRequest = async <T>(
  request: ApiRequest<T>,
  defaultErrorMessage: string,
  setError: (error: string | null) => void,
  onSuccess?: (result: T) => void,
  onError?: (errorMessage: string) => void
): Promise<T | null> => {
  try {
    const result = await request()
    if (onSuccess) {
      onSuccess(result)
    }
    return result
  } catch (err) {
    const errorMessage = handleApiError(err, defaultErrorMessage)
    setError(errorMessage)
    logger.error(defaultErrorMessage, err)
    if (onError) {
      onError(errorMessage)
    }
    return null
  }
}
