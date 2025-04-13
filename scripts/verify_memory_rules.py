#!/usr/bin/env python3
"""
Memory Bank Rule Verification Script

This script verifies that the memory bank is properly maintained according to
project standards. It checks for required files, freshness of content, and
task-specific documentation requirements.

Usage:
    python scripts/verify_memory_rules.py <task_type>

Where <task_type> is one of:
    - testing
    - frontend
    - backend
    - api
    - deployment
"""

import sys
import re
import logging
from datetime import datetime
from pathlib import Path
from typing import List

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("memory-verifier")

# Constants
MEMORY_BANK_PATH = Path("memory-bank")
PROGRESS_FILE = MEMORY_BANK_PATH / "progress.md"
ACTIVE_CONTEXT_FILE = MEMORY_BANK_PATH / "activeContext.md"
MAINTENANCE_PATH = MEMORY_BANK_PATH / "maintenance"
MAINTENANCE_LOG = MAINTENANCE_PATH / "memory-bank-verification.md"

# Task type definitions with required documentation
TASK_RULES = {
    "testing": {
        "primary_docs": ["testing/e2e-testing.md", "testing/unit-testing.md"],
        "secondary_docs": [
            "testing/integration-testing.md",
            "testing/performance-testing.md",
        ],
        "validation_files": ["e2e-tests/README.md", "e2e-tests/playwright.config.ts"],
    },
    "frontend": {
        "primary_docs": [
            "component-map/README.md",
            "code-patterns/custom-hook-patterns.md",
        ],
        "secondary_docs": [
            "features/workflow-editor.md",
            "features/metrics-visualization.md",
        ],
        "validation_files": ["frontend/src/components", "frontend/src/hooks"],
    },
    "backend": {
        "primary_docs": ["api/backend-api.md", "api/error-handling.md"],
        "secondary_docs": ["patterns/cqrs.md", "integrations/jira-cloud.md"],
        "validation_files": ["backend/app/routers", "backend/app/services"],
    },
    "api": {
        "primary_docs": ["api/jira-integration.md", "api/schemas"],
        "secondary_docs": ["api/error-handling.md"],
        "validation_files": ["backend/app/schemas.py"],
    },
    "deployment": {
        "primary_docs": [
            "deployment/docker-deployment.md",
            "deployment/ci-cd-pipeline.md",
        ],
        "secondary_docs": ["deployment/environments.md", "deployment/monitoring.md"],
        "validation_files": ["docker-compose.yml", "Dockerfile.node-base"],
    },
}

# Maximum age for memory bank files (in days)
MAX_AGE_DAYS = {
    "activeContext.md": 14,  # Two weeks
    "progress.md": 7,  # One week
    "task_specific": 30,  # One month
}


class MemoryVerifier:
    """Verifies memory bank compliance with project standards."""

    def __init__(self, task_type: str):
        """Initialize the verifier with a specific task type."""
        self.task_type = task_type.lower()
        self.violations: List[str] = []
        self.warnings: List[str] = []

        if self.task_type not in TASK_RULES:
            valid_types = ", ".join(TASK_RULES.keys())
            raise ValueError(
                f"Invalid task type: {task_type}. Must be one of: {valid_types}"
            )

        self.task_rules = TASK_RULES[self.task_type]

    def verify(self) -> bool:
        """Run all verification checks and return True if all pass."""
        self.check_core_files()
        self.check_task_specific_files()
        self.check_freshness()
        self.check_cross_references()

        if self.violations:
            self.handle_violations()
            return False

        if self.warnings:
            self.log_warnings()

        return True

    def check_core_files(self) -> None:
        """Verify that core memory bank files exist."""
        required_files = [
            ACTIVE_CONTEXT_FILE,
            PROGRESS_FILE,
            MEMORY_BANK_PATH / "projectbrief.md",
            MEMORY_BANK_PATH / "systemPatterns.md",
            MEMORY_BANK_PATH / "techContext.md",
        ]

        for file_path in required_files:
            if not file_path.exists():
                self.violations.append(
                    f"Missing core file: {file_path.relative_to(Path.cwd())}"
                )

    def check_task_specific_files(self) -> None:
        """Verify that task-specific documentation exists."""
        # Check primary docs (required)
        for doc in self.task_rules["primary_docs"]:
            doc_path = MEMORY_BANK_PATH / doc
            if not doc_path.exists():
                self.violations.append(f"Missing primary documentation: {doc}")

        # Check secondary docs (warnings only)
        for doc in self.task_rules["secondary_docs"]:
            doc_path = MEMORY_BANK_PATH / doc
            if not doc_path.exists():
                self.warnings.append(f"Missing recommended documentation: {doc}")

        # Check validation files
        for file_path in self.task_rules["validation_files"]:
            path = Path(file_path)
            if not path.exists():
                self.warnings.append(f"Missing validation file: {file_path}")

    def check_freshness(self) -> None:
        """Verify that memory bank files are up-to-date."""
        now = datetime.now()

        # Check core files
        for file_name, max_age in MAX_AGE_DAYS.items():
            if file_name == "task_specific":
                continue

            file_path = MEMORY_BANK_PATH / file_name
            if not file_path.exists():
                continue  # Already reported in check_core_files

            last_modified = datetime.fromtimestamp(file_path.stat().st_mtime)
            age_days = (now - last_modified).days

            if age_days > max_age:
                self.violations.append(
                    f"{file_name} is outdated (last updated {age_days} days ago, max is {max_age})"
                )

        # Check task-specific files
        max_age = MAX_AGE_DAYS["task_specific"]
        for doc in self.task_rules["primary_docs"]:
            doc_path = MEMORY_BANK_PATH / doc
            if not doc_path.exists():
                continue  # Already reported in check_task_specific_files

            last_modified = datetime.fromtimestamp(doc_path.stat().st_mtime)
            age_days = (now - last_modified).days

            if age_days > max_age:
                self.warnings.append(
                    f"{doc} is outdated (last updated {age_days} days ago, max is {max_age})"
                )

    def check_cross_references(self) -> None:
        """Verify cross-references between memory bank files."""
        if not ACTIVE_CONTEXT_FILE.exists() or not PROGRESS_FILE.exists():
            return  # Already reported in check_core_files

        # Check for task-specific references in activeContext.md
        with open(ACTIVE_CONTEXT_FILE, "r") as f:
            active_context = f.read()

        # Check for references to task-specific terms
        task_terms = {
            "testing": ["test", "e2e", "unit test", "integration test"],
            "frontend": ["component", "UI", "interface", "hook"],
            "backend": ["API", "endpoint", "service", "repository"],
            "api": ["schema", "validation", "endpoint", "request"],
            "deployment": ["deploy", "CI/CD", "pipeline", "Docker"],
        }

        terms = task_terms.get(self.task_type, [])
        found_terms = 0

        for term in terms:
            if re.search(rf"\b{term}\b", active_context, re.IGNORECASE):
                found_terms += 1

        if found_terms < 2 and terms:  # At least 2 terms should be found
            self.warnings.append(
                f"activeContext.md may not have sufficient references to {self.task_type} concepts"
            )

    def handle_violations(self) -> None:
        """Handle violations by logging and updating memory bank."""
        # Ensure maintenance directory exists
        MAINTENANCE_PATH.mkdir(exist_ok=True)

        # Create timestamp for the report
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Log to maintenance file
        with open(MAINTENANCE_LOG, "a") as f:
            f.write(f"\n## Memory Bank Verification Failure - {timestamp}\n\n")
            f.write(f"### Task Type: {self.task_type}\n\n")

            if self.violations:
                f.write("### Violations:\n\n")
                for violation in self.violations:
                    f.write(f"- {violation}\n")
                f.write("\n")

            if self.warnings:
                f.write("### Warnings:\n\n")
                for warning in self.warnings:
                    f.write(f"- {warning}\n")
                f.write("\n")

            f.write("### Required Actions:\n\n")
            f.write("1. Update the missing or outdated documentation\n")
            f.write("2. Ensure cross-references between related documents\n")
            f.write("3. Run verification again before proceeding with development\n\n")
            f.write("---\n")

        # Log to console
        logger.error(
            f"Memory bank verification failed with {len(self.violations)} violations"
        )
        for violation in self.violations:
            logger.error(f"VIOLATION: {violation}")

        for warning in self.warnings:
            logger.warning(f"WARNING: {warning}")

    def log_warnings(self) -> None:
        """Log warnings to console."""
        logger.warning(
            f"Memory bank verification passed with {len(self.warnings)} warnings"
        )
        for warning in self.warnings:
            logger.warning(f"WARNING: {warning}")


def main() -> int:
    """Main entry point for the script."""
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <task_type>")
        print("Where <task_type> is one of:", ", ".join(TASK_RULES.keys()))
        return 1

    task_type = sys.argv[1].lower()

    try:
        verifier = MemoryVerifier(task_type)
        success = verifier.verify()

        if success:
            logger.info("Memory bank verification passed successfully")
            return 0
        else:
            return 1
    except Exception as e:
        logger.error(f"Error during memory bank verification: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
