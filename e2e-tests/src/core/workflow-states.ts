import { takeScreenshot } from '../utils/screenshot-helper'
import { TestContext } from './types'

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
    await stateInput.waitFor({ state: 'visible', timeout: 5000 })
    await stateInput.fill(stateName)

    // Click the add button
    const addButton = page.getByRole('button', { name: 'Add' }).first()
    await addButton.click()

    // Verify state was added (brief check only)
    const leadTimeDropdown = page.getByLabel('Lead Time Start State')
    await leadTimeDropdown.waitFor({ state: 'visible', timeout: 3000 })

    console.log(`Added workflow state: ${stateName}`)
    return true
  } catch (error) {
    console.error(`Error adding workflow state "${stateName}":`, error)
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

  const stateElements = page.locator('.text-sm.font-medium.text-gray-900')
  const count = await stateElements.count()
  const names: string[] = []

  for (let i = 0; i < count; i++) {
    const text = await stateElements.nth(i).textContent()
    if (text) names.push(text.trim())
  }

  return names
}

/**
 * Perform a drag and drop operation on workflow states
 *
 * @param context Test context containing page and other shared state
 * @param sourceIndex Index of the source state to drag
 * @param targetIndex Index of the target position
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function dragWorkflowState(
  context: TestContext,
  sourceIndex: number,
  targetIndex: number
): Promise<boolean> {
  const { page } = context

  console.log(`Attempting to drag state from position ${sourceIndex} to ${targetIndex}`)
  await takeScreenshot(page, 'before_drag')

  try {
    // Get handles using a more reliable selector
    const dragHandles = page.locator(
      '[data-dnd-handle], [data-testid="workflow-state-drag-handle"]'
    )
    const handleCount = await dragHandles.count()

    if (handleCount < 2) {
      console.warn('Not enough drag handles found for drag operation')
      return false
    }

    if (sourceIndex >= handleCount || targetIndex >= handleCount) {
      console.warn(
        `Invalid indices: source=${sourceIndex}, target=${targetIndex}, count=${handleCount}`
      )
      return false
    }

    // Get names before drag for verification
    const stateNames = await getWorkflowStateNames(context)
    console.log('States before drag:', stateNames)

    // Get the bounding boxes
    const sourceBB = await dragHandles.nth(sourceIndex).boundingBox()
    const targetBB = await dragHandles.nth(targetIndex).boundingBox()

    if (!sourceBB || !targetBB) {
      console.warn('Could not get bounding boxes for drag operation')
      return false
    }

    // Use native mouse actions with more deliberate movements
    // Start the drag
    await page.mouse.move(sourceBB.x + sourceBB.width / 2, sourceBB.y + sourceBB.height / 2)
    await page.mouse.down()
    await page.waitForTimeout(300) // Wait for drag to start

    // Move in smaller steps
    const steps = 10
    const xDiff = (targetBB.x - sourceBB.x) / steps
    const yDiff = (targetBB.y - sourceBB.y) / steps

    for (let i = 1; i <= steps; i++) {
      await page.mouse.move(
        sourceBB.x + sourceBB.width / 2 + xDiff * i,
        sourceBB.y + sourceBB.height / 2 + yDiff * i
      )
      await page.waitForTimeout(50)
    }

    // Complete the drag
    await page.waitForTimeout(300)
    await page.mouse.up()
    await page.waitForTimeout(500)

    // Verify drag results
    const newStateNames = await getWorkflowStateNames(context)
    console.log('States after drag:', newStateNames)

    // Check if order changed
    const isDifferent = JSON.stringify(stateNames) !== JSON.stringify(newStateNames)
    console.log(`Drag operation ${isDifferent ? 'changed' : 'did not change'} the order`)

    await takeScreenshot(page, 'after_drag')
    return isDifferent
  } catch (error) {
    console.error('Error during drag operation:', error)
    await takeScreenshot(page, 'drag_error')
    return false
  }
}
