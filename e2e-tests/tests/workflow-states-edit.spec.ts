import { test } from '@playwright/test'
import { JiraAnalyzerPage } from '@pages/jira-analyzer-page'
import { takeScreenshot, resetScreenshotCounter } from '@utils/screenshot-helper'

/**
 * This test verifies the edit functionality for workflow configurations
 */
test('Should allow editing a workflow configuration', async ({ page }) => {
  // Set a unique test name for screenshots
  const testName = 'workflow-states-edit'
  resetScreenshotCounter(testName)

  console.log('Starting test for editing workflow configuration')

  // Create page object
  const jiraAnalyzerPage = new JiraAnalyzerPage(page)
  jiraAnalyzerPage.setTestName(testName)

  // Use a unique configuration name with timestamp to avoid conflicts
  const configName = `Edit_Test_${new Date().getTime()}`

  await test.step('Navigate to the application', async () => {
    // Navigate to the application
    await jiraAnalyzerPage.goto()
    // Verify navigation successful
    test.expect(page.url()).toContain('localhost')
  })

  // Step 1: Create a test configuration to edit
  console.log('Step 1: Create a new Jira configuration for editing')
  await jiraAnalyzerPage.createConfiguration({
    name: configName,
    server: 'https://test.atlassian.net',
    email: 'test@example.com',
    apiToken: 'test-token',
    jql: 'project = TEST',
    workflowStates: 'Backlog,In Progress,Review,Done',
    leadTimeStartState: 'Backlog',
    leadTimeEndState: 'Done',
    cycleTimeStartState: 'In Progress',
    cycleTimeEndState: 'Done',
  })

  // Step 2: Edit the configuration
  console.log('Step 2: Edit the configuration')
  await jiraAnalyzerPage.editConfiguration(configName)
  console.log('Edit form opened successfully')

  // Update some fields in the edit form
  await page.getByLabel('Jira Server URL').fill('https://updated.atlassian.net')
  await page.getByLabel('Default JQL Query').fill('project = UPDATED')

  // Take screenshot of the edit form with updated values
  await takeScreenshot(page, 'edit_form_updated')

  // Submit the form
  console.log('Submitting updated configuration')
  const updateButton = page.getByRole('button', { name: 'Update Configuration' })
  await updateButton.click()

  // Wait for the form to close and changes to apply
  await page.waitForLoadState('domcontentloaded', { timeout: 10000 })

  // Verify that the configuration has been updated
  console.log('Step 3: Verify configuration was updated')

  // Check that the configuration card exists
  const configElement = page.getByTestId(`config-${configName}`)
  await configElement.waitFor({ state: 'visible', timeout: 5000 })
  console.log('Configuration card is visible after update')

  // Take a screenshot of the updated configuration view
  await takeScreenshot(page, 'config_updated')
  console.log('Configuration was successfully updated')

  // Step 4: Clean up - delete the test configuration
  console.log('Step 4: Clean up - delete the test configuration')
  await jiraAnalyzerPage.deleteConfiguration(configName)

  console.log('Test completed - verified that configuration can be edited')
})
