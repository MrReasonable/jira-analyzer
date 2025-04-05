import { takeScreenshot } from '../utils/screenshot-helper'
import { TestContext } from './types'
import { TestConfig } from './test-config'

/**
 * Verify that charts are rendered on the page
 *
 * @param context Test context containing page and other shared state
 * @returns Promise resolving to true if charts are rendered, false otherwise
 */
export async function verifyChartsRendered(context: TestContext): Promise<boolean> {
  const { page } = context

  console.log('Verifying charts are rendered')

  // Wait a moment for charts to render
  await page.waitForTimeout(TestConfig.timeouts.api)

  // Take a screenshot for debugging
  await takeScreenshot(page, 'chart_verification')

  // Check for canvas elements (rendered charts)
  const canvasElements = page.locator('canvas')
  const canvasCount = await canvasElements.count()

  // Check for "No data available" messages
  const noDataMessages = page.getByTestId('no-data-message')
  const noDataCount = await noDataMessages.count()

  // Check for loading spinners
  const loadingSpinners = page.getByRole('status', { name: 'Loading' })
  const loadingCount = await loadingSpinners.count()

  console.log(
    `Found ${canvasCount} canvas elements, ${noDataCount} no-data messages, ${loadingCount} loading spinners`
  )

  // Charts are considered rendered if:
  // 1. There is at least one canvas element, OR
  // 2. There are no-data messages (which is a valid state)
  // AND there are no loading spinners still visible
  const chartsRendered = (canvasCount > 0 || noDataCount > 0) && loadingCount === 0

  return chartsRendered
}
