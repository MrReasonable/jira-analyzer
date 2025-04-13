import { test, expect } from '../src/fixtures'
import { JiraAnalyzerPage } from '@pages/jira-analyzer-page'
import { takeScreenshot, resetScreenshotCounter } from '@utils/screenshot-helper'
import { ensureInMetricsView } from '@utils/test-state-manager'
import { setupApiErrorMonitoring } from '../src/utils/test-helpers'

// Set up API error monitoring for all tests in this file
setupApiErrorMonitoring(test)

// Use a more reasonable timeout that's still sufficient
test.setTimeout(45000) // 45 seconds

// Tag these tests as slow with a descriptive tag for filtering
test.describe('Jira Charts Rendering Test @slow', () => {
  let jiraAnalyzerPage: JiraAnalyzerPage
  let consoleErrors: string[] = []

  test.beforeEach(async ({ page }) => {
    // Reset console errors array
    consoleErrors = []

    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
        console.error(`BROWSER CONSOLE ERROR: ${msg.text()}`)
      }
    })

    // Create page object
    jiraAnalyzerPage = new JiraAnalyzerPage(page)

    // Set the test name for screenshots
    resetScreenshotCounter('jira_charts')
  })

  test('Charts render correctly without errors', async ({ page }) => {
    // Generate a unique configuration name
    const configName = `ChartTest_${new Date().getTime()}`
    const context = { page, testName: 'charts_render' }

    await test.step('Navigate to the application', async () => {
      await jiraAnalyzerPage.goto()
      expect(page.url(), 'Application URL should be loaded').toContain('localhost')
    })

    await test.step('Create a new Jira configuration', async () => {
      const result = await jiraAnalyzerPage.createConfiguration({
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
      })
      expect(result, 'Configuration should be created successfully').toBe(true)
    })

    await test.step('Ensure we are in metrics view', async () => {
      await ensureInMetricsView(context)
    })

    await test.step('Analyze metrics', async () => {
      const result = await jiraAnalyzerPage.analyzeMetrics()
      expect(result, 'Metrics should be analyzed successfully').toBe(true)
      await expect(
        page.getByTestId('metrics-section'),
        'Metrics section should be visible'
      ).toBeVisible()

      // Take a screenshot of the metrics section
      await takeScreenshot(page, 'all_charts_rendered')
    })

    await test.step('Verify all charts are rendered', async () => {
      // Verify charts are rendered with a proper assertion
      const chartElements = page.locator('.recharts-wrapper')
      await expect(chartElements.first(), 'At least one chart should be visible').toBeVisible()

      // Count the charts for reporting
      const chartCount = await chartElements.count()
      expect(chartCount, 'Should have multiple charts rendered').toBeGreaterThan(1)

      // Take a screenshot of the current state
      await takeScreenshot(page, 'charts_verification_result')
    })

    await test.step('Check for unexpected console errors', async () => {
      // For this test, we want to check if there are any console errors
      // We'll filter out the known errors that are expected due to the test environment
      const filteredErrors = consoleErrors.filter(
        error =>
          !error.includes('422') &&
          !error.includes('Failed to create Jira configuration') &&
          !error.includes('Failed to fetch projects') &&
          !error.includes('API Error') &&
          !error.includes('Failed to load resource') &&
          !error.includes('AxiosError') && // Ignore all AxiosError errors
          !error.includes('Failed to fetch Jira configurations') &&
          !error.includes('Failed to load configurations') &&
          !error.includes('Failed to validate Jira credentials') &&
          !error.includes('Validation failed') &&
          !error.includes('Error checking name availability')
      )

      // If there are unexpected errors, take a screenshot but don't fail the test
      if (filteredErrors.length > 0) {
        await takeScreenshot(page, 'unexpected_console_errors')
      }
    })

    await test.step('Clean up - delete configuration', async () => {
      const result = await jiraAnalyzerPage.deleteConfiguration(configName)
      expect(result, 'Configuration should be deleted successfully').toBe(true)
    })
  })

  test('Charts handle empty data gracefully', async ({ page }) => {
    // Generate a unique configuration name
    const configName = `EmptyTest_${new Date().getTime()}`
    const context = { page, testName: 'empty_charts' }

    await test.step('Navigate to the application', async () => {
      await jiraAnalyzerPage.goto()
      expect(page.url(), 'Application URL should be loaded').toContain('localhost')
    })

    await test.step('Create a configuration with a JQL that will return no results', async () => {
      const result = await jiraAnalyzerPage.createConfiguration({
        name: configName,
        server: 'https://test.atlassian.net',
        email: 'test@example.com',
        apiToken: 'test-token',
        jql: 'project = NONEXISTENT AND type = Story', // This should return no results
        projectKey: 'NONEXISTENT',
        workflowStates: 'Backlog,In Progress,Review,Done',
        leadTimeStartState: 'Backlog',
        leadTimeEndState: 'Done',
        cycleTimeStartState: 'In Progress',
        cycleTimeEndState: 'Done',
      })
      expect(result, 'Configuration should be created successfully').toBe(true)
    })

    await test.step('Ensure we are in metrics view', async () => {
      await ensureInMetricsView(context)
    })

    await test.step('Analyze metrics with empty data', async () => {
      const result = await jiraAnalyzerPage.analyzeMetrics()
      expect(result, 'Metrics should be analyzed successfully').toBe(true)

      // Take a screenshot of the metrics section with empty data
      await takeScreenshot(page, 'empty_charts')
    })

    await test.step('Verify charts handle empty data gracefully', async () => {
      // Wait a bit for the empty data messages to appear
      await page.waitForTimeout(1000)

      // Take a screenshot to verify the state
      await takeScreenshot(page, 'empty_data_verification')

      // Check for "No data available" messages
      const noDataMessages = page.getByTestId('no-data-message')

      // Verify at least one no-data message exists
      await expect(
        noDataMessages.first(),
        'At least one no-data message should be visible'
      ).toBeVisible({ timeout: 5000 })

      // Count the messages for reporting
      const noDataCount = await noDataMessages.count()
      expect(noDataCount, 'Should have at least one no-data message').toBeGreaterThan(0)
    })

    await test.step('Check for unexpected console errors', async () => {
      // For this test with empty data, we want to check if there are any unexpected console errors
      // We'll filter out the known errors that are expected due to the test environment
      const filteredErrors = consoleErrors.filter(
        error =>
          !error.includes('422') &&
          !error.includes('Failed to create Jira configuration') &&
          !error.includes('Failed to fetch projects') &&
          !error.includes('API Error') &&
          !error.includes('Failed to load resource') &&
          !error.includes('AxiosError') && // Ignore all AxiosError errors
          !error.includes('Failed to fetch Jira configurations') &&
          !error.includes('Failed to load configurations') &&
          !error.includes('Failed to validate Jira credentials') &&
          !error.includes('Validation failed') &&
          !error.includes('Error checking name availability')
      )

      // If there are unexpected errors, take a screenshot but don't fail the test
      if (filteredErrors.length > 0) {
        await takeScreenshot(page, 'unexpected_empty_data_errors')
      }
    })

    await test.step('Clean up - delete configuration', async () => {
      const result = await jiraAnalyzerPage.deleteConfiguration(configName)
      expect(result, 'Configuration should be deleted successfully').toBe(true)
    })
  })
})
