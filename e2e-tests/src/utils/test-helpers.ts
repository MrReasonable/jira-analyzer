import { TestInfo, TestType } from '@playwright/test'
import { ApiMonitor } from './api-monitor'

/**
 * Check for API errors and attach error report to test results
 *
 * @param apiMonitor The API monitor instance
 * @param testInfo Playwright test info
 */
export async function checkApiErrors(apiMonitor: ApiMonitor, testInfo: TestInfo): Promise<void> {
  // Always check for errors, regardless of test status
  const hasErrors = await apiMonitor.hasApiErrors()

  // If there are API errors, report them
  if (hasErrors) {
    // Create a report file
    const report = apiMonitor.getErrorReport()

    // Attach the report to the test result
    await testInfo.attach('api-errors.txt', {
      body: Buffer.from(report),
      contentType: 'text/plain',
    })

    // Also add to test output for immediate visibility
    console.log('\n==== BACKEND API ERRORS DETECTED ====')
    console.log(apiMonitor.getErrorSummary())
    console.log('Check backend logs for more details: e2e-tests/logs/backend.log')

    // Check for specific error types
    const failedResponses = apiMonitor.getFailedResponses()
    const axiosErrors = failedResponses.filter(
      res =>
        res.responseBody &&
        typeof res.responseBody === 'string' &&
        res.responseBody.includes('AxiosError')
    )

    if (axiosErrors.length > 0) {
      console.log('\n==== AXIOS ERRORS DETECTED ====')
      axiosErrors.forEach(error => {
        console.log(`${error.method} ${error.url} - ${error.status} ${error.statusText}`)
        console.log(`Response: ${JSON.stringify(error.responseBody)}`)
      })
      console.log('Check backend logs for connection issues or service availability')
    }

    console.log('=======================================\n')
  }
}

/**
 * Setup global test hooks for API error monitoring
 *
 * @param test The Playwright test object with custom fixtures
 */
export function setupApiErrorMonitoring(test: TestType<{ apiMonitor: ApiMonitor }, object>): void {
  test.afterEach(async ({ apiMonitor }: { apiMonitor: ApiMonitor }, testInfo: TestInfo) => {
    await checkApiErrors(apiMonitor, testInfo)
  })
}
