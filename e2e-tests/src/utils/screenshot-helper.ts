import { Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

// State management (using closure instead of global variables)
const createScreenshotState = () => {
  let counter = 1
  let currentTestName = ''

  return {
    getCounter: () => counter,
    incrementCounter: () => {
      counter++
    },
    resetCounter: () => {
      counter = 1
    },
    getCurrentTestName: () => currentTestName,
    setCurrentTestName: (name: string) => {
      currentTestName = name
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_{2,}/g, '_')
        .toLowerCase()
    },
  }
}

const screenshotState = createScreenshotState()

/**
 * Ensures the screenshot directory exists
 */
const ensureDirectoryExists = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

/**
 * Creates a formatted counter string (e.g., "01", "02")
 */
const formatCounter = (counter: number): string => {
  return String(counter).padStart(2, '0')
}

/**
 * Creates the screenshot filename with counter prefix
 */
const createFilename = (counter: string, name: string): string => {
  return `${counter}_${name}.png`
}

/**
 * Takes a screenshot with an auto-incrementing number prefix in a folder based on test name
 *
 * @param page Playwright page object
 * @param name Base name for the screenshot (without extension)
 * @param testName Optional test name. If not provided, uses the previously set test name.
 * @returns Path of the saved screenshot
 */
export async function takeScreenshot(page: Page, name: string, testName?: string): Promise<string> {
  // Use provided test name or fallback to current test name
  const testFolder = testName ?? screenshotState.getCurrentTestName()

  if (!testFolder) {
    console.warn('Warning: No test name provided for screenshot organization')
  }

  // Format counter to have at least 2 digits (01, 02, etc.)
  const counterStr = formatCounter(screenshotState.getCounter())

  // Create the directory path based on test name
  const dirPath = `screenshots/${testFolder}`

  // Ensure directory exists
  ensureDirectoryExists(dirPath)

  // Create filename with counter prefix
  const filename = createFilename(counterStr, name)
  const filePath = path.join(dirPath, filename)

  // Take the screenshot
  await page.screenshot({ path: filePath })

  // Increment counter for next screenshot
  screenshotState.incrementCounter()

  return filePath
}

/**
 * Sets the test name for organizing screenshots in folders
 *
 * @param testName The name of the test (used for folder name)
 */
export function setScreenshotTestName(testName: string): void {
  screenshotState.setCurrentTestName(testName)
}

/**
 * Resets the screenshot counter to 1 and optionally sets a new test name
 *
 * @param testName Optional test name to set
 */
export function resetScreenshotCounter(testName?: string): void {
  screenshotState.resetCounter()

  if (testName) {
    setScreenshotTestName(testName)
  }
}
