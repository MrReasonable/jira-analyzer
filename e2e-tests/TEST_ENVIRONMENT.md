# Test Environment Configuration

This document describes the test environment configuration for the Jira Analyzer application. It explains how the
backend is configured to support end-to-end testing and how to use the test utilities.

## Backend Configuration for Testing

The backend has been configured to support end-to-end testing with the following features:

### 1. Rate Limiting Bypass

The rate limiter middleware has been updated to detect test requests and apply different rate limits:

- Test requests are identified by the `x-test-request` header
- Rate limits are increased to 1000 requests per minute for test environments
- Configuration and metrics endpoints are exempt from rate limiting in test environments

### 2. Caching Control

The caching service has been updated to support disabling caching for test environments:

- Caching is automatically disabled when the `USE_MOCK_JIRA` environment variable is set to `true`
- Test requests (identified by the `x-test-request` header) bypass caching
- A new `enable_caching()` function allows programmatically enabling/disabling caching

### 3. Cache Clearing Endpoint

The admin router provides an endpoint for clearing the cache:

- `POST /api/admin/cache/clear` clears all caches
- `POST /api/admin/cache/clear?namespace=configurations` clears a specific cache namespace
- Test requests (identified by the `x-test-request` header) bypass authentication

## Test Utilities

Several utility functions have been added to support end-to-end testing:

### Test Headers

The `test-headers.ts` module provides utilities for adding test-specific headers to requests:

```typescript
import {
  addTestHeaders,
  createTestFetch,
  patchGlobalFetch,
  restoreGlobalFetch,
} from '../utils/test-headers'

// Add test headers to fetch options
const options = addTestHeaders({ method: 'GET' })
fetch('/api/configurations', options)

// Create a fetch function that automatically adds test headers
const testFetch = createTestFetch()
testFetch('/api/configurations')

// Patch the global fetch function to add test headers
patchGlobalFetch()
fetch('/api/configurations') // Test headers automatically added
restoreGlobalFetch() // Restore original fetch
```

### Test Environment

The `test-environment.ts` module provides utilities for setting up the test environment:

```typescript
import { initializeTestEnvironment, clearBackendCache } from '../utils/test-environment'

// Initialize test environment for a page
await initializeTestEnvironment(context)

// Clear the backend cache
await clearBackendCache(context)
await clearBackendCache(context, 'configurations') // Clear specific namespace
```

## Using Test Utilities in Tests

Here's an example of how to use the test utilities in a test:

```typescript
import { test } from '@playwright/test'
import { initializeTestEnvironment, clearBackendCache } from '../utils/test-environment'

test('create configuration', async ({ page }) => {
  const context = { page }

  // Initialize test environment
  await initializeTestEnvironment(context)

  // Clear cache before test
  await clearBackendCache(context)

  // Test code here...
})
```

## Automatic Test Headers in Configuration Functions

The configuration functions (`createConfiguration`, `editConfiguration`, `deleteConfiguration`) have been updated to
automatically add test headers to all fetch requests. This ensures that all API requests made during these operations
bypass rate limiting and caching.

## Environment Variables

The following environment variables affect the test environment:

- `USE_MOCK_JIRA=true` - Enables test mode, which disables caching and increases rate limits for better test
  performance
