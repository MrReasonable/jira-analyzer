import { test, expect } from '@playwright/test'
import { JiraAnalyzerPage } from './pages/jira-analyzer-page'
import { takeScreenshot, resetScreenshotCounter } from './utils/screenshot-helper'

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
  })

  test('Detect and log chart rendering errors', async ({ page }) => {
    // Generate a unique configuration name
    const configName = `ErrorTest_${new Date().getTime()}`

    console.log('Step 1: Navigate to the application')
    await jiraAnalyzerPage.goto()

    console.log('Step 2: Create a new Jira configuration')
    await jiraAnalyzerPage.createConfiguration({
      name: configName,
      server: 'https://test.atlassian.net',
      email: 'test@example.com',
      apiToken: 'test-token',
      jql: 'project = TEST AND type = Story',
      workflowStates: 'Backlog,In Progress,Review,Done',
      leadTimeStartState: 'Backlog',
      leadTimeEndState: 'Done',
      cycleTimeStartState: 'In Progress',
      cycleTimeEndState: 'Done',
    })

    console.log('Step 3: Analyze metrics and capture any errors')
    await jiraAnalyzerPage.analyzeMetrics()

    // Take a screenshot of the metrics section
    await takeScreenshot(page, 'charts_with_potential_errors')

    console.log('Step 4: Check for console errors during chart rendering')

    // Log all errors for debugging
    if (consoleErrors.length > 0) {
      console.error('Console errors detected:')
      consoleErrors.forEach((error, index) => {
        console.error(`Error ${index + 1}: ${error}`)
      })

      // Take a screenshot when errors are found
      await takeScreenshot(page, 'console_errors_detected')

      // Test will continue but we'll log the errors
      console.error(`Found ${consoleErrors.length} console errors during chart rendering`)
    } else {
      console.log('No console errors detected during chart rendering')
    }

    // Check for network errors
    if (networkErrors.length > 0) {
      console.error('Network errors detected:')
      networkErrors.forEach((error, index) => {
        console.error(`Network Error ${index + 1}: ${error}`)
      })

      // Take a screenshot when network errors are found
      await takeScreenshot(page, 'network_errors_detected')

      console.error(`Found ${networkErrors.length} network errors during chart rendering`)
    } else {
      console.log('No network errors detected during chart rendering')
    }

    // Check for warnings (not failing the test, just logging)
    if (consoleWarnings.length > 0) {
      console.warn('Console warnings detected:')
      consoleWarnings.forEach((warning, index) => {
        console.warn(`Warning ${index + 1}: ${warning}`)
      })
      console.warn(`Found ${consoleWarnings.length} console warnings during chart rendering`)
    } else {
      console.log('No console warnings detected during chart rendering')
    }

    console.log('Step 5: Verify chart elements are present')

    // Check for canvas elements (actual charts)
    const canvasElements = page.locator('canvas')
    const canvasCount = await canvasElements.count()
    console.log(`Found ${canvasCount} canvas elements for charts`)

    // This test is primarily for error detection, so we'll just log the count
    // rather than failing if the count is wrong
    if (canvasCount < 5) {
      console.warn(`Expected at least 5 canvas elements, but found ${canvasCount}`)
    }

    // Check for "No data available" messages
    const noDataMessages = page.getByTestId('no-data-message')
    const noDataCount = await noDataMessages.count()

    if (noDataCount > 0) {
      console.warn(`Found ${noDataCount} "No data available" messages`)
    }

    console.log('Step 6: Clean up - delete configuration')
    await jiraAnalyzerPage.deleteConfiguration(configName)

    // Fail the test if there were console errors
    // This makes the test report clearly show if there were issues
    expect(
      consoleErrors,
      `Found ${consoleErrors.length} console errors during chart rendering`
    ).toEqual([])

    // Fail the test if there were network errors
    expect(
      networkErrors,
      `Found ${networkErrors.length} network errors during chart rendering`
    ).toEqual([])
  })
})
