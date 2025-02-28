import { test, expect } from '@playwright/test';
import { JiraAnalyzerPage } from './pages/jira-analyzer-page';

test.describe('Jira Analyzer End-to-End Test', () => {
  let jiraAnalyzerPage: JiraAnalyzerPage;

  test.beforeEach(async ({ page }) => {
    jiraAnalyzerPage = new JiraAnalyzerPage(page);
  });

  test('Full application workflow', async () => {
    // Step 1: Navigate to the application
    await jiraAnalyzerPage.goto();

    // Step 2: Create a new Jira configuration
    await jiraAnalyzerPage.createConfiguration({
      name: 'Test Configuration',
      server: 'https://test.atlassian.net',
      email: 'test@example.com',
      apiToken: 'test-token',
      jql: 'project = TEST AND type = Story',
      workflowStates: 'Backlog,In Progress,Review,Done',
      cycleTimeStartState: 'In Progress',
      cycleTimeEndState: 'Done',
    });

    // Step 3: Select the configuration
    await jiraAnalyzerPage.selectConfiguration('Test Configuration');

    // Step 4: Verify the JQL query was populated
    const jqlQuery = await jiraAnalyzerPage.getJqlQuery();
    expect(jqlQuery).toBe('project = TEST AND type = Story');

    // Step 5: Analyze metrics
    await jiraAnalyzerPage.analyzeMetrics();

    // Step 6: Delete the configuration
    await jiraAnalyzerPage.deleteConfiguration();

    // Step 7: Verify the configuration was deleted
    await expect(jiraAnalyzerPage.page.getByText('Test Configuration')).toBeHidden();
  });

  test('Modify JQL query and analyze', async () => {
    // Step 1: Navigate to the application
    await jiraAnalyzerPage.goto();

    // Step 2: Create a new Jira configuration
    await jiraAnalyzerPage.createConfiguration({
      name: 'Test Configuration',
      server: 'https://test.atlassian.net',
      email: 'test@example.com',
      apiToken: 'test-token',
      jql: 'project = TEST AND type = Story',
      workflowStates: 'Backlog,In Progress,Review,Done',
      cycleTimeStartState: 'In Progress',
      cycleTimeEndState: 'Done',
    });

    // Step 3: Select the configuration
    await jiraAnalyzerPage.selectConfiguration('Test Configuration');

    // Step 4: Modify the JQL query
    await jiraAnalyzerPage.setJqlQuery('project = TEST AND type = Bug');

    // Verify the JQL query was updated
    const jqlQuery = await jiraAnalyzerPage.getJqlQuery();
    expect(jqlQuery).toBe('project = TEST AND type = Bug');

    // Step 5: Analyze metrics
    await jiraAnalyzerPage.analyzeMetrics();

    // Step 6: Delete the configuration
    await jiraAnalyzerPage.deleteConfiguration();

    // Verify the configuration was deleted
    await expect(jiraAnalyzerPage.page.getByText('Test Configuration')).toBeHidden();
  });
});
