import { logger } from '@utils/logger'

/**
 * Function to handle API errors consistently
 */
export const handleApiError = (err: unknown, defaultMessage: string): string => {
  // Default error message
  let errorMessage = defaultMessage

  // Handle HTTP status code errors with user-friendly messages
  if (
    err &&
    typeof err === 'object' &&
    'response' in err &&
    err.response &&
    typeof err.response === 'object' &&
    'status' in err.response
  ) {
    const status = Number(err.response.status)

    if (status === 401) {
      errorMessage = 'Invalid credentials. Please check your email and API token.'
    } else if (status === 403) {
      errorMessage = 'You do not have permission to access this Jira instance.'
    } else if (status === 404) {
      errorMessage = 'Jira server not found. Please check the server URL.'
    } else if (status === 409) {
      errorMessage =
        'A configuration with this name already exists. Please choose a different name.'
    } else if (status >= 500) {
      errorMessage = 'Jira server error. Please try again later.'
    }
  }

  // Check for network errors
  if (
    err &&
    typeof err === 'object' &&
    (('code' in err && err.code === 'ERR_NETWORK') ||
      ('code' in err && err.code === 'ECONNREFUSED') ||
      ('message' in err &&
        typeof err.message === 'string' &&
        err.message.includes('Network Error')))
  ) {
    errorMessage =
      'Unable to connect to the Jira server. Please check your internet connection and server URL.'
  }

  // Check for bad gateway errors
  if (
    err &&
    typeof err === 'object' &&
    'code' in err &&
    err.code === 'ERR_BAD_RESPONSE' &&
    'status' in err &&
    err.status === 502
  ) {
    errorMessage =
      'Unable to connect to the Jira API. Please check your server URL and credentials, or try again later.'
  }

  // If the error contains "JiraError HTTP 401", it's likely an authentication issue
  if (
    err &&
    typeof err === 'object' &&
    'message' in err &&
    typeof err.message === 'string' &&
    err.message.includes('JiraError HTTP 401')
  ) {
    errorMessage = 'Invalid credentials. Please check your email and API token.'
  }

  return errorMessage
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
