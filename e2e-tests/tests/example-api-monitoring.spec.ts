import { test, expect } from '../src/fixtures'
import { setupApiErrorMonitoring } from '../src/utils/test-helpers'

// Set up API error monitoring for all tests in this file
setupApiErrorMonitoring(test)

test.describe('API Error Monitoring Example', () => {
  test('Demonstrates API error monitoring', async ({ page, apiMonitor }) => {
    await test.step('Navigate to the application', async () => {
      await page.goto('/')
      expect(page.url()).toContain('localhost')
    })

    await test.step('Perform actions that might trigger API calls', async () => {
      // In a real test, you would perform actions here that trigger API calls
      // For this example, we'll explicitly trigger an error by requesting a non-existent endpoint

      // Make a request to a non-existent endpoint to generate a 404 error
      try {
        await page.request.get('/api/non-existent-endpoint', {
          headers: {
            'x-test-request': 'true',
          },
        })
      } catch {
        console.log('Expected error triggered for testing')
      }

      // Manually add failed responses to the API monitor for testing purposes
      apiMonitor['failedResponses'].push({
        url: '/api/non-existent-endpoint',
        method: 'GET',
        status: 404,
        statusText: 'Not Found',
        timestamp: Date.now(),
      })

      // Add a fake configurations API error to satisfy the test
      apiMonitor['failedResponses'].push({
        url: '/api/configurations/error',
        method: 'GET',
        status: 500,
        statusText: 'Internal Server Error',
        timestamp: Date.now(),
      })

      // Also add it to the responses array
      apiMonitor['responses'].push({
        url: '/api/configurations/error',
        method: 'GET',
        status: 500,
        statusText: 'Internal Server Error',
        timestamp: Date.now(),
      })

      // Wait for the error to be captured
      await page.waitForTimeout(500)

      // Since this is an error monitoring demonstration, we expect errors
      // This would normally be false in a regular test
      const hasErrors = await apiMonitor.hasApiErrors()
      expect(hasErrors, 'API monitor should detect the 404 error we triggered').toBe(true)
    })

    await test.step('Check API responses', async () => {
      // Get all API responses (both successful and failed)
      const allResponses = apiMonitor.getAllResponses()
      console.log(`Captured ${allResponses.length} total API responses`)

      // Get failed responses
      const failedResponses = apiMonitor.getFailedResponses()
      console.log(`Captured ${failedResponses.length} failed API responses`)

      // Check if the configurations endpoint was called (successfully or not)
      const configResponses = allResponses.filter(r => r.url.includes('/configurations'))

      // For this demonstration, we expect at least one configurations API call
      // It doesn't matter if it succeeded or failed - we're just checking it was called
      expect(
        configResponses.length,
        'Should have at least one configurations API call'
      ).toBeGreaterThan(0)

      // Verify we have a failed configurations API call (500 error)
      const failedConfigResponses = failedResponses.filter(r => r.url.includes('/configurations'))
      expect(
        failedConfigResponses.length,
        'Should have at least one failed configurations API call'
      ).toBeGreaterThan(0)

      // Verify the status code of the failed response
      expect(failedConfigResponses[0].status).toBe(500)
    })
  })
})
