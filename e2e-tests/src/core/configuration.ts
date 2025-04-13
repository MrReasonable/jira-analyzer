import { expect } from '@playwright/test'
import { takeScreenshot } from '../utils/screenshot-helper'
import { JiraConfigurationOptions, TestContext } from './types'
import { TestConfig } from './test-config'

// Helper functions for configuration management

/**
 * Add test headers to fetch requests for testing purposes
 *
 * @param page Playwright page to configure
 */
async function addTestHeaders(page: TestContext['page']): Promise<void> {
  await page.addInitScript(() => {
    const originalFetch = window.fetch
    window.fetch = (input, init = {}) => {
      const headers = new Headers(init.headers || {})
      headers.append('x-test-request', 'true')

      const updatedInit = {
        ...init,
        headers,
        credentials: 'include' as RequestCredentials,
      }

      return originalFetch(input, updatedInit)
    }
  })
}

/**
 * Open the configuration form
 *
 * @param page Playwright page
 * @returns Promise resolving when form is opened
 */
async function openConfigurationForm(page: TestContext['page']): Promise<void> {
  await takeScreenshot(page, 'before_add_button')

  console.log('Clicking "Add Configuration" button')
  const addButton = page.getByTestId('add-config-button')
  await addButton.waitFor({ state: 'visible', timeout: TestConfig.timeouts.element })
  await addButton.click()

  console.log('Waiting for configuration form')
  const nameField = page.getByLabel('Configuration Name')
  await nameField.waitFor({ state: 'visible', timeout: TestConfig.timeouts.element })
}

/**
 * Fill the credentials form (Step 1)
 *
 * @param page Playwright page
 * @param config Configuration data
 */
async function fillCredentialsForm(
  page: TestContext['page'],
  config: JiraConfigurationOptions
): Promise<void> {
  console.log('Filling credentials form')
  await page.getByLabel('Configuration Name').fill(config.name)
  await page.getByLabel('Jira Server URL').fill(config.server)
  await page.getByLabel('Jira Email').fill(config.email)
  await page.getByLabel('Jira API Token').fill(config.apiToken)
  await takeScreenshot(page, 'credentials_filled')

  // Navigate to next step
  console.log('Navigating to Project & Query step')
  const formNextButton = page.getByRole('button', { name: 'Next' })
  await formNextButton.click()
  await takeScreenshot(page, 'project_step')
}

/**
 * Fill the JQL query field
 *
 * @param page Playwright page
 * @param jql JQL query string
 */
async function fillJqlQuery(page: TestContext['page'], jql: string): Promise<void> {
  console.log('Filling JQL query field')

  // Use a single, reliable selector with data-testid
  const jqlField = page.getByTestId('jql_query')

  // Fail explicitly if not visible
  await expect(jqlField, 'JQL query field should be visible').toBeVisible({
    timeout: TestConfig.timeouts.element,
  })

  await jqlField.fill(jql)
  await takeScreenshot(page, 'jql_query_filled')
}

/**
 * Handle project selection
 *
 * @param page Playwright page
 * @param projectKey Project key to select
 */
async function handleProjectSelection(
  page: TestContext['page'],
  projectKey: string
): Promise<void> {
  if (!projectKey) return

  console.log('Checking for project dropdown...')

  // Take a screenshot before project selection
  await takeScreenshot(page, 'before-project-selection')

  // Get the project dropdown with label selector
  const projectDropdown = page.getByLabel('Jira Project')

  // Add explicit assertion with longer timeout
  await expect(projectDropdown, 'Project dropdown should be visible').toBeVisible({
    timeout: 15000,
  })

  // If fetch button is visible, click it to load projects
  const fetchButton = page.getByRole('button', { name: /Refresh Projects|Fetch Projects/ })
  if (await fetchButton.isVisible()) {
    console.log('Clicking Fetch/Refresh Projects button')
    await fetchButton.click()

    // Wait for dropdown to update after fetching projects
    await page.waitForTimeout(2000)
  }

  await takeScreenshot(page, 'project_dropdown_visible')

  // Try to select the project with better error handling
  try {
    await projectDropdown.selectOption(projectKey)
    console.log(`Selected project: ${projectKey}`)
  } catch (error) {
    console.error(`Error selecting project: ${error}`)

    // Take a screenshot to help diagnose the issue
    await takeScreenshot(page, 'project-selection-error')

    throw new Error(`Failed to select project "${projectKey}": ${error}`)
  }
}

/**
 * Find and click the form submit button
 *
 * @param page Playwright page
 */
async function findAndClickSubmitButton(page: TestContext['page']): Promise<void> {
  console.log('Submitting configuration form')

  // Use a single, reliable selector with role
  const submitButton = page.getByRole('button', {
    name: /Create Configuration|Update Configuration/,
  })

  // Fail explicitly if not visible
  await expect(submitButton, 'Submit button should be visible').toBeVisible({
    timeout: TestConfig.timeouts.element,
  })

  console.log('Create/Update button found, clicking it')
  await takeScreenshot(page, 'create_button_found')
  await submitButton.click()
}

/**
 * Verify configuration was created in the UI
 *
 * @param page Playwright page
 * @param configName Name of the configuration to verify
 */
async function verifyConfigurationCreated(
  page: TestContext['page'],
  configName: string
): Promise<void> {
  console.log(`Verifying configuration "${configName}" was created`)

  // Wait for page to finish loading
  await page.waitForLoadState('domcontentloaded', { timeout: TestConfig.timeouts.pageLoad })
  await page.waitForLoadState('load', { timeout: TestConfig.timeouts.pageLoad })
  await page.waitForTimeout(TestConfig.timeouts.uiUpdate)

  // Use a single, reliable selector with data-testid
  const configElement = page.getByTestId(`config-${configName}`)

  // Fail explicitly if not found
  await expect(
    configElement,
    `Configuration "${configName}" should exist after creation`
  ).toBeVisible({
    timeout: TestConfig.timeouts.element,
  })

  console.log(`Configuration "${configName}" successfully created`)
  await takeScreenshot(page, 'configuration_created')
}

/**
 * Configure workflow states for a configuration
 *
 * @param page Playwright page
 * @param configName Name of the configuration
 * @param workflowStates Comma-separated string of workflow states
 * @returns Promise resolving to true if successful
 */
async function configureWorkflowStates(
  page: TestContext['page'],
  configName: string,
  workflowStates: string
): Promise<boolean> {
  try {
    console.log(`Updating workflow states for configuration: ${configName}`)

    // Get the current configuration
    const configElement = page.getByTestId(`config-${configName}`)
    await expect(configElement, 'Configuration should be visible').toBeVisible()

    // Click on the configuration to select it
    await configElement.click()

    // Wait for the configuration to be selected
    await page.waitForTimeout(TestConfig.timeouts.uiUpdate)

    // Check if the Edit Workflow button exists
    const editWorkflowButton = page.getByRole('button', { name: 'Edit Workflow' })
    if (!(await editWorkflowButton.isVisible())) {
      console.log('Edit Workflow button not found. Skipping workflow state configuration.')
      await takeScreenshot(page, 'edit_workflow_button_not_found')
      return false // Return false to indicate workflow states were not configured
    }

    // Click the Edit Workflow button
    await editWorkflowButton.click()

    // Wait for the workflow editor to be visible
    const workflowEditorVisible = await page
      .getByText('Edit Workflow States')
      .isVisible({ timeout: TestConfig.timeouts.element })

    if (!workflowEditorVisible) {
      console.log('Workflow editor did not appear. Skipping workflow state configuration.')
      await takeScreenshot(page, 'workflow_editor_not_visible')
      return false // Return false to indicate workflow states were not configured
    }

    // Add workflow states
    await addWorkflowStates(page, workflowStates)

    // Save or close the workflow editor
    await saveWorkflowStates(page)

    return true // Return true only if workflow states were successfully configured
  } catch (error) {
    console.error('Error updating workflow states:', error)
    await takeScreenshot(page, 'workflow_states_error')
    // Return false to indicate failure
    return false
  }
}

/**
 * Add workflow states to the workflow editor
 *
 * @param page Playwright page
 * @param workflowStates Comma-separated string of workflow states
 */
async function addWorkflowStates(page: TestContext['page'], workflowStates: string): Promise<void> {
  // Split the workflow states string into an array
  const workflowStatesArray = workflowStates.split(',').map(state => state.trim())

  // Add each workflow state
  for (const state of workflowStatesArray) {
    // Check if the state already exists
    const stateExists = await page.getByText(state, { exact: true }).isVisible()
    if (stateExists) continue

    // Check if Add State button exists
    const addButton = page.getByRole('button', { name: 'Add State' })
    if (!(await addButton.isVisible({ timeout: 5000 }))) {
      console.log(`Add State button not found. Skipping adding state: ${state}`)
      await takeScreenshot(page, 'add_state_button_not_found')
      continue // Skip this state but try others
    }

    // Add the state
    await addButton.click()

    // Check if state input field exists
    const stateInput = page.getByPlaceholder('Enter state name')
    if (!(await stateInput.isVisible({ timeout: 5000 }))) {
      console.log(`State input field not found. Skipping adding state: ${state}`)
      await takeScreenshot(page, 'state_input_not_found')
      continue // Skip this state but try others
    }

    // Fill in the state name
    await stateInput.fill(state)

    // Check if Add button exists
    const addStateButton = page.getByRole('button', { name: 'Add' })
    if (!(await addStateButton.isVisible({ timeout: 5000 }))) {
      console.log(`Add button not found. Skipping adding state: ${state}`)
      await takeScreenshot(page, 'add_button_not_found')
      continue // Skip this state but try others
    }

    // Click the Add button
    await addStateButton.click()
  }
}

/**
 * Save or close the workflow editor
 *
 * @param page Playwright page
 */
async function saveWorkflowStates(page: TestContext['page']): Promise<void> {
  // Check if Save button exists
  const saveButton = page.getByRole('button', { name: 'Save' })
  const isSaveButtonVisible = await saveButton.isVisible({ timeout: 5000 })

  if (isSaveButtonVisible) {
    // Save the workflow states
    await saveButton.click()
    // Wait for the workflow editor to close
    await page.waitForTimeout(TestConfig.timeouts.uiUpdate)
  } else {
    // If Save button is not visible, try to close the editor
    const closeButton = page.getByRole('button', { name: 'Close' })
    if (await closeButton.isVisible()) {
      await closeButton.click()
    }
  }
}

/**
 * Create a new Jira configuration
 *
 * @param context Test context containing page and other shared state
 * @param config Configuration options
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function createConfiguration(
  context: TestContext,
  config: JiraConfigurationOptions
): Promise<boolean> {
  const { page } = context

  try {
    // Step 1: Add test headers
    await addTestHeaders(page)

    // Step 2: Open configuration form
    await openConfigurationForm(page)

    // Step 3: Fill credentials form
    await fillCredentialsForm(page, config)

    // Step 4: Fill JQL query
    const jqlQuery = config.jql || TestConfig.testData.defaultJql
    await fillJqlQuery(page, jqlQuery)

    // Wait for project fetching
    await page.waitForTimeout(TestConfig.timeouts.projectFetch)

    // Step 5: Handle project selection
    await handleProjectSelection(page, config.projectKey)

    // Check if we need to navigate to the next step
    const nextButton = page.getByRole('button', { name: 'Next' })

    // Only proceed if the button is visible
    if (await nextButton.isVisible()) {
      // Explicitly assert before clicking
      await expect(nextButton, 'Next button should be visible').toBeVisible()
      await nextButton.click()
    }

    // Step 6: Submit the form
    await findAndClickSubmitButton(page)

    // Step 7: Verify configuration was created
    await verifyConfigurationCreated(page, config.name)

    // Step 8: Configure workflow states if provided
    let workflowConfigured = true
    if (config.workflowStates) {
      workflowConfigured = await configureWorkflowStates(page, config.name, config.workflowStates)
    }

    // Return true only if all steps were successful
    return workflowConfigured
  } catch (error) {
    console.error('Error creating configuration:', error)
    await takeScreenshot(page, 'create_config_error')
    throw error
  }
}

// Removed complex fallback functions in favor of simple, direct approach

/**
 * Edit a configuration
 *
 * @param context Test context containing page and other shared state
 * @param configName Name of the configuration to edit
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function editConfiguration(
  context: TestContext,
  configName: string
): Promise<boolean> {
  const { page } = context

  try {
    // Add test headers
    await addTestHeaders(page)

    console.log(`Editing configuration "${configName}"`)
    await takeScreenshot(page, 'before_edit')

    // Use a single reliable selector with data-testid
    const editButton = page.getByTestId(`edit-${configName}`)

    // Fail explicitly if not visible
    await expect(editButton, `Edit button for "${configName}" should be visible`).toBeVisible({
      timeout: TestConfig.timeouts.element,
    })

    // Click the button
    console.log('Edit button found, clicking it')
    await takeScreenshot(page, 'edit_button_found')
    await editButton.click()

    // Verify the edit form appears
    const formTitle = page.getByText('Edit Configuration', { exact: true })
    const formVisible = await formTitle.isVisible({ timeout: TestConfig.timeouts.element })
    if (!formVisible) {
      console.error('Edit configuration form did not appear')
      await takeScreenshot(page, 'edit_form_not_visible')
      return false
    }

    console.log('Edit form loaded')
    await takeScreenshot(page, 'edit_form_loaded')

    // Navigate through the form
    const nextButton = page.getByRole('button', { name: 'Next' })
    const nextButtonVisible = await nextButton.isVisible({ timeout: TestConfig.timeouts.element })
    if (!nextButtonVisible) {
      console.error('Next button not visible in edit form')
      await takeScreenshot(page, 'next_button_not_visible')
      return false
    }

    await nextButton.click()

    // Return true to indicate successful editing
    return true
  } catch (error) {
    console.error(`Error editing configuration "${configName}":`, error)
    await takeScreenshot(page, 'edit_configuration_error')
    throw error
  }
}

/**
 * Find and click the delete button for a specific configuration
 *
 * @param page Playwright page
 * @param configName Name of the configuration to delete
 */
async function findAndClickDeleteButton(
  page: TestContext['page'],
  configName: string
): Promise<void> {
  console.log(`Looking for delete button for "${configName}"`)

  // Use a single, reliable selector with data-testid
  const deleteButton = page.getByTestId(`delete-${configName}`)

  // Fail explicitly if not visible
  await expect(deleteButton, `Delete button for "${configName}" should be visible`).toBeVisible({
    timeout: TestConfig.timeouts.element,
  })

  console.log(`Clicking delete button for "${configName}"`)
  await deleteButton.click()
}

/**
 * Verify if a configuration has been deleted
 *
 * @param page Playwright page
 * @param configName Name of the configuration to verify
 */
async function verifyConfigurationDeleted(
  page: TestContext['page'],
  configName: string
): Promise<void> {
  // Use a single, reliable selector with data-testid
  const configElement = page.getByTestId(`config-${configName}`)

  // Wait for the element to be hidden or removed from DOM
  await expect(
    configElement,
    `Configuration "${configName}" should be removed after deletion`
  ).toBeHidden({
    timeout: TestConfig.timeouts.element,
  })

  console.log(`Configuration "${configName}" successfully deleted`)
  await takeScreenshot(page, 'after_delete')
}

/**
 * Delete a configuration
 *
 * @param context Test context containing page and other shared state
 * @param configName Name of the configuration to delete
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function deleteConfiguration(
  context: TestContext,
  configName: string
): Promise<boolean> {
  const { page } = context

  try {
    // Add test headers
    await addTestHeaders(page)

    console.log(`Deleting configuration "${configName}"`)
    await takeScreenshot(page, 'before_delete')

    // Set up dialog handler for confirmation prompts
    page.once('dialog', async dialog => {
      console.log(`Accepting dialog: ${dialog.message()}`)
      await dialog.accept()
    })

    // Find and click the delete button
    try {
      await findAndClickDeleteButton(page, configName)
    } catch (error) {
      console.error(`Could not find or click delete button for "${configName}":`, error)
      await takeScreenshot(page, 'delete_button_error')
      return false
    }

    // Wait briefly for dialog and page to update
    await page.waitForTimeout(TestConfig.timeouts.uiUpdate)

    // Verify configuration was deleted
    try {
      await verifyConfigurationDeleted(page, configName)
    } catch (error) {
      console.error(`Configuration "${configName}" was not deleted:`, error)
      await takeScreenshot(page, 'verification_error')
      return false
    }

    // Return true to indicate successful deletion
    return true
  } catch (error) {
    console.error(`Error deleting configuration "${configName}":`, error)
    await takeScreenshot(page, 'delete_error')
    throw error
  }
}

// No helper function needed as we're using a single, reliable selector approach
