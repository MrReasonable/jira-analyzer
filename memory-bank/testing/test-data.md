# Test Data Management

> **Executive Summary:** Our test data management strategy includes predefined fixtures for efficient E2E test execution, data factories for dynamic test data generation, and a balanced approach to test isolation and database seeding.

<!--
Last Updated: 11/04/2025
Related Documents:
- [E2E Testing](./e2e-testing.md)
- [Test Environment](./test-environment.md)
- [Test Fixtures](./test-fixtures.md)
- [Test Performance](./test-performance.md)
-->

## Table of Contents

- [Data Management Approaches](#data-management-approaches)
- [Fixture System](#fixture-system)
- [Data Factories](#data-factories)
- [Test Isolation](#test-isolation)
- [Jira Test Data](#jira-test-data)
- [Best Practices](#best-practices)

## Data Management Approaches

We use several complementary approaches to manage test data:

1. **UI-Based Setup**: Full E2E tests that set up data through the UI
2. **Fixture Loading**: Predefined database states for focused testing
3. **Data Factories**: Runtime generation of test data
4. **Mock API Responses**: Simulated external system responses

Each approach has specific use cases and trade-offs that are detailed below.

## Fixture System

Our fixture system provides predefined database states for efficient test execution. For detailed information, see [Test Fixtures](./test-fixtures.md).

Key benefits of the fixture system:

- **Faster test execution** by skipping lengthy setup steps
- **Consistent test data** across test runs
- **Complex scenario testing** with specific edge cases
- **Reduced test flakiness** with less UI interaction

## Data Factories

For tests that need dynamically generated data, we use factory functions that create consistent test objects:

```typescript
// Example factory function for creating a test configuration
function createTestConfiguration(overrides = {}) {
  return {
    name: `Test Config ${Date.now()}`,
    jiraUrl: "https://example.atlassian.net",
    projectKey: "TEST",
    username: "test-user",
    apiToken: "test-token",
    isCloud: true,
    ...overrides,
  };
}
```

## Test Isolation

To ensure tests are independent and don't interfere with each other:

1. **Reset Database**: Use `resetInMemoryDatabase()` to start with a clean state
2. **Clear Cache**: Use `clearBackendCache()` to avoid cached responses
3. **Isolated Fixtures**: Each fixture creates its own isolated data set
4. **Test-Specific Data**: Use unique identifiers for test data

## Jira Test Data

For Jira integration testing:

1. **Mock Jira Client**: The `USE_MOCK_JIRA=true` environment variable enables a mock Jira client
2. **Predefined Responses**: Mock responses are defined for common Jira API calls
3. **Realistic Data**: Mock data resembles real Jira data structures
4. **Consistent Results**: Mock responses are deterministic for reliable testing

## Best Practices

1. **Choose the Right Approach**:

   - Use UI-based setup for testing the setup flow itself
   - Use fixtures for testing specific features that require complex setup
   - Use data factories for simple, dynamic test data

2. **Maintain Test Independence**:

   - Each test should start with a known state
   - Tests should not depend on data created by other tests
   - Use `beforeEach` hooks to reset or prepare test state

3. **Balance Realism and Performance**:

   - Test data should resemble production data
   - Consider test execution time when designing data setup
   - Use fixtures for complex setup that would be slow through the UI

4. **Document Test Data**:
   - Document the purpose and structure of test data
   - Update fixtures when data models change
   - Use helper functions to encapsulate data creation logic
