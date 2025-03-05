#!/bin/bash

# Function to clean up resources
cleanup() {
  echo "Cleaning up resources..."

  # Kill the log capturing process if it exists
  if [ -n "$BACKEND_LOGS_PID" ] && ps -p $BACKEND_LOGS_PID > /dev/null; then
    echo "Stopping log capture process..."
    kill $BACKEND_LOGS_PID
  fi

  # Print log location if logs were captured
  if [ -f "$LOGS_DIR/backend.log" ]; then
    echo "Backend logs saved to: $LOGS_DIR/backend.log"
  fi

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

# Create logs directory if it doesn't exist and clear old logs
LOGS_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOGS_DIR"

# Create screenshots directory if it doesn't exist
SCREENSHOTS_DIR="$SCRIPT_DIR/screenshots"
mkdir -p "$SCREENSHOTS_DIR"

# Clear old log files and screenshots
echo "Clearing old log files and screenshots..."
rm -f "$LOGS_DIR"/*.log
rm -f "$SCREENSHOTS_DIR"/*.png

# Start the backend with Docker Compose, using in-memory database for tests
echo "Starting backend with Docker Compose (using in-memory database)..."
cd "$PROJECT_ROOT" && USE_IN_MEMORY_DB=true docker-compose -f docker-compose.dev.yml up -d

# Start capturing logs in the background
echo "Capturing backend logs to $LOGS_DIR/backend.log..."
docker logs -f jira-analyzer-backend-dev > "$LOGS_DIR/backend.log" 2>&1 &
BACKEND_LOGS_PID=$!

# Wait for services to be ready
echo "Waiting for services to be ready..."
timeout=30
counter=0

# Give services some time to start up
echo "Giving services time to start up..."
sleep 10
echo "Services should be ready now!"

# Check if node_modules exists and install dependencies if needed
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
  echo "node_modules not found. Installing dependencies..."
  cd "$SCRIPT_DIR" && pnpm install
fi

# Check if browsers are installed and install them if needed
echo "Checking if Playwright browsers are installed..."
if [ ! -d "$HOME/Library/Caches/ms-playwright" ] || [ ! -d "$HOME/Library/Caches/ms-playwright/chromium-1155" ]; then
  echo "Installing Playwright browsers..."
  cd "$SCRIPT_DIR" && pnpm exec playwright install
fi

# Build the tests before running
echo "Building the tests..."
cd "$SCRIPT_DIR" && pnpm run build

# Run the tests
echo "Running tests..."
cd "$SCRIPT_DIR" && PLAYWRIGHT_CONFIG_PATH=dist/playwright.config.js pnpm exec playwright test --config=dist/playwright.config.js "$@"
TEST_EXIT_CODE=$?

# Cleanup is handled by the trap
