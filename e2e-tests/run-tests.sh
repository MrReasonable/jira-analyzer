#!/bin/bash

# Function to clean up resources
cleanup() {
  echo "Cleaning up resources..."
  cd "$PROJECT_ROOT" && docker-compose -f docker-compose.dev.yml down
  exit $TEST_EXIT_CODE
}

# Set up trap to catch Ctrl+C and other termination signals
trap cleanup SIGINT SIGTERM EXIT

# Get the project root directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Initialize exit code
TEST_EXIT_CODE=0

# Check if services are already running and shut them down
echo "Checking if services are already running..."
if docker ps | grep -q "jira-analyzer"; then
  echo "Services are already running. Shutting them down..."
  cd "$PROJECT_ROOT" && docker-compose -f docker-compose.dev.yml down
fi

# Start the backend with Docker Compose, using in-memory database for tests
echo "Starting backend with Docker Compose (using in-memory database)..."
cd "$PROJECT_ROOT" && USE_IN_MEMORY_DB=true docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
timeout=30
counter=0

# Give services some time to start up
echo "Giving services time to start up..."
sleep 10
echo "Services should be ready now!"

# Check if browsers are installed and install them if needed
echo "Checking if Playwright browsers are installed..."
if [ ! -d "$HOME/Library/Caches/ms-playwright" ] || [ ! -d "$HOME/Library/Caches/ms-playwright/chromium-1155" ]; then
  echo "Installing Playwright browsers..."
  cd "$SCRIPT_DIR" && pnpm exec playwright install
fi

# Run the tests
echo "Running tests..."
cd "$SCRIPT_DIR" && pnpm exec playwright test "$@"
TEST_EXIT_CODE=$?

# Cleanup is handled by the trap
