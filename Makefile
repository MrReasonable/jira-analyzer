# Makefile for Jira Analyzer project

.PHONY: help install dev test lint format clean build docker-build docker-dev setup-pre-commit update-versions

# Show help message for all make commands
help:
	@echo "Available commands:"
	@grep -E '^[^#]*:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

install: ## Install all dependencies for frontend, backend, and e2e-tests
	@echo "Installing frontend dependencies..."
	cd frontend && pnpm install
	@echo "Upgrading pip..."
	pip install --upgrade pip
	@echo "Installing backend dependencies..."
	cd backend && pip install -r requirements.txt
	@echo "Installing e2e-tests dependencies and browsers..."
	cd e2e-tests && pnpm install && pnpm run install:browsers
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
	docker-compose -f docker-compose.dev.yml up -q --build

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
	@cd frontend && rm -rf dist dist-ssr node_modules coverage logs *.log npm-debug.log* yarn-debug.log* yarn-error.log* pnpm-debug.log* lerna-debug.log* .pnpm-store *.tsbuildinfo *.local

	@echo "Cleaning up backend Python cache and build artifacts..."
	@cd backend && find . -type d -name "__pycache__" -exec rm -rf {} +
	@cd backend && find . -type f -name "*.pyc" -delete
	@cd backend && find . -type f -name "*.pyo" -delete
	@cd backend && find . -type f -name "*.pyd" -delete
	@cd backend && find . -type f -name "*.log" -delete
	@echo "Cleaning up backend test and cache directories..."
	@cd backend && rm -rf .pytest_cache .coverage htmlcov .ruff_cache .mypy_cache .tox coverage.xml nosetests.xml pip-log.txt pip-delete-this-directory.txt *.egg-info .installed.cfg *.egg
	@echo "Removing backend database file..."
	@cd backend && rm -f jira_analyzer.db

	@echo "Cleaning up e2e-tests build artifacts and test results..."
	@cd e2e-tests && rm -rf node_modules test-results playwright-report blob-report playwright/.cache screenshots logs *.log npm-debug.log* yarn-debug.log* yarn-error.log* pnpm-debug.log* *.tsbuildinfo

	@echo "Cleaning up project-level temporary files and logs..."
	@rm -rf tmp .aider* .cache
	@find . -type f -name "*.log" -delete

	# Docker cleanup
	@echo "Stopping and removing Docker containers..."
	@docker-compose -f docker-compose.dev.yml down --remove-orphans || true
	@docker-compose -f docker-compose.yml down --remove-orphans || true

	@echo "Removing Docker networks..."
	@docker network rm jira-analyzer-network-dev jira-analyzer-network 2>/dev/null || true

	@echo "Removing Docker images..."
	@docker rmi jira-analyzer-frontend jira-analyzer-backend jira-analyzer-frontend-dev jira-analyzer-backend-dev frontend-dev frontend-ci backend-dev 2>/dev/null || true

build: ## Build the production version of the application
	@echo "Building production frontend Docker image..."
	@docker build -q -t jira-analyzer-frontend -f frontend/Dockerfile --target nginx frontend
	@echo "Building production backend Docker image..."
	@docker build -q -t jira-analyzer-backend -f backend/Dockerfile --target production backend

docker-build: ## Build production Docker images
	@echo "Building all production Docker images..."
	@docker-compose build -q

docker-dev: ## Start development environment using Docker
	@echo "Starting development environment using Docker..."
	@docker-compose -f docker-compose.dev.yml up -q --build

node-base: ## Build the shared Node.js base image
	@docker build -q -t node-base \
	@docker build -q -t node-base \
		-f Dockerfile.node-base --target node-base .

node-base-ci: ## Build the shared Node.js CI base image
	@docker build -q -t node-base-ci \
	@docker build -q -t node-base-ci \
		-f Dockerfile.node-base --target node-base-ci .

# Image building targets
frontend-dev-image: node-base ## Build the frontend development image
	@docker build -q -t frontend-dev \
	@docker build -q -t frontend-dev \
		--build-arg USER_ID=$(shell id -u) \
		--build-arg GROUP_ID=$(shell id -g) \
		-f frontend/Dockerfile --target development-nonroot frontend

frontend-ci-image: node-base-ci ## Build the frontend CI image
	@docker build -q -t frontend-ci \
	@docker build -q -t frontend-ci \
		-f frontend/Dockerfile --target ci frontend

e2e-dev-image: node-base ## Build the e2e-tests development image
	@docker build -q -t e2e-dev \
	@docker build -q -t e2e-dev \
		--build-arg USER_ID=$(shell id -u) \
		--build-arg GROUP_ID=$(shell id -g) \
		-f e2e-tests/Dockerfile --target development-nonroot e2e-tests

e2e-ci-image: node-base-ci ## Build the e2e-tests CI image
	@docker build -q -t e2e-ci \
	@docker build -q -t e2e-ci \
		-f e2e-tests/Dockerfile --target ci e2e-tests

frontend-test: frontend-dev-image ## Run frontend tests only (run once and exit)
	@echo "Running frontend tests..."
	@docker run --rm \
		-v $(PWD)/frontend/src:/frontend/src \
		-v $(PWD)/frontend/public:/frontend/public \
		-v $(PWD)/frontend/index.html:/frontend/index.html \
		-v $(PWD)/frontend/package.json:/frontend/package.json \
		-v $(PWD)/frontend/pnpm-lock.yaml:/frontend/pnpm-lock.yaml \
		-v $(PWD)/frontend/tsconfig.json:/frontend/tsconfig.json \
		-v $(PWD)/frontend/tsconfig.node.json:/frontend/tsconfig.node.json \
		-v $(PWD)/frontend/vite.config.ts:/frontend/vite.config.ts \
		-v $(PWD)/frontend/vitest.config.ts:/frontend/vitest.config.ts \
		-v $(PWD)/frontend/test:/frontend/test \
		frontend-dev pnpm test

frontend-test-ci: node-base frontend-ci-image ## Run frontend tests in CI mode (non-interactive)
	@echo "Running frontend tests in CI mode..."
	@docker run --rm \
		-v $(PWD)/frontend/src:/frontend/src \
		-v $(PWD)/frontend/public:/frontend/public \
		-v $(PWD)/frontend/index.html:/frontend/index.html \
		-v $(PWD)/frontend/package.json:/frontend/package.json \
		-v $(PWD)/frontend/pnpm-lock.yaml:/frontend/pnpm-lock.yaml \
		-v $(PWD)/frontend/tsconfig.json:/frontend/tsconfig.json \
		-v $(PWD)/frontend/tsconfig.node.json:/frontend/tsconfig.node.json \
		-v $(PWD)/frontend/vite.config.ts:/frontend/vite.config.ts \
		-v $(PWD)/frontend/vitest.config.ts:/frontend/vitest.config.ts \
		frontend-ci pnpm test

frontend-test-watch: frontend-dev-image ## Run frontend tests in watch mode
	@echo "Running frontend tests in watch mode..."
	@docker run --rm -ti \
		-v $(PWD)/frontend/src:/frontend/src \
		-v $(PWD)/frontend/public:/frontend/public \
		-v $(PWD)/frontend/index.html:/frontend/index.html \
		-v $(PWD)/frontend/package.json:/frontend/package.json \
		-v $(PWD)/frontend/pnpm-lock.yaml:/frontend/pnpm-lock.yaml \
		-v $(PWD)/frontend/tsconfig.json:/frontend/tsconfig.json \
		-v $(PWD)/frontend/tsconfig.node.json:/frontend/tsconfig.node.json \
		-v $(PWD)/frontend/vite.config.ts:/frontend/vite.config.ts \
		-v $(PWD)/frontend/vitest.config.ts:/frontend/vitest.config.ts \
		frontend-dev pnpm test:watch

backend-test: ## Run backend tests only
	@docker build -q -t backend-dev -f backend/Dockerfile --target development-enhanced backend
	@echo "Running backend tests..."
	@docker run --rm -v $(PWD)/backend:/app backend-dev pytest

backend-unit-test: ## Run backend unit tests only
	@docker build -q -t backend-dev -f backend/Dockerfile --target development-enhanced backend
	@echo "Running backend unit tests..."
	@docker run --rm -ti -v $(PWD)/backend:/app backend-dev pytest tests/unit

backend-unit-test-ci: ## Run backend unit tests in CI mode (non-interactive)
	@docker build -q -t backend-dev -f backend/Dockerfile --target ci backend
	@echo "Running backend unit tests in CI mode..."
	@docker run --rm -v $(PWD)/backend:/app backend-dev pytest tests/unit

backend-integration-test: ## Run backend integration tests only
	@docker build -q -t backend-dev -f backend/Dockerfile --target development-enhanced backend
	@echo "Running backend integration tests..."
	@docker run --rm -ti -v $(PWD)/backend:/app backend-dev pytest tests/test_config.py tests/test_input_validation.py tests/test_metric_calculations.py tests/test_api_metrics.py

backend-fast-test: ## Run backend tests with optimizations
	@docker build -q -t backend-dev -f backend/Dockerfile --target development-enhanced backend
	@echo "Running optimized backend tests..."
	@docker run --rm -ti -v $(PWD)/backend:/app backend-dev pytest -xvs --no-header

frontend-lint: frontend-dev-image ## Run frontend linting only
	@echo "Running frontend linting..."
	@docker run --rm -ti -v $(PWD)/frontend:/app frontend-dev sh -c "pnpm run lint && npx eslint --format stylish '*.{js,jsx,ts,tsx,json}'"

frontend-lint-ci: node-base frontend-ci-image ## Run frontend linting in CI mode (non-interactive)
	@echo "Running frontend linting in CI mode..."
	@docker run --rm -v $(PWD)/frontend:/app frontend-ci sh -c "pnpm run lint && npx eslint --format stylish '*.{js,jsx,ts,tsx,json}'"

backend-lint: ## Run backend linting only
	@docker build -q -t backend-dev -f backend/Dockerfile --target development-enhanced backend
	@echo "Running backend linting (ruff, mypy, bandit)..."
	@docker run --rm -ti -v $(PWD)/backend:/app backend-dev sh -c "ruff check app tests && mypy --explicit-package-bases --namespace-packages --ignore-missing-imports --exclude 'app/migrations/|tests/unit/conftest\.py' app tests && bandit -c pyproject.toml -r app tests"

backend-lint-ci: ## Run backend linting in CI mode (non-interactive)
	@docker build -q -t backend-dev -f backend/Dockerfile --target ci backend
	@echo "Running backend linting in CI mode (ruff, mypy, bandit)..."
	@docker run --rm -v $(PWD)/backend:/app backend-dev sh -c "ruff check app tests && mypy --explicit-package-bases --namespace-packages --ignore-missing-imports --exclude 'app/migrations/|tests/unit/conftest\.py' app tests && bandit -c pyproject.toml -r app tests"

frontend-format: frontend-dev-image ## Format frontend code only
	@echo "Formatting frontend code..."
	@docker run --rm -ti -v $(PWD)/frontend:/app frontend-dev pnpm run format

frontend-format-ci: node-base frontend-ci-image ## Format frontend code in CI mode (non-interactive)
	@echo "Formatting frontend code in CI mode..."
	@docker run --rm -v $(PWD)/frontend:/app frontend-ci pnpm run format

frontend-lint-fix: frontend-dev-image ## Auto-fix frontend linting issues
	@echo "Auto-fixing frontend linting issues..."
	@docker run --rm -ti -v $(PWD)/frontend:/app frontend-dev sh -c "pnpm run lint:fix && npx eslint --fix --format stylish '*.{js,jsx,ts,tsx,json}'"

frontend-lint-fix-ci: node-base frontend-ci-image ## Auto-fix frontend linting issues in CI mode (non-interactive)
	@echo "Auto-fixing frontend linting issues in CI mode..."
	@docker run --rm -v $(PWD)/frontend:/app frontend-ci sh -c "pnpm run lint:fix && npx eslint --fix --format stylish '*.{js,jsx,ts,tsx,json}'"

frontend-type-check: frontend-dev-image ## Run TypeScript type checking
	@echo "Running frontend TypeScript type checking..."
	@docker run --rm -ti -v $(PWD)/frontend:/app frontend-dev pnpm run type-check

frontend-type-check-ci: node-base frontend-ci-image ## Run TypeScript type checking in CI mode (non-interactive)
	@echo "Running frontend TypeScript type checking in CI mode..."
	@docker run --rm -v $(PWD)/frontend:/app frontend-ci pnpm run type-check

backend-format: ## Format backend code only
	@docker build -q -t backend-dev -f backend/Dockerfile --target development-enhanced backend
	@echo "Formatting backend code with ruff..."
	@docker run --rm -ti -v $(PWD)/backend:/app backend-dev ruff format app tests --exclude app/migrations/versions/

backend-format-ci: ## Format backend code in CI mode (non-interactive)
	@docker build -q -t backend-dev -f backend/Dockerfile --target ci backend
	@echo "Formatting backend code with ruff in CI mode..."
	@docker run --rm -v $(PWD)/backend:/app backend-dev ruff format app tests --exclude app/migrations/versions/

backend-lint-fix: ## Auto-fix backend linting issues
	@docker build -q -t backend-dev -f backend/Dockerfile --target development-enhanced backend
	@echo "Auto-fixing backend linting issues (ruff, mypy, bandit)..."
	@docker run --rm -ti -v $(PWD)/backend:/app backend-dev sh -c "ruff check --fix --exit-non-zero-on-fix app tests && ruff format app tests --exclude app/migrations/versions/ && mypy --explicit-package-bases --namespace-packages --ignore-missing-imports --exclude 'app/migrations/|tests/unit/conftest\.py' app tests && bandit -c pyproject.toml -r app tests"

backend-lint-fix-ci: ## Auto-fix backend linting issues in CI mode (non-interactive)
	@docker build -q -t backend-dev -f backend/Dockerfile --target ci backend
	@echo "Auto-fixing backend linting issues in CI mode (ruff, mypy, bandit)..."
	@docker run --rm -v $(PWD)/backend:/app backend-dev sh -c "ruff check --fix --exit-non-zero-on-fix app tests && ruff format app tests --exclude app/migrations/versions/ && mypy --explicit-package-bases --namespace-packages --ignore-missing-imports --exclude 'app/migrations/|tests/unit/conftest\.py' app tests && bandit -c pyproject.toml -r app tests"

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

e2e-test: ## Run end-to-end tests
	@echo "Running end-to-end tests..."
	@cd e2e-tests && pnpm run run-tests

e2e-test-ui: ## Run end-to-end tests with UI mode
	@echo "Running end-to-end tests in UI mode..."
	@cd e2e-tests && pnpm run test:ui

e2e-test-headed: ## Run end-to-end tests in headed mode (visible browser)
	@echo "Running end-to-end tests in headed mode (visible browser)..."
	@cd e2e-tests && pnpm run run-tests:headed

e2e-test-debug: ## Run end-to-end tests with debug output
	@echo "Running end-to-end tests with debug output..."
	@cd e2e-tests && pnpm run run-tests:debug

e2e-test-ci: ## Run end-to-end tests in CI mode (non-interactive)
	@echo "Running end-to-end tests in CI mode..."
	@cd e2e-tests && CI=true pnpm run run-tests

e2e-lint: e2e-dev-image ## Run linting for e2e-tests
	@echo "Running e2e-tests linting..."
	@docker run --rm -ti -v $(PWD)/e2e-tests:/app e2e-dev sh -c "pnpm run lint && npx eslint --format stylish '*.{js,jsx,ts,tsx,json}'"

e2e-lint-ci: node-base e2e-ci-image ## Run linting for e2e-tests in CI mode (non-interactive)
	@echo "Running e2e-tests linting in CI mode..."
	@docker run --rm -v $(PWD)/e2e-tests:/app e2e-ci sh -c "pnpm run lint:strict && npx eslint --format stylish '*.{js,jsx,ts,tsx,json}'"

e2e-lint-fix: e2e-dev-image ## Auto-fix linting issues in e2e-tests
	@echo "Auto-fixing e2e-tests linting issues..."
	@docker run --rm -ti -v $(PWD)/e2e-tests:/app e2e-dev sh -c "pnpm run lint:fix && npx eslint --fix --format stylish '*.{js,jsx,ts,tsx,json}'"

e2e-lint-fix-ci: node-base e2e-ci-image ## Auto-fix linting issues in e2e-tests in CI mode (non-interactive)
	@echo "Auto-fixing e2e-tests linting issues in CI mode..."
	@docker run --rm -v $(PWD)/e2e-tests:/app e2e-ci sh -c "pnpm run lint:fix && npx eslint --fix --format stylish '*.{js,jsx,ts,tsx,json}'"

e2e-format: e2e-dev-image ## Format e2e-tests code
	@echo "Formatting e2e-tests code..."
	@docker run --rm -ti -v $(PWD)/e2e-tests:/app e2e-dev pnpm run format

e2e-format-ci: node-base e2e-ci-image ## Format e2e-tests code in CI mode (non-interactive)
	@echo "Formatting e2e-tests code in CI mode..."
	@docker run --rm -v $(PWD)/e2e-tests:/app e2e-ci pnpm run format

e2e-format-check: e2e-dev-image ## Check e2e-tests code formatting
	@echo "Checking e2e-tests code formatting..."
	@docker run --rm -ti -v $(PWD)/e2e-tests:/app e2e-dev pnpm run format:check

e2e-format-check-ci: node-base e2e-ci-image ## Check e2e-tests code formatting in CI mode (non-interactive)
	@echo "Checking e2e-tests code formatting in CI mode..."
	@docker run --rm -v $(PWD)/e2e-tests:/app e2e-ci pnpm run format:check

e2e-type-check: e2e-dev-image ## Run TypeScript type checking for e2e-tests
	@echo "Running e2e-tests TypeScript type checking..."
	@docker run --rm -ti -v $(PWD)/e2e-tests:/app e2e-dev pnpm run type-check

e2e-type-check-ci: node-base e2e-ci-image ## Run TypeScript type checking for e2e-tests in CI mode (non-interactive)
	@echo "Running e2e-tests TypeScript type checking in CI mode..."
	@docker run --rm -v $(PWD)/e2e-tests:/app e2e-ci pnpm run type-check

yaml-lint: ## Lint YAML files
	@docker build -q -t backend-dev -f backend/Dockerfile --target development-enhanced backend
	@echo "Running YAML linting..."
	@docker run --rm -ti -v $(PWD):/app backend-dev yamllint -c /app/.yamllint.yml .github docker-compose.yml docker-compose.dev.yml

yamlfmt-image: ## Build the yamlfmt Docker image
	@docker build -q -t yamlfmt -f Dockerfile.yamlfmt .
	@docker build -q -t yamlfmt -f Dockerfile.yamlfmt .

yaml-format: yamlfmt-image ## Format YAML files
	@echo "Formatting YAML files..."
	@docker run --rm -ti -v $(PWD):/app yamlfmt -conf .yamlfmt.yml .github/workflows/*.yml .github/dependabot.yml docker-compose.yml docker-compose.dev.yml .yamllint.yml

yaml-format-check: yamlfmt-image ## Check YAML files formatting
	@echo "Checking YAML files formatting..."
	@docker run --rm -ti -v $(PWD):/app yamlfmt -conf .yamlfmt.yml -lint .github/workflows/*.yml .github/dependabot.yml docker-compose.yml docker-compose.dev.yml .yamllint.yml

yaml-format-ci: yamlfmt-image ## Format YAML files in CI mode (non-interactive)
	@echo "Formatting YAML files in CI mode..."
	@docker run --rm -v $(PWD):/app yamlfmt -conf .yamlfmt.yml .github/workflows/*.yml .github/dependabot.yml docker-compose.yml docker-compose.dev.yml .yamllint.yml

yaml-format-check-ci: yamlfmt-image ## Check YAML files formatting in CI mode (non-interactive)
	@echo "Checking YAML files formatting in CI mode..."
	@docker run --rm -v $(PWD):/app yamlfmt -conf .yamlfmt.yml -lint .github/workflows/*.yml .github/dependabot.yml docker-compose.yml docker-compose.dev.yml .yamllint.yml

markdown-lint: ## Lint Markdown files
	@docker build -q -t markdownlint -f Dockerfile.markdownlint .
	@echo "Running Markdown linting..."
	@cd $(PWD) && docker run --rm -v $(PWD):/app -w /app markdownlint markdownlint-cli2 || true

markdown-lint-ci: ## Lint Markdown files in CI mode (non-interactive)
	@docker build -q -t markdownlint -f Dockerfile.markdownlint .
	@echo "Running Markdown linting in CI mode..."
	@cd $(PWD) && docker run --rm -v $(PWD):/app -w /app markdownlint markdownlint-cli2 || true

markdown-format: ## Format Markdown files
	@docker build -q -t markdownlint -f Dockerfile.markdownlint .
	@echo "Formatting Markdown files..."
	@cd $(PWD) && docker run --rm -v $(PWD):/app -w /app markdownlint markdownlint-cli2 --fix || true

markdown-format-ci: ## Format Markdown files in CI mode (non-interactive)
	@docker build -q -t markdownlint -f Dockerfile.markdownlint .
	@echo "Formatting Markdown files in CI mode..."
	@cd $(PWD) && docker run --rm -v $(PWD):/app -w /app markdownlint markdownlint-cli2 --fix || true

test-github-actions: ## Test GitHub Actions workflows locally using act
	@echo "Checking if 'act' is installed..."
	@if ! command -v act &> /dev/null; then \
		echo "Error: 'act' is not installed. Please install it first:"; \
		echo "  - macOS: brew install act"; \
		echo "  - Linux: https://github.com/nektos/act#installation"; \
		exit 1; \
	fi
	@echo "Running GitHub Actions CI workflow locally..."
	@act -j frontend-checks -j backend-checks --workflows .github/workflows/ci.yml --container-architecture linux/amd64

test-github-actions-ci: ## Test GitHub Actions CI workflow locally using act
	@echo "Checking if 'act' is installed..."
	@if ! command -v act &> /dev/null; then \
		echo "Error: 'act' is not installed. Please install it first:"; \
		echo "  - macOS: brew install act"; \
		echo "  - Linux: https://github.com/nektos/act#installation"; \
		exit 1; \
	fi
	@echo "Running GitHub Actions CI workflow locally..."
	@act --workflows .github/workflows/ci.yml --container-architecture linux/amd64

test-github-actions-e2e: ## Test GitHub Actions E2E workflow locally using act
	@echo "Checking if 'act' is installed..."
	@if ! command -v act &> /dev/null; then \
		echo "Error: 'act' is not installed. Please install it first:"; \
		echo "  - macOS: brew install act"; \
		echo "  - Linux: https://github.com/nektos/act#installation"; \
		exit 1; \
	fi
	@echo "Running GitHub Actions E2E tests workflow locally..."
	@act --workflows .github/workflows/e2e-tests.yml --container-architecture linux/amd64
