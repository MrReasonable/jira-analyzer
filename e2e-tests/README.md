# Jira Analyzer End-to-End Tests

This directory contains end-to-end tests for the Jira Analyzer application using Playwright.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Install Playwright browsers:

   ```bash
   pnpm run install:browsers
   ```

   Note: The `run-tests.sh` script will automatically check if browsers are installed and install them if needed.

## Running Tests

### Using the run-tests.sh Script (Recommended)

The `run-tests.sh` script handles starting the backend and frontend servers before running the tests, and then cleans up afterward. This is the recommended way to run the tests.

```bash
# Run tests in headless mode
npm run run-tests

# Run tests in headed mode (visible browser)
npm run run-tests:headed

# Run tests in debug mode (with step-by-step debugging)
npm run run-tests:debug
```

From the project root, you can also use the Makefile commands:

```bash
# Run tests in headless mode
make e2e-test

# Run tests in headed mode
make e2e-test-headed

# Run tests in debug mode
make e2e-test-debug
```

### Running Tests Directly (Not Recommended)

These commands run the tests directly without starting the servers. You need to start the backend and frontend servers manually before running these commands.

```bash
# Run tests in headless mode
npm test

# Run tests with UI mode
npm run test:ui

# Run tests in headed mode
npm run test:headed

# Run tests in debug mode
npm run test:debug
```

## Test Structure

The tests are located in the `tests` directory and are organized as follows:

- `jira-analyzer.spec.ts`: Tests the full application workflow, including:
  - Creating a Jira configuration
  - Selecting a configuration
  - Analyzing metrics
  - Deleting a configuration

## Mock Jira Server

The end-to-end tests use a mock Jira server to avoid requiring actual Jira credentials. This makes the tests more reliable and faster, as they don't depend on external services.

The mock Jira server:

- Provides predefined sample data for all Jira API calls
- Simulates issues with different states and dates
- Includes changelogs for cycle time calculation
- Is automatically enabled when running the tests

The mock implementation is in `backend/app/mock_jira.py` and is activated by setting the `USE_MOCK_JIRA` environment variable to `true` in the Docker Compose configuration.

## Configuration

The Playwright configuration is in `playwright.config.ts`. It includes:

- Starting the backend using Docker Compose with mock Jira enabled
- Starting the frontend development server
- Using Chromium as the browser
- Setting timeouts and other test parameters
- Automatically stopping Docker Compose services after tests complete

## Linting and Formatting

This project uses ESLint and Prettier for code quality and formatting:

```bash
# Run linting
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code
npm run format

# Check if code is formatted correctly
npm run format:check
```

From the project root, you can also use the Makefile commands:

```bash
# Run linting
make e2e-lint

# Fix linting issues automatically
make e2e-lint-fix

# Format code
make e2e-format

# Check if code is formatted correctly
make e2e-format-check
```

## CI Integration

To run these tests in CI, you can use the following command:

```bash
CI=true npm test
```

This will:

- Run tests in headless mode
- Not reuse existing servers
- Retry failed tests
