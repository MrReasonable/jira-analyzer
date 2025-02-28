#!/bin/bash

# Get the project root directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Start the backend with Docker Compose
echo "Starting backend with Docker Compose..."
cd "$PROJECT_ROOT" && docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
timeout=120
counter=0
while ! curl -s http://localhost:80 > /dev/null; do
    if [ $counter -ge $timeout ]; then
        echo "Timed out waiting for services to start"
        cd "$PROJECT_ROOT" && docker-compose -f docker-compose.dev.yml down
        exit 1
    fi
    echo "Waiting for services... ($counter/$timeout)"
    sleep 1
    counter=$((counter+1))
done
echo "Services are ready!"

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

# Cleanup
echo "Cleaning up..."
cd "$PROJECT_ROOT" && docker-compose -f docker-compose.dev.yml down

exit $TEST_EXIT_CODE
