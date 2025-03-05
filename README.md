# Jira Analyzer

A powerful analytics tool for visualizing and understanding Jira workflow metrics.

## Overview

Jira Analyzer is a web application that provides insightful metrics and visualizations for Jira projects. It helps teams
analyze their workflow efficiency by calculating and displaying key performance indicators derived from Jira issue data.

## Features

- **JQL-Based Analysis**: Filter issues using Jira Query Language (JQL) to focus on specific projects, teams, or time periods
- **Saved Configurations**: Create and save configurations for quick access to frequently used queries
- **Comprehensive Metrics**:
  - **Lead Time**: Visualize how long issues take from creation to completion
  - **Throughput**: Track completion rates over time
  - **WIP (Work in Progress)**: Monitor the number of issues in progress at any given time
  - **CFD (Cumulative Flow Diagram)**: Visualize workflow distribution and identify bottlenecks
  - **Cycle Time**: Measure the time issues spend in specific workflow states

## Architecture

The application consists of:

- **Frontend**: Built with SolidJS and TailwindCSS, providing a responsive and intuitive user interface
- **Backend**: Python/FastAPI backend that interfaces with Jira's API and processes metrics
- **Dockerized Deployment**: Containerized setup with Docker Compose for easy deployment and development
- **CI/CD**: GitHub Actions workflows for continuous integration and deployment

### Development Tools

This repository uses several tools to maintain code quality:

- **yamlfmt**: YAML formatting tool used to ensure consistent formatting of YAML files
- **pre-commit**: Hooks for code quality checks before committing
- **ESLint/Ruff**: Code linting for JavaScript/TypeScript and Python
- **Playwright**: End-to-end testing framework

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Jira instance with API access

### Installation & Running

1. Clone this repository
2. Create a `.env` file based on `.env.example` with your configuration settings
3. Run the application:

   ```bash
   # Production mode
   docker-compose up -d

   # Development mode
   docker-compose -f docker-compose.dev.yml up -d
   ```

4. Access the application at <http://localhost> (or the port specified in your `.env` file)

### Development Setup

For development, the application provides:

- Hot-reloading for both frontend and backend
- Debugging ports for Python (5678) and Node.js (9229)
- Mock Jira API option for testing without a real Jira instance

```bash
# Start in development mode
docker-compose -f docker-compose.dev.yml up -d

# Run tests
make test

# Run E2E tests
make e2e-tests
```

## License

This project is licensed under the terms in the LICENSE file.

## Repository Structure

- **frontend/**: SolidJS frontend application
- **backend/**: Python/FastAPI backend application
- **e2e-tests/**: End-to-end tests using Playwright
- **.github/**: GitHub Actions workflows and configuration
  - Contains detailed [GitHub Actions documentation](.github/WORKFLOWS.md)
