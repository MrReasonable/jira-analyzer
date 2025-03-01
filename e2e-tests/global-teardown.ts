import type { FullConfig } from '@playwright/test'

// We're stopping the servers manually in the run-tests.sh script
async function globalTeardown(_config: FullConfig) {
  // No need to stop Docker Compose services here
  // Log statement removed
}

export default globalTeardown
