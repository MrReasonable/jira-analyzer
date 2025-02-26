import { setupJiraApiMocks } from '../test/testUtils';
import { mockHandlers } from './handlers';

// Export for use in tests
export const server = {
  listen: async () => {
    // Setup jiraApi mocks
    await setupJiraApiMocks();

    // No need to set up specific routes since we're mocking the jiraApi module directly
    return true;
  },
  resetHandlers: async () => {
    await setupJiraApiMocks();
    mockHandlers.resetMocks();
  },
  close: () => {
    // Nothing to clean up
  },
};
