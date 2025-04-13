import { expect, Page } from '@playwright/test'
import { TestContext, JiraConfigurationOptions } from './types'
import { TestConfig } from './test-config'

/**
 * Ensures a configuration exists with the given name
 * If the configuration doesn't exist, it creates one
 *
 * @param context Test context containing page and other shared state
 * @param config Configuration options
 * @returns Promise resolving when the configuration exists and is selected
 */
export async function ensureConfigurationExists(
  context: TestContext,
  config: JiraConfigurationOptions
): Promise<void> {
  const { page } = context

  // Check if configuration already exists
  if (await checkExistingConfiguration(page, config.name)) {
    return
  }

  // Create new configuration following the multi-step process
  await createNewConfiguration(page, config)
}

/**
 * Checks if a configuration with the given name already exists
 * If it exists, selects it
 *
 * @param page Playwright page
 * @param configName Name of the configuration to check
 * @returns Promise resolving to true if configuration exists, false otherwise
 */
async function checkExistingConfiguration(page: Page, configName: string): Promise<boolean> {
  // Use a reliable selector to check if configuration exists
  const existingConfig = page.getByTestId(`config-${configName}`)

  // Check if it's visible without using try/catch
  const isVisible = await existingConfig.isVisible({ timeout: 2000 })

  if (isVisible) {
    // Configuration exists, select it
    await existingConfig.click()
    return true
  }

  return false
}

/**
 * Creates a new configuration with the given details
 *
 * @param page Playwright page
 * @param config Configuration options
 * @returns Promise resolving when the configuration is created
 */
async function createNewConfiguration(page: Page, config: JiraConfigurationOptions): Promise<void> {
  // 1. Click add configuration button
  const addButton = page.getByTestId('add-config-button')
  await expect(addButton, 'Add configuration button should be visible').toBeVisible()
  await addButton.click()

  // 2. Fill credentials in step 1
  await fillCredentialsStep(page, config)

  // 3. Navigate to and fill project and JQL in step 2
  await fillProjectAndJqlStep(page, config)

  // 4. Submit the form
  await submitConfigurationForm(page)

  // 5. Verify creation
  await verifyConfigurationCreated(page, config.name)
}

/**
 * Fills the credentials step of the configuration form
 *
 * @param page Playwright page
 * @param config Configuration options
 */
async function fillCredentialsStep(page: Page, config: JiraConfigurationOptions): Promise<void> {
  await page.getByLabel('Configuration Name').fill(config.name)
  await page.getByLabel('Jira Server URL').fill(config.server)
  await page.getByLabel('Jira Email').fill(config.email)
  await page.getByLabel('Jira API Token').fill(config.apiToken)

  // Navigate to Step 2
  await page.getByRole('button', { name: 'Next' }).click()
}

/**
 * Handles the project selection and JQL query step
 *
 * @param page Playwright page
 * @param config Configuration options
 */
async function fillProjectAndJqlStep(page: Page, config: JiraConfigurationOptions): Promise<void> {
  await handleProjectSelection(page, config.projectKey)
  await handleJqlField(page, config)
}

/**
 * Handles project selection with explicit verification and no fallbacks
 *
 * @param page Playwright page
 * @param projectKey Project key to select
 */
async function handleProjectSelection(page: Page, projectKey: string): Promise<void> {
  console.log('Checking for project dropdown...')

  // Get the project dropdown and fetch button
  const projectDropdown = page.getByLabel('Jira Project')
  const fetchButton = page.getByRole('button', { name: 'Fetch Projects' })

  // If fetch button is visible, click it to load projects
  if (await fetchButton.isVisible()) {
    console.log('Clicking Fetch Projects button')
    await fetchButton.click()
  }

  // Wait for and verify the dropdown is visible
  await expect(projectDropdown, 'Project dropdown should be visible').toBeVisible({
    timeout: TestConfig.timeouts.element,
  })

  console.log('Project dropdown is now visible')
  await projectDropdown.selectOption(projectKey)
}

/**
 * Handles the JQL field filling with explicit assertions
 *
 * @param page Playwright page
 * @param config Configuration options
 */
async function handleJqlField(page: Page, config: JiraConfigurationOptions): Promise<void> {
  // Get the JQL field with a single reliable selector
  const jqlField = page.getByTestId('jql_query')

  // Explicitly verify the field is visible
  await expect(jqlField, 'JQL query field should be visible').toBeVisible({
    timeout: TestConfig.timeouts.element,
  })

  // Fill the JQL query
  await jqlField.fill(config.jql || `project = ${config.projectKey || 'TEST'} AND type = Story`)
}

/**
 * Submits the configuration form using a single reliable selector
 *
 * @param page Playwright page
 */
async function submitConfigurationForm(page: Page): Promise<void> {
  // Use a single, reliable selector with role
  const submitButton = page.getByRole('button', {
    name: /Create Configuration|Update Configuration/,
  })

  // Fail explicitly if not visible
  await expect(submitButton, 'Submit button should be visible').toBeVisible({
    timeout: TestConfig.timeouts.element,
  })

  console.log('Create/Update button found, clicking it')
  await submitButton.click()
}

/**
 * Verifies that the configuration appears in the list after creation
 *
 * @param page Playwright page
 * @param configName Name of the configuration to verify
 */
async function verifyConfigurationCreated(page: Page, configName: string): Promise<void> {
  // First, make sure we're at the configurations list view
  await page.waitForLoadState('domcontentloaded', { timeout: TestConfig.timeouts.pageLoad })
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
}

/**
 * Ensures the application is in the metrics view where the analyze button exists
 *
 * @param context Test context containing page and other shared state
 * @returns Promise resolving when the application is in the metrics view
 */
export async function ensureInMetricsView(
  context: TestContext,
  createConfigIfNeeded: boolean = true
): Promise<void> {
  const { page } = context

  try {
    // Take a screenshot to see the current state
    await page.screenshot({ path: 'screenshots/before-metrics-view.png' })

    // Check if we're already in the metrics view by looking for the analyze button
    const analyzeButton = page.getByTestId('analyze-button')

    // Check if the analyze button is already visible with a short timeout
    const isAnalyzeButtonVisible = await analyzeButton.isVisible({ timeout: 2000 })

    if (isAnalyzeButtonVisible) {
      console.log('Already in metrics view, analyze button is visible')
      return
    }

    // Try to navigate to metrics view using the tab
    const metricsTab = page.getByRole('tab', { name: 'Metrics' })

    // Add explicit assertion with screenshot
    const isMetricsTabVisible = await metricsTab.isVisible({ timeout: 5000 })
    await page.screenshot({ path: 'screenshots/metrics-tab-check.png' })

    if (isMetricsTabVisible) {
      console.log('Metrics tab found, clicking it')
      await metricsTab.click()
      await page.waitForTimeout(2000)

      // Verify navigation was successful with longer timeout
      await expect(
        analyzeButton,
        'Analyze button should be visible after navigation to metrics view'
      ).toBeVisible({ timeout: 10000 })

      return
    }

    // If metrics tab isn't available, we may need a configuration first
    if (createConfigIfNeeded) {
      console.log('Creating configuration to enable metrics view')
      await page.screenshot({ path: 'screenshots/before-create-config.png' })

      // Create a new configuration with default test values
      await ensureConfigurationExists(context, {
        name: `TestConfig_${Date.now()}`,
        server: 'https://test.atlassian.net',
        email: 'test@example.com',
        apiToken: 'test-token',
        jql: 'project = TEST',
        projectKey: 'TEST',
        workflowStates: 'Backlog,In Progress,Review,Done',
        leadTimeStartState: 'Backlog',
        leadTimeEndState: 'Done',
        cycleTimeStartState: 'In Progress',
        cycleTimeEndState: 'Done',
      })

      // After creating configuration, try metrics tab again
      await page.screenshot({ path: 'screenshots/after-create-config.png' })

      if (await metricsTab.isVisible({ timeout: 5000 })) {
        console.log('Metrics tab now visible after creating configuration')
        await metricsTab.click()
        await page.waitForTimeout(2000)

        // Verify navigation was successful with longer timeout
        await expect(
          analyzeButton,
          'Analyze button should be visible after navigation to metrics view'
        ).toBeVisible({ timeout: 10000 })

        return
      }
    }

    // If we still don't have access to metrics view, throw an error with clear message
    await page.screenshot({ path: 'screenshots/metrics-view-failed.png' })
    throw new Error(
      'Could not navigate to metrics view - metrics tab not found or navigation failed'
    )
  } catch (error) {
    // Re-throw the error with a clear message
    console.error('Failed to ensure metrics view:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to navigate to metrics view: ${errorMessage}`)
  }
}

/**
 * Ensures the application is in the workflow editor
 *
 * @param context Test context containing page and other shared state
 * @returns Promise resolving when the application is in the workflow editor
 */
export async function ensureInWorkflowEditor(
  context: TestContext,
  createConfigIfNeeded: boolean = true
): Promise<void> {
  const { page } = context

  try {
    // Take a screenshot to see the current state
    await page.screenshot({ path: 'screenshots/before-workflow-editor.png' })

    // Check if we're already in the workflow editor
    const workflowEditor = page.getByText('Edit Workflow States')

    // Check if workflow editor is already visible with a longer timeout
    const isEditorVisible = await workflowEditor.isVisible({ timeout: 2000 })

    if (isEditorVisible) {
      console.log('Already in workflow editor')
      return
    }

    // If not in workflow editor, we need to navigate to it
    // First ensure we have a configuration selected
    if (createConfigIfNeeded) {
      console.log('Creating configuration to enable workflow editor')
      await page.screenshot({ path: 'screenshots/before-create-config-for-workflow.png' })

      // Create a new configuration with default test values
      await ensureConfigurationExists(context, {
        name: `TestConfig_${Date.now()}`,
        server: 'https://test.atlassian.net',
        email: 'test@example.com',
        apiToken: 'test-token',
        jql: 'project = TEST',
        projectKey: 'TEST',
        workflowStates: 'Backlog,In Progress,Review,Done',
        leadTimeStartState: 'Backlog',
        leadTimeEndState: 'Done',
        cycleTimeStartState: 'In Progress',
        cycleTimeEndState: 'Done',
      })

      await page.screenshot({ path: 'screenshots/after-create-config-for-workflow.png' })
    }

    // Navigate to the workflow editor with a single reliable selector
    const editWorkflowButton = page.getByRole('button', { name: 'Edit Workflow' })

    // Take a screenshot to see if the button is visible
    await page.screenshot({ path: 'screenshots/edit-workflow-button-check.png' })

    // Fail explicitly if button is not visible with a longer timeout
    await expect(editWorkflowButton, 'Edit Workflow button should be visible').toBeVisible({
      timeout: 10000,
    })

    // Click the button
    await editWorkflowButton.click()

    // Wait for UI to update
    await page.waitForTimeout(1000)

    // Take a screenshot after clicking the button
    await page.screenshot({ path: 'screenshots/after-edit-workflow-click.png' })

    // Verify that we've successfully navigated to the workflow editor with a longer timeout
    await expect(
      workflowEditor,
      'Workflow editor should be visible after clicking Edit Workflow'
    ).toBeVisible({ timeout: 10000 })
  } catch (error) {
    // Take a screenshot to help diagnose the issue
    await page.screenshot({ path: 'screenshots/workflow-editor-error.png' })

    // Re-throw the error with a clear message
    console.error('Failed to ensure workflow editor:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to navigate to workflow editor: ${errorMessage}`)
  }
}
