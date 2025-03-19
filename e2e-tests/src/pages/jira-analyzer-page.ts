import { Page } from '@playwright/test'
import { setScreenshotTestName } from '../utils/screenshot-helper'
import { TestContext } from '../core/types'
import { navigateToApp } from '../core/navigation'
import { createConfiguration, deleteConfiguration, editConfiguration } from '../core/configuration'
import { analyzeMetrics, getJqlQuery, setJqlQuery } from '../core/jql'
import { JiraConfigurationOptions } from '../core/types'
import { dragWorkflowState } from '../core/workflow-states'

/**
 * Page object for the Jira Analyzer application
 * This is a thin wrapper around the functional modules
 */
export class JiraAnalyzerPage {
  private context: TestContext

  constructor(public page: Page) {
    this.context = { page }
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
   * Perform a drag and drop operation on workflow states
   */
  async dragWorkflowState(sourceIndex: number, targetIndex: number): Promise<boolean> {
    return await dragWorkflowState(this.context, sourceIndex, targetIndex)
  }
}
