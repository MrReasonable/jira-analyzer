/**
 * Utility functions for adding test-specific headers to requests
 */

/**
 * Add test-specific headers to a fetch request
 *
 * @param options Fetch options
 * @returns Updated fetch options with test headers
 */
export function addTestHeaders(options: RequestInit = {}): RequestInit {
  const headers = new Headers(options.headers || {})
  headers.append('x-test-request', 'true')

  return {
    ...options,
    headers,
  }
}

/**
 * Create a fetch function that automatically adds test headers
 *
 * @returns A fetch function that adds test headers
 */
export function createTestFetch(): typeof fetch {
  return (input: RequestInfo | URL, init?: RequestInit) => {
    return fetch(input, addTestHeaders(init))
  }
}

/**
 * Patch the global fetch function to add test headers
 *
 * This should be called at the beginning of a test file to ensure
 * all fetch requests include the test headers
 */
export function patchGlobalFetch(): void {
  const originalFetch = global.fetch

  // Replace global fetch with our version that adds test headers
  global.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    return originalFetch(input, addTestHeaders(init))
  }) as typeof fetch

  // Add a method to restore the original fetch
  ;(global as { restoreOriginalFetch?: () => void }).restoreOriginalFetch = () => {
    global.fetch = originalFetch
  }
}

/**
 * Restore the original fetch function
 *
 * This should be called at the end of a test file if patchGlobalFetch was used
 */
export function restoreGlobalFetch(): void {
  const globalWithRestore = global as { restoreOriginalFetch?: () => void }
  if (globalWithRestore.restoreOriginalFetch) {
    globalWithRestore.restoreOriginalFetch()
  }
}
