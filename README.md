# Jira Analyzer

A tool for analyzing Jira metrics including lead time, cycle time, throughput, and work in progress.

## Features

- Lead Time Analysis
- Cycle Time Analysis
- Throughput Metrics
- Work in Progress (WIP) Tracking
- Cumulative Flow Diagram (CFD)
- Configurable Workflow States
- Named Configuration Management
- Docker Support

## Configuration Management

The application supports saving and managing multiple named configurations. Each configuration includes:

- Jira API credentials
- Default JQL query
- Workflow states
- Lead time start/end states
- Cycle time start/end states

Configurations can be:
- Created and saved for future use
- Selected to quickly load settings
- Updated as needed
- Deleted when no longer required

## Quick Start

1. Clone the repository
2. Create environment file:
   ```bash
   # Copy and customize environment variables
   cp .env.example .env
   ```

3. Start the application:
   ```bash
   docker-compose up --build
   ```

4. Access the application:
   - Frontend: http://localhost:80 (or your configured FRONTEND_PORT)
   - Backend API: http://localhost:8000 (or your configured BACKEND_PORT)
   - API Documentation: http://localhost:8000/docs

## Environment Configuration

### Root Environment Variables (.env)

```env
# Docker configuration
BACKEND_PORT=8000
FRONTEND_PORT=80
NODE_ENV=development

# Default Jira configuration (optional)
JIRA_SERVER=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-api-token
JQL_QUERY="project = PROJ AND type = Story"
WORKFLOW_STATES='["Backlog", "In Progress", "Done"]'
LEAD_TIME_START_STATE=Backlog
LEAD_TIME_END_STATE=Done
CYCLE_TIME_START_STATE="In Progress"
CYCLE_TIME_END_STATE=Done
```

### Environment Variables

All configuration is managed through the root `.env` file. These settings provide default values that can be overridden by saved configurations in the UI.

The backend service will use these values for its initial configuration, and they can be modified through the configuration management interface once the application is running.

## Development

### Prerequisites

- Docker
- Docker Compose
- Python 3.x (for pre-commit hooks)

### Local Development

1. Start the services with volume mounts:
   ```bash
   docker-compose up
   ```

2. The following paths are mounted for development:
   - Backend: `./backend/app:/app/app`
   - Backend tests: `./backend/tests:/app/tests`
   - Frontend nginx config: `./frontend/nginx.conf:/etc/nginx/conf.d/default.conf`

3. Data persistence:
   - SQLite database is stored in a Docker volume: `jira-analyzer-data`
   - Configurations persist between container restarts

### Running Tests

Backend tests:
```bash
docker-compose exec backend pytest
# or
make backend-test
```

Frontend tests:
```bash
docker-compose exec frontend pnpm test
# or
make frontend-test
```

End-to-end tests:
```bash
make e2e-test
```

Run all tests:
```bash
make test
```

### Pre-commit Hooks

This project uses pre-commit hooks to ensure code quality and consistency. Pre-commit hooks run automatically when you attempt to commit changes, checking for issues like code formatting, linting errors, and failing tests.

#### Setup Pre-commit Hooks

1. Install pre-commit and set up the hooks:
   ```bash
   make install
   make setup-pre-commit
   ```

2. The pre-commit hooks will now run automatically on `git commit`. They include:
   - Code formatting (with auto-fix for both frontend and backend)
   - Linting for Python and TypeScript
   - Type checking
   - Security checks
   - Tests

3. To manually run all pre-commit hooks on all files:
   ```bash
   make pre-commit-run
   ```

4. If a pre-commit hook fails, the commit will be aborted. Fix the issues and try committing again.

5. To format all frontend files manually:
   ```bash
   cd frontend && pnpm run format
   ```

6. To format all backend files manually:
   ```bash
   cd backend && ruff format app tests
   ```

7. If you need to bypass pre-commit hooks temporarily (not recommended):
   ```bash
   git commit -m "Your message" --no-verify
   ```

## Production Deployment

1. Update environment variables:
   ```env
   NODE_ENV=production
   ```

2. Deploy with Docker Compose:
   ```bash
   docker-compose -f docker-compose.yml up --build -d
   ```

## Testing

### Unit Tests

The project includes comprehensive unit tests for both frontend and backend components:

- **Backend Tests**: Using pytest to test API endpoints, metric calculations, and configuration management.
- **Frontend Tests**: Using Vitest to test components, hooks, and API interactions.

### End-to-End Tests

The project includes end-to-end tests using Playwright that validate the full application workflow:

- Creating and managing Jira configurations
- Entering JQL queries
- Analyzing metrics
- Displaying charts and data

To run the end-to-end tests:

```bash
# Install dependencies (first time only)
cd e2e-tests && npm install && npm run install:browsers

# Run the tests
make e2e-test

# Run with visible browser
make e2e-test-headed

# Run with debug mode (step-by-step debugging)
make e2e-test-debug
```

The end-to-end tests:
- Automatically start the backend using Docker Compose with a mock Jira server
- Start the frontend development server
- Run the tests against the running services
- Automatically shut down all services after completion

**Mock Jira Server:** The end-to-end tests use a mock implementation of the Jira API that provides predefined sample data. This eliminates the need for actual Jira credentials and makes the tests more reliable and faster. The mock server is automatically enabled when running the tests by setting the `USE_MOCK_JIRA` environment variable to `true`.

**Improved Test Runner:** The tests use a custom shell script (`run-tests.sh`) that handles starting the servers, waiting for them to be ready, running the tests, and cleaning up afterward. This makes the tests more reliable and provides better error output.

**Note:** Make sure Docker is running before executing the end-to-end tests, as they rely on Docker Compose to start the backend services.

## Version Management

The project uses a centralized version management system to ensure consistent language versions across all configuration files, including GitHub Actions workflows and Docker files.

### Centralized Version File

All language versions are defined in a single source of truth file:

```json
// versions.json
{
  "node": "23",
  "python": "3.12",
  "pnpm": "10.5.2"
}
```

### Updating Versions

To update language versions across all configuration files:

1. Edit the `versions.json` file with the desired versions
2. Run the update script:
   ```bash
   make update-versions
   ```

This will automatically update:
- GitHub Actions workflows
- Dockerfiles
- mise.toml (for local development)

### Supported Languages

The version management system currently supports:
- Node.js
- Python
- PNPM

## Architecture

### Backend (Python/FastAPI)

- REST API endpoints for metrics and configuration
- SQLite database for configuration storage
- Jira API integration
- Metric calculations:
  - Lead Time
  - Cycle Time
  - Throughput
  - Work in Progress (WIP)
  - Cumulative Flow Diagram (CFD)

### Frontend (SolidJS)

- Configuration management UI
- Interactive metric visualizations
- Responsive design
- Real-time updates

### Docker Services

1. Backend:
   - Python 3.11 base image
   - FastAPI application server
   - SQLite database
   - Volume mounts for development
   - Health checks

2. Frontend:
   - Multi-stage build
   - nginx server
   - Reverse proxy to backend
   - Health checks

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass and pre-commit hooks succeed
5. Create a Pull Request
