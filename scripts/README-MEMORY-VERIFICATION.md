# Memory Bank Verification System

This directory contains scripts for verifying and maintaining the memory bank documentation system.

## Overview

The Memory Bank Verification System ensures that all documentation is properly maintained and up-to-date. It enforces task-specific documentation requirements, checks for freshness of content, and verifies cross-references between related documents.

## Scripts

### verify_memory_rules.py

This script verifies that the memory bank is properly maintained according to project standards.

#### Usage

```bash
python scripts/verify_memory_rules.py <task_type>
```

Where `<task_type>` is one of:

- `testing`
- `frontend`
- `backend`
- `api`
- `deployment`

#### Examples

```bash
# Verify memory bank for testing tasks
python scripts/verify_memory_rules.py testing

# Verify memory bank for frontend tasks
python scripts/verify_memory_rules.py frontend
```

#### Return Codes

- `0`: Verification passed successfully
- `1`: Verification failed (violations detected)

### test_memory_verifier.py

This script tests the memory bank verification system with different task types and reports the results.

#### Usage

```bash
python scripts/test_memory_verifier.py
```

This will run the verification for all task types and report the results.

## Integration with Pre-commit Hooks

The memory bank verification system is integrated with pre-commit hooks to ensure documentation is maintained. The configuration is in `.pre-commit-config.yaml`:

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

## Task-Specific Requirements

Each task type has specific documentation requirements defined in the Dynamic Priority System table in `activeContext.md`. The current task types and their requirements are:

| Task Type  | Primary Docs (Required)                                          | Secondary Docs (Recommended)                                     |
| ---------- | ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| Testing    | testing/e2e-testing.md<br>testing/unit-testing.md                | testing/integration-testing.md<br>testing/performance-testing.md |
| Frontend   | component-map/README.md<br>code-patterns/custom-hook-patterns.md | features/workflow-editor.md<br>features/metrics-visualization.md |
| Backend    | api/backend-api.md<br>api/error-handling.md                      | patterns/cqrs.md<br>integrations/jira-cloud.md                   |
| API        | api/jira-integration.md<br>api/schemas                           | api/error-handling.md                                            |
| Deployment | deployment/docker-deployment.md<br>deployment/ci-cd-pipeline.md  | deployment/environments.md<br>deployment/monitoring.md           |

## Documentation

For more detailed information about the memory bank verification system, see:

- [Memory Bank Verification System](../memory-bank/maintenance/memory-bank-verification.md)
- [Dynamic Priority System](../memory-bank/activeContext.md#dynamic-priority-system)

## Maintenance

The Memory Bank Verification System itself should be maintained and updated as the project evolves:

1. **Adding New Task Types**: Update the `TASK_RULES` dictionary in `scripts/verify_memory_rules.py`
2. **Modifying Requirements**: Update the Dynamic Priority System table in `activeContext.md`
3. **Adjusting Freshness Requirements**: Modify the `MAX_AGE_DAYS` dictionary in `scripts/verify_memory_rules.py`

The system should be reviewed quarterly to ensure it remains aligned with the project's documentation needs.
