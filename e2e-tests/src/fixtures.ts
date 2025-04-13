import { test as base } from '@playwright/test'
import { ApiMonitor } from './utils/api-monitor'

// Define the type for our custom fixtures
type CustomFixtures = {
  apiMonitor: ApiMonitor
}

/**
 * Extended test fixtures with API monitoring
 */
export const test = base.extend<CustomFixtures>({
  // Add the API monitor to the context
  apiMonitor: async ({ page }, use) => {
    const monitor = new ApiMonitor(page)
    await use(monitor)
  },

  // Override the default page fixture
  page: async ({ page }, use) => {
    // Any global page setup can go here

    // Continue with the modified page
    await use(page)
  },
})

// Export the expect object from playwright
export { expect } from '@playwright/test'
