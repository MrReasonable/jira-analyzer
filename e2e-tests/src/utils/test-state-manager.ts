import { test } from '@playwright/test'
import { TestContext } from '../core/types'
import { JiraConfigurationOptions } from '../core/types'
import { JiraAnalyzerPage } from '../pages/jira-analyzer-page'

/**
 * Ensures a configuration exists with the given name
 * If the configuration doesn't exist, it creates one
 *
 * @param context Test context containing page and other shared state
 * @param config Configuration options
 * @returns Promise resolving when the configuration exists and is selected
 */
export async function ensureConfigurationExists(
  context: TestContext,
  config: JiraConfigurationOptions
): Promise<void> {
  const { page } = context

  await test.step(`Ensure configuration "${config.name}" exists`, async () => {
    // Use the JiraAnalyzerPage method for better encapsulation
    const jiraAnalyzerPage = new JiraAnalyzerPage(page)
    await jiraAnalyzerPage.ensureConfigurationExists(config)
  })
}

/**
 * Ensures the application is in the metrics view where the analyze button exists
 *
 * @param context Test context containing page and other shared state
 * @returns Promise resolving when the application is in the metrics view
 */
export async function ensureInMetricsView(context: TestContext): Promise<void> {
  const { page } = context

  await test.step('Ensure application is in metrics view', async () => {
    // Use the JiraAnalyzerPage method for better encapsulation
    const jiraAnalyzerPage = new JiraAnalyzerPage(page)
    await jiraAnalyzerPage.ensureInMetricsView()
  })
}

/**
 * Ensures the application is in the workflow editor
 *
 * @param context Test context containing page and other shared state
 * @returns Promise resolving when the application is in the workflow editor
 */
export async function ensureInWorkflowEditor(context: TestContext): Promise<void> {
  const { page } = context

  await test.step('Ensure application is in workflow editor', async () => {
    // Use the JiraAnalyzerPage method for better encapsulation
    const jiraAnalyzerPage = new JiraAnalyzerPage(page)
    await jiraAnalyzerPage.ensureInWorkflowEditor()
  })
}
