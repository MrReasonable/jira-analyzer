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

  try {
    // Use page.request.fetch() which automatically resolves URLs against baseURL
    const response = await page.request.fetch(url, {
      method: 'POST',
      headers: {
        'x-test-request': 'true',
      },
    })

    if (!response.ok()) {
      console.warn(`Failed to clear cache: ${response.status()} ${response.statusText()}`)
    } else {
      console.log('Cache cleared successfully')
    }
  } catch (error) {
    console.error('Error clearing cache:', error)
  }
}

/**
 * Reset the in-memory database
 *
 * This function makes a request to the admin endpoint to reset the in-memory database.
 * It's useful for ensuring tests start with a clean database state.
 *
 * @param context Test context containing page and other shared state
 * @returns Promise<boolean> True if the database was reset successfully, false otherwise
 */
export async function resetInMemoryDatabase(context: TestContext): Promise<boolean> {
  const { page } = context

  // Use the admin endpoint to reset the database
  const url = '/api/admin/database/reset'

  try {
    // Use page.request.fetch() which automatically resolves URLs against baseURL
    const response = await page.request.fetch(url, {
      method: 'POST',
      headers: {
        'x-test-request': 'true',
      },
    })

    if (!response.ok()) {
      console.warn(`Failed to reset database: ${response.status()} ${response.statusText()}`)
      return false
    } else {
      console.log('In-memory database reset successfully')
      return true
    }
  } catch (error) {
    console.error('Error resetting database:', error)
    return false
  }
}

/**
 * Load a fixture into the test database
 *
 * This function makes a request to the admin test endpoint to load a fixture.
 * Fixtures provide predefined database states for testing specific scenarios.
 *
 * @param context Test context containing page and other shared state
 * @param fixtureId The ID of the fixture to load
 * @param options Options for loading the fixture
 * @returns The result of the fixture loading operation, or null if it failed
 */
export async function loadFixture(
  context: TestContext,
  fixtureId: string,
  options: { clearExisting?: boolean } = { clearExisting: true }
): Promise<Record<string, unknown> | null> {
  const { page } = context

  // Use the admin test endpoint to load the fixture
  const url = `/api/admin/test/fixtures/load?fixture=${encodeURIComponent(fixtureId)}&clear_existing=${options.clearExisting}`

  try {
    // Use page.request.fetch() which automatically resolves URLs against baseURL
    const response = await page.request.fetch(url, {
      method: 'POST',
      headers: {
        'x-test-request': 'true',
      },
    })

    if (!response.ok()) {
      console.warn(
        `Failed to load fixture ${fixtureId}: ${response.status()} ${response.statusText()}`
      )
      return null
    }

    const result = await response.json()

    if (result?.status === 'success') {
      console.log(`Fixture loaded: ${fixtureId}`)
      return result.result
    } else {
      console.error(`Failed to load fixture ${fixtureId}:`, result)
      return null
    }
  } catch (error) {
    console.error(`Error loading fixture ${fixtureId}:`, error)
    return null
  }
}

/**
 * Get a list of available fixtures
 *
 * This function makes a request to the admin test endpoint to list available fixtures.
 *
 * @param context Test context containing page and other shared state
 * @returns Array of available fixture IDs, or empty array if request failed
 */
export async function listAvailableFixtures(context: TestContext): Promise<string[]> {
  const { page } = context

  // Use the admin test endpoint to list fixtures
  const url = '/api/admin/test/fixtures/list'

  try {
    // Use page.request.fetch() which automatically resolves URLs against baseURL
    const response = await page.request.fetch(url, {
      method: 'GET',
      headers: {
        'x-test-request': 'true',
      },
    })

    if (!response.ok()) {
      console.warn(`Failed to list fixtures: ${response.status()} ${response.statusText()}`)
      return []
    }

    const result = await response.json()

    if (result?.fixtures) {
      return result.fixtures
    } else {
      console.error('Failed to get available fixtures:', result)
      return []
    }
  } catch (error) {
    console.error('Error getting available fixtures:', error)
    return []
  }
}

/**
 * Clean up the PostgreSQL test database
 *
 * This function makes a request to the admin endpoint to clean up the PostgreSQL test database.
 * It truncates all tables, which is faster than recreating them.
 * This is useful for ensuring tests start with a clean database state.
 *
 * @param context Test context containing page and other shared state
 * @returns Promise<boolean> True if the database was cleaned up successfully, false otherwise
 */
export async function cleanupPostgresTestDatabase(context: TestContext): Promise<boolean> {
  const { page } = context

  // Use the admin endpoint to clean up the database
  const url = '/api/admin/database/cleanup'

  try {
    // Use page.request.fetch() which automatically resolves URLs against baseURL
    const response = await page.request.fetch(url, {
      method: 'POST',
      headers: {
        'x-test-request': 'true',
      },
    })

    if (!response.ok()) {
      console.warn(`Failed to clean up database: ${response.status()} ${response.statusText()}`)
      return false
    } else {
      console.log('PostgreSQL test database cleaned up successfully')
      return true
    }
  } catch (error) {
    console.error('Error cleaning up database:', error)
    return false
  }
}

/**
 * Reset or clean up the test database based on configuration
 *
 * This function automatically detects whether to use resetInMemoryDatabase or
 * cleanupPostgresTestDatabase based on the environment variables.
 *
 * @param context Test context containing page and other shared state
 * @returns Promise<boolean> True if the database was reset/cleaned up successfully, false otherwise
 */
export async function resetTestDatabase(context: TestContext): Promise<boolean> {
  // First try PostgreSQL cleanup
  try {
    const pgCleanupResult = await cleanupPostgresTestDatabase(context)
    if (pgCleanupResult) {
      return true
    }
  } catch {
    console.log('PostgreSQL cleanup not available, trying in-memory reset')
  }

  // Fall back to in-memory reset
  try {
    return await resetInMemoryDatabase(context)
  } catch (error) {
    console.error('Failed to reset test database:', error)
    return false
  }
}
