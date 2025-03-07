import { Page } from '@playwright/test'

/**
 * Page object for the Jira Analyzer application
 */
export class JiraAnalyzerPage {
  constructor(public page: Page) {}

  /**
   * Navigate to the Jira Analyzer application
   */
  async goto() {
    try {
      // Set up request failure logging
      this.page.on('requestfailed', request => {
        console.error(`Request failed: ${request.url()}, ${request.failure()?.errorText}`)
      })

      // Set up console message logging
      this.page.on('console', msg => {
        console.log(`BROWSER CONSOLE ${msg.type()}: ${msg.text()}`)
      })

      console.log('Navigating to application using baseURL configuration')
      // Use baseURL from playwright.config.ts by using relative URL
      const response = await this.page.goto('/', { timeout: 30000 })
      console.log(`Navigation response status: ${response?.status()}`)

      // Wait for page to be fully loaded
      await this.page.waitForLoadState('domcontentloaded', { timeout: 30000 })
      await this.page.waitForLoadState('load', { timeout: 30000 })

      // Wait for content to be loaded instead of using networkidle
      console.log('Waiting for content to be fully loaded')
      await this.page.waitForLoadState('domcontentloaded', { timeout: 20000 }).catch((e: Error) => {
        console.log('Load state timeout, but continuing test:', e.message)
      })

      // Log page title for debugging
      const title = await this.page.title()
      console.log(`Page title: ${title}`)

      // Take a screenshot of the initial page load
      await this.page.screenshot({ path: 'screenshots/00_initial_page_load.png' })

      // Wait for application to be ready by looking for a key element
      console.log('Waiting for Jira Analyzer heading to be visible')
      try {
        // Use getByRole instead of waitForSelector
        await this.page
          .getByRole('heading', { name: 'Jira Analyzer' })
          .waitFor({ state: 'visible', timeout: 15000 })
        console.log('Jira Analyzer heading is visible, application loaded')
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e)
        console.error('Could not find Jira Analyzer heading:', errorMessage)
        // Take screenshot and print page content for debugging
        await this.page.screenshot({ path: 'screenshots/heading_not_found.png' })

        console.log('Page HTML content:')
        const html = await this.page.content()
        console.log(html.substring(0, 1000) + '...')

        throw new Error('Application failed to load - Jira Analyzer heading not found')
      }
    } catch (error) {
      console.error('Error during navigation:', error)
      // Take screenshot of error state
      await this.page.screenshot({ path: 'screenshots/navigation_error.png' })
      throw error
    }
  }

  /**
   * Create a new Jira configuration
   */
  async createConfiguration(config: {
    name: string
    server: string
    email: string
    apiToken: string
    jql: string
    workflowStates: string
    leadTimeStartState: string
    leadTimeEndState: string
    cycleTimeStartState: string
    cycleTimeEndState: string
  }) {
    try {
      console.log('API URL from env:', process.env.VITE_API_URL || 'Not set')
      console.log('Locating and clicking "Add Configuration" button')

      // Take screenshot before trying to find the add button
      await this.page.screenshot({ path: 'screenshots/before_finding_add_button.png' })

      // Wait for the application to be fully loaded and stabilized
      console.log('Waiting for the page to be fully loaded')
      await this.page.waitForLoadState('domcontentloaded', { timeout: 20000 })

      // Output the current HTML for debugging
      console.log('Current page HTML structure:')
      const html = await this.page.content()
      console.log(html.substring(0, 500) + '...')

      console.log('Looking for the Add Configuration button with data-testid attribute')
      const addButton = this.page.getByTestId('add-config-button')

      // Wait for a longer timeout to make sure the button is visible
      await addButton.waitFor({ state: 'visible', timeout: 30000 })

      // Take a screenshot before clicking for reference
      await this.page.screenshot({ path: 'screenshots/before_clicking_add_button.png' })

      console.log('Clicking the Add Configuration button')
      await addButton.click({ timeout: 15000 })

      // Take screenshot after clicking Add Configuration
      await this.page.screenshot({ path: 'screenshots/01_after_add_config_click.png' })

      console.log('Waiting for Configuration Name field')
      const nameField = this.page.getByLabel('Configuration Name')
      await nameField.waitFor({ state: 'visible', timeout: 10000 })

      console.log('Form is visible, filling fields')
      // Log form presence for debugging
      const formExists = await this.page.locator('form').isVisible()
      console.log(`Form is visible: ${formExists}`)

      // Fill in the form fields using more reliable getByLabel selectors
      await nameField.fill(config.name)
      await this.page.getByLabel('Jira Server URL').fill(config.server)
      await this.page.getByLabel('Jira Email').fill(config.email)
      await this.page.getByLabel('Jira API Token').fill(config.apiToken)
      await this.page.getByLabel('Default JQL Query').fill(config.jql)

      // Handle the new workflow states UI
      console.log('Adding workflow states using the new drag-and-drop UI')
      const workflowStatesArray = config.workflowStates.split(',').map(s => s.trim())

      // Add each workflow state
      for (const state of workflowStatesArray) {
        console.log(`Adding workflow state: ${state}`)

        // Fill the new state input
        const stateInput = this.page
          .getByLabel('Add a new workflow state')
          .or(this.page.getByPlaceholder('New state name'))
        await stateInput.fill(state)

        // Take screenshot to debug
        await this.page.screenshot({ path: `screenshots/add_state_${state}.png` })

        // Find the Add button by role and name
        const addStateButton = this.page.getByRole('button', { name: 'Add' })
        await addStateButton.click()

        // Instead of waiting, verify the UI updated by checking for state in dropdown

        // Verify the state was added - using a proper non-ambiguous selector
        console.log(`Verifying state ${state} was added to the workflow states list`)

        // Based on the actual component structure, find the area where the workflow states are listed
        // The component renders a div with overflow-hidden, rounded-md classes for the states list
        // Take a screenshot after adding the state
        await this.page.screenshot({ path: `screenshots/workflow_states_after_${state}.png` })

        // Wait for UI to update using a condition instead of timeout
        await this.page
          .waitForFunction(
            () => {
              // Check if any elements have been added to the workflow states list
              return document.querySelectorAll('[data-testid^="workflow-state-"]').length > 0
            },
            { timeout: 2000 }
          )
          .catch(() => {
            console.log('UI update check timed out, continuing anyway')
          })

        // Look for the state in the form - verify it's in one of the select dropdowns
        // This is more reliable than trying to find it in the drag/drop UI
        console.log(`Verifying state "${state}" was added by checking dropdown options`)

        // Check if the state appears in the Lead Time Start State dropdown
        const startStateDropdown = this.page.getByLabel('Lead Time Start State')
        await startStateDropdown.waitFor({ state: 'visible', timeout: 3000 })

        // Take a screenshot of the form with dropdowns
        await this.page.screenshot({ path: `screenshots/dropdown_after_${state}.png` })

        // Check if the option exists in the dropdown - either use getByRole or try to select it
        const optionExists =
          (await startStateDropdown.locator('option', { hasText: state }).count()) > 0

        if (!optionExists) {
          console.error(`State "${state}" was not found in the Lead Time Start State dropdown`)
          // Capture the current available options for debugging
          const options = await startStateDropdown.locator('option').allInnerTexts()
          console.log(`Available options: ${options.join(', ')}`)
          throw new Error(`Failed to add state "${state}" - not found in dropdown options`)
        }

        console.log(`Successfully verified state "${state}" was added to the workflow states list`)
      }

      // Take a screenshot to see the states list
      await this.page.screenshot({ path: 'screenshots/workflow_states_list.png' })

      console.log('Setting workflow state markers for Lead Time and Cycle Time')

      // Wait for the workflow states to be visible using a condition
      await this.page
        .waitForFunction(
          () => {
            // Check if the dropdown has options
            const dropdown = document.querySelector('select[name="leadTimeStartState"]')
            return dropdown && dropdown.children.length > 0
          },
          { timeout: 2000 }
        )
        .catch(() => {
          console.log('Workflow states load check timed out, continuing anyway')
        })

      // Instead of trying to click Start buttons (which may have different structure),
      // just use the dropdown directly which is more reliable
      console.log(`Setting ${config.leadTimeStartState} as Lead Time start state via dropdown`)

      // Using the dropdown selector for lead time start/end states which is more reliable
      const leadTimeStartDropdown = this.page.getByLabel('Lead Time Start State')
      await leadTimeStartDropdown.selectOption(config.leadTimeStartState)
      console.log(`Selected ${config.leadTimeStartState} from Lead Time Start State dropdown`)

      // Take screenshot after selecting
      await this.page.screenshot({ path: 'screenshots/after_select_lead_time_start.png' })

      // Set end state via dropdown like we did for the start state
      console.log(`Setting ${config.leadTimeEndState} as Lead Time end state via dropdown`)

      // Use dropdown selector for end state
      const leadTimeEndDropdown = this.page.getByLabel('Lead Time End State')
      await leadTimeEndDropdown.selectOption(config.leadTimeEndState)
      console.log(`Selected ${config.leadTimeEndState} from Lead Time End State dropdown`)

      // Take screenshot after selecting
      await this.page.screenshot({ path: 'screenshots/after_select_lead_time_end.png' })

      // Fill in the Cycle Time dropdowns too
      console.log(`Setting Cycle Time states via dropdowns`)
      await this.page.getByLabel('Cycle Time Start State').selectOption(config.cycleTimeStartState)
      await this.page.getByLabel('Cycle Time End State').selectOption(config.cycleTimeEndState)

      // Take screenshot after setting all dropdowns
      await this.page.screenshot({ path: 'screenshots/after_setting_all_state_dropdowns.png' })

      // Take screenshot after filling form
      await this.page.screenshot({ path: 'screenshots/02_after_filling_form.png' })

      console.log('Submitting the form')
      // Use a more reliable selector for the submit button
      const submitButton = this.page.getByRole('button', { name: 'Create Configuration' })
      await submitButton.waitFor({ state: 'visible', timeout: 10000 })

      // Simpler approach: Just click and take a screenshot
      await submitButton.click()

      // Take screenshot after clicking submit
      await this.page.screenshot({ path: 'screenshots/03_after_submit_click.png' })

      // Wait for page to be fully loaded instead of networkidle
      await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 })
      await this.page.waitForLoadState('load', { timeout: 10000 })

      // Verify configuration was created successfully
      console.log('Verifying configuration was saved successfully')

      // Wait for the UI to refresh after form submission
      await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 })
      await this.page.waitForLoadState('load', { timeout: 10000 })

      // Take a screenshot of the current state
      await this.page.screenshot({ path: 'screenshots/04_after_form_submission.png' })

      // No arbitrary wait, just proceed with verification

      // Take another screenshot for debugging
      await this.page.screenshot({ path: 'screenshots/before_verify_config.png' })

      // Check for the presence of our configuration name anywhere on the page
      console.log(`Looking for configuration name "${config.name}" on the page`)

      // Look for the configuration name anywhere on the page
      const configNameText = this.page.getByText(config.name, { exact: false })
      const configFound = (await configNameText.count()) > 0

      if (configFound) {
        console.log(`Configuration "${config.name}" successfully created and found in the list`)
      } else {
        console.error(`Configuration "${config.name}" not found on the page after submission`)
        // Try to capture any visible content for debugging
        const pageContent = await this.page.content()
        console.log('Current page content:', pageContent.substring(0, 1000) + '...')
        throw new Error(`Configuration "${config.name}" was not found after form submission`)
      }
    } catch (error) {
      console.error('Error in createConfiguration:', error)
      // Take screenshot of error state
      await this.page.screenshot({ path: 'screenshots/error_create_config.png' })
      throw error
    }
  }

  /**
   * Get the JQL query from the input field
   */
  async getJqlQuery(): Promise<string> {
    console.log('Getting JQL query')
    // Use label to find the JQL input
    const jqlInput = this.page.getByLabel('JQL Query', { exact: true })
    await jqlInput.waitFor({ state: 'visible', timeout: 5000 })
    const value = await jqlInput.inputValue()
    console.log(`JQL query: ${value}`)
    return value
  }

  /**
   * Set the JQL query in the input field
   */
  async setJqlQuery(jql: string) {
    console.log(`Setting JQL query to: ${jql}`)
    // Use label to find the JQL input
    const jqlInput = this.page.getByLabel('JQL Query', { exact: true })
    await jqlInput.waitFor({ state: 'visible', timeout: 5000 })
    // Check if input is disabled (read-only) and try clicking it first
    const isDisabled = await jqlInput.isDisabled()
    if (isDisabled) {
      // Find the edit button near the JQL input
      const editButton = this.page.getByRole('button', { name: 'Edit Query' })
      if (await editButton.isVisible()) {
        await editButton.click()
        // Use waitForFunction instead of waitForTimeout
        await this.page.waitForFunction(
          () =>
            document.activeElement !== null &&
            document.activeElement.tagName.toLowerCase() === 'input'
        )
      }
    }
    await jqlInput.fill(jql)
    console.log('JQL query set successfully')
  }

  /**
   * Analyze metrics by clicking the Analyze button
   */
  async analyzeMetrics() {
    console.log('Analyzing metrics')
    // Use a button with a specific aria-label
    const analyzeButton = this.page.getByRole('button', { name: 'Analyze', exact: true })

    // Wait for button with longer timeout and debug message
    console.log('Waiting for analyze button to be visible...')
    try {
      await analyzeButton.waitFor({ state: 'visible', timeout: 15000 })
    } catch (error) {
      console.error('Analyze button not found:', error)
      await this.page.screenshot({ path: 'screenshots/analyze_button_not_found.png' })
      throw new Error('Analyze button not found or not visible')
    }

    // Click the button
    await analyzeButton.click()
    console.log('Analyze button clicked successfully')

    // Take screenshot after clicking Analyze
    await this.page.screenshot({ path: 'screenshots/05_after_analyze_click.png' })

    // Wait for the Lead Time Analysis header which should appear after metrics load
    try {
      // Look for the Lead Time Analysis header which appears after data is loaded
      await this.page
        .getByRole('heading', { name: 'Lead Time Analysis', exact: true })
        .waitFor({ state: 'visible', timeout: 10000 })

      // Also check if there's a canvas element which indicates chart rendering
      const canvasCount = await this.page.locator('canvas').count()
      console.log(`Found ${canvasCount} canvas elements on the page`)

      // Take a screenshot to show metrics loaded
      await this.page.screenshot({ path: 'screenshots/metrics_loaded.png' })

      console.log('Metrics content detected successfully')
    } catch (error) {
      console.error('Failed to detect metrics content:', error)
      await this.page.screenshot({ path: 'screenshots/metrics_content_not_found.png' })

      // Get what's currently on the page for debugging
      const headings = await this.page.locator('h1, h2, h3').allTextContents()
      console.log('Found headings on page:', headings)

      throw new Error('Failed to detect metrics after clicking analyze button')
    }

    // Take screenshot after metrics loaded
    await this.page.screenshot({ path: 'screenshots/06_after_metrics_loaded.png' })
  }

  /**
   * Delete the configuration
   * @param configName Optional configuration name to delete a specific configuration
   */
  async deleteConfiguration(configName?: string) {
    console.log('Deleting configuration')
    // Set up dialog handler before clicking the Delete button
    this.page.on('dialog', dialog => {
      console.log(`Accepting dialog: ${dialog.message()}`)
      dialog.accept()
    })

    try {
      // First, capture the configuration name that's currently visible
      // This will be used to verify it's gone after deletion
      const configItems = await this.page
        .locator('table tr, .config-item, [data-testid="config-item"]')
        .allTextContents()
      const visibleConfigNames = configItems.filter(text => text.trim().length > 0)
      console.log('Visible configurations before delete:', visibleConfigNames)

      // Find the configuration to delete
      let targetConfig = configName

      // If no specific config name was provided, get the first visible one
      if (!targetConfig && visibleConfigNames.length > 0) {
        // Extract the config name from the visible text
        const match = visibleConfigNames[0].match(/([^\s]+)/)
        if (match) targetConfig = match[0]
      }

      console.log(`Target config to delete: ${targetConfig || 'unknown'}`)

      // Use proper role-based selectors to find the delete button
      const deleteButtons = this.page.getByRole('button', { name: 'Delete' })
      const deleteCount = await deleteButtons.count()
      console.log(`Found ${deleteCount} delete buttons`)

      let deleteButton

      if (targetConfig && deleteCount > 0) {
        // Find the delete button associated with our config
        for (let i = 0; i < deleteCount; i++) {
          const btn = deleteButtons.nth(i)
          // Get the row text to check if it contains our target config
          const rowText = await btn.locator('..').textContent()
          if (rowText && rowText.includes(targetConfig)) {
            deleteButton = btn
            console.log(`Found delete button for configuration "${targetConfig}"`)
            break
          }
        }
      }

      // If we couldn't find a specific button, fall back to the first one
      if (!deleteButton) {
        deleteButton = deleteButtons.first()
        console.log(`Using first available delete button`)
      }

      console.log('Waiting for delete button to be visible...')
      try {
        await deleteButton.waitFor({ state: 'visible', timeout: 10000 })
      } catch (error) {
        console.error('Delete button not found or not visible:', error)
        await this.page.screenshot({ path: 'screenshots/delete_button_not_found.png' })
        throw new Error('Delete button not found or not visible')
      }

      if (await deleteButton.isVisible()) {
        await deleteButton.click()
        console.log('Delete button clicked successfully')
      } else {
        console.log('Delete button not visible')
        await this.page.screenshot({ path: 'screenshots/delete_button_not_visible.png' })
        throw new Error('Delete button not visible')
      }

      // Take a screenshot after delete attempt
      await this.page.screenshot({ path: 'screenshots/07_after_delete.png' })

      // Wait for page to be fully loaded instead of networkidle
      await this.page.waitForLoadState('domcontentloaded', { timeout: 5000 })
      await this.page.waitForLoadState('load', { timeout: 5000 })

      // Wait for UI to stabilize - check for some stable element being visible
      try {
        await this.page
          .getByTestId('add-config-button')
          .waitFor({ state: 'visible', timeout: 10000 })
      } catch (error) {
        console.error('Add Configuration button not found after deletion:', error)
        await this.page.screenshot({ path: 'screenshots/add_button_not_found_after_deletion.png' })
        throw new Error('UI did not stabilize after deletion - Add Configuration button not found')
      }

      // Verify configuration is no longer visible by checking if the previously visible configs are gone
      // or if "No configurations" message is now shown
      console.log('Verifying configuration was deleted...')

      // Wait for the page to be fully loaded instead of using timeout and networkidle
      await this.page.waitForLoadState('domcontentloaded', { timeout: 5000 })
      await this.page.waitForLoadState('load', { timeout: 5000 })

      // Take another screenshot to see the current state
      await this.page.screenshot({ path: 'screenshots/08_after_delete_verification.png' })

      // Look specifically for a message indicating no configurations or an empty state
      const noConfigsMessage = this.page
        .getByText(/no configurations|empty|create your first/i)
        .or(this.page.locator('[data-testid="empty-configs"]'))
        .or(this.page.locator('.empty-state'))

      let noConfigsVisible = false
      try {
        noConfigsVisible = await noConfigsMessage.isVisible({ timeout: 2000 })
      } catch (error) {
        console.error('Error checking for "no configurations" message:', error)
        await this.page.screenshot({ path: 'screenshots/no_configs_check_error.png' })
        // We won't throw here as we'll try other verification methods
      }

      if (noConfigsVisible) {
        console.log('No configurations message visible, deletion confirmed')
        return // Success - we're done
      }

      // Check if the specific deleted configuration is still visible
      const deletedConfigElement = this.page.getByTestId(`config-${targetConfig}`)
      const isDeletedConfigStillVisible = await deletedConfigElement
        .isVisible({ timeout: 1000 })
        .catch(() => false)

      if (isDeletedConfigStillVisible) {
        console.log(`Configuration "${targetConfig}" is still visible in the UI after deletion`)
        throw new Error('Configuration still visible after deletion')
      }

      // To be thorough, also check all visible config items
      const currentConfigItems = await this.page
        .locator('table tr, .config-item, [data-testid^="config-"]')
        .allTextContents()
        .catch(() => [])
      console.log('Configurations after delete:', currentConfigItems)

      // If we have fewer configurations than before, that's a good sign
      if (currentConfigItems.length < visibleConfigNames.length) {
        console.log('Fewer configurations visible, deletion likely successful')
      } else {
        // If we still have the same number, let's check if any of the specific ones are gone
        for (const prevConfig of visibleConfigNames) {
          const stillExists = currentConfigItems.some(curr => curr.includes(prevConfig))
          if (stillExists) {
            console.log(`Configuration "${prevConfig}" still exists after deletion attempt`)
            throw new Error('Configuration still visible after deletion')
          }
        }
      }

      console.log('Delete operation successfully verified')
    } catch (e: Error | unknown) {
      console.error('Error in deleteConfiguration:', e)
      await this.page.screenshot({ path: 'screenshots/delete_error.png' })
      throw e
    }
  }
}
