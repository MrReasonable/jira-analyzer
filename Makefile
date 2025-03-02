# Makefile for Jira Analyzer project

.PHONY: help install dev test lint format clean build docker-build docker-dev setup-pre-commit update-versions

# Show help message for all make commands
help:
	@echo "Available commands:"
	@grep -E '^[^#]*:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

install: ## Install all dependencies for frontend, backend, and e2e-tests
	cd frontend && pnpm install
	cd backend && pip install -r requirements.txt
	cd e2e-tests && npm install && pnpm run install:browsers
	pip install pre-commit

setup-pre-commit: ## Install pre-commit hooks
	pre-commit install

update-versions: ## Update language versions across all configuration files
	node update-versions.js

dev: ## Start development servers for both frontend and backend
	docker-compose -f docker-compose.dev.yml up --build

test: frontend-test backend-test e2e-test ## Run all tests (frontend, backend, and end-to-end)

lint: frontend-lint backend-lint e2e-lint ## Run linting for both frontend, backend, and e2e-tests

format: frontend-format backend-format e2e-format ## Format code in both frontend, backend, and e2e-tests

clean: ## Clean up build artifacts and cache
	cd frontend && rm -rf dist node_modules
	cd backend && find . -type d -name "__pycache__" -exec rm -rf {} +
	cd backend && find . -type f -name "*.pyc" -delete
	cd e2e-tests && rm -rf node_modules test-results playwright-report blob-report playwright/.cache

build: ## Build the production version of the application
	docker build -t jira-analyzer-frontend -f frontend/Dockerfile --target nginx frontend
	docker build -t jira-analyzer-backend -f backend/Dockerfile --target production backend

docker-build: ## Build production Docker images
	docker-compose build

docker-dev: ## Start development environment using Docker
	docker-compose -f docker-compose.dev.yml up --build

frontend-test: ## Run frontend tests only (run once and exit)
	docker build -t frontend-dev \
		--build-arg USER_ID=$(shell id -u) \
		--build-arg GROUP_ID=$(shell id -g) \
		-f frontend/Dockerfile --target development-nonroot frontend
	docker run --rm -ti \
		-v $(PWD)/frontend/src:/app/src \
		-v $(PWD)/frontend/public:/app/public \
		-v $(PWD)/frontend/index.html:/app/index.html \
		-v $(PWD)/frontend/package.json:/app/package.json \
		-v $(PWD)/frontend/pnpm-lock.yaml:/app/pnpm-lock.yaml \
		-v $(PWD)/frontend/tsconfig.json:/app/tsconfig.json \
		-v $(PWD)/frontend/tsconfig.node.json:/app/tsconfig.node.json \
		-v $(PWD)/frontend/vite.config.ts:/app/vite.config.ts \
		-v $(PWD)/frontend/vitest.config.ts:/app/vitest.config.ts \
		frontend-dev pnpm test

frontend-test-ci: ## Run frontend tests in CI mode (non-interactive)
	docker build -t frontend-ci -f frontend/Dockerfile --target ci frontend
	docker run --rm \
		-v $(PWD)/frontend/src:/app/src \
		-v $(PWD)/frontend/public:/app/public \
		-v $(PWD)/frontend/index.html:/app/index.html \
		-v $(PWD)/frontend/package.json:/app/package.json \
		-v $(PWD)/frontend/pnpm-lock.yaml:/app/pnpm-lock.yaml \
		-v $(PWD)/frontend/tsconfig.json:/app/tsconfig.json \
		-v $(PWD)/frontend/tsconfig.node.json:/app/tsconfig.node.json \
		-v $(PWD)/frontend/vite.config.ts:/app/vite.config.ts \
		-v $(PWD)/frontend/vitest.config.ts:/app/vitest.config.ts \
		frontend-ci pnpm test

frontend-test-watch: ## Run frontend tests in watch mode
	docker build -t frontend-dev \
		--build-arg USER_ID=$(shell id -u) \
		--build-arg GROUP_ID=$(shell id -g) \
		-f frontend/Dockerfile --target development-nonroot frontend
	docker run --rm -ti \
		-v $(PWD)/frontend/src:/app/src \
		-v $(PWD)/frontend/public:/app/public \
		-v $(PWD)/frontend/index.html:/app/index.html \
		-v $(PWD)/frontend/package.json:/app/package.json \
		-v $(PWD)/frontend/pnpm-lock.yaml:/app/pnpm-lock.yaml \
		-v $(PWD)/frontend/tsconfig.json:/app/tsconfig.json \
		-v $(PWD)/frontend/tsconfig.node.json:/app/tsconfig.node.json \
		-v $(PWD)/frontend/vite.config.ts:/app/vite.config.ts \
		-v $(PWD)/frontend/vitest.config.ts:/app/vitest.config.ts \
		frontend-dev pnpm test:watch

backend-test: ## Run backend tests only
	docker build -t backend-dev -f backend/Dockerfile --target development-enhanced backend
	docker run --rm -ti -v $(PWD)/backend:/app backend-dev pytest

backend-unit-test: ## Run backend unit tests only
	docker build -t backend-dev -f backend/Dockerfile --target development-enhanced backend
	docker run --rm -ti -v $(PWD)/backend:/app backend-dev pytest tests/unit

backend-unit-test-ci: ## Run backend unit tests in CI mode (non-interactive)
	docker build -t backend-dev -f backend/Dockerfile --target ci backend
	docker run --rm -v $(PWD)/backend:/app backend-dev pytest tests/unit

backend-integration-test: ## Run backend integration tests only
	docker build -t backend-dev -f backend/Dockerfile --target development-enhanced backend
	docker run --rm -ti -v $(PWD)/backend:/app backend-dev pytest tests/test_config.py tests/test_input_validation.py tests/test_metric_calculations.py tests/test_api_metrics.py

backend-fast-test: ## Run backend tests with optimizations
	docker build -t backend-dev -f backend/Dockerfile --target development-enhanced backend
	docker run --rm -ti -v $(PWD)/backend:/app backend-dev pytest -xvs --no-header

frontend-lint: ## Run frontend linting only
	docker build -t frontend-dev \
		--build-arg USER_ID=$(shell id -u) \
		--build-arg GROUP_ID=$(shell id -g) \
		-f frontend/Dockerfile --target development-nonroot frontend
	docker run --rm -ti -v $(PWD)/frontend:/app frontend-dev pnpm run lint

frontend-lint-ci: ## Run frontend linting in CI mode (non-interactive)
	docker build -t frontend-ci -f frontend/Dockerfile --target ci frontend
	docker run --rm -v $(PWD)/frontend:/app frontend-ci pnpm run lint

backend-lint: ## Run backend linting only
	docker build -t backend-dev -f backend/Dockerfile --target development-enhanced backend
	docker run --rm -ti -v $(PWD)/backend:/app backend-dev sh -c "ruff check app tests && mypy --explicit-package-bases --namespace-packages --ignore-missing-imports --exclude 'app/migrations/|tests/unit/conftest\.py' app tests && bandit -c pyproject.toml -r app tests"

backend-lint-ci: ## Run backend linting in CI mode (non-interactive)
	docker build -t backend-dev -f backend/Dockerfile --target ci backend
	docker run --rm -v $(PWD)/backend:/app backend-dev sh -c "ruff check app tests && mypy --explicit-package-bases --namespace-packages --ignore-missing-imports --exclude 'app/migrations/|tests/unit/conftest\.py' app tests && bandit -c pyproject.toml -r app tests"

frontend-format: ## Format frontend code only
	docker build -t frontend-dev \
		--build-arg USER_ID=$(shell id -u) \
		--build-arg GROUP_ID=$(shell id -g) \
		-f frontend/Dockerfile --target development-nonroot frontend
	docker run --rm -ti -v $(PWD)/frontend:/app frontend-dev pnpm run format

frontend-format-ci: ## Format frontend code in CI mode (non-interactive)
	docker build -t frontend-ci -f frontend/Dockerfile --target ci frontend
	docker run --rm -v $(PWD)/frontend:/app frontend-ci pnpm run format

frontend-lint-fix: ## Auto-fix frontend linting issues
	docker build -t frontend-dev \
		--build-arg USER_ID=$(shell id -u) \
		--build-arg GROUP_ID=$(shell id -g) \
		-f frontend/Dockerfile --target development-nonroot frontend
	docker run --rm -ti -v $(PWD)/frontend:/app frontend-dev pnpm run lint:fix

frontend-lint-fix-ci: ## Auto-fix frontend linting issues in CI mode (non-interactive)
	docker build -t frontend-ci -f frontend/Dockerfile --target ci frontend
	docker run --rm -v $(PWD)/frontend:/app frontend-ci pnpm run lint:fix

frontend-type-check-ci: ## Run TypeScript type checking in CI mode (non-interactive)
	docker build -t frontend-ci -f frontend/Dockerfile --target ci frontend
	docker run --rm -v $(PWD)/frontend:/app frontend-ci pnpm run type-check

backend-format: ## Format backend code only
	docker build -t backend-dev -f backend/Dockerfile --target development-enhanced backend
	docker run --rm -ti -v $(PWD)/backend:/app backend-dev ruff format app tests --exclude app/migrations/versions/

backend-format-ci: ## Format backend code in CI mode (non-interactive)
	docker build -t backend-dev -f backend/Dockerfile --target ci backend
	docker run --rm -v $(PWD)/backend:/app backend-dev ruff format app tests --exclude app/migrations/versions/

backend-lint-fix: ## Auto-fix backend linting issues
	docker build -t backend-dev -f backend/Dockerfile --target development-enhanced backend
	docker run --rm -ti -v $(PWD)/backend:/app backend-dev sh -c "ruff check --fix --exit-non-zero-on-fix app tests && ruff format app tests --exclude app/migrations/versions/ && mypy --explicit-package-bases --namespace-packages --ignore-missing-imports --exclude 'app/migrations/|tests/unit/conftest\.py' app tests && bandit -c pyproject.toml -r app tests"

backend-lint-fix-ci: ## Auto-fix backend linting issues in CI mode (non-interactive)
	docker build -t backend-dev -f backend/Dockerfile --target ci backend
	docker run --rm -v $(PWD)/backend:/app backend-dev sh -c "ruff check --fix --exit-non-zero-on-fix app tests && ruff format app tests --exclude app/migrations/versions/ && mypy --explicit-package-bases --namespace-packages --ignore-missing-imports --exclude 'app/migrations/|tests/unit/conftest\.py' app tests && bandit -c pyproject.toml -r app tests"

lint-fix: frontend-lint-fix backend-lint-fix e2e-lint-fix ## Auto-fix linting issues in frontend, backend, and e2e-tests

pre-commit-run: ## Run pre-commit hooks on all files
	pre-commit run --all-files

e2e-test: ## Run end-to-end tests
	cd e2e-tests && pnpm run run-tests

e2e-test-ui: ## Run end-to-end tests with UI mode
	cd e2e-tests && pnpm run test:ui

e2e-test-headed: ## Run end-to-end tests in headed mode (visible browser)
	cd e2e-tests && pnpm run run-tests:headed

e2e-test-debug: ## Run end-to-end tests with debug output
	cd e2e-tests && pnpm run run-tests:debug

e2e-test-ci: ## Run end-to-end tests in CI mode (non-interactive)
	cd e2e-tests && CI=true pnpm run run-tests

e2e-lint: ## Run linting for e2e-tests
	cd e2e-tests && npm run lint

e2e-lint-fix: ## Auto-fix linting issues in e2e-tests
	cd e2e-tests && npm run lint:fix

e2e-format: ## Format e2e-tests code
	cd e2e-tests && npm run format

e2e-format-check: ## Check e2e-tests code formatting
	cd e2e-tests && npm run format:check

test-github-actions: ## Test GitHub Actions workflows locally using act
	@if ! command -v act &> /dev/null; then \
		echo "Error: 'act' is not installed. Please install it first:"; \
		echo "  - macOS: brew install act"; \
		echo "  - Linux: https://github.com/nektos/act#installation"; \
		exit 1; \
	fi
	@echo "Running GitHub Actions CI workflow locally..."
	act -j frontend-checks -j backend-checks --workflows .github/workflows/ci.yml --container-architecture linux/amd64

test-github-actions-ci: ## Test GitHub Actions CI workflow locally using act
	@if ! command -v act &> /dev/null; then \
		echo "Error: 'act' is not installed. Please install it first:"; \
		echo "  - macOS: brew install act"; \
		echo "  - Linux: https://github.com/nektos/act#installation"; \
		exit 1; \
	fi
	@echo "Running GitHub Actions CI workflow locally..."
	act --workflows .github/workflows/ci.yml --container-architecture linux/amd64

test-github-actions-e2e: ## Test GitHub Actions E2E workflow locally using act
	@if ! command -v act &> /dev/null; then \
		echo "Error: 'act' is not installed. Please install it first:"; \
		echo "  - macOS: brew install act"; \
		echo "  - Linux: https://github.com/nektos/act#installation"; \
		exit 1; \
	fi
	@echo "Running GitHub Actions E2E tests workflow locally..."
	act --workflows .github/workflows/e2e-tests.yml --container-architecture linux/amd64

test-github-actions-all: test-github-actions-ci test-github-actions-e2e ## Test all GitHub Actions workflows locally
