# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automating various aspects of the development process for the Jira Analyzer project.

## Testing Workflows Locally

You can test the GitHub Actions workflows locally using the [act](https://github.com/nektos/act) tool. This allows you to verify that your workflows are correctly configured before pushing them to GitHub.

### Prerequisites

1. Install act:
   - macOS: `brew install act`
   - Linux: `curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash`
   - Windows: `choco install act-cli` or download from GitHub releases

2. Make sure Docker is installed and running on your machine.

### Running Tests

We've provided a script to make testing workflows easier:

```bash
# Make the script executable
chmod +x .github/test-workflows.sh

# Test the CI workflow (default)
.github/test-workflows.sh

# Test a specific workflow
.github/test-workflows.sh -w pre-commit.yml

# Test the CD workflow with a tag event
.github/test-workflows.sh -w cd.yml -e tag

# Get help
.github/test-workflows.sh -h
```

### Available Test Events

The following test event files are available in `.github/test-events/`:

- `push.json`: Simulates a push to the main branch
- `pull_request.json`: Simulates a pull request being opened
- `tag.json`: Simulates a new tag being created (for releases)
- `workflow_dispatch.json`: Simulates a manual workflow dispatch event

### Troubleshooting Local Testing

When testing workflows locally with `act`, you might encounter some issues:

1. **Missing Dependencies**: The Docker containers used by `act` might not have all the necessary dependencies installed. We've updated the workflows to install required dependencies during execution, but you might still encounter issues.

   - For backend Python dependencies, we now explicitly install tools like `ruff`, `mypy`, and `bandit` in the workflow steps.
   - For frontend dependencies, we've added steps to install system dependencies required for the `canvas` package.

2. **Adaptive Behavior**: The workflows are designed to detect when they're running in the `act` environment and adjust their behavior accordingly:

   - **Format Checking**: When running with `act`, the format checking steps will automatically format files instead of failing when formatting issues are found.
   - **Linting**: Frontend linting uses fix mode in the local environment.
   - **Type Checking**: MyPy type checking uses more lenient settings in the local environment.
   - **Integration Tests**: Integration tests are skipped in the local environment to speed up testing.
   - **Unit Tests**: Unit tests run with more verbose output in the local environment.
   - **Docker Builds**: Docker builds use a simplified approach in the local environment to avoid Docker-in-Docker issues.

2. **Canvas Package Issues**: The `canvas` package requires system dependencies that might not be available in the Docker container. You can try the following:

   ```bash
   # Run with a more complete Ubuntu image
   .github/test-workflows.sh -w ci.yml --image catthehacker/ubuntu:act-latest

   # Or skip the frontend checks
   .github/test-workflows.sh -w ci.yml -j backend-checks
   ```

3. **Architecture Issues**: If you're using an Apple M-series chip, you might encounter architecture compatibility issues. Try running with the `--container-architecture` flag:

   ```bash
   .github/test-workflows.sh -w ci.yml --container-architecture linux/amd64
   ```

4. **Skipping Jobs**: You can test specific jobs within a workflow:

   ```bash
   # Test only the backend checks
   .github/test-workflows.sh -w ci.yml -j backend-checks
   ```

Remember that local testing with `act` is not a perfect simulation of GitHub's environment. Some workflows might work differently when run on GitHub's infrastructure.

## Workflows

### CI (Continuous Integration)

**File:** [ci.yml](./workflows/ci.yml)

This workflow runs on every push to the `main` branch and on pull requests targeting the `main` branch. It performs the following checks:

- **Frontend Checks:**
  - Linting with ESLint
  - Format checking with Prettier
  - Type checking with TypeScript
  - Running tests with Vitest

- **Backend Checks:**
  - Linting with Ruff
  - Format checking with Ruff
  - Type checking with MyPy
  - Security checking with Bandit
  - Running unit and integration tests with Pytest

- **Docker Build Test:**
  - Builds the frontend and backend Docker images to ensure they can be built successfully

### CD (Continuous Deployment)

**File:** [cd.yml](./workflows/cd.yml)

This workflow runs when a new tag with the format `v*` is pushed to the repository or when manually triggered. It performs the following actions:

- **Build and Push Docker Images:**
  - Builds the frontend and backend Docker images
  - Pushes the images to GitHub Container Registry (ghcr.io)
  - Tags the images with the version number, major.minor version, branch name, and commit SHA

- **Deploy:**
  - Deploys the application to the specified environment (staging or production)
  - Verifies the deployment

### Pre-commit Checks

**File:** [pre-commit.yml](./workflows/pre-commit.yml)

This workflow runs on pull requests targeting the `main` branch and when manually triggered. It performs the following actions:

- Runs all pre-commit hooks on all files in the repository
- For pull requests, also runs pre-commit hooks on the changed files only

### Code Coverage

**File:** [code-coverage.yml](./workflows/code-coverage.yml)

This workflow runs on every push to the `main` branch, on pull requests targeting the `main` branch, and when manually triggered. It performs the following actions:

- **Frontend Coverage:**
  - Runs frontend tests with coverage reporting
  - Uploads the coverage report to Codecov

- **Backend Coverage:**
  - Runs backend tests with coverage reporting
  - Uploads the coverage report to Codecov

## Dependabot Configuration

**File:** [dependabot.yml](../dependabot.yml)

This configuration file sets up Dependabot to automatically check for updates to dependencies and create pull requests when updates are available. It includes:

- Frontend dependency updates (npm)
- Backend dependency updates (pip)
- GitHub Actions updates
- Docker updates

## Usage

### Manual Triggers

Some workflows can be triggered manually from the GitHub Actions tab in the repository:

1. Navigate to the "Actions" tab in the GitHub repository
2. Select the workflow you want to run
3. Click the "Run workflow" button
4. Select the branch and provide any required inputs
5. Click "Run workflow"

### Required Secrets

The following secrets need to be configured in the GitHub repository settings:

- `CODECOV_TOKEN`: Token for uploading coverage reports to Codecov

### Environment Setup

For the CD workflow, you need to set up environments in the GitHub repository settings:

1. Navigate to "Settings" > "Environments"
2. Create environments for "staging" and "production"
3. Configure environment-specific secrets and protection rules as needed

## Customization

To customize these workflows for your specific needs:

1. Edit the workflow YAML files in the `.github/workflows` directory
2. Commit and push your changes
3. The updated workflows will be used for subsequent runs
