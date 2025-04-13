import { test, expect } from '@playwright/test'
import { JiraAnalyzerPage } from '@pages/jira-analyzer-page'
import { TestConfig } from '@core/test-config'

// Set a reasonable timeout
test.setTimeout(60000)

test.describe('Workflow States Drag and Drop Functionality', () => {
  let jiraAnalyzerPage: JiraAnalyzerPage

  test.beforeEach(async ({ page }) => {
    jiraAnalyzerPage = new JiraAnalyzerPage(page)
  })

  test('Should allow reordering workflow states via drag and drop', async ({ page }) => {
    // Use a unique configuration name with timestamp to avoid conflicts
    const configName = `DragTest_${new Date().getTime()}`

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
        jql: 'project = TEST AND type = Story',
        projectKey: 'TEST',
        workflowStates: 'Backlog,In Progress,Review,Done',
        leadTimeStartState: 'Backlog',
        leadTimeEndState: 'Done',
        cycleTimeStartState: 'In Progress',
        cycleTimeEndState: 'Done',
      })

      // Explicit assertion instead of implicit expectation
      expect(result, 'Configuration should be created successfully').toBe(true)
    })

    // Verify the configuration was created and navigate to edit view
    await test.step('Edit the configuration to access workflow states', async () => {
      const result = await jiraAnalyzerPage.editConfiguration(configName)
      expect(result, 'Should be able to edit the configuration').toBe(true)
    })

    // Attempt drag operation using state names instead of indices
    await test.step('Drag "In Progress" state to the position of "Review"', async () => {
      // Get all workflow state names before drag
      const statesBefore = await page.locator('.workflow-state-item').allTextContents()

      // Perform the drag operation using state names
      const dragResult = await jiraAnalyzerPage.dragWorkflowStateByName('In Progress', 'Review')

      // Verify the drag operation was successful
      expect(dragResult, 'Drag operation should change the order of states').toBe(true)

      // Get all workflow state names after drag
      const statesAfter = await page.locator('.workflow-state-item').allTextContents()

      // Verify the states are in a different order
      expect(
        JSON.stringify(statesBefore),
        'State order should be different after drag operation'
      ).not.toEqual(JSON.stringify(statesAfter))
    })

    // Save the changes to the configuration
    await test.step('Save configuration changes', async () => {
      const updateButton = page.getByRole('button', { name: 'Update Configuration' })
      await updateButton.click()

      // Wait for the update to complete
      await page.waitForLoadState('domcontentloaded', { timeout: TestConfig.timeouts.pageLoad })
    })

    // Clean up - delete the test configuration
    await test.step('Clean up - delete test configuration', async () => {
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
