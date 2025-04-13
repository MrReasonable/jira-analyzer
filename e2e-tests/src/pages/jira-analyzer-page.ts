import { Page } from '@playwright/test'
import { setScreenshotTestName } from '../utils/screenshot-helper'
import { TestContext, JiraConfigurationOptions } from '../core/types'
import { navigateToApp } from '../core/navigation'
import { createConfiguration, deleteConfiguration, editConfiguration } from '../core/configuration'
import { analyzeMetrics, getJqlQuery, setJqlQuery } from '../core/jql'
import { dragWorkflowStateByName, addWorkflowState } from '../core/workflow-states'
import { getAllWorkflowStateNames } from '../utils/selector-helper'
import { verifyChartsRendered } from '../core/chart-verification'
import {
  ensureConfigurationExists as ensureConfigExists,
  ensureInMetricsView as ensureInMetricsViewHelper,
  ensureInWorkflowEditor as ensureInWorkflowEditorHelper,
} from '../core/state-management'

/**
 * Page object for the Jira Analyzer application
 * This is a thin wrapper around the functional modules
 */
export class JiraAnalyzerPage {
  private readonly context: TestContext

  constructor(readonly page: Page) {
    this.context = { page }

    // Default test name based on current timestamp if none is set
    this.setTestName(`jira-analyzer-test-${Date.now()}`)
  }

  /**
   * Set the test name for screenshots taken by this page object
   */
  setTestName(testName: string): void {
    this.context.testName = testName
    setScreenshotTestName(testName)
  }

  /**
   * Navigate to the Jira Analyzer application
   */
  async goto(): Promise<void> {
    await navigateToApp(this.context)
  }

  /**
   * Create a new Jira configuration
   */
  async createConfiguration(config: JiraConfigurationOptions): Promise<boolean> {
    return await createConfiguration(this.context, config)
  }

  /**
   * Get the JQL query from the input field
   */
  async getJqlQuery(): Promise<string> {
    return await getJqlQuery(this.context)
  }

  /**
   * Set the JQL query in the input field
   */
  async setJqlQuery(jql: string): Promise<void> {
    await setJqlQuery(this.context, jql)
  }

  /**
   * Analyze metrics by clicking the Analyze button
   */
  async analyzeMetrics(): Promise<boolean> {
    return await analyzeMetrics(this.context)
  }

  /**
   * Edit a configuration
   */
  async editConfiguration(configName: string): Promise<boolean> {
    return await editConfiguration(this.context, configName)
  }

  /**
   * Delete a configuration
   */
  async deleteConfiguration(configName: string): Promise<boolean> {
    return await deleteConfiguration(this.context, configName)
  }

  /**
   * Add a workflow state
   */
  async addWorkflowState(stateName: string): Promise<boolean> {
    return await addWorkflowState(this.context, stateName)
  }

  /**
   * Perform a drag and drop operation on workflow states using indices
   * @deprecated Use dragWorkflowStateByName for more stable tests
   */
  async dragWorkflowState(sourceIndex: number, targetIndex: number): Promise<boolean> {
    try {
      // Get all state names
      const stateNames = await getAllWorkflowStateNames(this.page)

      // Check if indices are valid
      if (sourceIndex >= stateNames.length || targetIndex >= stateNames.length) {
        return false
      }

      // Get the state names at the specified indices
      const sourceStateName = stateNames[sourceIndex]
      const targetStateName = stateNames[targetIndex]

      // Use the name-based method
      return await this.dragWorkflowStateByName(sourceStateName, targetStateName)
    } catch {
      return false
    }
  }

  /**
   * Perform a drag and drop operation on workflow states using state names
   * This is more stable than using indices as it doesn't depend on the order
   */
  async dragWorkflowStateByName(
    sourceStateName: string,
    targetStateName: string
  ): Promise<boolean> {
    return await dragWorkflowStateByName(this.context, sourceStateName, targetStateName)
  }

  /**
   * Verify that charts are rendered on the page
   *
   * @returns Promise resolving to true if charts are rendered, false otherwise
   */
  async verifyChartsRendered(): Promise<boolean> {
    return await verifyChartsRendered(this.context)
  }

  /**
   * Ensures a configuration exists with the given name
   * If the configuration doesn't exist, it creates one
   *
   * @param config Configuration options
   * @returns Promise resolving when the configuration exists and is selected
   */
  async ensureConfigurationExists(config: JiraConfigurationOptions): Promise<void> {
    // Use the helper function from state-management.ts
    await ensureConfigExists(this.context, config)
  }

  /**
   * Ensures the application is in the metrics view where the analyze button exists
   *
   * @returns Promise resolving when the application is in the metrics view
   */
  async ensureInMetricsView(): Promise<void> {
    // Use the helper function from state-management.ts
    await ensureInMetricsViewHelper(this.context)
  }

  /**
   * Ensures the application is in the workflow editor
   *
   * @returns Promise resolving when the application is in the workflow editor
   */
  async ensureInWorkflowEditor(): Promise<void> {
    // Use the helper function from state-management.ts
    await ensureInWorkflowEditorHelper(this.context)
  }
}
