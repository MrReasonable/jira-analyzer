/**
 * Utilities for setting up the test environment
 */

import { Page } from '@playwright/test'
import { TestContext } from '../core/types'

/**
 * Initialize the test environment for a page
 *
 * This function:
 * 1. Adds test headers to all fetch requests
 * 2. Disables caching in the backend
 * 3. Configures rate limiting for tests
 *
 * @param context Test context containing page and other shared state
 */
export async function initializeTestEnvironment(context: TestContext): Promise<void> {
  const { page } = context

  // Add test headers to all fetch requests in this page and ensure cookies are sent
  await page.addInitScript(() => {
    // Patch fetch to add test headers and ensure credentials are included
    const originalFetch = window.fetch
    window.fetch = (input, init = {}) => {
      const headers = new Headers(init.headers || {})
      headers.append('x-test-request', 'true')

      // Ensure credentials are included to send cookies
      const updatedInit = {
        ...init,
        headers,
        credentials: 'include' as RequestCredentials, // This ensures cookies are sent with the request
      }

      return originalFetch(input, updatedInit)
    }

    console.log(
      'Test environment initialized: Added test headers and credentials to all fetch requests'
    )
  })
}

/**
 * Initialize the test environment for multiple pages
 *
 * @param pages Array of pages to initialize
 */
export async function initializeTestEnvironmentForPages(pages: Page[]): Promise<void> {
  for (const page of pages) {
    await initializeTestEnvironment({ page } as TestContext)
  }
}

/**
 * Clear the cache in the backend
 *
 * This function makes a request to the admin endpoint to clear the cache
 *
 * @param context Test context containing page and other shared state
 * @param namespace Optional namespace to clear. If not provided, all caches are cleared.
 */
export async function clearBackendCache(context: TestContext, namespace?: string): Promise<void> {
  const { page } = context

  // Use the admin endpoint to clear the cache
  const url = namespace
    ? `/api/admin/cache/clear?namespace=${encodeURIComponent(namespace)}`
    : '/api/admin/cache/clear'

  await page.evaluate(async cacheUrl => {
    try {
      const headers = new Headers()
      headers.append('x-test-request', 'true')

      const response = await fetch(cacheUrl, {
        method: 'POST',
        headers,
        credentials: 'include', // This ensures cookies are sent with the request
      })

      if (!response.ok) {
        console.warn(`Failed to clear cache: ${response.status} ${response.statusText}`)
        return false
      }

      console.log('Cache cleared successfully')
      return true
    } catch (error) {
      console.error('Error clearing cache:', error)
      return false
    }
  }, url)
}
