import { defineConfig, devices } from '@playwright/test'

/**
 * Read environment variables for test configuration
 */
// Default to localhost:80 for local development with Caddy
const TEST_HOST = process.env.TEST_HOST || 'localhost'
const TEST_PORT = process.env.TEST_PORT || '80'
const BASE_URL = `http://${TEST_HOST}:${TEST_PORT}`

// Get API URL from environment or default to localhost
const API_URL = process.env.VITE_API_URL || 'http://localhost:8000'

console.log(`Using base URL for tests: ${BASE_URL}`)
console.log(`Using API URL for tests: ${API_URL}`)

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Cleanup after tests */
  globalTeardown: './global-teardown.ts',
  /* Maximum time one test can run for. */
  timeout: 30 * 1000, // Maximum 30 seconds per test as requested
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 10000, // 10 seconds for expect timeouts
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!globalThis.process?.env?.CI,
  /* Retry on CI only */
  retries: globalThis.process?.env?.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: globalThis.process?.env?.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['list'], // Add list reporter for console output
    ['line'], // Add line reporter for more detailed console output
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: BASE_URL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Configure screenshots */
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true,
    },
  },

  /* Configure directories for artifacts */
  outputDir: './test-results/',

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

  /* We're starting the servers manually in the run-tests.sh script */
})
