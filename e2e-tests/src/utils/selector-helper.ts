import { Page, expect } from '@playwright/test'

/**
 * Selector helper functions for more stable and maintainable tests
 * This file provides a centralized place for all selectors used in tests
 */

/**
 * Get a workflow state element by its name
 *
 * @param page Playwright page object
 * @param stateName Name of the workflow state
 * @returns Locator for the workflow state element
 */
export function getWorkflowStateByName(page: Page, stateName: string) {
  // Use a single, reliable selector with data-testid
  const testId = `workflow-state-${stateName.toLowerCase().replace(/\s+/g, '-')}`
  return page.getByTestId(testId)
}

/**
 * Get a workflow state drag handle by state name
 *
 * @param page Playwright page object
 * @param stateName Name of the workflow state
 * @returns Locator for the workflow state drag handle
 */
export function getWorkflowStateDragHandle(page: Page, stateName: string) {
  // Use a single, reliable selector with data-testid
  const stateTestId = `workflow-state-${stateName.toLowerCase().replace(/\s+/g, '-')}`
  const handleTestId = `${stateTestId}-drag-handle`
  return page.getByTestId(handleTestId)
}

/**
 * Get the position of a workflow state in the list
 *
 * @param page Playwright page object
 * @param stateName Name of the workflow state
 * @returns Promise resolving to the position (index) of the state, or -1 if not found
 */
export async function getWorkflowStatePosition(page: Page, stateName: string): Promise<number> {
  // Use data-testid for consistent selector strategy
  const testId = `workflow-state-${stateName.toLowerCase().replace(/\s+/g, '-')}`
  const allStates = page.locator('[data-testid^="workflow-state-"]')
  const count = await allStates.count()

  for (let i = 0; i < count; i++) {
    const stateId = await allStates.nth(i).getAttribute('data-testid')
    if (stateId === testId) {
      return i
    }
  }

  return -1
}

/**
 * Verify if a workflow state is at the expected position
 *
 * @param page Playwright page object
 * @param stateName Name of the workflow state
 * @param expectedPosition Expected position (index) of the state
 * @returns Promise resolving to true if the state is at the expected position, false otherwise
 */
export async function verifyWorkflowStatePosition(
  page: Page,
  stateName: string,
  expectedPosition: number
): Promise<boolean> {
  const actualPosition = await getWorkflowStatePosition(page, stateName)
  return actualPosition === expectedPosition
}

/**
 * Get all workflow state names in their current order
 *
 * @param page Playwright page object
 * @returns Promise resolving to array of state names in their current order
 */
export async function getAllWorkflowStateNames(page: Page): Promise<string[]> {
  // Use a single, reliable selector approach
  const allStates = page.locator('[data-testid^="workflow-state-"]')

  // Add explicit assertion with timeout to ensure at least one state is visible
  try {
    await expect(allStates.first(), 'At least one workflow state should be visible').toBeVisible({
      timeout: 10000,
    })
  } catch (error) {
    // Take a screenshot to help diagnose the issue
    await page.screenshot({ path: 'screenshots/workflow-states-not-found.png' })
    throw error
  }

  const count = await allStates.count()

  if (count === 0) {
    throw new Error('No workflow states found with data-testid attribute')
  }

  const names: string[] = []
  for (let i = 0; i < count; i++) {
    const stateElement = allStates.nth(i)

    // Add explicit assertion for each state name element with a reasonable timeout
    const nameElement = stateElement.locator('.state-name')
    try {
      await expect(
        nameElement,
        `State name element should be visible for state ${i + 1}`
      ).toBeVisible({ timeout: 5000 })
    } catch (error) {
      // Take a screenshot to help diagnose the issue
      await page.screenshot({ path: `screenshots/state-name-not-found-${i}.png` })
      throw error
    }

    const text = await nameElement.textContent()
    if (text) names.push(text.trim())
  }

  return names
}
