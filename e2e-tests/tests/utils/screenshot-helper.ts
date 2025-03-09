import { Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

// Counter for screenshot numbering
let screenshotCounter = 1

// Current test name for folder organization
let currentTestName = ''

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
  const testFolder = testName || currentTestName

  if (!testFolder) {
    console.warn('Warning: No test name provided for screenshot organization')
  }

  // Format counter to have at least 2 digits (01, 02, etc.)
  const counterStr = String(screenshotCounter).padStart(2, '0')

  // Create the directory path based on test name
  const dirPath = `screenshots/${testFolder}`

  // Ensure directory exists
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }

  // Create filename with counter prefix
  const filename = `${counterStr}_${name}.png`
  const filePath = path.join(dirPath, filename)

  // Take the screenshot
  await page.screenshot({ path: filePath })

  // Increment counter for next screenshot
  screenshotCounter++

  return filePath
}

/**
 * Sets the test name for organizing screenshots in folders
 *
 * @param testName The name of the test (used for folder name)
 */
export function setScreenshotTestName(testName: string): void {
  // Remove invalid characters and spaces for folder name
  currentTestName = testName
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase()
}

/**
 * Resets the screenshot counter to 1 and optionally sets a new test name
 *
 * @param testName Optional test name to set
 */
export function resetScreenshotCounter(testName?: string): void {
  screenshotCounter = 1

  if (testName) {
    setScreenshotTestName(testName)
  }
}
