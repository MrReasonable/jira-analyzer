import { Page } from '@playwright/test'

/**
 * Configuration options for creating a Jira configuration
 */
export interface JiraConfigurationOptions {
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
}

/**
 * Context object containing page and other shared state
 */
export interface TestContext {
  page: Page
  testName?: string
}
