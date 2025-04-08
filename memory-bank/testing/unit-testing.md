# Unit Testing

## Overview

Unit testing in the Jira Analyzer project focuses on validating the behavior of individual units of code in isolation. Our approach emphasizes testing the contract (inputs and outputs) rather than implementation details, allowing for more maintainable and less brittle tests.

## Testing Framework

- **Testing Libraries**: We use Vitest for unit tests, which provides fast, parallel test execution
- **Test Runner Configuration**: Configured in `vitest.config.ts` with TypeScript integration
- **Code Coverage Tools**: Vitest includes built-in coverage reporting
- **Mocking Libraries**:
  - axios-mock-adapter for API testing
  - vi.mock() for module mocking
  - MSW (Mock Service Worker) for more complex API mocking scenarios

## Directory Structure

- **Test File Organization**: Tests are co-located with the source files they test
  - Source file: `src/api/jiraApi.ts`
  - Test file: `src/api/jiraApi.test.ts`
- **Naming Conventions**:
  - Regular test files: `*.test.ts` or `*.test.tsx`
  - Special test cases: `*.specific-scenario.test.ts` (e.g., `LeadTimeChart.empty-data.test.tsx`)

## Writing Effective Tests

### Test Structure

We follow the Arrange-Act-Assert (AAA) pattern:

```typescript
it("should fetch projects with the given config name", async () => {
  // Arrange (Setup)
  mockAxios
    .onGet("/jira/projects", { params: { config_name: "test-config" } })
    .reply(200, mockProjects);

  // Act (Execute)
  const result = await jiraApi.getProjects("test-config");

  // Assert (Verify)
  expect(result).toEqual(mockProjects);
});
```

### Behavior vs. Implementation Testing

We prioritize testing the behavior of functions rather than implementation details:

✅ **DO**: Test inputs and outputs

```typescript
// Test what the function returns
expect(result).toEqual(mockResponse);
```

❌ **DON'T**: Test implementation details

```typescript
// Don't test that a function called a specific logger method
expect(logger.info).toHaveBeenCalledWith("Some message");
```

### Mocking Approaches

- **External Dependencies**: Always mock external dependencies like APIs
- **HTTP Requests**: Use axios-mock-adapter to intercept and mock HTTP requests
- **Module Mocks**: Use vi.mock() for internal dependencies that aren't the focus of the test

Example with axios-mock-adapter:

```typescript
let mockAxios: MockAdapter;

beforeEach(() => {
  mockAxios = new MockAdapter(api);
  vi.clearAllMocks();
});

afterEach(() => {
  mockAxios.reset();
});

it("should call the correct endpoint with credentials", async () => {
  // Setup a mock response for the specific endpoint and parameters
  mockAxios.onPost("/validate-credentials", mockCredentials).reply(200, {
    status: "success",
    message: "Credentials valid",
  });

  // Test the function that makes the API call
  const result = await jiraApi.validateCredentials(mockCredentials);

  // Verify the result matches what we expect
  expect(result).toEqual({ status: "success", message: "Credentials valid" });
});
```

### Test for Success and Failure Paths

Always test both the happy path and error handling:

```typescript
it("should handle validation errors correctly", async () => {
  // Setup - simulate a 401 error
  mockAxios.onPost("/validate-credentials").reply(401, {
    error: "Invalid credentials",
  });

  // Execute & Verify the error is thrown
  await expect(jiraApi.validateCredentials(mockCredentials)).rejects.toThrow();
});
```

### Use Realistic Test Data

Mock data should match the actual API response format:

```typescript
const mockProjects = [
  { key: "TEST", name: "Test Project" },
  { key: "DEV", name: "Development Project" },
];
```

## Best Practices

1. **Test Behavior, Not Implementation**

   - Focus on inputs and outputs
   - Avoid testing private methods or implementation details
   - Don't test that logging occurred

2. **Mock External Dependencies**

   - Create controlled test environments
   - Use appropriate mocking tools for different scenarios
   - Reset mocks between tests

3. **Test Both Success and Error Paths**

   - Verify successful operations work as expected
   - Ensure errors are properly caught and handled
   - Test edge cases (empty data, invalid inputs, etc.)

4. **Use Realistic Test Data**

   - Mock data should match actual API responses
   - Keep test data consistent with real-world scenarios
   - Update test data when API contracts change

5. **Keep Assertions Focused**

   - Test one thing per test case
   - Use specific assertions rather than generic ones
   - Ensure test failures are clear and actionable

6. **Maintain Test Independence**
   - Tests should not depend on each other
   - Reset state between tests
   - Avoid shared mutable state

## Running Tests

### Commands and Options

- Run all tests: `npm test`
- Run specific test file: `npm test src/api/jiraApi.test.ts`
- Run with coverage: `npm test -- --coverage`
- Run in watch mode: `npm test -- --watch`

### CI Integration

- Tests run automatically on pull requests
- Code coverage reports are generated and stored
- Failed tests block PR merges
