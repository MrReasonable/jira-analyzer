# JIRA Analyzer Development Guide

## Commands

### Build & Run

- Full build: `make build`
- Docker build: `make docker-build`

### Testing

- Run all tests: `make test`
- Frontend tests: `make frontend-test`
- Single frontend test: `cd frontend && pnpm run test -- -t "test name"`
- Backend tests: `make backend-test`
- Single backend test: `cd backend && python -m pytest tests/path/to/test.py::test_name`
- E2E tests: `make e2e-test`

### Linting & Formatting

- Lint all: `make lint`
- Format all: `make format`
- Frontend format: `make frontend-format`
- Frontend lint: `make frontend-lint`
- Backend format: `make backend-format`

## Code Style

- TypeScript: strict typing, 2-space indent, 100 char line limit
- SolidJS: functional components, hooks for state management
- Python: Google docstrings, type hints, single quotes for code
- Imports: group standard lib → third-party → local
- Error handling: use try/catch with specific error types
- Naming: camelCase for JS, snake_case for Python
