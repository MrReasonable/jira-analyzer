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
    await this.page.goto('http://localhost:3000')
    await this.page.waitForLoadState('domcontentloaded')
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
    // Click the "Add Configuration" button
    await this.page.getByRole('button', { name: 'Add Configuration' }).click()

    // Fill in the form fields
    await this.page.getByLabel('Configuration Name').fill(config.name)
    await this.page.getByLabel('Jira Server URL').fill(config.server)
    await this.page.getByLabel('Jira Email').fill(config.email)
    await this.page.getByLabel('Jira API Token').fill(config.apiToken)
    await this.page.getByLabel('JQL Query').fill(config.jql)
    await this.page.getByLabel('Workflow States').fill(config.workflowStates)
    await this.page.getByLabel('Lead Time Start State').fill(config.leadTimeStartState)
    await this.page.getByLabel('Lead Time End State').fill(config.leadTimeEndState)
    await this.page.getByLabel('Cycle Time Start State').fill(config.cycleTimeStartState)
    await this.page.getByLabel('Cycle Time End State').fill(config.cycleTimeEndState)

    // Submit the form
    await this.page.getByRole('button', { name: 'Save' }).click()

    // Wait for the configuration to be saved
    await this.page.getByText(config.name).waitFor({ state: 'visible' })
  }

  /**
   * Get the JQL query from the input field
   */
  async getJqlQuery(): Promise<string> {
    const jqlInput = this.page.getByPlaceholder('Enter JQL Query')
    return jqlInput.inputValue()
  }

  /**
   * Set the JQL query in the input field
   */
  async setJqlQuery(jql: string) {
    const jqlInput = this.page.getByPlaceholder('Enter JQL Query')
    await jqlInput.fill(jql)
  }

  /**
   * Analyze metrics by clicking the Analyze button
   */
  async analyzeMetrics() {
    await this.page.getByRole('button', { name: 'Analyze' }).click()
    // Wait for the metrics to load
    await this.page.getByText('Analytics').waitFor({ state: 'visible' })
  }

  /**
   * Delete the configuration
   */
  async deleteConfiguration() {
    await this.page.getByRole('button', { name: 'Delete' }).click()
    // Confirm deletion
    await this.page.getByRole('button', { name: 'Confirm' }).click()
  }
}
