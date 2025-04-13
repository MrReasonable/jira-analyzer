# Test Selector Strategy

<!--
Last Updated: 12/04/2025
Related Documents:
- [E2E Testing](./e2e-testing.md)
- [Test Reliability](./test-reliability.md)
- [E2E Test Utilities](./e2e-test-utilities.md)
- [API Error Monitoring](./api-error-monitoring.md)
-->

> **Executive Summary:** This document defines the selector strategy for end-to-end tests. We follow a single, reliable selector approach with no fallbacks or silent retries. Tests must fail immediately and explicitly when elements cannot be found, as this indicates a real issue that needs addressing.

## Table of Contents

- [Core Principles](#core-principles)
- [Selector Strategy](#selector-strategy)
- [Failure Handling](#failure-handling)
- [Implementation Details](#implementation-details)
- [Prohibited Practices](#prohibited-practices)
- [Examples](#examples)

## Core Principles

1. **Single Reliable Selector**: Each element must be accessed using exactly one consistent, reliable selector.
2. **No Fallbacks**: Never implement multiple selector strategies with fallbacks.
3. **Fail Fast**: Tests must fail immediately when elements cannot be found.
4. **Explicit Assertions**: All assertions must include descriptive messages.
5. **Clear Error Messages**: Error messages should help diagnose the real issue.

## Selector Strategy

### Preferred Selector Hierarchy

1. **data-testid**: The primary and preferred selector method

   ```typescript
   page.getByTestId("element-id");
   ```

2. **Accessibility Role + Name**: For common UI elements without test IDs

   ```typescript
   page.getByRole("button", { name: "Submit" });
   ```

3. **Labels**: For form elements tied to labels

   ```typescript
   page.getByLabel("Configuration Name");
   ```

4. **Text Content**: Only for non-interactive elements

   ```typescript
   page.getByText("Exact text", { exact: true });
   ```

### Naming Conventions for data-testid

- Use kebab-case for all test IDs
- Follow the pattern: `[component-name]-[element-type]-[purpose]`
- Examples:
  - `workflow-state-backlog`
  - `analyze-button`
  - `config-name-input`

## Failure Handling

When elements cannot be found, tests must fail immediately and explicitly. This is a fundamental principle of our testing strategy.

```typescript
// CORRECT: Explicit assertion with timeout and message
await expect(
  page.getByTestId("analyze-button"),
  "Analyze button should be visible after navigation"
).toBeVisible({ timeout: 5000 });

// INCORRECT: Silent failure with fallback
if (
  !(await page
    .getByTestId("analyze-button")
    .isVisible()
    .catch(() => false))
) {
  // Try alternative selector...
}
```

## Implementation Details

### Adding data-testid Attributes

- Add data-testid attributes to all significant elements in the application
- Keep test IDs consistent between related elements
- Document test IDs in component documentation

### Test Helper Functions

- Helper functions should enforce the single selector strategy
- Helpers must not implement fallbacks or silent retries
- Helpers should include proper error handling that fails tests appropriately

## Prohibited Practices

The following practices are strictly prohibited in our end-to-end tests:

### 1. Fallback Selectors

```typescript
// PROHIBITED: Multiple selector strategies with fallbacks
const selectors = ["textarea#jql_query", "input#jql_input", '[data-testid="jql_query"]'];

for (const selector of selectors) {
  const element = page.locator(selector);
  if (await element.isVisible().catch(() => false)) {
    await element.fill(value);
    return true;
  }
}
```

### 2. Silent Retries

```typescript
// PROHIBITED: Silent retry of operations
try {
  await page.getByTestId("element").click();
} catch {
  // Silently try an alternative approach
  await page.getByText("Similar Element").click();
}
```

### 3. Catching Errors to Continue Tests

```typescript
// PROHIBITED: Catching errors to continue tests
try {
  await someOperation();
} catch (error) {
  console.error("Operation failed:", error);
  // Continue with test anyway
}
```

### 4. Index-based Selectors

```typescript
// PROHIBITED: Using index-based selectors
page.locator(".workflow-state-item").nth(3);
```

## Examples

### Good Example: Single Reliable Selector

```typescript
/**
 * Get the JQL query from the input field
 */
export async function getJqlQuery(context: TestContext): Promise<string> {
  const { page } = context;

  // Use a single reliable selector strategy with data-testid
  const jqlInput = page.getByTestId("jql_query");

  // Fail explicitly if not visible
  await expect(jqlInput, "JQL query input should be visible").toBeVisible({
    timeout: TestConfig.timeouts.element,
  });

  return await jqlInput.inputValue();
}
```

### Good Example: Proper Error Handling

```typescript
/**
 * Analyze metrics by clicking the Analyze button
 */
export async function analyzeMetrics(context: TestContext): Promise<void> {
  const { page } = context;

  // Ensure we're in the metrics view
  await ensureInMetricsView(context);

  // Use a single reliable selector strategy
  const analyzeButton = page.getByTestId("analyze-button");

  // Fail explicitly if not visible
  await expect(analyzeButton, "Analyze button should be visible").toBeVisible({
    timeout: TestConfig.timeouts.element,
  });

  await analyzeButton.click();

  // Wait for metrics to load
  await page.waitForTimeout(TestConfig.timeouts.api);

  // Check for metrics section using a single reliable selector
  const metricsSection = page.getByTestId("metrics-section");
  await expect(metricsSection, "Metrics section should be visible after analysis").toBeVisible({
    timeout: TestConfig.timeouts.element,
  });
}
```

### Good Example: Clear Test Steps

```typescript
await test.step("Verify workflow state order", async () => {
  // Get workflow states
  const states = await getAllWorkflowStateNames(page);

  // Make specific assertions with messages
  expect(states.length, "Should have exactly 4 workflow states").toBe(4);
  expect(states[0], "First state should be Backlog").toBe("Backlog");
  expect(states[1], "Second state should be In Progress").toBe("In Progress");
  expect(states[2], "Third state should be Review").toBe("Review");
  expect(states[3], "Fourth state should be Done").toBe("Done");
});
```
