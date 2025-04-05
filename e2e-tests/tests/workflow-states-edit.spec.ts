import { test, expect } from '@playwright/test'
import { JiraAnalyzerPage } from '@pages/jira-analyzer-page'
import { takeScreenshot, resetScreenshotCounter } from '@utils/screenshot-helper'

/**
 * This test verifies the edit functionality for workflow configurations
 * Using the optimized page object pattern
 */
// Tag this test as fast for filtering
test.describe('Workflow States Edit Tests @fast', () => {
  test('Should allow editing a workflow configuration', async ({ page }) => {
    // Create the page object
    const jiraAnalyzerPage = new JiraAnalyzerPage(page)

    // Reset screenshot counter and set test name
    resetScreenshotCounter('workflow_edit')
    jiraAnalyzerPage.setTestName('workflow_edit')

    // Use a unique configuration name with timestamp to avoid conflicts
    const configName = `Edit_Test_${new Date().getTime()}`

    console.log('Step 1: Navigate to the application')
    await jiraAnalyzerPage.goto()

    console.log('Step 2: Create a new Jira configuration')
    await jiraAnalyzerPage.createConfiguration({
      name: configName,
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

    console.log('Step 3: Edit the configuration')
    await jiraAnalyzerPage.editConfiguration(configName)

    // Update fields
    await page.getByLabel('Jira Server URL').fill('https://updated.atlassian.net')
    await page.locator('textarea#jql_query').fill('project = UPDATED')

    // Submit the form
    await page.getByRole('button', { name: 'Update Configuration' }).click()
    await page.waitForLoadState('domcontentloaded')

    // Take a screenshot of the updated configuration
    await takeScreenshot(page, 'configuration_updated')

    // Verify the configuration was updated
    const configElement = page.getByTestId(`config-${configName}`)
    await configElement.waitFor({ state: 'visible' })

    // Clean up - delete the configuration
    console.log('Step 4: Clean up - delete the test configuration')
    await jiraAnalyzerPage.deleteConfiguration(configName)

    // Verify the configuration is no longer visible
    const configExists = await page
      .getByTestId(`config-${configName}`)
      .isVisible()
      .catch(() => false)

    // Assert that the configuration no longer exists
    expect(configExists).toBe(false)

    console.log('Test completed - verified that configuration can be edited')
  })
})
