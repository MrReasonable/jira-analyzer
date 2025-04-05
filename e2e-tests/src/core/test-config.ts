/**
 * Configuration settings for E2E tests
 *
 * This file contains centralized configuration values used across the test suite.
 * Modify these values to adjust test behavior without changing test code.
 */

export const TestConfig = {
  /**
   * Timeout settings (in milliseconds)
   */
  timeouts: {
    /** Default timeout for element visibility */
    element: 3000,

    /** Timeout for page load states */
    pageLoad: 3000,

    /** Timeout for API responses */
    api: 5000,

    /** Short delay for UI updates */
    uiUpdate: 500,

    /** Timeout for project fetching */
    projectFetch: 2000,

    /** Timeout for entire test execution */
    test: 30000,
  },

  /**
   * URL settings
   */
  urls: {
    /** Base URL for the application */
    baseUrl: 'http://localhost:80',

    /** API URL for backend requests */
    apiUrl: 'http://localhost:8000',
  },

  /**
   * Test data
   */
  testData: {
    /** Default JQL query for tests */
    defaultJql: 'project = TEST AND type = Story',

    /** Default project key for tests */
    defaultProjectKey: 'TEST',

    /** Default workflow states */
    defaultWorkflowStates: ['Backlog', 'In Progress', 'Review', 'Done'],
  },
}
