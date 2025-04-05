# Jira Analyzer

A powerful analytics tool for visualizing and understanding Jira workflow metrics.

[![Coverage Status](https://coveralls.io/repos/github/MrReasonable/jira-analyzer/badge.svg?branch=main)](https://coveralls.io/github/MrReasonable/jira-analyzer?branch=main)
[![CI Status](https://github.com/MrReasonable/jira-analyzer/actions/workflows/ci.yml/badge.svg)](https://github.com/MrReasonable/jira-analyzer/actions/workflows/ci.yml)
[![E2E Tests Status](https://github.com/MrReasonable/jira-analyzer/actions/workflows/e2e-tests.yml/badge.svg)](https://github.com/MrReasonable/jira-analyzer/actions/workflows/e2e-tests.yml)

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
  - Contains [Test Performance Guidelines](e2e-tests/TEST_PERFORMANCE.md) for optimizing test execution
- **.github/**: GitHub Actions workflows and configuration
  - Contains detailed [GitHub Actions documentation](.github/WORKFLOWS.md)

## E2E Testing

The project includes comprehensive end-to-end tests using Playwright.
These tests verify theapplication's functionality from a user's perspective.

### Test Performance Optimizations

We've implemented several optimizations to improve E2E test performance:

- **Page Object Pattern**: Using an optimized page object model that reduces timeouts and improves reliability
- **Test Categorization**: Tests are tagged as `@slow` or `@fast` to allow selective execution
- **Reduced Wait Times**: Consolidated wait operations and optimized verification steps
- **Selective Screenshots**: Taking screenshots only at critical points to reduce overhead

For more details, see the [Test Performance Guidelines](e2e-tests/TEST_PERFORMANCE.md).

### Running E2E Tests

```bash
# Run all tests
make e2e-tests

# Run only fast tests
cd e2e-tests && npx playwright test --grep-invert "@slow"

# Run only slow tests
cd e2e-tests && npx playwright test --grep "@slow"

# Run tests with visual feedback
cd e2e-tests && npx playwright test --headed
```
