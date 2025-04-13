# Test Reliability Best Practices

> **Executive Summary:** Our test reliability practices ensure that tests consistently produce the same results when run multiple times. We achieve this through proper environment setup, explicit assertions, and clear separation between setup and test phases.

<!--
Last Updated: 11/04/2025
Related Documents:
- [E2E Testing](./e2e-testing.md)
- [API Error Monitoring](./api-error-monitoring.md)
- [Test Environment](./test-environment.md)
- [Test Performance](./test-performance.md)
-->

## Table of Contents

- [Core Principles](#core-principles)
- [Environment Setup](#environment-setup)
- [Test Structure](#test-structure)
- [Error Handling](#error-handling)
- [Cleanup Procedures](#cleanup-procedures)
- [Common Pitfalls](#common-pitfalls)

## Core Principles

1. **Deterministic Setup**: Tests must always start from a known, consistent state
2. **Explicit Assertions**: All expectations must be explicitly asserted with clear messages
3. **Proper Error Handling**: Distinguish between expected and unexpected errors
4. **Complete Cleanup**: Tests must clean up after themselves to avoid affecting other tests
5. **Clear Separation**: Setup phase must be distinct from the testing phase
6. **Single Reliable Selector**: Each element must be accessed using exactly one reliable selector
7. **No Fallbacks**: Never implement multiple selector strategies with fallbacks
8. **Fail Fast**: Tests must fail immediately when elements cannot be found

## Environment Setup

### Initializing the Test Environment

Always initialize the test environment properly at the beginning of each test:

```typescript
// Initialize test environment
const context = { page };
await initializeTestEnvironment(context);
await clearBackendCache(context);
```

### Creating Test Data

When creating test data (like configurations), always:

1. Use unique identifiers to avoid conflicts
2. Assert that creation was successful
3. Clean up the data after the test completes

```typescript
// Generate a unique configuration name
const configName = `TestConfig_${new Date().getTime()}`;

// Create and assert
const result = await jiraAnalyzerPage.createConfiguration(testConfig);
expect(result, "Configuration should be created successfully").toBe(true);

// Later, clean up
await jiraAnalyzerPage.deleteConfiguration(configName);
```

## Test Structure

### Separating Setup from Testing

Clearly separate the setup phase from the testing phase:

```typescript
// Setup phase - should fail the test if unsuccessful
await test.step("Create a new Jira configuration", async () => {
  const result = await jiraAnalyzerPage.createConfiguration(testConfig);
  expect(result, "Configuration should be created successfully").toBe(true);
});

// Testing phase - may handle expected errors
await test.step("Attempt to analyze metrics", async () => {
  try {
    await jiraAnalyzerPage.analyzeMetrics();
    // ...
  } catch (error) {
    // Only catch errors that are expected as part of the test
    console.log("Expected error during metrics analysis:", error);
  }
});
```

### Using test.step() for Organization

Organize tests into logical steps using `test.step()`:

```typescript
await test.step("Navigate to the application", async () => {
  await jiraAnalyzerPage.goto();
  expect(page.url(), "Application URL should be loaded").toContain("localhost");
});
```

## Error Handling

### Expected vs. Unexpected Errors

Clearly distinguish between expected and unexpected errors:

1. **Unexpected errors in setup**: Should fail the test immediately

   - Backend API errors (e.g., 500 errors) during setup are unexpected and indicate real issues
   - Application crashes or exceptions during normal operation should fail tests
   - Network failures during expected operations should fail tests

2. **Expected errors in testing**: Can be caught and handled, but only when they're part of the test scenario
   - Only catch errors that are explicitly expected as part of the test case
   - Always be specific about which errors are expected
   - Document why certain errors are expected in test comments

### Backend API Errors

Backend API errors require special attention:

1. **API errors during setup or normal operation**:

   - These indicate real application issues that need to be fixed
   - Tests should fail to alert developers of these problems
   - Never modify tests to work around or ignore these errors

2. **API errors in error-handling tests**:
   - Only in tests specifically designed to verify error handling
   - Must be explicitly triggered as part of the test
   - Should verify the application handles the error gracefully

```typescript
// Example of handling unexpected API errors
const hasApiErrors = await apiMonitor.hasApiErrors();
if (hasApiErrors) {
  // Log the errors for debugging
  console.log("API errors detected:");
  console.log(apiMonitor.getErrorSummary());

  // Fail the test to alert developers
  expect(hasApiErrors, "Should not have API errors during normal operation").toBe(false);
}
```

### Error Detection Tests

For tests specifically designed to detect errors:

1. Set up the environment properly (this should not be error-prone)
2. Perform actions that are expected to produce specific, well-defined errors
3. Verify that the expected errors were detected and handled appropriately

```typescript
// Verify specific expected errors were detected
await test.step("Verify expected errors were detected", async () => {
  // Check for specific error types
  const apiErrors = await apiMonitor.hasApiErrors();
  const errorSummary = apiMonitor.getErrorSummary();

  // Verify we got the specific error we expected
  expect(errorSummary, "Should contain the expected validation error").toContain(
    "Invalid input format"
  );

  // Verify the application handled the error appropriately
  const errorMessage = page.getByTestId("error-message");
  await expect(errorMessage, "Error message should be displayed").toBeVisible();
  await expect(errorMessage, "Error message should explain the issue").toContainText(
    "Please check your input format"
  );
});
```

### Critical Distinction: Error Detection vs. Error Accommodation

There's a critical difference between:

1. **Error Detection Tests**: Tests designed to verify the application handles specific error conditions gracefully

   - These intentionally trigger well-defined errors and verify proper handling
   - Example: Testing that invalid input shows appropriate validation messages

2. **Error Accommodation**: Modifying tests to work around application bugs
   - This hides real issues and should NEVER be done
   - Example: Ignoring 500 errors from the backend instead of fixing the underlying issue

## Cleanup Procedures

### Reliable Cleanup

Always attempt to clean up resources created during the test:

```typescript
await test.step("Clean up - delete configuration", async () => {
  try {
    await jiraAnalyzerPage.deleteConfiguration(configName);
  } catch (error) {
    console.log("Error during configuration deletion:", error);
    // This is acceptable in an error detection test
  }
});
```

### Using beforeEach and afterEach

Use `beforeEach` for setup and `afterEach` for cleanup:

```typescript
test.beforeEach(async ({ page }) => {
  // Setup code
});

test.afterEach(async ({ page }) => {
  // Cleanup code
});
```

## Common Pitfalls

### 1. Continuing After Setup Failures

**Bad Practice**:

```typescript
try {
  await createConfiguration();
  // Continue even if creation fails
} catch (error) {
  console.log("Error during setup:", error);
  // Continue anyway
}
```

**Good Practice**:

```typescript
const result = await createConfiguration();
expect(result, "Configuration should be created successfully").toBe(true);
```

### 5. Using Fallback Selectors

**Bad Practice**:

```typescript
// Try multiple selectors until one works
const selectors = ["#jql-query", ".jql-input", '[data-testid="jql_query"]'];
for (const selector of selectors) {
  const element = page.locator(selector);
  if (await element.isVisible().catch(() => false)) {
    await element.fill(value);
    break;
  }
}
```

**Good Practice**:

```typescript
// Use a single reliable selector
const jqlInput = page.getByTestId("jql_query");
await expect(jqlInput, "JQL query input should be visible").toBeVisible();
await jqlInput.fill(value);
```

### 6. Implementing Silent Retries

**Bad Practice**:

```typescript
// Silently try alternative approaches if the first one fails
try {
  await page.getByTestId("submit-button").click();
} catch {
  try {
    await page.getByRole("button", { name: "Submit" }).click();
  } catch {
    await page.locator("button[type=submit]").click();
  }
}
```

**Good Practice**:

```typescript
// Use a single reliable selector and let the test fail properly if it's not found
const submitButton = page.getByTestId("submit-button");
await expect(submitButton, "Submit button should be visible").toBeVisible();
await submitButton.click();
```

### 2. Missing Assertions

**Bad Practice**:

```typescript
await jiraAnalyzerPage.ensureInMetricsView();
// No verification that we're actually in metrics view
```

**Good Practice**:

```typescript
await jiraAnalyzerPage.ensureInMetricsView();
const analyzeButton = page.getByTestId("analyze-button");
await expect(analyzeButton, "Analyze button should be visible").toBeVisible();
```

### 3. Unclear Error Handling

**Bad Practice**:

```typescript
try {
  // Some code that might fail
} catch (error) {
  // Catch all errors and continue
}
```

**Good Practice**:

```typescript
try {
  // Code that is expected to produce specific errors
} catch (error) {
  // Only catch and handle expected errors
  if (error.message.includes("expected error type")) {
    console.log("Expected error occurred:", error);
  } else {
    throw error; // Re-throw unexpected errors
  }
}
```

### 4. Inconsistent Environment

**Bad Practice**:

```typescript
// Directly start testing without ensuring environment state
```

**Good Practice**:

```typescript
// Initialize test environment
await initializeTestEnvironment(context);
await clearBackendCache(context);
```
