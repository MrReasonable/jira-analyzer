# Workflow States Testing

> **Executive Summary:** Our workflow states testing approach verifies the drag-and-drop functionality and state management during both configuration creation and editing, with comprehensive screenshot organization and recent improvements to the edit functionality.

<!--
Last Updated: 11/04/2025
Related Documents:
- [E2E Testing](./e2e-testing.md)
- [Test Environment](./test-environment.md)
- [Features: Workflow Editor](../features/workflow-editor.md)
-->

## Table of Contents

- [Current Testing Implementation](#current-testing-implementation)
- [Screenshot Organization](#screenshot-organization)
- [Recent Improvements](#recent-improvements)
- [Test Strategies](#test-strategies)
- [Common Issues](#common-issues)

## Current Testing Implementation

We have identified that workflow states drag-and-drop functionality exists in the application and is accessible
during both the initial configuration creation process and when editing an existing configuration.

We have implemented the following tests:

1. **Original Test (`workflow-states-drag-drop.spec.ts`)**

   - Verifies the drag-and-drop functionality during configuration creation
   - Tests the complete workflow state management process

2. **Creation Test (`workflow-states-creation.spec.ts`)**

   - Specifically tests the workflow states drag-and-drop during the configuration creation process
   - Tests the complete drag-and-drop functionality without submitting the form
   - Provides visual evidence of the drag-and-drop working

3. **Edit Test (`workflow-states-edit.spec.ts`)**
   - Tests the ability to edit an existing configuration
   - Verifies that configuration details can be updated
   - Ensures changes are saved correctly

## Screenshot Organization

We've implemented a comprehensive screenshot organization system:

- Each test has its own dedicated folder named after the test
- Screenshots are automatically numbered with incrementing prefixes
- All test files and page objects use the same screenshot helper utility

## Recent Improvements

The following improvements have been implemented:

1. **Added "Edit" Button to ConfigurationList Component**

   - An Edit button has been added next to the existing Select/Delete buttons
   - The button has appropriate styling and a pencil icon
   - Each button has a data-testid attribute (e.g., `edit-${config.name}`) for testing

2. **Added Edit Handler in useJiraConfigurations Hook**

   - Added `configToEdit` state to store the configuration being edited
   - Added `handleConfigEdit` function to fetch and prepare the configuration for editing
   - Connected the edit functionality to the existing form

3. **Updated ConfigurationForm to Handle Edit Mode**

   - The form now checks for an existing configuration and handles updates appropriately
   - The form title changes based on whether it's in create or edit mode
   - The form properly populates all fields with existing configuration values when editing

4. **Added E2E Testing for Edit Functionality**
   - Created `editConfiguration` method in the JiraAnalyzerPage class
   - Added a new test file `workflow-states-edit.spec.ts` to verify edit functionality
   - Test creates a configuration, edits it, verifies the changes, and cleans up

## Test Strategies

When testing workflow states, we follow these strategies:

1. **Isolated Testing**

   - Test workflow state functionality in isolation from other features
   - Create dedicated test configurations for workflow state tests
   - Clean up test data after each test

2. **Visual Verification**

   - Take screenshots before and after drag operations
   - Verify the visual order of workflow states
   - Ensure the UI reflects the expected state

3. **Data Verification**

   - Verify that the workflow state order is saved correctly
   - Check that lead time and cycle time states are properly set
   - Ensure the backend receives the correct workflow state data

4. **Error Handling**
   - Test error scenarios (e.g., duplicate state names)
   - Verify error messages are displayed correctly
   - Ensure the form prevents invalid submissions

## Common Issues

When working with workflow state tests, be aware of these common issues:

1. **Drag and Drop Timing**

   - Drag and drop operations can be flaky in headless mode
   - Use appropriate waits and verification steps
   - Consider using the `force: true` option for drag operations

2. **State Order Verification**

   - Always verify the order of states after drag operations
   - Use the `getAllWorkflowStateNames` helper function
   - Compare arrays of state names rather than individual elements

3. **Form Submission**
   - Ensure the form is submitted after making changes
   - Verify that changes are persisted to the backend
   - Check that the UI reflects the updated state after submission
