# Workflow States Testing Guide

This document outlines the testing approach for the workflow states functionality in the Jira Analyzer application.

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

These improvements enhance both the user experience and the testability of the application by allowing users to modify configurations after creation.
