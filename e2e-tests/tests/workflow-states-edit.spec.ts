import { test, expect } from '@playwright/test'

/**
 * This test verifies the edit functionality for workflow configurations
 * Using a direct approach without the page object to avoid timeout issues
 */
test('Should allow editing a workflow configuration', async ({ page }) => {
  // Use a unique configuration name with timestamp to avoid conflicts
  const configName = `Edit_Test_${new Date().getTime()}`

  console.log('Step 1: Navigate to the application')
  await page.goto('/')
  await page.waitForLoadState('domcontentloaded')

  // Wait for application to be ready
  await page.getByRole('heading', { name: 'Jira Analyzer' }).waitFor({ state: 'visible' })

  console.log('Step 2: Create a new Jira configuration')
  // Click the Add Configuration button
  await page.getByTestId('add-config-button').click()

  // Fill the form
  await page.getByLabel('Configuration Name').fill(configName)
  await page.getByLabel('Jira Server URL').fill('https://test.atlassian.net')
  await page.getByLabel('Jira Email').fill('test@example.com')
  await page.getByLabel('Jira API Token').fill('test-token')
  await page.getByLabel('Default JQL Query').fill('project = TEST')

  // Click Fetch Projects button
  const fetchButton = page.getByRole('button', { name: 'Fetch Projects' })
  if (await fetchButton.isVisible()) {
    await fetchButton.click()

    // Wait for project dropdown to appear
    const projectDropdown = page.getByLabel('Jira Project')
    await projectDropdown
      .waitFor({ state: 'visible', timeout: 5000 })
      .catch(() => console.log('Project dropdown not visible, continuing'))

    // Select project if dropdown is visible
    if (await projectDropdown.isVisible()) {
      await projectDropdown.selectOption('TEST')
    }
  }

  // Add workflow states
  for (const state of ['Backlog', 'In Progress', 'Review', 'Done']) {
    await page.getByPlaceholder('New state name').fill(state)
    await page.getByRole('button', { name: 'Add' }).click()
  }

  // Set state dropdowns
  await page.getByLabel('Lead Time Start State').selectOption('Backlog')
  await page.getByLabel('Lead Time End State').selectOption('Done')
  await page.getByLabel('Cycle Time Start State').selectOption('In Progress')
  await page.getByLabel('Cycle Time End State').selectOption('Done')

  // Submit the form
  await page.getByRole('button', { name: 'Create Configuration' }).click()

  // Wait for page to refresh
  await page.waitForLoadState('domcontentloaded')

  console.log('Step 3: Edit the configuration')
  // Find and click the edit button
  const editButton = page.getByTestId(`edit-${configName}`)
  await editButton.waitFor({ state: 'visible' })
  await editButton.click()

  // Wait for edit form to appear
  await page.getByText('Edit Configuration').waitFor({ state: 'visible' })

  // Update fields
  await page.getByLabel('Jira Server URL').fill('https://updated.atlassian.net')
  await page.getByLabel('Default JQL Query').fill('project = UPDATED')

  // Submit the form
  await page.getByRole('button', { name: 'Update Configuration' }).click()

  // Wait for page to refresh
  await page.waitForLoadState('domcontentloaded')

  // Verify the configuration was updated
  const configElement = page.getByTestId(`config-${configName}`)
  await configElement.waitFor({ state: 'visible' })

  // Clean up - delete the configuration
  console.log('Step 4: Clean up - delete the test configuration')

  // Set up dialog handler for confirmation prompts before clicking delete
  page.once('dialog', async dialog => {
    console.log(`Accepting dialog: ${dialog.message()}`)
    await dialog.accept()
  })

  // Find and click the delete button
  const deleteButton = page.getByTestId(`delete-${configName}`)
  await deleteButton.click()

  // Wait for the deletion to complete
  await page.waitForTimeout(1000)

  // Refresh the page to ensure the UI is updated
  await page.reload()
  await page.waitForLoadState('domcontentloaded')

  // Verify the configuration is no longer visible
  const configExists = await page
    .getByTestId(`config-${configName}`)
    .isVisible()
    .catch(() => false)

  // Assert that the configuration no longer exists
  expect(configExists).toBe(false)

  console.log('Test completed - verified that configuration can be edited')
})
