import { Page } from '@playwright/test'

/**
 * Represents an API response captured during test execution
 */
export interface ApiResponse {
  url: string
  method: string
  status: number
  statusText: string
  responseBody?: Record<string, unknown> | string | null
  requestData?: Record<string, unknown> | string | null
  timestamp: number
}

/**
 * Monitors API responses during E2E tests to help with failure diagnosis
 */
export class ApiMonitor {
  private responses: ApiResponse[] = []
  private failedResponses: ApiResponse[] = []

  constructor(public page: Page) {
    // Set up network monitoring
    this.setupMonitoring()
  }

  /**
   * Set up response monitoring for API calls
   */
  private setupMonitoring() {
    // Listen for all API responses
    this.page.on('response', async response => {
      // Only monitor API calls
      if (!response.url().includes('/api/')) return

      const status = response.status()
      const method = response.request().method()

      // Log all API calls for debugging
      console.log(`API ${method} ${response.url()} - Status: ${status}`)

      try {
        // Try to parse the response body
        let responseBody = null
        if (status !== 204) {
          // No content
          try {
            responseBody = await response.json()
          } catch {
            try {
              responseBody = await response.text()
            } catch {
              responseBody = 'Could not parse response body'
            }
          }
        }

        // Try to get request data
        let requestData = null
        try {
          const request = response.request()
          const postData = request.postData()
          if (postData) {
            try {
              requestData = JSON.parse(postData)
            } catch {
              requestData = postData
            }
          }
        } catch {
          // Ignore errors getting request data
        }

        const apiResponse: ApiResponse = {
          url: response.url(),
          method,
          status,
          statusText: response.statusText(),
          responseBody,
          requestData,
          timestamp: Date.now(),
        }

        this.responses.push(apiResponse)

        // Track failed responses separately
        if (status >= 400) {
          this.failedResponses.push(apiResponse)
          console.error(
            `API Error: ${method} ${response.url()} returned ${status} ${response.statusText()}`
          )
        }
      } catch (error) {
        // Handle parsing errors
        console.error('Error parsing API response:', error)
      }
    })
  }

  /**
   * Get all failed API responses during the test
   */
  getFailedResponses(): ApiResponse[] {
    return this.failedResponses
  }

  /**
   * Get all API responses during the test
   */
  getAllResponses(): ApiResponse[] {
    return this.responses
  }

  /**
   * Check if there were any API errors during the test
   *
   * @param waitForNetworkIdle If true, wait for network idle before checking
   * @param timeout Timeout in milliseconds to wait for network idle
   */
  async hasApiErrors(waitForNetworkIdle = true, timeout = 2000): Promise<boolean> {
    if (waitForNetworkIdle) {
      // Wait for network idle to ensure all API responses are captured
      try {
        // First wait for network idle - using 'load' state which is safer than 'networkidle'
        await this.page.waitForLoadState('load', { timeout })
        // Add a small additional delay to ensure all responses are captured
        await this.page.waitForTimeout(500)
      } catch {
        // If timeout occurs, just wait for the specified timeout
        await this.page.waitForTimeout(timeout)
      }
    }
    return this.failedResponses.length > 0
  }

  /**
   * Get a formatted report of API errors
   */
  getErrorReport(): string {
    if (this.failedResponses.length === 0) return 'No API errors detected'

    return this.failedResponses
      .map(res => {
        return (
          `API Error: ${res.method} ${res.url} returned ${res.status} ${res.statusText}\n` +
          `Request data: ${JSON.stringify(res.requestData, null, 2)}\n` +
          `Response body: ${JSON.stringify(res.responseBody, null, 2)}`
        )
      })
      .join('\n\n')
  }

  /**
   * Get a summary of API errors (shorter version for console output)
   */
  getErrorSummary(): string {
    if (this.failedResponses.length === 0) return 'No API errors detected'

    return this.failedResponses
      .map(res => {
        try {
          // Try to parse the URL, but handle cases where it might not be a valid URL
          const pathname = res.url.startsWith('http') ? new URL(res.url).pathname : res.url
          return `${res.method} ${pathname} - ${res.status} ${res.statusText}`
        } catch {
          // If URL parsing fails, just return the raw URL
          return `${res.method} ${res.url} - ${res.status} ${res.statusText}`
        }
      })
      .join('\n')
  }

  /**
   * Reset the monitor (clear all captured responses)
   */
  reset(): void {
    this.responses = []
    this.failedResponses = []
  }
}
