import { test, expect } from '@playwright/test'
import { JiraAnalyzerPage } from '@pages/jira-analyzer-page'
import { TestConfig } from '@core/test-config'
import { getAllWorkflowStateNames } from '@utils/selector-helper'

// Set timeout from TestConfig
test.setTimeout(TestConfig.timeouts.test)

test.describe('Workflow States During Configuration Creation', () => {
  let jiraAnalyzerPage: JiraAnalyzerPage

  test.beforeEach(async ({ page }) => {
    jiraAnalyzerPage = new JiraAnalyzerPage(page)
  })

  test('Should allow adding and reordering workflow states during configuration creation', async ({
    page,
  }) => {
    // Use a unique configuration name with timestamp to avoid conflicts
    const configName = `WorkflowTest_${new Date().getTime()}`

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
        jql: TestConfig.testData.defaultJql,
        projectKey: TestConfig.testData.defaultProjectKey,
        workflowStates: TestConfig.testData.defaultWorkflowStates.join(','),
        leadTimeStartState: 'Backlog',
        leadTimeEndState: 'Done',
        cycleTimeStartState: 'In Progress',
        cycleTimeEndState: 'Done',
      })

      expect(result, 'Configuration should be created successfully').toBe(true)
    })

    await test.step('Edit the configuration to access workflow states', async () => {
      const result = await jiraAnalyzerPage.editConfiguration(configName)
      expect(result, 'Should be able to edit the configuration').toBe(true)

      // Verify the workflow editor is visible
      await expect(
        page.getByText('Edit Workflow States'),
        'Workflow editor should be visible'
      ).toBeVisible()
    })

    await test.step('Verify all workflow states are present', async () => {
      // Check if all states are added in the dropdown
      const startStateDropdown = page.getByLabel('Lead Time Start State')
      await expect(
        startStateDropdown,
        'Lead Time Start State dropdown should be visible'
      ).toBeVisible()

      const options = await startStateDropdown.locator('option').allInnerTexts()

      // Verify all expected states are present
      for (const state of TestConfig.testData.defaultWorkflowStates) {
        expect(options, `Dropdown should contain the "${state}" state`).toContain(state)
      }
    })

    await test.step('Test drag and drop functionality', async () => {
      // Get all workflow state names before drag
      const statesBefore = await getAllWorkflowStateNames(page)
      expect(statesBefore.length, 'Should have workflow states to drag').toBeGreaterThanOrEqual(2)

      // Perform the drag operation using state names
      const dragResult = await jiraAnalyzerPage.dragWorkflowStateByName('Backlog', 'In Progress')

      // Verify the drag operation was successful
      expect(dragResult, 'Drag operation should change the order of states').toBe(true)

      // Get all workflow state names after drag
      const statesAfter = await getAllWorkflowStateNames(page)

      // Verify the states are in a different order
      expect(
        JSON.stringify(statesBefore),
        'State order should be different after drag operation'
      ).not.toEqual(JSON.stringify(statesAfter))
    })

    await test.step('Set state markers and close the form', async () => {
      // Set Lead Time start and end states
      await page.getByLabel('Lead Time Start State').selectOption('Backlog')
      await page.getByLabel('Lead Time End State').selectOption('Done')

      // Set Cycle Time start and end states
      await page.getByLabel('Cycle Time Start State').selectOption('In Progress')
      await page.getByLabel('Cycle Time End State').selectOption('Done')

      // Close the dialog
      const closeButton = page.getByRole('button', { name: 'Close' })
      await closeButton.click()

      // Verify the dialog is closed
      await expect(
        page.getByText('Edit Workflow States'),
        'Workflow editor should be closed'
      ).toBeHidden()
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
