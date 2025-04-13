# Test Environment Configuration

> **Executive Summary:** Our test environment is configured to support reliable end-to-end testing with features like rate limiting bypass, caching control, and test-specific headers to ensure consistent test execution.

<!--
Last Updated: 11/04/2025
Related Documents:
- [E2E Testing](./e2e-testing.md)
- [API Error Monitoring](./api-error-monitoring.md)
- [Backend API](../api/backend-api.md)
-->

## Table of Contents

- [Backend Configuration](#backend-configuration-for-testing)
  - [Rate Limiting Bypass](#1-rate-limiting-bypass)
  - [Caching Control](#2-caching-control)
  - [Cache Clearing Endpoint](#3-cache-clearing-endpoint)
- [Test Utilities](#test-utilities)
  - [Test Headers](#test-headers)
  - [Test Environment](#test-environment)
- [Usage in Tests](#using-test-utilities-in-tests)
- [Environment Variables](#environment-variables)

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

### 4. In-Memory Database Management

The backend has been configured to support in-memory database testing:

- When `USE_IN_MEMORY_DB=true`, the application uses an in-memory SQLite database
- Database tables are automatically created during application startup when using an in-memory database
- A new admin endpoint allows resetting the in-memory database to a clean state:
  - `POST /api/admin/database/reset` recreates all tables in the in-memory database
  - This endpoint is only available when using an in-memory database
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
} from "../utils/test-headers";

// Add test headers to fetch options
const options = addTestHeaders({ method: "GET" });
fetch("/api/configurations", options);

// Create a fetch function that automatically adds test headers
const testFetch = createTestFetch();
testFetch("/api/configurations");

// Patch the global fetch function to add test headers
patchGlobalFetch();
fetch("/api/configurations"); // Test headers automatically added
restoreGlobalFetch(); // Restore original fetch
```

### Test Environment

The `test-environment.ts` module provides utilities for setting up the test environment:

```typescript
import {
  initializeTestEnvironment,
  clearBackendCache,
  resetInMemoryDatabase,
} from "../utils/test-environment";

// Initialize test environment for a page
await initializeTestEnvironment(context);

// Clear the backend cache
await clearBackendCache(context);
await clearBackendCache(context, "configurations"); // Clear specific namespace

// Reset the in-memory database to ensure a clean state
const databaseReset = await resetInMemoryDatabase(context);
if (databaseReset) {
  console.log("In-memory database reset successfully");
} else {
  console.warn("Failed to reset in-memory database, test may use stale data");
}
```

## Using Test Utilities in Tests

Here's an example of how to use the test utilities in a test:

```typescript
import { test } from "@playwright/test";
import {
  initializeTestEnvironment,
  clearBackendCache,
  resetInMemoryDatabase,
} from "../utils/test-environment";

test("create configuration", async ({ page }) => {
  const context = { page };

  // Initialize test environment
  await initializeTestEnvironment(context);

  // Clear cache before test
  await clearBackendCache(context);

  // Reset the in-memory database to ensure a clean state
  await resetInMemoryDatabase(context);

  // Test code here...
});
```

For tests that need to ensure a completely clean database state, you can use the `resetInMemoryDatabase` function in the `beforeEach` hook:

```typescript
test.describe("Configuration Management", () => {
  test.beforeEach(async ({ page }) => {
    const context = { page };

    // Initialize test environment
    await initializeTestEnvironment(context);

    // Clear cache
    await clearBackendCache(context);

    // Reset database to ensure a clean state for each test
    const databaseReset = await resetInMemoryDatabase(context);
    if (!databaseReset) {
      console.warn("Failed to reset in-memory database, test may use stale data");
    }
  });

  test("create configuration", async ({ page }) => {
    // Test starts with a clean database state
    // ...
  });
});
```

## Automatic Test Headers in Configuration Functions

The configuration functions (`createConfiguration`, `editConfiguration`, `deleteConfiguration`) have been updated to
automatically add test headers to all fetch requests. This ensures that all API requests made during these operations
bypass rate limiting and caching.

## Environment Variables

The following environment variables affect the test environment:

- `USE_MOCK_JIRA=true` - Enables test mode, which uses mock Jira client instead of real one, disables caching, and increases rate limits for better test performance
- `USE_IN_MEMORY_DB=true` - Uses an in-memory SQLite database instead of a persistent database, which is faster for tests and ensures each test run starts with a clean database state

## Important: Setting USE_MOCK_JIRA in run-tests.sh

The `run-tests.sh` script must explicitly set `USE_MOCK_JIRA=true` when running docker-compose to ensure that the mock Jira client is used during tests. This is critical for the following reasons:

1. **Credential Validation**: Without the mock Jira client, the validate-credentials endpoint will attempt to validate test credentials against a real Jira server, resulting in 401 Unauthorized errors.

2. **Test Reliability**: Using the mock Jira client ensures that tests don't depend on external services, making them more reliable and faster.

3. **Consistent Test Data**: The mock Jira client provides consistent, predictable test data that doesn't change between test runs.

The correct docker-compose command in run-tests.sh should be:

```bash
cd "$PROJECT_ROOT" && USE_IN_MEMORY_DB=true USE_MOCK_JIRA=true VITE_DEBUG_LEVEL=$VITE_DEBUG_LEVEL docker-compose -f docker-compose.dev.yml up -d
```

If this environment variable is not explicitly set, tests that involve Jira credential validation (such as configuration creation) may fail with 401 Unauthorized errors, even though the docker-compose.dev.yml file has a default value of `USE_MOCK_JIRA=${USE_MOCK_JIRA:-true}`.
