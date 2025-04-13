import { expect } from '@playwright/test'
import { TestContext } from './types'
import { TestConfig } from './test-config'
import { getWorkflowStateDragHandle, getAllWorkflowStateNames } from '../utils/selector-helper'

/**
 * Add a single workflow state to the configuration
 *
 * @param context Test context containing page and other shared state
 * @param stateName Name of the workflow state to add
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function addWorkflowState(context: TestContext, stateName: string): Promise<boolean> {
  const { page } = context

  try {
    // Find the input field with a single, reliable selector
    const stateInput = page.getByPlaceholder('New state name')
    await stateInput.waitFor({ state: 'visible', timeout: TestConfig.timeouts.element })
    await stateInput.fill(stateName)

    // Click the add button
    const addButton = page.getByRole('button', { name: 'Add' }).first()
    await addButton.click()

    // Verify state was added (brief check only)
    const leadTimeDropdown = page.getByLabel('Lead Time Start State')
    await leadTimeDropdown.waitFor({ state: 'visible', timeout: TestConfig.timeouts.element })

    return true
  } catch {
    return false
  }
}

/**
 * Get the current workflow state names
 *
 * @param context Test context containing page and other shared state
 * @returns Promise resolving to array of state names
 */
export async function getWorkflowStateNames(context: TestContext): Promise<string[]> {
  const { page } = context

  // Use the same function from selector-helper for consistency
  return await getAllWorkflowStateNames(page)
}

/**
 * Perform a drag and drop operation on workflow states using state names
 * instead of indices for more stable tests
 *
 * @param context Test context containing page and other shared state
 * @param sourceStateName Name of the source state to drag
 * @param targetStateName Name of the target state position
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function dragWorkflowStateByName(
  context: TestContext,
  sourceStateName: string,
  targetStateName: string
): Promise<boolean> {
  const { page } = context

  // Take a screenshot before drag operation
  await page.screenshot({
    path: `screenshots/before-drag-${sourceStateName}-to-${targetStateName}.png`,
  })

  // Get the state names before drag for verification
  const stateNamesBefore = await getAllWorkflowStateNames(page)
  console.log('States before drag:', stateNamesBefore)

  // Get the source and target elements using reliable selectors
  const sourceHandle = getWorkflowStateDragHandle(page, sourceStateName)
  const targetHandle = getWorkflowStateDragHandle(page, targetStateName)

  // Ensure both handles are visible with explicit assertions and longer timeouts
  try {
    await expect(
      sourceHandle,
      `Source drag handle for "${sourceStateName}" should be visible`
    ).toBeVisible({
      timeout: 10000,
    })
  } catch (error) {
    // Take a screenshot to help diagnose the issue
    await page.screenshot({ path: `screenshots/source-handle-not-found-${sourceStateName}.png` })
    throw error
  }

  try {
    await expect(
      targetHandle,
      `Target drag handle for "${targetStateName}" should be visible`
    ).toBeVisible({
      timeout: 10000,
    })
  } catch (error) {
    // Take a screenshot to help diagnose the issue
    await page.screenshot({ path: `screenshots/target-handle-not-found-${targetStateName}.png` })
    throw error
  }

  // Take a screenshot with handles visible
  await page.screenshot({
    path: `screenshots/handles-visible-${sourceStateName}-to-${targetStateName}.png`,
  })

  // Use the drag and drop API directly - no fallbacks
  try {
    await sourceHandle.dragTo(targetHandle)
  } catch (error) {
    // Take a screenshot to help diagnose the issue
    await page.screenshot({
      path: `screenshots/drag-operation-failed-${sourceStateName}-to-${targetStateName}.png`,
    })
    console.error(
      `Error during drag operation from "${sourceStateName}" to "${targetStateName}":`,
      error
    )
    throw error
  }

  // Wait for the UI to update with a longer timeout
  await page.waitForTimeout(2000)

  // Take a screenshot after drag operation
  await page.screenshot({
    path: `screenshots/after-drag-${sourceStateName}-to-${targetStateName}.png`,
  })

  // Get the state names after drag
  const stateNamesAfter = await getAllWorkflowStateNames(page)
  console.log('States after drag:', stateNamesAfter)

  // Check if order changed
  const isDifferent = JSON.stringify(stateNamesBefore) !== JSON.stringify(stateNamesAfter)

  // Verify the order actually changed
  expect(
    isDifferent,
    `State order should be different after dragging "${sourceStateName}" to "${targetStateName}"`
  ).toBe(true)

  return isDifferent
}

/**
 * Legacy method for backward compatibility
 * Uses the new name-based method internally
 * @deprecated Use dragWorkflowStateByName for more stable tests
 */
export async function dragWorkflowState(
  context: TestContext,
  sourceIndex: number,
  targetIndex: number
): Promise<boolean> {
  const { page } = context

  try {
    // Get all state names
    const stateNames = await getAllWorkflowStateNames(page)

    // Check if indices are valid
    if (sourceIndex >= stateNames.length || targetIndex >= stateNames.length) {
      return false
    }

    // Get the state names at the specified indices
    const sourceStateName = stateNames[sourceIndex]
    const targetStateName = stateNames[targetIndex]

    // Use the name-based method
    return await dragWorkflowStateByName(context, sourceStateName, targetStateName)
  } catch {
    return false
  }
}
