import { expect } from '@playwright/test'
import type { Page, Locator } from '@playwright/test'

/**
 * Page Object Model for the Jira Analyzer application.
 * This class encapsulates all interactions with the application UI.
 */
export class JiraAnalyzerPage {
  readonly page: Page

  // Configuration management
  readonly addConfigButton: Locator
  readonly configDialog: Locator
  readonly configNameInput: Locator
  readonly jiraServerInput: Locator
  readonly jiraEmailInput: Locator
  readonly jiraApiTokenInput: Locator
  readonly jqlQueryInput: Locator
  readonly workflowStatesInput: Locator
  readonly leadTimeStartStateInput: Locator
  readonly leadTimeEndStateInput: Locator
  readonly cycleTimeStartStateInput: Locator
  readonly cycleTimeEndStateInput: Locator
  readonly saveConfigButton: Locator
  readonly deleteConfigButton: Locator

  // JQL and analysis
  readonly jqlInput: Locator
  readonly analyzeButton: Locator

  // Metrics sections
  readonly leadTimeSection: Locator
  readonly throughputSection: Locator
  readonly wipSection: Locator
  readonly cfdSection: Locator
  readonly cycleTimeSection: Locator

  /**
   * Constructor for the JiraAnalyzerPage class.
   * @param page The Playwright Page object
   */
  constructor(page: Page) {
    this.page = page

    // Configuration management
    this.addConfigButton = page.getByRole('button', { name: 'Add Configuration' })
    this.configDialog = page.getByRole('dialog')
    this.configNameInput = page.getByLabel('Configuration Name')
    this.jiraServerInput = page.getByLabel('Jira Server URL')
    this.jiraEmailInput = page.getByLabel('Jira Email')
    this.jiraApiTokenInput = page.getByLabel('Jira API Token')
    this.jqlQueryInput = page.getByLabel('JQL Query')
    this.workflowStatesInput = page.getByLabel('Workflow States')
    this.leadTimeStartStateInput = page.getByLabel('Lead Time Start State')
    this.leadTimeEndStateInput = page.getByLabel('Lead Time End State')
    this.cycleTimeStartStateInput = page.getByLabel('Cycle Time Start State')
    this.cycleTimeEndStateInput = page.getByLabel('Cycle Time End State')
    this.saveConfigButton = page.getByRole('button', { name: 'Create Configuration' })
    this.deleteConfigButton = page.getByRole('button', { name: 'Delete' })

    // JQL and analysis
    this.jqlInput = page.getByRole('textbox', { name: 'JQL Query' })
    this.analyzeButton = page.getByRole('button', { name: 'Analyze' })

    // Metrics sections - use tab selectors instead of headings
    this.leadTimeSection = page.getByRole('tab', { name: 'Lead Time' })
    this.throughputSection = page.getByRole('tab', { name: 'Throughput' })
    this.wipSection = page.getByRole('tab', { name: 'WIP' })
    this.cfdSection = page.getByRole('tab', { name: 'CFD' })
    this.cycleTimeSection = page.getByRole('tab', { name: 'Cycle Time' })
  }

  /**
   * Navigate to the application.
   */
  async goto() {
    await this.page.goto('http://localhost')
    // Wait for the page to load
    await this.page.waitForLoadState('domcontentloaded')
    await expect(this.page).toHaveTitle(/Jira Metrics/)
  }

  /**
   * Create a new Jira configuration.
   * @param config The configuration details
   */
  async createConfiguration(config: {
    name: string
    server: string
    email: string
    apiToken: string
    jql: string
    workflowStates: string
    leadTimeStartState?: string
    leadTimeEndState?: string
    cycleTimeStartState: string
    cycleTimeEndState: string
  }) {
    console.log('Clicking Add Configuration button...')
    await this.addConfigButton.click({ timeout: 30000 })

    console.log('Waiting for dialog to be visible...')
    await expect(this.configDialog).toBeVisible({ timeout: 30000 })

    console.log('Filling configuration form...')
    await this.configNameInput.fill(config.name)
    await this.jiraServerInput.fill(config.server)
    await this.jiraEmailInput.fill(config.email)
    await this.jiraApiTokenInput.fill(config.apiToken)
    await this.jqlQueryInput.fill(config.jql)
    await this.workflowStatesInput.fill(config.workflowStates)

    if (config.leadTimeStartState) {
      await this.leadTimeStartStateInput.fill(config.leadTimeStartState)
    } else {
      await this.leadTimeStartStateInput.fill('Backlog') // Default value
    }

    if (config.leadTimeEndState) {
      await this.leadTimeEndStateInput.fill(config.leadTimeEndState)
    } else {
      await this.leadTimeEndStateInput.fill('Done') // Default value
    }

    await this.cycleTimeStartStateInput.fill(config.cycleTimeStartState)
    await this.cycleTimeEndStateInput.fill(config.cycleTimeEndState)

    console.log('Taking screenshot before clicking Save Configuration...')
    await this.page.screenshot({ path: 'screenshots/before-save-config.png' })

    console.log('Clicking Save Configuration button...')
    await this.saveConfigButton.click({ timeout: 30000 })

    console.log('Waiting for dialog to be hidden...')
    await expect(this.configDialog).toBeHidden({ timeout: 30000 })

    console.log('Verifying configuration was created...')
    // Verify the configuration was created
    await expect(this.page.getByText(config.name)).toBeVisible({ timeout: 30000 })
    console.log('Configuration created successfully')
  }

  /**
   * Select a configuration by name.
   * @param name The name of the configuration to select
   */
  async selectConfiguration(name: string) {
    // Click the "Select" button for the configuration
    await this.page.getByTestId(`select-${name}`).click()
  }

  /**
   * Delete a configuration.
   * @param name The name of the configuration to delete (defaults to 'Test Configuration')
   */
  async deleteConfiguration(name: string = 'Test Configuration') {
    // Set up the dialog handler BEFORE clicking the delete button
    this.page.on('dialog', async dialog => {
      console.log('Accepting confirmation dialog');
      await dialog.accept();
    });

    // Take a screenshot before clicking delete
    await this.page.screenshot({ path: 'screenshots/before-delete.png' });

    // Find the delete button and force click it
    console.log(`Clicking delete button for configuration: ${name}`);
    const deleteButton = this.page.getByTestId(`delete-${name}`);

    // Ensure the button is visible and clickable
    await expect(deleteButton).toBeVisible();

    // Click with force option to ensure the click is registered
    await deleteButton.click({ force: true });

    // Take a screenshot after clicking delete
    await this.page.screenshot({ path: 'screenshots/after-delete.png' });

    // Wait for the configuration to be removed from the DOM
    await this.page.waitForSelector(`text=${name}`, { state: 'detached' });
  }

  /**
   * Analyze metrics using the current JQL query.
   */
  async analyzeMetrics() {
    await this.analyzeButton.click()

    // Verify metrics sections are displayed
    await expect(this.leadTimeSection).toBeVisible()
    await expect(this.throughputSection).toBeVisible()
    await expect(this.wipSection).toBeVisible()
    await expect(this.cfdSection).toBeVisible()
    await expect(this.cycleTimeSection).toBeVisible()
  }

  /**
   * Set the JQL query.
   * @param jql The JQL query to set
   */
  async setJqlQuery(jql: string) {
    await this.jqlInput.fill(jql)
  }

  /**
   * Get the current JQL query.
   * @returns The current JQL query
   */
  async getJqlQuery(): Promise<string> {
    return await this.jqlInput.inputValue()
  }
}
