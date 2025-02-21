.PHONY: help dev dev-build dev-down prod prod-build prod-down logs clean

# Default target
.DEFAULT_GOAL := help

# Test and lint targets
test: test-backend test-frontend ## Run all unit tests

test-backend: ## Run backend unit tests
	docker build -f backend/Dockerfile.dev -t jira-analyzer-backend-test backend
	docker run --rm -v $(PWD)/backend:/app jira-analyzer-backend-test python -m pytest -v tests/

test-frontend: ## Run frontend unit tests
	docker build -f frontend/Dockerfile.dev -t jira-analyzer-frontend-test frontend
	docker run --rm -v $(PWD)/frontend:/app jira-analyzer-frontend-test npm test

lint: lint-backend lint-frontend ## Run all linters

lint-backend: ## Run backend linter
	docker build -f backend/Dockerfile.dev -t jira-analyzer-backend-test backend
	docker run --rm -v $(PWD)/backend:/app jira-analyzer-backend-test python -m flake8

lint-frontend: ## Run frontend linter
	docker build -f frontend/Dockerfile.dev -t jira-analyzer-frontend-test frontend
	docker run --rm -v $(PWD)/frontend:/app jira-analyzer-frontend-test npm run lint

# Integration tests (these require the full compose stack)
test-integration: ensure-dev ## Run integration tests
	docker compose -f docker-compose.dev.yml exec backend python -m pytest -v integration_tests/

# Ensure services are running (for integration tests)
ensure-dev:
	docker compose -f docker-compose.dev.yml up -d

# Show help for each target
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev: ## Start development environment
	docker compose -f docker-compose.dev.yml up

dev-build: ## Build and start development environment
	docker compose -f docker-compose.dev.yml up --build

dev-down: ## Stop development environment
	docker compose -f docker-compose.dev.yml down

prod: ## Start production environment
	docker compose up

prod-build: ## Build and start production environment
	docker compose up --build

prod-down: ## Stop production environment
	docker compose down

logs: ## View development logs
	docker compose -f docker-compose.dev.yml logs -f

clean: ## Clean up all containers and volumes
	docker compose down -v
	docker compose -f docker-compose.dev.yml down -v
