# Test Fixtures

> **Executive Summary:** Our test fixtures system provides a balanced approach to E2E testing, allowing efficient test execution while maintaining test integrity through predefined, realistic database states that can be loaded on demand.

<!--
Last Updated: 11/04/2025
Related Documents:
- [Test Data Management](./test-data.md)
- [E2E Testing](./e2e-testing.md)
- [Test Environment](./test-environment.md)
- [Test Performance](./test-performance.md)
-->

## Table of Contents

- [Overview](#overview)
- [Key Principles](#key-principles)
- [Available Fixtures](#available-fixtures)
- [Using Fixtures in Tests](#using-fixtures-in-tests)
- [Implementation Details](#implementation-details)
- [Security Considerations](#security-considerations)
- [Best Practices](#best-practices)
- [Creating New Fixtures](#creating-new-fixtures)

## Overview

The test fixtures system allows loading predefined database states for testing specific scenarios without having to set up the data through the UI. This approach balances the need for comprehensive end-to-end testing with practical considerations around test execution time and reliability.

Fixtures are only available in test environments and are loaded through a secure API endpoint that is not registered in production environments.

## Key Principles

Our fixtures system is built on four key principles:

### 1. Layered Testing Strategy

- Maintain comprehensive E2E tests for full user journeys
- Use fixtures for focused tests of specific features
- Balance between full-journey tests and fixture-based tests

### 2. Document Fixture Contents

- Each fixture has clear documentation of what it contains
- Fixtures explain what user steps they replace
- Documentation is maintained alongside the fixture code

### 3. Realistic Fixtures

- Fixtures represent realistic application states
- Fixtures are created by capturing the result of actual user flows
- Avoid creating unrealistic data states that wouldn't occur in real usage

### 4. Fixture Validation

- Tests verify fixtures match expected schemas
- Fixtures are updated when the application model changes
- Fixtures are validated before being applied to the database

## Available Fixtures

| Fixture ID              | Description                          | Created Data                                           |
| ----------------------- | ------------------------------------ | ------------------------------------------------------ |
| `basic_workflow`        | Basic workflow configuration         | 1 configuration, 4 workflow states                     |
| `workflow_with_metrics` | Workflow with pre-calculated metrics | 1 configuration, 4 workflow states, 1 metrics analysis |

### basic_workflow

This fixture creates:

- A configuration named "Test Project"
- 4 workflow states:
  - Backlog (position 0)
  - In Progress (position 1, time point)
  - Review (position 2)
  - Done (position 3, time point)

### workflow_with_metrics

This fixture extends `basic_workflow` and adds:

- A metrics analysis with:
  - Date range: 2025-01-01 to 2025-03-31
  - JQL: "project = TEST"
  - Pre-calculated metrics:
    - Issue count: 50
    - Lead time: 15.3 days
    - Cycle time: 8.7 days
    - Throughput: 4.2 issues per week
  - Chart data for lead time, cycle time, and throughput

## Using Fixtures in Tests

The fixtures system provides utility functions in `test-environment.ts` for loading fixtures and listing available fixtures:

```typescript
// Initialize test environment
const context = { page };
await initializeTestEnvironment(context);

// List available fixtures
const fixtures = await listAvailableFixtures(context);
console.log("Available fixtures:", fixtures);

// Load a fixture
const result = await loadFixture(context, "basic_workflow");
if (result) {
  console.log(`Loaded configuration ID: ${result.configuration_id}`);
}
```

### Example Test

Here's an example test that uses the `workflow_with_metrics` fixture:

```typescript
test("should verify metrics using fixture", async ({ page }) => {
  const context = { page };
  const jiraAnalyzerPage = new JiraAnalyzerPage(page);

  // Load the fixture
  const result = await loadFixture(context, "workflow_with_metrics");
  expect(result).toBeTruthy();

  // Navigate to the application
  await jiraAnalyzerPage.goto();

  // Select the configuration
  const configDropdown = page.getByTestId("configuration-select");
  await configDropdown.click();
  await page.getByText("Test Project").click();

  // Navigate to metrics view
  await jiraAnalyzerPage.ensureInMetricsView();

  // Verify metrics are displayed
  const leadTimeMetric = page.getByTestId("lead-time-metric");
  await expect(leadTimeMetric).toBeVisible();

  // Verify chart is rendered
  await jiraAnalyzerPage.verifyChartsRendered();
});
```

## Implementation Details

The fixtures system consists of several components:

1. **Backend Fixtures Module**: Manages fixture registration and loading
2. **Admin Test Router**: Provides secure endpoints for loading fixtures
3. **Test Environment Utilities**: Frontend utilities for interacting with fixtures
4. **Example Tests**: Demonstrate how to use fixtures in tests

### Security Measures

The fixtures system includes multiple layers of security:

1. **Conditional Route Registration**: Test endpoints are only registered when test environment variables are set
2. **Separate Test Router**: Test endpoints are isolated in a dedicated router
3. **Environment Verification**: Every test endpoint verifies it's running in a test environment
4. **Test Header Requirement**: All test endpoints require the `x-test-request` header
5. **Limited Database Operations**: Fixtures use parameterized queries to prevent SQL injection

## Security Considerations

The fixtures system is designed with security in mind:

- Fixtures endpoints are only registered in test environments
- Multiple layers of verification prevent accidental exposure
- Test headers are required for all fixture operations
- Fixtures are validated before being applied to the database
- The fixtures system is completely absent from production deployments

## Best Practices

### When to Use Fixtures

- **Use fixtures when**:

  - Setting up test preconditions through the UI would be too slow
  - You need to test a specific feature in isolation
  - You need consistent data for testing edge cases
  - Your test focuses on a specific part of the application

- **Don't use fixtures when**:
  - The test is specifically verifying the setup flow itself
  - You need to verify the complete end-to-end user journey
  - The fixture would create unrealistic application states

### Balancing Fixture Usage with Full E2E Tests

For each major feature, maintain:

1. At least one full journey test that sets up preconditions through the UI
2. Focused tests using fixtures for comprehensive feature coverage

This approach ensures both the full user journey and specific feature behaviors are tested.

### Maintaining Fixtures

- Update fixtures when the data model changes
- Document what each fixture contains and what user steps it replaces
- Ensure fixtures represent realistic application states
- Validate fixtures before applying them to the database
- Keep fixtures focused on specific testing scenarios

## Creating New Fixtures

To create a new fixture:

1. Implement a fixture loader function in `app/fixtures/`
2. Register the fixture using the `register_fixture` function
3. Document the fixture in this file

Example fixture implementation:

```python
async def load_custom_fixture(options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Load a custom fixture with specific data.

    Args:
        options: Optional parameters for fixture loading.
            - clear_existing: Whether to clear existing data before loading.

    Returns:
        Dict containing the result of the fixture loading operation.
    """
    if options is None:
        options = {}

    clear_existing = options.get("clear_existing", True)

    async with get_async_session() as session:
        if clear_existing:
            # Clear existing data
            await session.execute("DELETE FROM metrics_analysis")
            await session.execute("DELETE FROM workflow_state")
            await session.execute("DELETE FROM configuration")
            await session.commit()

        # Create your fixture data here
        # ...

        return {
            "result_data": "..."
        }

# Register the fixture
register_fixture("custom_fixture", load_custom_fixture)
```
