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
cd "$PROJECT_ROOT" && USE_IN_MEMORY_DB=true docker-compose -f docker-compose.dev.yml up --build -d

# Start capturing logs in the background
echo "Capturing backend logs to $LOGS_DIR/backend.log..."
docker logs -f jira-analyzer-backend-dev > "$LOGS_DIR/backend.log" 2>&1 &
BACKEND_LOGS_PID=$!

# Wait for services to be ready with a health check
echo "Waiting for services to be ready..."
# Increased initial wait time from 10 to 15 seconds
sleep 15

# Maximum time to wait for services in seconds
MAX_WAIT_TIME=60
START_TIME=$(date +%s)

# Check backend health
BACKEND_READY=false
FRONTEND_READY=false

while true; do
  # Check if we've waited too long
  CURRENT_TIME=$(date +%s)
  ELAPSED_TIME=$((CURRENT_TIME - START_TIME))

  if [ $ELAPSED_TIME -ge $MAX_WAIT_TIME ]; then
    echo "Warning: Maximum wait time ($MAX_WAIT_TIME seconds) reached. Proceeding anyway."
    break
  fi

  # Check if backend is ready by testing the API
  if ! $BACKEND_READY; then
    if curl -s --head --fail "http://localhost/api/docs" > /dev/null; then
      echo "✅ Backend API is ready"
      BACKEND_READY=true
    else
      echo "Waiting for backend API..."
    fi
  fi

  # Check if frontend is ready by checking if the server responds
  if ! $FRONTEND_READY; then
    if curl -s --head --fail "http://localhost" > /dev/null; then
      echo "✅ Frontend is ready"
      FRONTEND_READY=true
    else
      echo "Waiting for frontend..."
    fi
  fi

  # If both are ready, we can proceed
  if $BACKEND_READY && $FRONTEND_READY; then
    echo "All services are ready!"
    break
  fi

  # Wait a bit before checking again
  sleep 1
done

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

# Run the tests with environment variables set for the local Docker setup
echo "Running tests..."
cd "$SCRIPT_DIR"

# Set environment variables
export TEST_HOST=localhost
export TEST_PORT=80
export DEBUG=pw:api
export NODE_OPTIONS="--no-experimental-strip-types"

# Make use of Playwright's built-in timeouts and retries
export PLAYWRIGHT_TIMEOUT=60000        # 60 seconds timeout for each test
export PLAYWRIGHT_RETRIES=1            # Retry failed tests once
export PLAYWRIGHT_WORKERS=4            # Control parallel test execution

# Show base URL for tests
echo "Using base URL for tests: http://localhost:$TEST_PORT"
echo "Using API URL for tests: http://localhost:8000"

# Run the tests, using a cross-platform approach for timeout
echo "Starting tests with a 180-second safety timeout..."
(
  # Start the tests in background with type stripping disabled
  pnpm exec playwright test "$@" &
  TEST_PID=$!

  # Wait for the test to complete or timeout
  TIMEOUT=180  # Increased from 120 to 180 seconds for more reliability
  COUNT=0
  while [ $COUNT -lt $TIMEOUT ]; do
    # Check if the process is still running
    if ! ps -p $TEST_PID > /dev/null; then
      # Process has finished
      wait $TEST_PID
      TEST_EXIT_CODE=$?
      break
    fi

    # Sleep for a second
    sleep 1
    COUNT=$((COUNT+1))
  done

  # If we've reached the timeout, kill the test process
  if [ $COUNT -ge $TIMEOUT ]; then
    echo "Tests have been running for $TIMEOUT seconds, which likely indicates a hanging test."
    echo "Terminating the test process..."
    kill -9 $TEST_PID 2>/dev/null
    # Generate a report even if tests timed out
    pnpm exec playwright show-report
    TEST_EXIT_CODE=124
  fi

  exit $TEST_EXIT_CODE
)
TEST_EXIT_CODE=$?

# Cleanup is handled by the trap
