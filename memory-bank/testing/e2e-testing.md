# End-to-End Testing

> **Executive Summary:** Our end-to-end testing approach uses Playwright to verify the complete application flow from the user's perspective. We follow the Page Object Model pattern with stable selectors, explicit assertions, and logical test organization to ensure reliable and maintainable tests. We strictly enforce a single reliable selector strategy with no fallbacks or silent retries.

<!--
Last Updated: 12/04/2025
Related Documents:
- [Test Selector Strategy](./test-selector-strategy.md)
- [Test Reliability](./test-reliability.md)
- [API Error Monitoring](./api-error-monitoring.md)
- [Test Environment](./test-environment.md)
- [Test Performance](./test-performance.md)
- [Workflow States Testing](./workflow-states-testing.md)
- [User Journeys](./user-journeys.md)
- [Unit Testing](./unit-testing.md)
- [Integration Testing](./integration-testing.md)
- [E2E Test Utilities](./e2e-test-utilities.md)
-->

## Table of Contents

- [Testing Tools](#testing-tools)
- [Test Structure](#test-structure)
  - [Page Objects](#page-objects)
  - [Selector Strategy](#selector-strategy)
  - [Test Organization](#test-organization)
  - [Assertions](#assertions)
- [User Journeys](#user-journeys)
- [Test Scenarios](#test-scenarios)
- [Test Environment](#test-environment)
- [Running E2E Tests](#running-e2e-tests)
- [Testing Standards](#testing-standards)
- [Recent Improvements](#recent-improvements)
- [Future Improvements](#future-improvements)

## Testing Tools

- **Playwright**: Primary testing framework for browser automation
- **TypeScript**: Language used for writing tests
- **Page Object Model**: Design pattern for organizing test code
- **Test Utilities**: Custom helpers for common operations (see [E2E Test Utilities](./e2e-test-utilities.md))
- **API Error Monitoring**: System for detecting and reporting backend errors during tests

## Test Structure

### Page Objects

We use the Page Object Model pattern to encapsulate page interactions:

- `JiraAnalyzerPage`: Main page object for the application
- Core modules for specific functionality (configuration, workflow states, etc.)
- Utility functions for common operations

### Selector Strategy

We strictly enforce a single reliable selector strategy:

- **Name-based selectors** instead of index-based selectors
- **No fallback selectors** - each element must have one reliable selector
- **No silent retries** - tests must fail fast when elements aren't found
- **Consistent use of data-testid attributes** as the primary selector mechanism
- **Explicit assertions** with descriptive messages for all element interactions

For detailed rules and examples, see [Test Selector Strategy](./test-selector-strategy.md).

Example:

```typescript
// CORRECT: Using a single reliable selector with proper assertions
const analyzeButton = page.getByTestId("analyze-button");
await expect(analyzeButton, "Analyze button should be visible").toBeVisible();
await analyzeButton.click();

// INCORRECT: Using fallback selectors or silent retries
try {
  await page.getByTestId("analyze-button").click();
} catch {
  await page.getByRole("button", { name: "Analyze" }).click();
}
```

### Test Organization

Tests are organized into logical steps using `test.step()`:

```typescript
await test.step("Navigate to the application", async () => {
  await jiraAnalyzerPage.goto();
  await expect(page.url()).toContain("localhost");
});

await test.step("Create a new Jira configuration", async () => {
  // Configuration creation code
});

await test.step("Test drag and drop functionality", async () => {
  // Drag and drop testing code
});
```

### Assertions

We use explicit assertions with descriptive messages:

```typescript
expect(result, "Configuration should be created successfully").toBe(true);

expect(
  JSON.stringify(statesBefore),
  "State order should be different after drag operation"
).not.toEqual(JSON.stringify(statesAfter));

await expect(metricsSection, "Metrics section should be visible after analysis").toBeVisible({
  timeout: TestConfig.timeouts.element,
});
```

## User Journeys

Our E2E tests are designed to verify the primary user journeys through the application. For detailed flow diagrams and testing points, see the [User Journeys](./user-journeys.md) documentation.

The main journeys we test include:

1. **Configuration Management**: Creating, editing, and deleting Jira configurations
2. **Metrics Analysis**: Selecting configurations, analyzing metrics, and viewing charts
3. **Workflow Management**: Editing workflow states, reordering states, and setting time points

## Test Scenarios

- **Configuration Management**: Creating, editing, and deleting Jira configurations
- **Workflow States**: Adding, editing, and reordering workflow states
- **Drag and Drop**: Testing the drag and drop functionality for workflow states
- **Chart Rendering**: Verifying that all charts render correctly
- **Error Handling**: Testing error scenarios and edge cases

## Test Environment

- **Local Development**: Tests run against local development servers
- **Docker**: Tests can run in Docker containers for CI/CD
- **Test Data**: Uses mock data to avoid dependencies on external systems

## Running E2E Tests

### Important: Test Environment Setup

E2E tests require the full application stack to be running. The `run-tests.sh` script handles this automatically by:

1. Checking if services are already running and shutting them down if needed
2. Clearing old log files and screenshots
3. Starting the backend with Docker Compose using an in-memory database
4. Capturing backend logs
5. Waiting for services to be ready
6. Installing dependencies and browsers if needed
7. Running the tests with appropriate environment variables

### Running All Tests

Run all tests using:

```bash
cd e2e-tests
./run-tests.sh --no-debug  # Without debug logs (default)
./run-tests.sh             # With debug logs
```

Or use the Makefile targets:

```bash
make e2e-test      # Run tests without debug logs (default)
make e2e-test-debug  # Run tests with debug logs
```

### Running Specific Tests

To run a specific test file:

```bash
cd e2e-tests
./run-tests.sh tests/example-api-monitoring.spec.ts
```

### Additional Run Options

The `run-tests.sh` script accepts additional arguments that are passed directly to Playwright:

```bash
# Run tests in headed mode (visible browser)
./run-tests.sh --headed

# Run tests with a specific browser
./run-tests.sh --browser=firefox

# Run tests with specific tags
./run-tests.sh --grep="@slow"
```

### Test Execution Process

When running tests:

1. The script starts Docker containers for the backend, frontend, and database
2. It waits for all services to be ready (checking health endpoints)
3. Tests are executed against the running services
4. On completion (or interruption), all containers are automatically shut down
5. Test results and logs are saved for review

### Troubleshooting Test Runs

If tests fail:

1. Check the backend logs at `e2e-tests/logs/backend.log`
2. Review screenshots in the `e2e-tests/screenshots` directory
3. Examine the HTML report generated by Playwright
4. Look for API errors in the test output (especially for API monitoring tests)

## Testing Standards

To ensure consistent and reliable tests, we follow these standards:

1. **Single Reliable Selector Strategy**

   - Use exactly one selector strategy for each element
   - Prefer data-testid attributes for element selection
   - Never implement fallback selectors or retry mechanisms
   - Tests must fail immediately when elements can't be found

2. **Explicit Assertions**

   - Always include descriptive messages in assertions
   - Use expect() with clear conditions
   - Avoid returning boolean values instead of assertions
   - Never silently continue when assertions fail

3. **Logical Test Organization**

   - Use test.step() to organize tests into logical steps
   - Keep steps focused on a single responsibility
   - Use descriptive step names that explain the purpose
   - Clearly separate setup from actual testing

4. **Clean Error Handling**

   - Let test failures surface clearly
   - Never use try/catch blocks that hide failures
   - Use proper assertions instead of conditional logic
   - Never implement retry loops for operations that should succeed

5. **State Management**

   - Ensure tests start from a known state
   - Clean up after tests to avoid interdependencies
   - Use utility functions to set up test preconditions
   - Verify state is correct with explicit assertions

6. **Backend Error Handling**
   - Backend API errors (e.g., 500 errors) during normal operation indicate real application issues
   - Tests must fail when unexpected backend errors occur during setup or normal operation
   - Never modify tests to accommodate or ignore backend errors that should be fixed
   - Only catch and handle errors that are explicitly part of the test scenario
   - Use API monitoring to detect and report backend errors, not to ignore them

## Error Handling in E2E Tests

E2E tests verify the application works correctly from the user's perspective. When handling errors in E2E tests, follow these principles:

### Distinguishing Between Application Errors and Test Errors

1. **Application Errors**: Problems in the application code that users would experience

   - These should cause tests to fail to alert developers of real issues
   - Examples: 500 server errors, unhandled exceptions, failed API requests

2. **Test Errors**: Issues with the test code itself
   - These should be fixed in the test code
   - Examples: selector errors, timing issues, test environment problems

### Handling Backend API Errors

Backend API errors during E2E tests typically indicate real problems that need fixing:

```typescript
// Check for API errors after navigation
const hasInitialErrors = await apiMonitor.hasApiErrors();
if (hasInitialErrors) {
  console.log("API errors detected:");
  console.log(apiMonitor.getErrorSummary());
  // Fail the test to alert developers of the issue
  expect(hasInitialErrors, "Should not have API errors during normal operation").toBe(false);
}
```

### Error Detection Tests

The only exception is when a test is specifically designed to verify error handling behavior:

```typescript
// This test specifically verifies the application's error handling
await test.step("Verify application handles API errors gracefully", async () => {
  // Force an error condition (e.g., by providing invalid input)
  await page.fill("#api-key-input", "invalid-key");
  await page.click("#submit-button");

  // Verify the application shows an appropriate error message
  const errorMessage = page.getByTestId("error-message");
  await expect(errorMessage, "Error message should be displayed").toBeVisible();
  await expect(errorMessage, "Error message should explain the issue").toContainText(
    "Invalid API key"
  );
});
```

Even in error detection tests, the test setup should not have unexpected errors:

```typescript
// Setup phase - should fail if there are unexpected errors
await test.step("Navigate to the application", async () => {
  await page.goto("/");

  // This should fail if there are unexpected API errors during navigation
  const hasApiErrors = await apiMonitor.hasApiErrors();
  expect(hasApiErrors, "Should not have API errors during page load").toBe(false);
});

// Test phase - now we can test error scenarios
await test.step("Test invalid input handling", async () => {
  // Test code that intentionally triggers errors
});
```

## Recent Improvements

We've made significant improvements to the E2E tests:

1. **Stable Selectors**

   - Added `selector-helper.ts` with name-based selectors
   - Improved resilience to UI changes and reordering of elements
   - Simplified selectors to use consistent data-testid attributes
   - Removed fallback mechanisms for cleaner, more predictable tests
   - Eliminated multi-strategy selector approaches in favor of single reliable selectors
   - Standardized on getByTestId() for most element selection

2. **Explicit Assertions**

   - Replaced implicit assertions with explicit expectations
   - Added descriptive error messages to all assertions
   - Improved test failure diagnostics

3. **Simplified Test Structure**

   - Organized tests into logical steps using `test.step()`
   - Removed unnecessary console logging for cleaner test output
   - Eliminated screenshot dependencies
   - Simplified error handling with clean try/catch blocks
   - Replaced complex fallback mechanisms with direct assertions
   - Removed conditional logic that was masking test failures
   - Added proper error handling that fails tests appropriately
   - Standardized on expect() assertions with descriptive messages

4. **Improved Drag and Drop Testing**

   - Added name-based drag and drop functionality
   - Maintained backward compatibility with index-based methods
   - Added proper verification of drag operations

5. **API Error Monitoring**
   - Implemented automatic API response monitoring during tests
   - Added detailed error reporting for backend issues
   - Created custom test fixtures for API monitoring
   - Integrated with test reports to show backend errors
   - Added comprehensive documentation for error monitoring

## Future Improvements

1. Add data-testid attributes to all workflow state elements
2. Create predefined test configurations to avoid repetitive setup
3. Implement a test data cleanup utility
4. Add visual regression testing for critical UI components
5. Refactor remaining tests to use the simplified approach
6. Remove all remaining fallback mechanisms in other test files
7. Standardize on a single selector strategy across all tests
8. Add more explicit assertions with descriptive messages
9. Implement page object model more consistently
10. Add test isolation to prevent test interdependencies
