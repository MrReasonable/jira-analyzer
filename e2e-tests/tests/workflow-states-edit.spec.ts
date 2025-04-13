import { test, expect } from '@playwright/test'
import { JiraAnalyzerPage } from '@pages/jira-analyzer-page'
import { TestConfig } from '@core/test-config'

/**
 * This test verifies the edit functionality for workflow configurations
 * Using the optimized page object pattern with explicit assertions
 */
// Tag this test as fast for filtering
test.describe('Workflow States Edit Tests @fast', () => {
  let jiraAnalyzerPage: JiraAnalyzerPage

  test.beforeEach(async ({ page }) => {
    jiraAnalyzerPage = new JiraAnalyzerPage(page)
  })

  test('Should allow editing a workflow configuration', async ({ page }) => {
    // Use a unique configuration name with timestamp to avoid conflicts
    const configName = `Edit_Test_${new Date().getTime()}`

    await test.step('Navigate to the application', async () => {
      await jiraAnalyzerPage.goto()
      expect(page.url()).toContain('localhost')
    })

    await test.step('Create a new Jira configuration', async () => {
      const result = await jiraAnalyzerPage.createConfiguration({
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

      expect(result, 'Configuration should be created successfully').toBe(true)
    })

    await test.step('Edit the configuration', async () => {
      const result = await jiraAnalyzerPage.editConfiguration(configName)
      expect(result, 'Should be able to edit the configuration').toBe(true)

      // Update fields
      await page.getByLabel('Jira Server URL').fill('https://updated.atlassian.net')
      await page.locator('textarea#jql_query').fill('project = UPDATED')

      // Submit the form
      await page.getByRole('button', { name: 'Update Configuration' }).click()
      await page.waitForLoadState('domcontentloaded', { timeout: TestConfig.timeouts.pageLoad })

      // Verify the configuration was updated
      const configElement = page.getByTestId(`config-${configName}`)
      await expect(configElement, 'Updated configuration should be visible').toBeVisible()
    })

    await test.step('Clean up - delete the test configuration', async () => {
      const deleteResult = await jiraAnalyzerPage.deleteConfiguration(configName)
      expect(deleteResult, 'Configuration should be deleted successfully').toBe(true)

      // Verify the configuration is no longer visible
      const configExists = await page
        .getByTestId(`config-${configName}`)
        .isVisible()
        .catch(() => false)

      expect(configExists, 'Configuration should no longer be visible').toBe(false)
    })
  })
})
