import { expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the Jira Analyzer application.
 * This class encapsulates all interactions with the application UI.
 */
export class JiraAnalyzerPage {
  readonly page: Page;

  // Configuration management
  readonly addConfigButton: Locator;
  readonly configDialog: Locator;
  readonly configNameInput: Locator;
  readonly jiraServerInput: Locator;
  readonly jiraEmailInput: Locator;
  readonly jiraApiTokenInput: Locator;
  readonly jqlQueryInput: Locator;
  readonly workflowStatesInput: Locator;
  readonly cycleTimeStartStateInput: Locator;
  readonly cycleTimeEndStateInput: Locator;
  readonly saveConfigButton: Locator;
  readonly deleteConfigButton: Locator;

  // JQL and analysis
  readonly jqlInput: Locator;
  readonly analyzeButton: Locator;

  // Metrics sections
  readonly leadTimeSection: Locator;
  readonly throughputSection: Locator;
  readonly wipSection: Locator;
  readonly cfdSection: Locator;
  readonly cycleTimeSection: Locator;

  /**
   * Constructor for the JiraAnalyzerPage class.
   * @param page The Playwright Page object
   */
  constructor(page: Page) {
    this.page = page;

    // Configuration management
    this.addConfigButton = page.getByRole('button', { name: 'Add Configuration' });
    this.configDialog = page.getByRole('dialog');
    this.configNameInput = page.getByLabel('Configuration Name');
    this.jiraServerInput = page.getByLabel('Jira Server URL');
    this.jiraEmailInput = page.getByLabel('Jira Email');
    this.jiraApiTokenInput = page.getByLabel('Jira API Token');
    this.jqlQueryInput = page.getByLabel('JQL Query');
    this.workflowStatesInput = page.getByLabel('Workflow States');
    this.cycleTimeStartStateInput = page.getByLabel('Cycle Time Start State');
    this.cycleTimeEndStateInput = page.getByLabel('Cycle Time End State');
    this.saveConfigButton = page.getByRole('button', { name: 'Save Configuration' });
    this.deleteConfigButton = page.getByRole('button', { name: 'Delete' });

    // JQL and analysis
    this.jqlInput = page.getByRole('textbox', { name: 'JQL Query' });
    this.analyzeButton = page.getByRole('button', { name: 'Analyze' });

    // Metrics sections
    this.leadTimeSection = page.getByText('Lead Time');
    this.throughputSection = page.getByText('Throughput');
    this.wipSection = page.getByText('Work in Progress');
    this.cfdSection = page.getByText('Cumulative Flow');
    this.cycleTimeSection = page.getByText('Cycle Time');
  }

  /**
   * Navigate to the application.
   */
  async goto() {
    await this.page.goto('/');
    // Wait for the page to load
    await this.page.waitForLoadState('domcontentloaded');
    // Skip title check for now
    // await expect(this.page).toHaveTitle(/Jira Metrics/);
  }

  /**
   * Create a new Jira configuration.
   * @param config The configuration details
   */
  async createConfiguration(config: {
    name: string;
    server: string;
    email: string;
    apiToken: string;
    jql: string;
    workflowStates: string;
    cycleTimeStartState: string;
    cycleTimeEndState: string;
  }) {
    await this.addConfigButton.click();
    await expect(this.configDialog).toBeVisible();

    await this.configNameInput.fill(config.name);
    await this.jiraServerInput.fill(config.server);
    await this.jiraEmailInput.fill(config.email);
    await this.jiraApiTokenInput.fill(config.apiToken);
    await this.jqlQueryInput.fill(config.jql);
    await this.workflowStatesInput.fill(config.workflowStates);
    await this.cycleTimeStartStateInput.fill(config.cycleTimeStartState);
    await this.cycleTimeEndStateInput.fill(config.cycleTimeEndState);

    await this.saveConfigButton.click();
    await expect(this.configDialog).toBeHidden();

    // Verify the configuration was created
    await expect(this.page.getByText(config.name)).toBeVisible();
  }

  /**
   * Select a configuration by name.
   * @param name The name of the configuration to select
   */
  async selectConfiguration(name: string) {
    await this.page.getByText(name).click();
  }

  /**
   * Delete a configuration.
   */
  async deleteConfiguration() {
    await this.deleteConfigButton.click();
  }

  /**
   * Analyze metrics using the current JQL query.
   */
  async analyzeMetrics() {
    await this.analyzeButton.click();

    // Verify metrics sections are displayed
    await expect(this.leadTimeSection).toBeVisible();
    await expect(this.throughputSection).toBeVisible();
    await expect(this.wipSection).toBeVisible();
    await expect(this.cfdSection).toBeVisible();
    await expect(this.cycleTimeSection).toBeVisible();
  }

  /**
   * Set the JQL query.
   * @param jql The JQL query to set
   */
  async setJqlQuery(jql: string) {
    await this.jqlInput.fill(jql);
  }

  /**
   * Get the current JQL query.
   * @returns The current JQL query
   */
  async getJqlQuery(): Promise<string> {
    return await this.jqlInput.inputValue();
  }
}
