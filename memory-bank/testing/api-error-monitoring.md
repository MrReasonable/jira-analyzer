# API Error Monitoring for E2E Tests

> **Executive Summary:** Our API error monitoring system captures all API responses during test execution and provides detailed error reports when tests fail, helping identify whether failures are due to frontend issues or backend errors.

<!--
Last Updated: 11/04/2025
Related Documents:
- [E2E Testing](./e2e-testing.md)
- [Test Environment](./test-environment.md)
- [Backend API](../api/backend-api.md)
- [Error Handling](../api/error-handling.md)
-->

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Implementation](#implementation)
- [Usage in Tests](#usage-in-tests)
- [Error Reports](#error-reports)
- [Debugging Tips](#debugging-tips)
- [Backend Log Integration](#backend-log-integration)

## Overview

The API monitoring system captures all API responses during test execution and provides detailed error reports when tests fail. This helps identify whether test failures are due to frontend issues or backend errors.

## Features

- Automatically captures all API responses during test execution
- Tracks failed responses (HTTP 4xx/5xx)
- Generates formatted error reports
- Attaches error reports to test results
- Provides console output with links to backend logs
- Integrates with backend log checking

## Implementation

The API error monitoring system consists of two main components:

1. **ApiMonitor Class**: Captures and tracks API responses
2. **Test Helpers**: Integrates with Playwright test fixtures

### ApiMonitor Class

The `ApiMonitor` class in `src/utils/api-monitor.ts` handles:

- Listening for network responses
- Filtering for API calls
- Capturing request and response details
- Tracking failed responses
- Generating error reports

### Test Helpers

The `test-helpers.ts` file provides:

- `setupApiErrorMonitoring`: Sets up global test hooks
- `checkApiErrors`: Checks for API errors and attaches reports

## Usage in Tests

### 1. Import the Custom Test Fixtures

Replace the standard Playwright test import with our custom fixtures:

```typescript
// Before
import { test, expect } from "@playwright/test";

// After
import { test, expect } from "../src/fixtures";
```

### 2. Set Up API Error Monitoring

Add the following to your test file:

```typescript
import { setupApiErrorMonitoring } from "../src/utils/test-helpers";

// Set up API error monitoring for all tests in this file
setupApiErrorMonitoring(test);
```

### 3. Use the API Monitor in Tests

The `apiMonitor` is now available in your test functions:

```typescript
test("Example test", async ({ page, apiMonitor }) => {
  // Your test code here...

  // You can check for API errors at any point
  const hasErrors = await apiMonitor.hasApiErrors();
  expect(hasErrors, "API should not return errors during this operation").toBe(false);

  // You can also get all API responses
  const responses = apiMonitor.getAllResponses();
  console.log(`Captured ${responses.length} API responses`);
});
```

## Error Reports

When a test fails and API errors are detected, you'll see:

1. A console message with a summary of the errors
2. A link to the backend logs for more details
3. An attached file in the test report with detailed error information

## Debugging Tips

- Check the `api-errors.txt` attachment in the test report for detailed error information
- Look for the `==== BACKEND API ERRORS DETECTED ====` message in the console output
- Examine the backend logs at `e2e-tests/logs/backend.log` for more context
- Use `apiMonitor.getAllResponses()` to get all API responses for debugging

## Backend Log Integration

When API errors are detected, the system automatically provides a link to the backend logs. To effectively debug API errors:

1. **Check Backend Logs**: Always examine `e2e-tests/logs/backend.log` when API errors are reported
2. **Look for Axios Errors**: Pay special attention to Axios errors in the backend logs, which often indicate connection issues
3. **Correlate Timestamps**: Match the timestamps in the API error report with entries in the backend logs
4. **Check Database Errors**: Many API errors are caused by database issues, which are logged in the backend logs
5. **Examine Request Data**: Compare the request data in the API error report with what's expected by the backend

### Common Backend Error Patterns

- **401 Unauthorized**: Check credentials in the test configuration
- **422 Unprocessable Entity**: Verify required fields are being provided
- **500 Internal Server Error**: Look for exception stack traces in the backend logs
- **Connection Errors**: Check for network connectivity issues or service availability

### Example Backend Log Analysis

When you see an API error like:

```text
API Error: POST /api/validate-credentials - 401 Unauthorized
```

Check the backend logs for entries like:

```text
ERROR: Failed to validate Jira credentials: (sqlite3.OperationalError) no such table: configurations
```

This indicates a database initialization issue that needs to be addressed.
