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
      // Add browser network debugging
      this.page.on('request', request => {
        console.log(`Browser request: ${request.method()} ${request.url()}`)
      })

      this.page.on('response', response => {
        console.log(`Browser response: ${response.status()} for ${response.url()}`)
      })

      this.page.on('requestfailed', request => {
        console.error(`Request failed: ${request.url()}, ${request.failure()?.errorText}`)
      })

      console.log('Navigating to application using baseURL configuration')
      // Use baseURL from playwright.config.ts by using relative URL
      const response = await this.page.goto('/', { timeout: 20000 })
      console.log(`Navigation response status: ${response?.status()}`)

      // Wait for page to be fully loaded
      await this.page.waitForLoadState('domcontentloaded', { timeout: 20000 })
      await this.page.waitForLoadState('load', { timeout: 20000 })

      // Log page title for debugging
      const title = await this.page.title()
      console.log(`Page title: ${title}`)
    } catch (error) {
      console.error('Error during navigation:', error)
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
      const addButton = this.page.getByRole('button', { name: 'Add Configuration' })
      await addButton.waitFor({ state: 'visible', timeout: 10000 })
      await addButton.click()

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
      await this.page.getByLabel('Workflow States').fill(config.workflowStates)
      await this.page.getByLabel('Lead Time Start State').fill(config.leadTimeStartState)
      await this.page.getByLabel('Lead Time End State').fill(config.leadTimeEndState)
      await this.page.getByLabel('Cycle Time Start State').fill(config.cycleTimeStartState)
      await this.page.getByLabel('Cycle Time End State').fill(config.cycleTimeEndState)

      // Take screenshot after filling form
      await this.page.screenshot({ path: 'screenshots/02_after_filling_form.png' })

      console.log('Submitting the form')
      // Use a more reliable selector for the submit button
      const submitButton = this.page.getByRole('button', { name: 'Create Configuration' })
      await submitButton.waitFor({ state: 'visible', timeout: 10000 })
      await submitButton.click()

      // Take screenshot after clicking submit
      await this.page.screenshot({ path: 'screenshots/03_after_submit_click.png' })

      // Wait for configuration to be saved and verify it appears in the list
      console.log('Waiting for configuration to appear in the list')
      await this.page.waitForLoadState('domcontentloaded', { timeout: 20000 })

      // Wait for a stable element to be visible - using more specific selector
      console.log('Waiting for Saved Configurations heading')
      const heading = this.page.getByRole('heading', { name: 'Saved Configurations' })
      await heading.waitFor({ state: 'visible', timeout: 10000 })

      console.log('Waiting for configuration name to appear')
      await this.page.getByText(config.name).waitFor({ state: 'visible', timeout: 10000 })

      // Take screenshot of the saved configuration
      await this.page.screenshot({ path: 'screenshots/04_after_submission.png' })
      console.log('Configuration successfully created')
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
    // Now we can use the label selector since we've fixed the ambiguity in the HTML markup
    const jqlInput = this.page.getByLabel('JQL Query')
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
    // Now we can use the label selector since we've fixed the ambiguity in the HTML markup
    const jqlInput = this.page.getByLabel('JQL Query')
    await jqlInput.waitFor({ state: 'visible', timeout: 5000 })
    await jqlInput.fill(jql)
    console.log('JQL query set successfully')
  }

  /**
   * Analyze metrics by clicking the Analyze button
   */
  async analyzeMetrics() {
    console.log('Analyzing metrics')
    await this.page.getByRole('button', { name: 'Analyze' }).click()

    // Take screenshot after clicking Analyze
    await this.page.screenshot({ path: 'screenshots/05_after_analyze_click.png' })

    // Wait for the metrics to load
    await this.page.getByText('Analytics').waitFor({ state: 'visible', timeout: 10000 })

    // Take screenshot after metrics loaded
    await this.page.screenshot({ path: 'screenshots/06_after_metrics_loaded.png' })
  }

  /**
   * Delete the configuration
   */
  async deleteConfiguration() {
    console.log('Deleting configuration')
    // Set up dialog handler before clicking the Delete button
    this.page.on('dialog', dialog => dialog.accept())

    // Click the Delete button
    await this.page.getByRole('button', { name: 'Delete' }).click()

    // Take a screenshot after delete
    await this.page.screenshot({ path: 'screenshots/07_after_delete.png' })

    // Wait for deletion to complete
    await this.page.waitForLoadState('domcontentloaded')
    // Wait for UI to stabilize - check for some stable element like a heading or the add button
    await this.page.getByRole('button', { name: 'Add Configuration' }).waitFor({ state: 'visible' })
  }
}
