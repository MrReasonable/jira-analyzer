# E2E Test Utilities

> **Executive Summary:** This document provides a comprehensive reference for all end-to-end testing utilities available in the Jira Analyzer project. It categorizes utilities by function and provides guidance on when and how to use them to create robust, maintainable tests.

<!--
Last Updated: 11/04/2025
Related Documents:
- [E2E Testing](./e2e-testing.md)
- [Test Reliability](./test-reliability.md)
- [Test Environment](./test-environment.md)
- [Test Fixtures](./test-fixtures.md)
- [API Error Monitoring](./api-error-monitoring.md)
-->

## Table of Contents

- [Page Object and User Interaction](#page-object-and-user-interaction)
- [Test Environment Setup](#test-environment-setup)
- [State Management](#state-management)
- [Selectors and UI Interaction](#selectors-and-ui-interaction)
- [API Monitoring](#api-monitoring)
- [Test Fixtures](#test-fixtures)
- [Best Practices](#best-practices)

## Page Object and User Interaction

### JiraAnalyzerPage

The main page object that encapsulates user interactions with the Jira Analyzer application.

```typescript
import { JiraAnalyzerPage } from "@pages/jira-analyzer-page";

// Create a new page object
const jiraAnalyzerPage = new JiraAnalyzerPage(page);

// Navigate to the application
await jiraAnalyzerPage.goto();

// Create a configuration
await jiraAnalyzerPage.createConfiguration({
  name: "Test Config",
  server: "https://test.atlassian.net",
  email: "test@example.com",
  apiToken: "test-token",
  jql: "project = TEST",
  projectKey: "TEST",
  workflowStates: "Backlog,In Progress,Review,Done",
  leadTimeStartState: "Backlog",
  leadTimeEndState: "Done",
  cycleTimeStartState: "In Progress",
  cycleTimeEndState: "Done",
});
```

#### Available Methods

| Method                                    | Description                                      | Returns            |
| ----------------------------------------- | ------------------------------------------------ | ------------------ |
| `goto()`                                  | Navigate to the Jira Analyzer application        | `Promise<void>`    |
| `createConfiguration(config)`             | Create a new Jira configuration                  | `Promise<boolean>` |
| `getJqlQuery()`                           | Get the JQL query from the input field           | `Promise<string>`  |
| `setJqlQuery(jql)`                        | Set the JQL query in the input field             | `Promise<void>`    |
| `analyzeMetrics()`                        | Analyze metrics by clicking the Analyze button   | `Promise<boolean>` |
| `editConfiguration(configName)`           | Edit a configuration                             | `Promise<boolean>` |
| `deleteConfiguration(configName)`         | Delete a configuration                           | `Promise<boolean>` |
| `dragWorkflowStateByName(source, target)` | Drag a workflow state by name                    | `Promise<boolean>` |
| `verifyChartsRendered()`                  | Verify that charts are rendered on the page      | `Promise<boolean>` |
| `ensureConfigurationExists(config)`       | Ensure a configuration exists                    | `Promise<void>`    |
| `ensureInMetricsView()`                   | Ensure the application is in the metrics view    | `Promise<void>`    |
| `ensureInWorkflowEditor()`                | Ensure the application is in the workflow editor | `Promise<void>`    |

## Test Environment Setup

### initializeTestEnvironment

Sets up the test environment for a page, including adding test headers to all fetch requests, disabling caching, and configuring rate limiting.

```typescript
import { initializeTestEnvironment } from "@utils/test-environment";

// Initialize the test environment
const context = { page };
await initializeTestEnvironment(context);
```

### clearBackendCache

Clears the cache in the backend by making a request to the admin endpoint.

```typescript
import { clearBackendCache } from "@utils/test-environment";

// Clear all caches
await clearBackendCache(context);

// Clear a specific namespace
await clearBackendCache(context, "jira-data");
```

### resetTestDatabase

Resets or cleans up the test database based on configuration. This function automatically detects whether to use SQLite in-memory database or PostgreSQL test database.

```typescript
import { resetTestDatabase } from "@utils/test-environment";

// Reset the database
const reset = await resetTestDatabase(context);
expect(reset, "Database should reset successfully").toBe(true);
```

### resetInMemoryDatabase

Resets the SQLite in-memory database to ensure tests start with a clean state.

```typescript
import { resetInMemoryDatabase } from "@utils/test-environment";

// Reset the database
const reset = await resetInMemoryDatabase(context);
expect(reset, "Database should reset successfully").toBe(true);
```

### cleanupPostgresTestDatabase

Cleans up the PostgreSQL test database by truncating all tables. This is faster than recreating them.

```typescript
import { cleanupPostgresTestDatabase } from "@utils/test-environment";

// Clean up the database
const reset = await cleanupPostgresTestDatabase(context);
expect(reset, "Database should be cleaned up successfully").toBe(true);
```

## State Management

### ensureConfigurationExists

Ensures a configuration exists with the given name. If the configuration doesn't exist, it creates one.

```typescript
import { ensureConfigurationExists } from "@core/state-management";

// Ensure a configuration exists
await ensureConfigurationExists(context, {
  name: "Test Config",
  server: "https://test.atlassian.net",
  email: "test@example.com",
  apiToken: "test-token",
  jql: "project = TEST",
  projectKey: "TEST",
  workflowStates: "Backlog,In Progress,Review,Done",
  leadTimeStartState: "Backlog",
  leadTimeEndState: "Done",
  cycleTimeStartState: "In Progress",
  cycleTimeEndState: "Done",
});
```

### ensureInMetricsView

Ensures the application is in the metrics view where the analyze button exists.

```typescript
import { ensureInMetricsView } from "@core/state-management";

// Navigate to metrics view
await ensureInMetricsView(context);

// Navigate to metrics view, creating a configuration if needed
await ensureInMetricsView(context, true);
```

### ensureInWorkflowEditor

Ensures the application is in the workflow editor.

```typescript
import { ensureInWorkflowEditor } from "@core/state-management";

// Navigate to workflow editor
await ensureInWorkflowEditor(context);

// Navigate to workflow editor, creating a configuration if needed
await ensureInWorkflowEditor(context, true);
```

## Selectors and UI Interaction

### getWorkflowStateByName

Gets a workflow state element by its name.

```typescript
import { getWorkflowStateByName } from "@utils/selector-helper";

// Get a workflow state by name
const state = getWorkflowStateByName(page, "In Progress");
await expect(state).toBeVisible();
```

### getWorkflowStateDragHandle

Gets a workflow state drag handle by state name.

```typescript
import { getWorkflowStateDragHandle } from "@utils/selector-helper";

// Get a drag handle for a workflow state
const handle = getWorkflowStateDragHandle(page, "Backlog");
await handle.click();
```

### getWorkflowStatePosition

Gets the position of a workflow state in the list.

```typescript
import { getWorkflowStatePosition } from "@utils/selector-helper";

// Get the position of a workflow state
const position = await getWorkflowStatePosition(page, "In Progress");
expect(position).toBe(1);
```

### verifyWorkflowStatePosition

Verifies if a workflow state is at the expected position.

```typescript
import { verifyWorkflowStatePosition } from "@utils/selector-helper";

// Verify a workflow state is at the expected position
const isAtPosition = await verifyWorkflowStatePosition(page, "Done", 3);
expect(isAtPosition).toBe(true);
```

### getAllWorkflowStateNames

Gets all workflow state names in their current order.

```typescript
import { getAllWorkflowStateNames } from "@utils/selector-helper";

// Get all workflow state names
const stateNames = await getAllWorkflowStateNames(page);
expect(stateNames).toEqual(["Backlog", "In Progress", "Review", "Done"]);
```

## API Monitoring

### setupApiErrorMonitoring

Sets up API error monitoring for all tests in a file.

```typescript
import { setupApiErrorMonitoring } from "@utils/test-helpers";

// Set up API error monitoring
setupApiErrorMonitoring(test);
```

### checkApiErrors

Checks for API errors and attaches an error report to test results.

```typescript
import { checkApiErrors } from "@utils/test-helpers";

// Check for API errors
await checkApiErrors(apiMonitor, testInfo);
```

### ApiMonitor

The ApiMonitor class provides methods for monitoring API responses during tests.

```typescript
// Access the apiMonitor fixture
test("API monitoring example", async ({ page, apiMonitor }) => {
  // Check for API errors
  const hasErrors = await apiMonitor.hasApiErrors();
  expect(hasErrors, "Should not have API errors").toBe(false);

  // Get all API responses
  const allResponses = apiMonitor.getAllResponses();
  console.log(`Captured ${allResponses.length} total API responses`);

  // Get failed responses
  const failedResponses = apiMonitor.getFailedResponses();
  console.log(`Captured ${failedResponses.length} failed API responses`);

  // Get error report
  const errorReport = apiMonitor.getErrorReport();
  console.log(errorReport);

  // Get error summary
  const errorSummary = apiMonitor.getErrorSummary();
  console.log(errorSummary);

  // Reset the monitor
  apiMonitor.reset();
});
```

## Test Fixtures

### loadFixture

Loads a fixture into the test database.

```typescript
import { loadFixture } from "@utils/test-environment";

// Load a fixture
const result = await loadFixture(context, "basic_workflow");
expect(result).not.toBeNull();

// Load a fixture without clearing existing data
const result = await loadFixture(context, "basic_workflow", { clearExisting: false });
```

### listAvailableFixtures

Gets a list of available fixtures.

```typescript
import { listAvailableFixtures } from "@utils/test-environment";

// Get available fixtures
const fixtures = await listAvailableFixtures(context);
console.log(`Available fixtures: ${fixtures.join(", ")}`);
```

## Best Practices

### 1. Use Page Object for User Interactions

Use the JiraAnalyzerPage for high-level user interactions and workflows:

```typescript
// Good: Using page object for user interactions
await jiraAnalyzerPage.createConfiguration(config);
await jiraAnalyzerPage.analyzeMetrics();

// Avoid: Direct page interactions
await page.getByRole("button", { name: "Add Configuration" }).click();
await page.getByLabel("Configuration Name").fill(config.name);
// ...many more steps
```

### 2. Use State Management for Navigation

Use state management utilities to ensure the application is in the correct state:

```typescript
// Good: Using state management
await jiraAnalyzerPage.ensureInMetricsView();

// Avoid: Manual navigation
const metricsTab = page.getByRole("tab", { name: "Metrics" });
if (await metricsTab.isVisible()) await metricsTab.click();
```

### 3. Use Stable Selectors

Use name-based selectors instead of index-based selectors:

```typescript
// Good: Using name-based selectors
await jiraAnalyzerPage.dragWorkflowStateByName("Backlog", "In Progress");

// Avoid: Using index-based selectors
await jiraAnalyzerPage.dragWorkflowState(0, 1);
```

### 4. Check for API Errors

Always check for API errors after key operations:

```typescript
// Good: Checking for API errors
const hasErrors = await apiMonitor.hasApiErrors();
expect(hasErrors, "Should not have API errors").toBe(false);

// Avoid: Not checking for API errors
await jiraAnalyzerPage.analyzeMetrics();
// ... continue without checking for errors
```

### 5. Use Explicit Assertions

Use explicit assertions with descriptive messages:

```typescript
// Good: Explicit assertion with message
expect(result, "Configuration should be created successfully").toBe(true);

// Avoid: Assertion without message
expect(result).toBe(true);
```

### 6. Organize Tests with test.step()

Use test.step() to organize tests into logical steps:

```typescript
// Good: Using test.step()
await test.step("Create a new Jira configuration", async () => {
  // Configuration creation code
});

// Avoid: Using console.log
console.log("Step 1: Create a new Jira configuration");
// Configuration creation code
```

### 7. Clean Up After Tests

Always clean up resources created during tests:

```typescript
// Good: Cleaning up resources
await test.step("Clean up - delete configuration", async () => {
  const deleteResult = await jiraAnalyzerPage.deleteConfiguration(configName);
  expect(deleteResult, "Configuration should be deleted successfully").toBe(true);
});
```

### 8. Initialize Test Environment

Always initialize the test environment before tests:

```typescript
// Good: Initializing test environment
test.beforeEach(async ({ page }) => {
  jiraAnalyzerPage = new JiraAnalyzerPage(page);
  const context = { page };
  await initializeTestEnvironment(context);
  await clearBackendCache(context);
  await resetTestDatabase(context); // Works with both SQLite and PostgreSQL
});
```

### 9. Use Test Fixtures for Predefined Data

Use test fixtures to set up predefined data states:

```typescript
// Good: Using test fixtures
await test.step("Load test data", async () => {
  const result = await loadFixture(context, "workflow_with_metrics");
  expect(result, "Fixture should load successfully").not.toBeNull();
});
```

### 10. Verify UI State After Actions

Always verify the UI state after actions:

```typescript
// Good: Verifying UI state
await jiraAnalyzerPage.analyzeMetrics();
const chartsRendered = await jiraAnalyzerPage.verifyChartsRendered();
expect(chartsRendered, "Charts should be rendered after analysis").toBe(true);
```
