# Jira Analyzer E2E Tests

This directory contains end-to-end tests for the Jira Analyzer application using Playwright.

## Organization

- `tests/` - Contains all test specs
  - `pages/` - Page object models used by the tests
  - `utils/` - Utility functions used across tests

## Running Tests

To run the tests, use:

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

This will:

1. Start the backend and frontend services with Docker
2. Run the tests with Playwright
3. Stop the services when done

### Debug vs. No-Debug Mode

By default, tests run without debug logs for cleaner output. This is suitable for CI environments and regular test runs.

When running without debug logs:

1. Playwright API debug logs are disabled
2. Frontend logger is set to "none" mode (completely disables logs)
3. Browser console messages are suppressed
4. Console output is significantly reduced

When running with debug logs (using `make e2e-test-debug`):

1. Playwright API debug logs are enabled
2. Frontend logger is set to verbose mode
3. All browser console messages are displayed
4. Detailed output is shown for debugging issues

## Screenshot Organization

The tests use a consistent screenshot organization system:

### Screenshot Helper Utility

We use a screenshot helper utility (`tests/utils/screenshot-helper.ts`) that provides the following features:

- **Test-Specific Folders**: Each test's screenshots are saved in a dedicated folder
- **Auto-Incrementing Numbers**: Screenshots are prefixed with incrementing numbers (01*, 02*, etc.)
- **Consistent API**: All tests use the same screenshot helper functions

### Usage

```typescript
import { takeScreenshot, resetScreenshotCounter } from './utils/screenshot-helper'

// In the beforeEach hook
test.beforeEach(async ({ page }) => {
  // Set the screenshot folder name based on the test
  resetScreenshotCounter('my_test_name')
})

// During a test
await takeScreenshot(page, 'descriptive_name')
```

### Output Structure

Screenshots are organized with this structure:

```sh
screenshots/
  test_name_1/
    01_initial_page_load.png
    02_form_filled.png
    03_after_submission.png
  test_name_2/
    01_navigation.png
    02_action_performed.png
    ...
```

## Test Structure Guidelines

### Page Object Model

We follow the Page Object Model pattern:

- Page interactions are encapsulated in classes in the `pages/` directory
- Tests use these page objects rather than directly interacting with elements
- This makes tests more maintainable and readable

### Test Organization

Each test file should:

1. Have a descriptive name ending with `.spec.ts`
2. Use a `describe` block to group related tests
3. Reset the screenshot counter in `beforeEach` with a specific test name
4. Include detailed test steps with console logs
5. Use appropriate assertions to verify expected behaviors

### Error Handling

For better test stability:

- Use error handling where appropriate
- Catch and log errors but continue tests when possible
- Take screenshots when errors occur for debugging

## Workflow States Testing

For specific information about workflow states drag-and-drop testing, see [WORKFLOW_STATES_TESTING.md](./WORKFLOW_STATES_TESTING.md).
