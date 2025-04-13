# Memory Bank Verification System

> **Executive Summary:** The Memory Bank Verification System ensures that all documentation is properly maintained and up-to-date. It enforces task-specific documentation requirements, checks for freshness of content, and verifies cross-references between related documents.

## Table of Contents

- [Overview](#overview)
- [Verification Process](#verification-process)
- [Task-Specific Requirements](#task-specific-requirements)
- [Integration with Development Workflow](#integration-with-development-workflow)
- [Handling Violations](#handling-violations)
- [Maintenance and Updates](#maintenance-and-updates)

## Overview

The Memory Bank Verification System is a critical component of our documentation strategy. It ensures that:

1. All required documentation exists for each task type
2. Documentation is kept up-to-date
3. Cross-references between related documents are maintained
4. Task-specific documentation requirements are enforced

This system is integrated with our pre-commit hooks and CI/CD pipeline to prevent documentation debt from accumulating.

## Verification Process

The verification process consists of the following steps:

1. **Core Files Check**: Verifies that all core memory bank files exist and are up-to-date
2. **Task-Specific Files Check**: Verifies that task-specific documentation exists based on the current task type
3. **Freshness Check**: Ensures that documentation is updated regularly
4. **Cross-Reference Check**: Verifies that related documents reference each other appropriately

The verification is triggered:

- As a pre-commit hook when modifying memory bank files
- Before starting work on a new task
- As part of the CI/CD pipeline

## Task-Specific Requirements

Each task type has specific documentation requirements defined in the Dynamic Priority System table in `activeContext.md`. The current task types and their requirements are:

| Task Type  | Primary Docs (Required)                                          | Secondary Docs (Recommended)                                     | Validation Files                                      |
| ---------- | ---------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| Testing    | testing/e2e-testing.md<br>testing/unit-testing.md                | testing/integration-testing.md<br>testing/performance-testing.md | e2e-tests/README.md<br>e2e-tests/playwright.config.ts |
| Frontend   | component-map/README.md<br>code-patterns/custom-hook-patterns.md | features/workflow-editor.md<br>features/metrics-visualization.md | frontend/src/components<br>frontend/src/hooks         |
| Backend    | api/backend-api.md<br>api/error-handling.md                      | patterns/cqrs.md<br>integrations/jira-cloud.md                   | backend/app/routers<br>backend/app/services           |
| API        | api/jira-integration.md<br>api/schemas                           | api/error-handling.md                                            | backend/app/schemas.py                                |
| Deployment | deployment/docker-deployment.md<br>deployment/ci-cd-pipeline.md  | deployment/environments.md<br>deployment/monitoring.md           | docker-compose.yml<br>Dockerfile.node-base            |

## Integration with Development Workflow

The Memory Bank Verification System is integrated with our development workflow through:

1. **Pre-commit Hook**: Automatically runs verification when committing changes to memory bank files

   ```yaml
   - id: verify-memory-bank
     name: Verify memory bank rules
     entry: python scripts/verify_memory_rules.py
     args: ["testing"] # Default to testing, can be overridden
     language: python
     pass_filenames: false
     files: ^memory-bank/
     stages: [pre-commit]
   ```

2. **Manual Verification**: Can be run manually before starting work on a task

   ```bash
   python scripts/verify_memory_rules.py <task_type>
   ```

3. **CI/CD Integration**: Runs as part of the CI/CD pipeline to ensure documentation is maintained

## Handling Violations

When violations are detected, the system:

1. Logs detailed information about the violations
2. Creates a violation report in `memory-bank/maintenance/memory-bank-verification.md`
3. Prevents the commit from proceeding (if run as a pre-commit hook)
4. Provides clear instructions on how to resolve the violations

Example violation report:

```markdown
## Memory Bank Verification Failure - 2025-04-10 21:45:32

### Task Type: testing

### Violations:

- Missing primary documentation: testing/performance-testing.md
- activeContext.md is outdated (last updated 15 days ago, max is 14)

### Warnings:

- Missing recommended documentation: testing/integration-testing.md

### Required Actions:

1. Update the missing or outdated documentation
2. Ensure cross-references between related documents
3. Run verification again before proceeding with development
```

## Maintenance and Updates

The Memory Bank Verification System itself should be maintained and updated as the project evolves:

1. **Adding New Task Types**: Update the `TASK_RULES` dictionary in `scripts/verify_memory_rules.py`
2. **Modifying Requirements**: Update the Dynamic Priority System table in `activeContext.md`
3. **Adjusting Freshness Requirements**: Modify the `MAX_AGE_DAYS` dictionary in `scripts/verify_memory_rules.py`

The system should be reviewed quarterly to ensure it remains aligned with the project's documentation needs.

---

Last Updated: 10/04/2025
