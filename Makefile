# Makefile for Jira Analyzer project

# Project directories
FRONTEND_DIR := frontend
BACKEND_DIR := backend
E2E_DIR := e2e-tests

# Docker image names
NODE_BASE_IMAGE := node-base
NODE_BASE_CI_IMAGE := node-base-ci
FRONTEND_DEV_IMAGE := frontend-dev
FRONTEND_CI_IMAGE := frontend-ci
BACKEND_DEV_IMAGE := backend-dev
E2E_DEV_IMAGE := e2e-dev
E2E_CI_IMAGE := e2e-ci
YAMLFMT_IMAGE := yamlfmt
MARKDOWN_LINT_IMAGE := markdownlint

# Docker compose files
DEV_COMPOSE_FILE := docker-compose.dev.yml
PROD_COMPOSE_FILE := docker-compose.yml

# Common commands
PNPM := pnpm
PYTEST := pytest
DOCKER := docker
DOCKER_COMPOSE := docker-compose

# User ID and Group ID for Docker
USER_ID := $(shell id -u)
GROUP_ID := $(shell id -g)

# Docker images used in the project
JIRA_FRONTEND_IMAGE := jira-analyzer-frontend
JIRA_BACKEND_IMAGE := jira-analyzer-backend
JIRA_FRONTEND_DEV_IMAGE := jira-analyzer-frontend-dev
JIRA_BACKEND_DEV_IMAGE := jira-analyzer-backend-dev

# List of all Docker images to remove during cleanup
DOCKER_IMAGES_TO_REMOVE := \
	$(JIRA_FRONTEND_IMAGE) \
	$(JIRA_BACKEND_IMAGE) \
	$(JIRA_FRONTEND_DEV_IMAGE) \
	$(JIRA_BACKEND_DEV_IMAGE) \
	$(FRONTEND_DEV_IMAGE) \
	$(FRONTEND_CI_IMAGE) \
	$(BACKEND_DEV_IMAGE) \
	$(E2E_DEV_IMAGE) \
	$(E2E_CI_IMAGE) \
	$(NODE_BASE_IMAGE) \
	$(NODE_BASE_CI_IMAGE) \
	$(YAMLFMT_IMAGE) \
	$(MARKDOWN_LINT_IMAGE)

.PHONY: help install dev test lint format clean build docker-build setup-pre-commit update-versions node-base node-base-ci frontend-dev-image frontend-ci-image e2e-dev-image e2e-ci-image frontend-test frontend-test-ci frontend-test-watch backend-test backend-unit-test backend-unit-test-ci backend-integration-test backend-fast-test frontend-lint frontend-lint-ci backend-lint backend-lint-ci frontend-format frontend-format-ci frontend-lint-fix frontend-lint-fix-ci frontend-type-check frontend-type-check-ci backend-format backend-format-ci backend-lint-fix backend-lint-fix-ci lint-fix pre-commit-run e2e-test e2e-test-ui e2e-test-headed e2e-test-debug e2e-test-quiet e2e-test-ci e2e-lint e2e-lint-ci e2e-lint-fix e2e-lint-fix-ci e2e-format e2e-format-ci e2e-format-check e2e-format-check-ci e2e-type-check e2e-type-check-ci yaml-lint yamlfmt-image yaml-format yaml-format-check yaml-format-ci yaml-format-check-ci markdown-lint markdown-lint-ci markdown-format markdown-format-ci test-github-actions test-github-actions-ci test-github-actions-e2e

# Show help message for all make commands
help:
	@echo "Available commands:"
	@grep -E '^[^#]*:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

install: ## Install all dependencies for frontend, backend, and e2e-tests
	@echo "Installing frontend dependencies..."
	cd $(FRONTEND_DIR) && $(PNPM) install
	@echo "Upgrading pip..."
	pip install --upgrade pip
	@echo "Installing backend dependencies..."
	cd $(BACKEND_DIR) && pip install -r requirements.txt
	@echo "Installing e2e-tests dependencies and browsers..."
	cd $(E2E_DIR) && $(PNPM) install && $(PNPM) run install:browsers
	@echo "Installing pre-commit..."
	pip install pre-commit

setup-pre-commit: ## Install pre-commit hooks
	@echo "Setting up pre-commit hooks..."
	pre-commit install

update-versions: ## Update language versions across all configuration files
	@echo "Updating language versions across configuration files..."
	node update-versions.js

dev: ## Start development servers for both frontend and backend
	@echo "Starting development servers for frontend and backend..."
	$(DOCKER_COMPOSE) -f $(DEV_COMPOSE_FILE) build -q
	$(DOCKER_COMPOSE) -f $(DEV_COMPOSE_FILE) up

test: ## Run all tests (frontend, backend, and end-to-end)
	@echo "Running all tests (frontend, backend, and end-to-end)..."
	@$(MAKE) frontend-test
	@$(MAKE) backend-test
	@$(MAKE) e2e-test

lint: ## Run linting for frontend, backend, e2e-tests, YAML and Markdown files
	@echo "Running linting for all components..."
	@$(MAKE) frontend-lint
	@$(MAKE) frontend-type-check
	@$(MAKE) backend-lint
	@$(MAKE) e2e-lint
	@$(MAKE) e2e-type-check
	@$(MAKE) yaml-lint
	@$(MAKE) markdown-lint

format: ## Format code in frontend, backend, e2e-tests, YAML and Markdown files
	@echo "Formatting code in all components..."
	@$(MAKE) frontend-format
	@$(MAKE) backend-format
	@$(MAKE) e2e-format
	@$(MAKE) yaml-format
	@$(MAKE) markdown-format

clean: ## Clean up build artifacts, cache, logs, temporary files, and Docker resources
	@echo "Cleaning up frontend build artifacts and temporary files..."
	@cd $(FRONTEND_DIR) && rm -rf dist dist-ssr node_modules coverage logs *.log npm-debug.log* yarn-debug.log* yarn-error.log* pnpm-debug.log* lerna-debug.log* .pnpm-store *.tsbuildinfo *.local

	@echo "Cleaning up backend Python cache and build artifacts..."
	@cd $(BACKEND_DIR) && find . -type d -name "__pycache__" -exec rm -rf {} +
	@cd $(BACKEND_DIR) && find . -type f -name "*.pyc" -delete
	@cd $(BACKEND_DIR) && find . -type f -name "*.pyo" -delete
	@cd $(BACKEND_DIR) && find . -type f -name "*.pyd" -delete
	@cd $(BACKEND_DIR) && find . -type f -name "*.log" -delete
	@echo "Cleaning up backend test and cache directories..."
	@cd $(BACKEND_DIR) && rm -rf .pytest_cache .coverage htmlcov .ruff_cache .mypy_cache .tox coverage.xml nosetests.xml pip-log.txt pip-delete-this-directory.txt *.egg-info .installed.cfg *.egg
	@echo "Removing backend database file..."
	@cd $(BACKEND_DIR) && rm -f jira_analyzer.db

	@echo "Cleaning up e2e-tests build artifacts and test results..."
	@cd $(E2E_DIR) && rm -rf node_modules test-results playwright-report blob-report playwright/.cache screenshots logs *.log npm-debug.log* yarn-debug.log* yarn-error.log* pnpm-debug.log* *.tsbuildinfo

	@echo "Cleaning up project-level temporary files and logs..."
	@rm -rf tmp .aider* .cache
	@find . -type f -name "*.log" -delete

	# Docker cleanup
	@echo "Stopping and removing Docker containers..."
	@$(DOCKER_COMPOSE) -f $(DEV_COMPOSE_FILE) down --remove-orphans || true
	@$(DOCKER_COMPOSE) -f $(PROD_COMPOSE_FILE) down --remove-orphans || true

	@echo "Removing Docker networks..."
	@$(DOCKER) network rm jira-analyzer-network-dev jira-analyzer-network 2>/dev/null || true

	@echo "Removing Docker images..."
	@$(DOCKER) rmi $(DOCKER_IMAGES_TO_REMOVE) 2>/dev/null || true

build: ## Build the production version of the application
	@echo "Building production frontend Docker image..."
	@$(DOCKER) build -q -t $(JIRA_FRONTEND_IMAGE) -f $(FRONTEND_DIR)/Dockerfile --target nginx $(FRONTEND_DIR)
	@echo "Building production backend Docker image..."
	@$(DOCKER) build -q -t $(JIRA_BACKEND_IMAGE) -f $(BACKEND_DIR)/Dockerfile --target production $(BACKEND_DIR)

docker-build: ## Build production Docker images
	@echo "Building all production Docker images..."
	@$(DOCKER_COMPOSE) build -q

node-base: ## Build the shared Node.js base image
	@$(DOCKER) build -q -t $(NODE_BASE_IMAGE) \
		-f Dockerfile.node-base --target node-base .

node-base-ci: ## Build the shared Node.js CI base image
	@$(DOCKER) build -q -t $(NODE_BASE_CI_IMAGE) \
		-f Dockerfile.node-base --target node-base-ci .

# Image building targets
frontend-dev-image: node-base ## Build the frontend development image
	@$(DOCKER) build -q -t $(FRONTEND_DEV_IMAGE) \
		--build-arg USER_ID=$(USER_ID) \
		--build-arg GROUP_ID=$(GROUP_ID) \
		-f $(FRONTEND_DIR)/Dockerfile --target development-nonroot $(FRONTEND_DIR)

frontend-ci-image: node-base-ci ## Build the frontend CI image
	@$(DOCKER) build -q -t $(FRONTEND_CI_IMAGE) \
		-f $(FRONTEND_DIR)/Dockerfile --target ci $(FRONTEND_DIR)

e2e-dev-image: node-base ## Build the e2e-tests development image
	@$(DOCKER) build -q -t $(E2E_DEV_IMAGE) \
		--build-arg USER_ID=$(USER_ID) \
		--build-arg GROUP_ID=$(GROUP_ID) \
		-f $(E2E_DIR)/Dockerfile --target development-nonroot $(E2E_DIR)

e2e-ci-image: node-base-ci ## Build the e2e-tests CI image
	@$(DOCKER) build -q -t $(E2E_CI_IMAGE) \
		-f $(E2E_DIR)/Dockerfile --target ci $(E2E_DIR)

# Common frontend Docker volume mounts
FRONTEND_VOLUMES := \
	-v $(PWD)/$(FRONTEND_DIR)/src:/frontend/src \
	-v $(PWD)/$(FRONTEND_DIR)/public:/frontend/public \
	-v $(PWD)/$(FRONTEND_DIR)/index.html:/frontend/index.html \
	-v $(PWD)/$(FRONTEND_DIR)/package.json:/frontend/package.json \
	-v $(PWD)/$(FRONTEND_DIR)/pnpm-lock.yaml:/frontend/pnpm-lock.yaml \
	-v $(PWD)/$(FRONTEND_DIR)/tsconfig.json:/frontend/tsconfig.json \
	-v $(PWD)/$(FRONTEND_DIR)/tsconfig.node.json:/frontend/tsconfig.node.json \
	-v $(PWD)/$(FRONTEND_DIR)/vite.config.ts:/frontend/vite.config.ts \
	-v $(PWD)/$(FRONTEND_DIR)/vitest.config.ts:/frontend/vitest.config.ts \
	-v $(PWD)/$(FRONTEND_DIR)/test:/frontend/test

frontend-test: frontend-dev-image ## Run frontend tests only (run once and exit)
	@echo "Running frontend tests..."
	@$(DOCKER) run --rm \
		$(FRONTEND_VOLUMES) \
		$(FRONTEND_DEV_IMAGE) $(PNPM) test

frontend-test-ci: node-base frontend-ci-image ## Run frontend tests in CI mode (non-interactive)
	@echo "Running frontend tests in CI mode..."
	@$(DOCKER) run --rm \
		$(FRONTEND_VOLUMES) \
		$(FRONTEND_CI_IMAGE) $(PNPM) test

frontend-test-watch: frontend-dev-image ## Run frontend tests in watch mode
	@echo "Running frontend tests in watch mode..."
	@$(DOCKER) run --rm -ti \
		$(FRONTEND_VOLUMES) \
		$(FRONTEND_DEV_IMAGE) $(PNPM) test:watch

backend-test: ## Run backend tests only
	@$(DOCKER) build -q -t $(BACKEND_DEV_IMAGE) -f $(BACKEND_DIR)/Dockerfile --target development-enhanced $(BACKEND_DIR)
	@echo "Running backend tests..."
	@$(DOCKER) run --rm -v $(PWD)/$(BACKEND_DIR):/app $(BACKEND_DEV_IMAGE) $(PYTEST)

backend-unit-test: ## Run backend unit tests only
	@$(DOCKER) build -q -t $(BACKEND_DEV_IMAGE) -f $(BACKEND_DIR)/Dockerfile --target development-enhanced $(BACKEND_DIR)
	@echo "Running backend unit tests..."
	@$(DOCKER) run --rm -ti -v $(PWD)/$(BACKEND_DIR):/app $(BACKEND_DEV_IMAGE) $(PYTEST) tests/unit

backend-unit-test-ci: ## Run backend unit tests in CI mode (non-interactive)
	@$(DOCKER) build -q -t $(BACKEND_DEV_IMAGE) -f $(BACKEND_DIR)/Dockerfile --target ci $(BACKEND_DIR)
	@echo "Running backend unit tests in CI mode..."
	@$(DOCKER) run --rm -v $(PWD)/$(BACKEND_DIR):/app $(BACKEND_DEV_IMAGE) $(PYTEST) tests/unit

backend-integration-test: ## Run backend integration tests only
	@$(DOCKER) build -q -t $(BACKEND_DEV_IMAGE) -f $(BACKEND_DIR)/Dockerfile --target development-enhanced $(BACKEND_DIR)
	@echo "Running backend integration tests..."
	@$(DOCKER) run --rm -ti -v $(PWD)/$(BACKEND_DIR):/app $(BACKEND_DEV_IMAGE) $(PYTEST) tests/test_config.py tests/test_input_validation.py tests/test_metric_calculations.py tests/test_api_metrics.py

backend-fast-test: ## Run backend tests with optimizations
	@$(DOCKER) build -q -t $(BACKEND_DEV_IMAGE) -f $(BACKEND_DIR)/Dockerfile --target development-enhanced $(BACKEND_DIR)
	@echo "Running optimized backend tests..."
	@$(DOCKER) run --rm -ti -v $(PWD)/$(BACKEND_DIR):/app $(BACKEND_DEV_IMAGE) $(PYTEST) -xvs --no-header

frontend-lint: frontend-dev-image ## Run frontend linting only
	@echo "Running frontend linting..."
	@$(DOCKER) run --rm -ti -v $(PWD)/$(FRONTEND_DIR):/app $(FRONTEND_DEV_IMAGE) sh -c "$(PNPM) run lint && npx eslint --format stylish '*.{js,jsx,ts,tsx,json}'"

frontend-lint-ci: node-base frontend-ci-image ## Run frontend linting in CI mode (non-interactive)
	@echo "Running frontend linting in CI mode..."
	@$(DOCKER) run --rm -v $(PWD)/$(FRONTEND_DIR):/app $(FRONTEND_CI_IMAGE) sh -c "$(PNPM) run lint && npx eslint --format stylish '*.{js,jsx,ts,tsx,json}'"

backend-lint: ## Run backend linting only
	@$(DOCKER) build -q -t $(BACKEND_DEV_IMAGE) -f $(BACKEND_DIR)/Dockerfile --target development-enhanced $(BACKEND_DIR)
	@echo "Running backend linting (ruff, mypy, bandit)..."
	@$(DOCKER) run --rm -ti -v $(PWD)/$(BACKEND_DIR):/app $(BACKEND_DEV_IMAGE) sh -c "ruff check app tests && mypy --explicit-package-bases --namespace-packages --ignore-missing-imports --exclude 'app/migrations/|tests/unit/conftest\.py' app tests && bandit -c pyproject.toml -r app tests"

backend-lint-ci: ## Run backend linting in CI mode (non-interactive)
	@$(DOCKER) build -q -t $(BACKEND_DEV_IMAGE) -f $(BACKEND_DIR)/Dockerfile --target ci $(BACKEND_DIR)
	@echo "Running backend linting in CI mode (ruff, mypy, bandit)..."
	@$(DOCKER) run --rm -v $(PWD)/$(BACKEND_DIR):/app $(BACKEND_DEV_IMAGE) sh -c "ruff check app tests && mypy --explicit-package-bases --namespace-packages --ignore-missing-imports --exclude 'app/migrations/|tests/unit/conftest\.py' app tests && bandit -c pyproject.toml -r app tests"

frontend-format: frontend-dev-image ## Format frontend code only
	@echo "Formatting frontend code..."
	@$(DOCKER) run --rm -ti -v $(PWD)/$(FRONTEND_DIR):/app $(FRONTEND_DEV_IMAGE) $(PNPM) run format

frontend-format-ci: node-base frontend-ci-image ## Format frontend code in CI mode (non-interactive)
	@echo "Formatting frontend code in CI mode..."
	@$(DOCKER) run --rm -v $(PWD)/$(FRONTEND_DIR):/app $(FRONTEND_CI_IMAGE) $(PNPM) run format

frontend-lint-fix: frontend-dev-image ## Auto-fix frontend linting issues
	@echo "Auto-fixing frontend linting issues..."
	@$(DOCKER) run --rm -ti -v $(PWD)/$(FRONTEND_DIR):/app $(FRONTEND_DEV_IMAGE) sh -c "$(PNPM) run lint:fix && npx eslint --fix --format stylish '*.{js,jsx,ts,tsx,json}'"

frontend-lint-fix-ci: node-base frontend-ci-image ## Auto-fix frontend linting issues in CI mode (non-interactive)
	@echo "Auto-fixing frontend linting issues in CI mode..."
	@$(DOCKER) run --rm -v $(PWD)/$(FRONTEND_DIR):/app $(FRONTEND_CI_IMAGE) sh -c "$(PNPM) run lint:fix && npx eslint --fix --format stylish '*.{js,jsx,ts,tsx,json}'"

frontend-type-check: frontend-dev-image ## Run TypeScript type checking
	@echo "Running frontend TypeScript type checking..."
	@$(DOCKER) run --rm -ti -v $(PWD)/$(FRONTEND_DIR):/app $(FRONTEND_DEV_IMAGE) $(PNPM) run type-check

frontend-type-check-ci: node-base frontend-ci-image ## Run TypeScript type checking in CI mode (non-interactive)
	@echo "Running frontend TypeScript type checking in CI mode..."
	@$(DOCKER) run --rm -v $(PWD)/$(FRONTEND_DIR):/app $(FRONTEND_CI_IMAGE) $(PNPM) run type-check

backend-format: ## Format backend code only
	@$(DOCKER) build -q -t $(BACKEND_DEV_IMAGE) -f $(BACKEND_DIR)/Dockerfile --target development-enhanced $(BACKEND_DIR)
	@echo "Formatting backend code with ruff..."
	@$(DOCKER) run --rm -ti -v $(PWD)/$(BACKEND_DIR):/app $(BACKEND_DEV_IMAGE) ruff format app tests --exclude app/migrations/versions/

backend-format-ci: ## Format backend code in CI mode (non-interactive)
	@$(DOCKER) build -q -t $(BACKEND_DEV_IMAGE) -f $(BACKEND_DIR)/Dockerfile --target ci $(BACKEND_DIR)
	@echo "Formatting backend code with ruff in CI mode..."
	@$(DOCKER) run --rm -v $(PWD)/$(BACKEND_DIR):/app $(BACKEND_DEV_IMAGE) ruff format app tests --exclude app/migrations/versions/

backend-lint-fix: ## Auto-fix backend linting issues
	@$(DOCKER) build -q -t $(BACKEND_DEV_IMAGE) -f $(BACKEND_DIR)/Dockerfile --target development-enhanced $(BACKEND_DIR)
	@echo "Auto-fixing backend linting issues (ruff, mypy, bandit)..."
	@$(DOCKER) run --rm -ti -v $(PWD)/$(BACKEND_DIR):/app $(BACKEND_DEV_IMAGE) sh -c "ruff check --fix --exit-non-zero-on-fix app tests && ruff format app tests --exclude app/migrations/versions/ && mypy --explicit-package-bases --namespace-packages --ignore-missing-imports --exclude 'app/migrations/|tests/unit/conftest\.py' app tests && bandit -c pyproject.toml -r app tests"

backend-lint-fix-ci: ## Auto-fix backend linting issues in CI mode (non-interactive)
	@$(DOCKER) build -q -t $(BACKEND_DEV_IMAGE) -f $(BACKEND_DIR)/Dockerfile --target ci $(BACKEND_DIR)
	@echo "Auto-fixing backend linting issues in CI mode (ruff, mypy, bandit)..."
	@$(DOCKER) run --rm -v $(PWD)/$(BACKEND_DIR):/app $(BACKEND_DEV_IMAGE) sh -c "ruff check --fix --exit-non-zero-on-fix app tests && ruff format app tests --exclude app/migrations/versions/ && mypy --explicit-package-bases --namespace-packages --ignore-missing-imports --exclude 'app/migrations/|tests/unit/conftest\.py' app tests && bandit -c pyproject.toml -r app tests"

lint-fix: ## Auto-fix linting issues in frontend, backend, e2e-tests, YAML and Markdown files
	@echo "Auto-fixing linting issues in all components..."
	@$(MAKE) frontend-lint-fix
	@$(MAKE) frontend-type-check
	@$(MAKE) backend-lint-fix
	@$(MAKE) e2e-lint-fix
	@$(MAKE) e2e-type-check
	@$(MAKE) yaml-format
	@$(MAKE) markdown-format

pre-commit-run: ## Run pre-commit hooks on all files
	@echo "Running pre-commit hooks on all files..."
	@pre-commit run --all-files

e2e-test: ## Run end-to-end tests (without debug logs by default)
	@echo "Running end-to-end tests..."
	@cd $(E2E_DIR) && ./run-tests.sh --no-debug

e2e-test-debug: ## Run end-to-end tests with debug output
	@echo "Running end-to-end tests with debug output..."
	@cd $(E2E_DIR) && ./run-tests.sh

e2e-test-ui: ## Run end-to-end tests with UI mode
	@echo "Running end-to-end tests in UI mode..."
	@cd $(E2E_DIR) && $(PNPM) run test:ui

e2e-test-headed: ## Run end-to-end tests in headed mode (visible browser)
	@echo "Running end-to-end tests in headed mode (visible browser)..."
	@cd $(E2E_DIR) && $(PNPM) run run-tests:headed

e2e-test-ci: ## Run end-to-end tests in CI mode (non-interactive)
	@echo "Running end-to-end tests in CI mode..."
	@cd $(E2E_DIR) && CI=true ./run-tests.sh --no-debug

e2e-lint: e2e-dev-image ## Run linting for e2e-tests
	@echo "Running e2e-tests linting..."
	@$(DOCKER) run --rm -ti -v $(PWD)/$(E2E_DIR):/app $(E2E_DEV_IMAGE) sh -c "$(PNPM) run lint && npx eslint --format stylish '*.{js,jsx,ts,tsx,json}'"

e2e-lint-ci: node-base e2e-ci-image ## Run linting for e2e-tests in CI mode (non-interactive)
	@echo "Running e2e-tests linting in CI mode..."
	@$(DOCKER) run --rm -v $(PWD)/$(E2E_DIR):/app $(E2E_CI_IMAGE) sh -c "$(PNPM) run lint:strict && npx eslint --format stylish '*.{js,jsx,ts,tsx,json}'"

e2e-lint-fix: e2e-dev-image ## Auto-fix linting issues in e2e-tests
	@echo "Auto-fixing e2e-tests linting issues..."
	@$(DOCKER) run --rm -ti -v $(PWD)/$(E2E_DIR):/app $(E2E_DEV_IMAGE) sh -c "$(PNPM) run lint:fix && npx eslint --fix --format stylish '*.{js,jsx,ts,tsx,json}'"

e2e-lint-fix-ci: node-base e2e-ci-image ## Auto-fix linting issues in e2e-tests in CI mode (non-interactive)
	@echo "Auto-fixing e2e-tests linting issues in CI mode..."
	@$(DOCKER) run --rm -v $(PWD)/$(E2E_DIR):/app $(E2E_CI_IMAGE) sh -c "$(PNPM) run lint:fix && npx eslint --fix --format stylish '*.{js,jsx,ts,tsx,json}'"

e2e-format: e2e-dev-image ## Format e2e-tests code
	@echo "Formatting e2e-tests code..."
	@$(DOCKER) run --rm -ti -v $(PWD)/$(E2E_DIR):/app $(E2E_DEV_IMAGE) $(PNPM) run format

e2e-format-ci: node-base e2e-ci-image ## Format e2e-tests code in CI mode (non-interactive)
	@echo "Formatting e2e-tests code in CI mode..."
	@$(DOCKER) run --rm -v $(PWD)/$(E2E_DIR):/app $(E2E_CI_IMAGE) $(PNPM) run format

e2e-format-check: e2e-dev-image ## Check e2e-tests code formatting
	@echo "Checking e2e-tests code formatting..."
	@$(DOCKER) run --rm -ti -v $(PWD)/$(E2E_DIR):/app $(E2E_DEV_IMAGE) $(PNPM) run format:check

e2e-format-check-ci: node-base e2e-ci-image ## Check e2e-tests code formatting in CI mode (non-interactive)
	@echo "Checking e2e-tests code formatting in CI mode..."
	@$(DOCKER) run --rm -v $(PWD)/$(E2E_DIR):/app $(E2E_CI_IMAGE) $(PNPM) run format:check

e2e-type-check: e2e-dev-image ## Run TypeScript type checking for e2e-tests
	@echo "Running e2e-tests TypeScript type checking..."
	@$(DOCKER) run --rm -ti -v $(PWD)/$(E2E_DIR):/app $(E2E_DEV_IMAGE) $(PNPM) run type-check

e2e-type-check-ci: node-base e2e-ci-image ## Run TypeScript type checking for e2e-tests in CI mode (non-interactive)
	@echo "Running e2e-tests TypeScript type checking in CI mode..."
	@$(DOCKER) run --rm -v $(PWD)/$(E2E_DIR):/app $(E2E_CI_IMAGE) $(PNPM) run type-check

yaml-lint: ## Lint YAML files
	@$(DOCKER) build -q -t $(BACKEND_DEV_IMAGE) -f $(BACKEND_DIR)/Dockerfile --target development-enhanced $(BACKEND_DIR)
	@echo "Running YAML linting..."
	@$(DOCKER) run --rm -ti -v $(PWD):/app --entrypoint /bin/sh $(BACKEND_DEV_IMAGE) -c "find /app -type d \( -name 'node_modules' -o -name 'pnpm-store' -o -name '.git' -o -name '.venv' -o -name 'dist' -o -name 'dist-ssr' -o -name 'build' -o -name '.pnpm' -o -name '.npm' -o -name '.cache' -o -name 'vendor' \) -prune -o -type f \( -name '*.yml' -o -name '*.yaml' \) \( -not -name '*pnpm-lock.yaml' \) -not -path '*/generated/*' -not -path '*/auto-generated/*' -not -path '*/dist/*' -not -name '*.generated.yaml' -not -name '*.generated.yml' -print | xargs yamllint -c /app/.yamllint.yml"

yamlfmt-image: ## Build the yamlfmt Docker image
	@$(DOCKER) build -q -t $(YAMLFMT_IMAGE) -f Dockerfile.yamlfmt .

yaml-format: yamlfmt-image ## Format YAML files
	@echo "Running step: yaml-format - Formatting YAML files..."
	@$(DOCKER) run --rm -ti -v $(PWD):/app --entrypoint /bin/sh $(YAMLFMT_IMAGE) -c "find /app -type d \( -name 'node_modules' -o -name 'pnpm-store' -o -name '.git' -o -name '.venv' -o -name 'dist' -o -name 'dist-ssr' -o -name 'build' -o -name '.pnpm' -o -name '.npm' -o -name '.cache' -o -name 'vendor' \) -prune -o -type f \( -name '*.yml' -o -name '*.yaml' \) -not -name 'pnpm-lock.yaml' -not -path '*/generated/*' -not -path '*/auto-generated/*' -not -path '*/dist/*' -not -name '*.generated.yaml' -not -name '*.generated.yml' -print | xargs yamlfmt -conf /app/.yamlfmt.yml"

yaml-format-check: yamlfmt-image ## Check YAML files formatting
	@echo "Running step: yaml-format-check - Checking YAML files formatting..."
	@$(DOCKER) run --rm -ti -v $(PWD):/app --entrypoint /bin/sh $(YAMLFMT_IMAGE) -c "find /app -type d \( -name 'node_modules' -o -name 'pnpm-store' -o -name '.git' -o -name '.venv' -o -name 'dist' -o -name 'dist-ssr' -o -name 'build' -o -name '.pnpm' -o -name '.npm' -o -name '.cache' -o -name 'vendor' \) -prune -o -type f \( -name '*.yml' -o -name '*.yaml' \) -not -name 'pnpm-lock.yaml' -not -path '*/generated/*' -not -path '*/auto-generated/*' -not -path '*/dist/*' -not -name '*.generated.yaml' -not -name '*.generated.yml' -print | xargs yamlfmt -conf /app/.yamlfmt.yml -lint"

yaml-format-ci: yamlfmt-image ## Format YAML files in CI mode (non-interactive)
	@echo "Running step: yaml-format-ci - Formatting YAML files in CI mode..."
	@$(DOCKER) run --rm -v $(PWD):/app --entrypoint /bin/sh $(YAMLFMT_IMAGE) -c "find /app -type d \( -name 'node_modules' -o -name 'pnpm-store' -o -name '.git' -o -name '.venv' -o -name 'dist' -o -name 'dist-ssr' -o -name 'build' -o -name '.pnpm' -o -name '.npm' -o -name '.cache' -o -name 'vendor' \) -prune -o -type f \( -name '*.yml' -o -name '*.yaml' \) -not -name 'pnpm-lock.yaml' -not -path '*/generated/*' -not -path '*/auto-generated/*' -not -path '*/dist/*' -not -name '*.generated.yaml' -not -name '*.generated.yml' -print | xargs yamlfmt -conf /app/.yamlfmt.yml"

yaml-format-check-ci: yamlfmt-image ## Check YAML files formatting in CI mode (non-interactive)
	@echo "Running step: yaml-format-check-ci - Checking YAML files formatting in CI mode..."
	@$(DOCKER) run --rm -v $(PWD):/app --entrypoint /bin/sh $(YAMLFMT_IMAGE) -c "find /app -type d \( -name 'node_modules' -o -name 'pnpm-store' -o -name '.git' -o -name '.venv' -o -name 'dist' -o -name 'dist-ssr' -o -name 'build' -o -name '.pnpm' -o -name '.npm' -o -name '.cache' -o -name 'vendor' \) -prune -o -type f \( -name '*.yml' -o -name '*.yaml' \) -not -name 'pnpm-lock.yaml' -not -path '*/generated/*' -not -path '*/auto-generated/*' -not -path '*/dist/*' -not -name '*.generated.yaml' -not -name '*.generated.yml' -print | xargs yamlfmt -conf /app/.yamlfmt.yml -lint"

markdown-lint: ## Lint Markdown files
	@$(DOCKER) build -q -t $(MARKDOWN_LINT_IMAGE) -f Dockerfile.markdownlint .
	@echo "Running Markdown linting..."
	@cd $(PWD) && $(DOCKER) run --rm -v $(PWD):/app -w /app $(MARKDOWN_LINT_IMAGE) markdownlint-cli2 || true

markdown-lint-ci: ## Lint Markdown files in CI mode (non-interactive)
	@$(DOCKER) build -q -t $(MARKDOWN_LINT_IMAGE) -f Dockerfile.markdownlint .
	@echo "Running Markdown linting in CI mode..."
	@cd $(PWD) && $(DOCKER) run --rm -v $(PWD):/app -w /app $(MARKDOWN_LINT_IMAGE) markdownlint-cli2 || true

markdown-format: ## Format Markdown files
	@$(DOCKER) build -q -t $(MARKDOWN_LINT_IMAGE) -f Dockerfile.markdownlint .
	@echo "Formatting Markdown files..."
	@cd $(PWD) && $(DOCKER) run --rm -v $(PWD):/app -w /app $(MARKDOWN_LINT_IMAGE) markdownlint-cli2 --fix || true

markdown-format-ci: ## Format Markdown files in CI mode (non-interactive)
	@$(DOCKER) build -q -t $(MARKDOWN_LINT_IMAGE) -f Dockerfile.markdownlint .
	@echo "Formatting Markdown files in CI mode..."
	@cd $(PWD) && $(DOCKER) run --rm -v $(PWD):/app -w /app $(MARKDOWN_LINT_IMAGE) markdownlint-cli2 --fix || true

# GitHub Actions testing
GITHUB_ACTIONS_SCRIPT := .github/test-workflows.sh
CONTAINER_ARCH := linux/amd64

test-github-actions: ## Test GitHub Actions workflows locally using act
	@echo "Running GitHub Actions workflows locally..."
	@$(GITHUB_ACTIONS_SCRIPT) -w ci.yml -j frontend-checks -j backend-checks --container-architecture $(CONTAINER_ARCH)
	@$(GITHUB_ACTIONS_SCRIPT) -w e2e-tests.yml -j e2e-checks --container-architecture $(CONTAINER_ARCH)
	@$(GITHUB_ACTIONS_SCRIPT) -w pre-commit.yml -j pre-commit-check --container-architecture $(CONTAINER_ARCH)

test-github-actions-ci: ## Test GitHub Actions CI workflow locally using act
	@echo "Running GitHub Actions CI workflow locally..."
	@$(GITHUB_ACTIONS_SCRIPT) -w ci.yml --container-architecture $(CONTAINER_ARCH)

test-github-actions-e2e: ## Test GitHub Actions E2E workflow locally using act
	@echo "Running GitHub Actions E2E tests workflow locally..."
	@$(GITHUB_ACTIONS_SCRIPT) -w e2e-tests.yml --container-architecture $(CONTAINER_ARCH)
