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

> **Note:** As part of our test improvements, we're moving away from screenshot dependencies in tests.
> New tests should use explicit assertions instead of relying on screenshots for verification.
> See [README-TEST-IMPROVEMENTS.md](./README-TEST-IMPROVEMENTS.md) for details.

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
3. Organize test steps using `test.step()` for better readability
4. Use explicit assertions with descriptive messages
5. Prefer stable selectors over index-based or position-based selectors

> **Note:** We're moving away from console logs and screenshots for test flow documentation.
> Instead, use `test.step()` to clearly document test steps and explicit assertions to verify behavior.

### Error Handling

For better test stability:

- Use error handling where appropriate
- Catch and log errors but continue tests when possible
- Take screenshots when errors occur for debugging

## Workflow States Testing

For specific information about workflow states drag-and-drop testing, see [WORKFLOW_STATES_TESTING.md](./WORKFLOW_STATES_TESTING.md).

### Test Improvements

We've made significant improvements to the workflow states testing to reduce complexity and improve reliability:

- **Name-based selectors** instead of index-based selectors
- **Explicit assertions** with descriptive messages
- **Simplified test structure** using `test.step()`
- **Improved drag and drop testing** with better verification

For details on these improvements, see [README-TEST-IMPROVEMENTS.md](./README-TEST-IMPROVEMENTS.md).

### Selector Helpers

The new `selector-helper.ts` utility provides stable selectors for workflow states:

```typescript
// Get a workflow state element by name
getWorkflowStateByName(page, 'In Progress')

// Get a drag handle for a specific state
getWorkflowStateDragHandle(page, 'Backlog')

// Get all workflow state names in their current order
await getAllWorkflowStateNames(page)
```

These helpers make tests more resilient to UI changes and element reordering.

## Jira Charts Testing

The e2e tests include specific tests for verifying the Jira metrics charts functionality:

### Chart Rendering Tests

Located in `tests/jira-charts.spec.ts`, these tests verify:

- All charts (Lead Time, Throughput, WIP, CFD, Cycle Time) render correctly
- Canvas elements are properly created for each chart
- No console errors occur during chart rendering
- Charts handle empty data gracefully

### Chart Error Detection Tests

Located in `tests/jira-charts-errors.spec.ts`, these tests:

- Capture and log all console errors during chart rendering
- Detect network errors that might affect chart data loading
- Log console warnings for debugging purposes
- Verify the presence of chart elements
- Take screenshots at key points for visual verification

These tests help identify issues with chart rendering that might not be apparent in unit tests, such as:

- JavaScript errors in chart initialization
- Network errors when fetching chart data
- DOM-related issues with chart containers
- Visual rendering problems

When charts don't display properly on the frontend, run these tests to help diagnose the issue.
