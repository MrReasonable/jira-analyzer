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
```

Frontend tests:
```bash
docker-compose exec frontend pnpm test
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
4. Ensure all tests pass
5. Create a Pull Request
