# E2E Tests Source Directory

This directory contains the source code for the E2E test execution framework. The code has been refactored to follow
functional programming principles and to separate test execution code from the actual test definitions.

## Directory Structure

- **src/**: Contains all the test execution code

  - **core/**: Core functionality modules
    - **types.ts**: Common type definitions
    - **navigation.ts**: Page navigation functions
    - **configuration.ts**: Configuration management functions
    - **jql.ts**: JQL query management functions
    - **workflow-states.ts**: Workflow state management functions
  - **pages/**: Page object models
    - **jira-analyzer-page.ts**: Page object for the Jira Analyzer application
  - **utils/**: Utility functions
    - **screenshot-helper.ts**: Screenshot management functions
  - **index.ts**: Exports all modules for easy importing

- **tests/**: Contains the actual test definitions
  - **jira-analyzer.spec.ts**: Basic application tests
  - **workflow-states-creation.spec.ts**: Tests for workflow state creation
  - **workflow-states-drag-drop.spec.ts**: Tests for workflow state drag and drop
  - **workflow-states-edit.spec.ts**: Tests for workflow state editing

## Design Principles

1. **Functional Composition**: The code has been refactored to use functional composition
   instead of class inheritance. This makes the code more modular and easier to test.

2. **Separation of Concerns**: Test execution code is separated from test definitions.
   This makes it easier to maintain and extend the tests.

3. **Immutability**: State is managed through closures and immutable data structures where possible.

4. **Pure Functions**: Functions are designed to be pure, with minimal side effects.

## Usage

To use the test execution framework in your tests:

```typescript
import { JiraAnalyzerPage } from '@pages/jira-analyzer-page'
import { takeScreenshot, resetScreenshotCounter } from '@utils/screenshot-helper'

// Create a page object
const jiraAnalyzerPage = new JiraAnalyzerPage(page)

// Set the test name for screenshots
jiraAnalyzerPage.setTestName('my-test')
resetScreenshotCounter('my-test')

// Navigate to the application
await jiraAnalyzerPage.goto()

// Create a configuration
await jiraAnalyzerPage.createConfiguration({
  name: 'My Config',
  server: 'https://test.atlassian.net',
  email: 'test@example.com',
  apiToken: 'test-token',
  jql: 'project = TEST',
  workflowStates: 'Backlog,In Progress,Done',
  leadTimeStartState: 'Backlog',
  leadTimeEndState: 'Done',
  cycleTimeStartState: 'In Progress',
  cycleTimeEndState: 'Done',
})

// Take a screenshot
await takeScreenshot(page, 'configuration-created')
```
