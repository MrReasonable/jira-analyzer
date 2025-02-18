.PHONY: help dev dev-build dev-down prod prod-build prod-down logs clean

# Default target
.DEFAULT_GOAL := help

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
