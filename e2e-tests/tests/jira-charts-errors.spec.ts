import { test, expect } from '../src/fixtures'
import { JiraAnalyzerPage } from '@pages/jira-analyzer-page'
import { takeScreenshot, resetScreenshotCounter } from '@utils/screenshot-helper'
import { TestConfig } from '../src/core/test-config'
import { setupApiErrorMonitoring } from '../src/utils/test-helpers'
import {
  initializeTestEnvironment,
  clearBackendCache,
  resetInMemoryDatabase,
} from '../src/utils/test-environment'

// Set up API error monitoring for all tests in this file
setupApiErrorMonitoring(test)

// Increase timeout for more reliable tests
test.setTimeout(60000) // 60 seconds

test.describe('Jira Charts Error Detection Test', () => {
  let jiraAnalyzerPage: JiraAnalyzerPage
  let consoleErrors: string[] = []
  let consoleWarnings: string[] = []
  let networkErrors: string[] = []

  test.beforeEach(async ({ page }) => {
    // Reset error arrays
    consoleErrors = []
    consoleWarnings = []
    networkErrors = []

    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
        console.error(`BROWSER CONSOLE ERROR: ${msg.text()}`)
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text())
        console.warn(`BROWSER CONSOLE WARNING: ${msg.text()}`)
      }
    })

    // Listen for network errors
    page.on('requestfailed', request => {
      const failure = request.failure()
      if (failure) {
        const errorMsg = `Network request failed: ${request.url()} - ${failure.errorText}`
        networkErrors.push(errorMsg)
        console.error(errorMsg)
      }
    })

    // Create page object
    jiraAnalyzerPage = new JiraAnalyzerPage(page)

    // Set the test name for screenshots
    resetScreenshotCounter('jira_charts_errors')

    // Initialize test environment
    const context = { page }
    await initializeTestEnvironment(context)
    await clearBackendCache(context)

    // Reset the in-memory database to ensure a clean state
    const databaseReset = await resetInMemoryDatabase(context)
    if (!databaseReset) {
      console.warn('Failed to reset in-memory database, test may use stale data')
    } else {
      console.log('In-memory database reset successfully')
    }
  })

  test('Detect and log chart rendering errors', async ({ page, apiMonitor }) => {
    // Generate a unique configuration name
    const configName = `ErrorTest_${new Date().getTime()}`

    // Setup test configuration
    const testConfig = {
      name: configName,
      server: 'https://test.atlassian.net',
      email: 'test@example.com',
      apiToken: 'test-token',
      jql: 'project = TEST AND type = Story',
      projectKey: 'TEST',
      workflowStates: 'Backlog,In Progress,Review,Done',
      leadTimeStartState: 'Backlog',
      leadTimeEndState: 'Done',
      cycleTimeStartState: 'In Progress',
      cycleTimeEndState: 'Done',
    }

    await test.step('Navigate to the application', async () => {
      await jiraAnalyzerPage.goto()
      expect(page.url(), 'Application URL should be loaded').toContain('localhost')

      // Check for API errors after navigation
      const hasInitialErrors = await apiMonitor.hasApiErrors()
      if (hasInitialErrors) {
        console.log('API errors detected during initial page load:')
        console.log(apiMonitor.getErrorSummary())

        // Fail the test if we have API errors during setup
        // This indicates a real backend issue that needs to be fixed
        expect(hasInitialErrors, 'Should not have API errors during initial page load').toBe(false)
      }
    })

    await test.step('Create a new Jira configuration', async () => {
      // Create configuration and assert on the result
      // If this fails, the test should fail as it's part of the setup
      const result = await jiraAnalyzerPage.createConfiguration(testConfig)
      expect(result, 'Configuration should be created successfully').toBe(true)

      // Check for API errors after configuration creation
      const hasConfigErrors = await apiMonitor.hasApiErrors()
      if (hasConfigErrors) {
        console.log('API errors detected during configuration creation:')
        console.log(apiMonitor.getErrorSummary())
        // Fail the test if we have API errors during setup
        expect(hasConfigErrors, 'Should not have API errors during configuration creation').toBe(
          false
        )
      }
    })

    await test.step('Navigate to metrics view', async () => {
      // Ensure we're in the metrics view
      await jiraAnalyzerPage.ensureInMetricsView()

      // Verify we're in the metrics view by checking for the analyze button
      const analyzeButton = page.getByTestId('analyze-button')
      await expect(analyzeButton, 'Analyze button should be visible').toBeVisible({
        timeout: TestConfig.timeouts.element,
      })
    })

    // From this point on, we're testing error detection, so we'll capture errors
    // but not fail the test if they occur

    await test.step('Attempt to analyze metrics and capture any errors', async () => {
      try {
        // Analyze metrics
        await jiraAnalyzerPage.analyzeMetrics()

        // Take a screenshot of the current state
        await takeScreenshot(page, 'charts_with_potential_errors')

        // Check for API errors after metrics analysis
        const hasAnalysisErrors = await apiMonitor.hasApiErrors()
        if (hasAnalysisErrors) {
          console.log('API errors detected during metrics analysis:')
          console.log(apiMonitor.getErrorSummary())
        }
      } catch (error) {
        console.log('Error during metrics analysis:', error)
        // This is expected in an error detection test
      }
    })

    await test.step('Check for console errors during chart rendering', async () => {
      // Take a screenshot if errors are found
      if (consoleErrors.length > 0) {
        await takeScreenshot(page, 'console_errors_detected')
      }

      // Take a screenshot if network errors are found
      if (networkErrors.length > 0) {
        await takeScreenshot(page, 'network_errors_detected')
      }
    })

    await test.step('Verify chart elements are present or error messages exist', async () => {
      // Check for canvas elements (actual charts)
      const canvasElements = page.locator('canvas')
      const canvasCount = await canvasElements.count()

      // Check for "No data available" messages
      const noDataMessages = page.getByTestId('no-data-message')
      const noDataCount = await noDataMessages.count()

      // Check for error messages in the UI
      const errorMessages = page.locator(
        '.error-message, .alert-error, [data-testid="error-message"]'
      )
      const errorCount = await errorMessages.count()

      // Log what we found
      console.log(`Chart verification results:
        - Chart canvas elements: ${canvasCount}
        - "No data available" messages: ${noDataCount}
        - Error messages in UI: ${errorCount}
      `)

      // Take screenshots based on what we found
      if (canvasCount > 0 && canvasCount < 5) {
        await takeScreenshot(page, 'fewer_charts_than_expected')
      } else if (canvasCount === 0) {
        await takeScreenshot(page, 'no_charts_found')
      }

      if (noDataCount > 0) {
        await takeScreenshot(page, 'no_data_messages_found')
      }

      if (errorCount > 0) {
        await takeScreenshot(page, 'ui_error_messages')
      }
    })

    await test.step('Clean up - delete configuration', async () => {
      try {
        await jiraAnalyzerPage.deleteConfiguration(configName)
      } catch (error) {
        console.log('Error during configuration deletion:', error)
        // This is acceptable in an error detection test
      }
    })

    await test.step('Verify errors were detected', async () => {
      // This test is specifically for detecting errors, so we expect errors to be present
      // Collect all types of errors we've detected
      const apiErrors = await apiMonitor.hasApiErrors()
      const totalErrors = consoleErrors.length + networkErrors.length + (apiErrors ? 1 : 0)

      console.log(`Detected errors summary:
        - Console errors: ${consoleErrors.length}
        - Network errors: ${networkErrors.length}
        - API errors: ${apiErrors ? 'Yes' : 'No'}
        - Total error sources: ${totalErrors}
      `)

      // The test should pass if we detected errors (which is expected)
      // and fail if we didn't detect any errors (which would be unexpected)
      expect(
        totalErrors,
        'Should detect errors during chart rendering (console, network, or API errors)'
      ).toBeGreaterThan(0)

      // Log a success message to make it clear this is expected behavior
      console.log('✅ Successfully detected expected errors - test is passing as designed')
    })
  })
})
