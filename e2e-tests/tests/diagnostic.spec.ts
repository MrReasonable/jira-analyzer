/**
 * Diagnostic test for debugging E2E test failures
 *
 * This test loads each fixture and captures detailed information about the UI state
 * to help diagnose issues with selectors, timing, and element visibility.
 *
 * Run with --full-debug flag to enable verbose logging:
 * ./run-tests.sh --full-debug tests/diagnostic.spec.ts
 */

import { test, expect } from '@playwright/test'
import {
  initializeTestEnvironment,
  clearBackendCache,
  loadFixture,
  listAvailableFixtures,
} from '../src/utils/test-environment'
import { JiraAnalyzerPage } from '../src/pages/jira-analyzer-page'

// Check if we're in verbose mode
const isVerboseMode = process.env.VITE_DEBUG_LEVEL === 'verbose'

// Conditional logger that only logs in verbose mode
const verboseLog = (...args: unknown[]) => {
  if (isVerboseMode) {
    console.log(...args)
  }
}

test.describe('Diagnostic Tests', () => {
  test.beforeEach(async ({ page }) => {
    const context = { page }
    await initializeTestEnvironment(context)
    await clearBackendCache(context)
  })

  test('should diagnose fixture loading and UI state', async ({ page }) => {
    const context = { page }
    const jiraAnalyzerPage = new JiraAnalyzerPage(page)

    // Step 1: List available fixtures
    await test.step('List available fixtures', async () => {
      const fixtures = await listAvailableFixtures(context)
      verboseLog('Available fixtures:', fixtures)
      console.log(`Found ${fixtures.length} fixtures`)

      // Verify we have the expected fixtures
      expect(fixtures).toContain('basic_workflow')
      expect(fixtures).toContain('workflow_with_metrics')
    })

    // Step 2: Load the basic_workflow fixture
    await test.step('Load basic_workflow fixture', async () => {
      const fixtureResult = await loadFixture(context, 'basic_workflow')
      verboseLog('Fixture result:', fixtureResult)

      // Verify the fixture loaded successfully
      expect(fixtureResult, 'Fixture should load successfully').not.toBeNull()
      expect(fixtureResult?.configuration_id, 'Fixture should return configuration ID').toBeTruthy()
    })

    // Step 3: Navigate to the application
    await test.step('Navigate to the application', async () => {
      await jiraAnalyzerPage.goto()
      await expect(page).toHaveURL(/localhost/)

      // Take a screenshot of the initial page
      await page.screenshot({ path: 'screenshots/diagnostic-initial-page.png' })
      console.log('Navigated to application and took screenshot')
    })

    // Step 4: Diagnose configuration dropdown
    await test.step('Diagnose configuration dropdown', async () => {
      // Log all elements with data-testid attributes
      const elements = await page.locator('[data-testid]').all()
      console.log(`Found ${elements.length} elements with data-testid attributes`)

      if (isVerboseMode) {
        for (const element of elements) {
          const testId = await element.getAttribute('data-testid')
          const text = await element.textContent()
          console.log(`Element with data-testid="${testId}": ${text}`)
        }
      }

      // Check for configuration dropdown specifically
      const configDropdown = page.getByTestId('configuration-select')
      const isVisible = await configDropdown.isVisible()
      console.log(`Configuration dropdown visible: ${isVisible}`)

      if (isVisible) {
        await configDropdown.click()
        await page.screenshot({ path: 'screenshots/diagnostic-config-dropdown-open.png' })

        // Log all visible options
        const options = await page.locator('.configuration-option').all()
        console.log(`Found ${options.length} configuration options`)

        if (isVerboseMode) {
          for (const option of options) {
            const text = await option.textContent()
            console.log(`Configuration option: ${text}`)
          }

          // Try to find Test Project with partial match
          const testProjectOptions = await page.getByText('Test Project', { exact: false }).all()
          console.log(`Found ${testProjectOptions.length} options containing "Test Project"`)

          for (const option of testProjectOptions) {
            const text = await option.textContent()
            console.log(`Option containing "Test Project": ${text}`)
          }
        }
      } else {
        console.log('Configuration dropdown not visible, checking page content')
        if (isVerboseMode) {
          const bodyText = await page.locator('body').textContent()
          console.log('Page content:', bodyText)
        }
      }
    })

    // Step 5: Try to select configuration regardless of exact name
    await test.step('Try to select configuration with partial match', async () => {
      try {
        const configDropdown = page.getByTestId('configuration-select')
        if (await configDropdown.isVisible()) {
          await configDropdown.click()

          // Try to find and click any option containing "Test Project"
          const testProjectOption = page.getByText('Test Project', { exact: false })
          if (await testProjectOption.isVisible()) {
            console.log('Found option containing "Test Project", clicking it')
            await testProjectOption.click()
            await page.screenshot({ path: 'screenshots/diagnostic-after-config-selection.png' })
          } else {
            console.log('No option containing "Test Project" found')

            if (isVerboseMode) {
              // Log all visible options
              const allOptions = await page.locator('.configuration-option, .dropdown-item').all()
              for (const option of allOptions) {
                console.log(`Available option: ${await option.textContent()}`)
              }
            }
          }
        }
      } catch (error) {
        console.log('Error selecting configuration:', error)
      }
    })

    // Step 6: Try to navigate to workflow editor
    await test.step('Try to navigate to workflow editor', async () => {
      try {
        await jiraAnalyzerPage.ensureInWorkflowEditor()
        await page.screenshot({ path: 'screenshots/diagnostic-workflow-editor.png' })

        // Check for workflow states
        const workflowStates = await page.locator('.workflow-state-item').all()
        console.log(`Found ${workflowStates.length} workflow state items`)

        if (isVerboseMode) {
          for (const state of workflowStates) {
            const text = await state.textContent()
            const className = await state.getAttribute('class')
            const testId = await state.getAttribute('data-testid')
            console.log(
              `Workflow state: text="${text}", class="${className}", data-testid="${testId}"`
            )
          }
        }
      } catch (error) {
        console.log('Error navigating to workflow editor:', error)
        await page.screenshot({ path: 'screenshots/diagnostic-workflow-editor-error.png' })
      }
    })

    // Step 7: Load the workflow_with_metrics fixture
    await test.step('Load workflow_with_metrics fixture', async () => {
      // Clear previous state
      await clearBackendCache(context)

      const fixtureResult = await loadFixture(context, 'workflow_with_metrics')
      verboseLog('Metrics fixture result:', fixtureResult)
      console.log('Loaded metrics fixture successfully')

      // Verify the fixture loaded successfully
      expect(fixtureResult, 'Fixture should load successfully').not.toBeNull()
      expect(fixtureResult?.configuration_id, 'Fixture should return configuration ID').toBeTruthy()
      expect(fixtureResult?.analysis_id, 'Fixture should return analysis ID').toBeTruthy()
    })

    // Step 8: Try to navigate to metrics view
    await test.step('Try to navigate to metrics view', async () => {
      try {
        // Reload the page to see the new configuration
        await jiraAnalyzerPage.goto()
        await page.screenshot({ path: 'screenshots/diagnostic-after-metrics-fixture.png' })

        // Try to navigate to metrics view
        await jiraAnalyzerPage.ensureInMetricsView()
        await page.screenshot({ path: 'screenshots/diagnostic-metrics-view.png' })

        // Check for metrics elements
        const metricsSection = page.getByTestId('metrics-section')
        const isMetricsSectionVisible = await metricsSection.isVisible()
        console.log(`Metrics section visible: ${isMetricsSectionVisible}`)

        // Log all metrics-related elements
        const metricElements = await page
          .locator('[data-testid*="metric"], [data-testid*="chart"]')
          .all()
        console.log(`Found ${metricElements.length} metric-related elements`)

        if (isVerboseMode) {
          for (const element of metricElements) {
            const testId = await element.getAttribute('data-testid')
            console.log(`Metric element: data-testid="${testId}"`)
          }
        }
      } catch (error) {
        console.log('Error navigating to metrics view:', error)
        await page.screenshot({ path: 'screenshots/diagnostic-metrics-view-error.png' })
      }
    })
  })
})
