import { takeScreenshot } from '../utils/screenshot-helper'
import { TestContext } from './types'
import { TestConfig } from './test-config'

/**
 * Navigate to the Jira Analyzer application
 *
 * @param context Test context containing page and other shared state
 */
export async function navigateToApp(context: TestContext): Promise<void> {
  const { page } = context

  try {
    // Set up request failure logging
    page.on('requestfailed', request => {
      console.error(`Request failed: ${request.url()}, ${request.failure()?.errorText}`)
    })

    // Set up console message logging
    page.on('console', msg => {
      console.log(`BROWSER CONSOLE ${msg.type()}: ${msg.text()}`)
    })

    console.log('Navigating to application using baseURL configuration')
    // Use baseURL from playwright.config.ts by using relative URL
    const response = await page.goto('/', { timeout: TestConfig.timeouts.test })
    console.log(`Navigation response status: ${response?.status()}`)

    // Wait for page to be fully loaded
    console.log('Waiting for page to load (domcontentloaded)')
    await page
      .waitForLoadState('domcontentloaded', { timeout: TestConfig.timeouts.pageLoad })
      .catch(() => {
        console.log('DOMContentLoaded timeout, but continuing test')
      })

    console.log('Waiting for page to load (load event)')
    await page.waitForLoadState('load', { timeout: TestConfig.timeouts.pageLoad }).catch(() => {
      console.log('Load event timeout, but continuing test')
    })

    // Log page title for debugging
    const title = await page.title()
    console.log(`Page title: ${title}`)

    // Take a screenshot of the initial page load
    await takeScreenshot(page, 'initial_page_load')

    // Wait for application to be ready by looking for a key element
    console.log('Waiting for Jira Analyzer heading to be visible')
    await page
      .getByRole('heading', { name: 'Jira Analyzer' })
      .waitFor({ state: 'visible', timeout: TestConfig.timeouts.api })
      .catch(async e => {
        console.error('Could not find Jira Analyzer heading:', e)
        await takeScreenshot(page, 'heading_not_found')
        throw new Error('Application failed to load - Jira Analyzer heading not found')
      })

    console.log('Jira Analyzer heading is visible, application loaded')
  } catch (error) {
    console.error('Error during navigation:', error)
    await takeScreenshot(page, 'navigation_error')
    throw error
  }
}
