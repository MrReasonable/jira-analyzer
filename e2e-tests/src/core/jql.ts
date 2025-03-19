import { takeScreenshot } from '../utils/screenshot-helper'
import { TestContext } from './types'

/**
 * Get the JQL query from the input field
 *
 * @param context Test context containing page and other shared state
 * @returns Promise resolving to the JQL query string
 */
export async function getJqlQuery(context: TestContext): Promise<string> {
  const { page } = context

  const jqlInput = page.getByLabel('JQL Query', { exact: true })
  await jqlInput.waitFor({ state: 'visible', timeout: 5000 })
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

  // Find JQL input
  const jqlInput = page.getByLabel('JQL Query', { exact: true })
  await jqlInput.waitFor({ state: 'visible', timeout: 5000 })

  // Click edit button if needed
  const isDisabled = await jqlInput.isDisabled()
  if (isDisabled) {
    const editButton = page.getByRole('button', { name: 'Edit Query' })
    if (await editButton.isVisible()) {
      await editButton.click()
      await page.waitForFunction(() => document.activeElement?.tagName.toLowerCase() === 'input')
    }
  }

  // Fill the input
  await jqlInput.fill(jql)
  console.log(`JQL query set to: ${jql}`)
}

/**
 * Analyze metrics by clicking the Analyze button
 *
 * @param context Test context containing page and other shared state
 * @returns Promise resolving to true if successful
 */
export async function analyzeMetrics(context: TestContext): Promise<boolean> {
  const { page } = context

  console.log('Analyzing metrics')

  // Click analyze button
  const analyzeButton = page.getByRole('button', { name: 'Analyze', exact: true })
  await analyzeButton.waitFor({ state: 'visible', timeout: 10000 })
  await analyzeButton.click()

  // Wait for metrics to load
  console.log('Waiting for metrics to load')
  await page
    .getByRole('heading', { name: 'Lead Time Analysis', exact: true })
    .waitFor({ state: 'visible', timeout: 10000 })
    .catch(async () => {
      console.error('Lead Time Analysis heading not found')
      await takeScreenshot(page, 'metrics_not_loaded')
      throw new Error('Metrics did not load after clicking Analyze')
    })

  console.log('Metrics loaded successfully')
  await takeScreenshot(page, 'metrics_loaded')

  return true
}
