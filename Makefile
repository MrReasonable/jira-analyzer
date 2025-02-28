# Makefile for Jira Analyzer project

.PHONY: help install dev test lint format clean build docker-build docker-dev setup-pre-commit

# Show help message for all make commands
help:
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

install: ## Install all dependencies for both frontend and backend
	cd frontend && pnpm install
	cd backend && pip install -r requirements.txt
	pip install pre-commit

setup-pre-commit: ## Install pre-commit hooks
	pre-commit install

dev: ## Start development servers for both frontend and backend
	docker-compose -f docker-compose.dev.yml up --build

test: frontend-test backend-test ## Run all tests (frontend and backend)

lint: frontend-lint backend-lint ## Run linting for both frontend and backend

format: frontend-format backend-format ## Format code in both frontend and backend

clean: ## Clean up build artifacts and cache
	cd frontend && rm -rf dist node_modules
	cd backend && find . -type d -name "__pycache__" -exec rm -rf {} +
	cd backend && find . -type f -name "*.pyc" -delete

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

lint-fix: frontend-lint-fix backend-lint-fix ## Auto-fix linting issues in both frontend and backend

pre-commit-run: ## Run pre-commit hooks on all files
	pre-commit run --all-files
