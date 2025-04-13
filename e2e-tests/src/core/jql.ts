import { expect } from '@playwright/test'
import { TestContext } from './types'
import { TestConfig } from './test-config'
import { ensureInMetricsView } from './state-management'

/**
 * Get the JQL query from the input field
 *
 * @param context Test context containing page and other shared state
 * @returns Promise resolving to the JQL query string
 */
export async function getJqlQuery(context: TestContext): Promise<string> {
  const { page } = context

  // Use a single reliable selector strategy with data-testid
  const jqlInput = page.getByTestId('jql_query')
  await jqlInput.waitFor({ state: 'visible', timeout: TestConfig.timeouts.element })

  return await jqlInput.inputValue()
}

/**
 * Set the JQL query in the input field
 *
 * @param context Test context containing page and other shared state
 * @param jql JQL query string to set
 */
export async function setJqlQuery(context: TestContext, jql: string): Promise<void> {
  const { page } = context

  // Use a single reliable selector strategy with data-testid
  const jqlInput = page.getByTestId('jql_query')
  await jqlInput.waitFor({ state: 'visible', timeout: TestConfig.timeouts.element })

  // Check if it's disabled and needs to be enabled
  const isDisabled = await jqlInput.isDisabled()
  if (isDisabled) {
    const editButton = page.getByRole('button', { name: 'Edit Query' })
    await editButton.click()
    await page.waitForTimeout(TestConfig.timeouts.uiUpdate)
  }

  // Fill the input
  await jqlInput.fill(jql)
}

/**
 * Analyze metrics by clicking the Analyze button
 *
 * @param context Test context containing page and other shared state
 * @returns Promise resolving to true if successful
 */
export async function analyzeMetrics(context: TestContext): Promise<boolean> {
  const { page } = context

  // Ensure we're in the metrics view where the analyze button exists
  await ensureInMetricsView(context)

  // Use a single reliable selector strategy
  const analyzeButton = page.getByTestId('analyze-button')
  await expect(analyzeButton, 'Analyze button should be visible').toBeVisible({
    timeout: TestConfig.timeouts.element,
  })

  await analyzeButton.click()

  // Wait for metrics to load
  await page.waitForTimeout(TestConfig.timeouts.api)

  // Check for any metrics-related elements
  const selectors = [
    // Try in order of specificity
    page.getByTestId('metrics-section'),
    page.getByTestId('lead-time-metric'),
    page.getByTestId('cycle-time-metric'),
    page.getByTestId('throughput-metric'),
    page.locator('.chart-container'),
    page.locator('.metrics-container'),
    page.locator('.metrics-view'),
  ]

  // Try each selector until one is found
  let metricsFound = false
  for (const selector of selectors) {
    if (await selector.isVisible().catch(() => false)) {
      console.log(
        'Found metrics element:',
        await selector.evaluate(el => el.outerHTML.substring(0, 100) + '...')
      )
      metricsFound = true
      break
    }
  }

  // If no metrics elements were found, check if there's an error message
  if (!metricsFound) {
    const errorMessage = page.getByText('Error loading metrics', { exact: false })
    if (await errorMessage.isVisible().catch(() => false)) {
      console.error('Error message found:', await errorMessage.textContent())
      throw new Error('Error loading metrics: ' + (await errorMessage.textContent()))
    }

    // If no error message, log what's on the page for debugging
    console.log('Page content:', await page.content())
    throw new Error('No metrics elements found and no error message displayed')
  }

  return true
}
