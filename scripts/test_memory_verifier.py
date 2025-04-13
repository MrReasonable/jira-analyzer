#!/usr/bin/env python3
"""
Test script for the memory bank verification system.

This script tests the memory bank verification system with different task types
and reports the results.

Usage:
    python scripts/test_memory_verifier.py
"""

import sys
import subprocess
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("memory-verifier-test")

# Constants
SCRIPT_PATH = Path("scripts/verify_memory_rules.py")
TASK_TYPES = ["testing", "frontend", "backend", "api", "deployment"]


def run_test(task_type: str) -> bool:
    """Run the memory verifier with a specific task type."""
    logger.info(f"Testing memory verifier with task type: {task_type}")

    # Validate task_type is in the allowed list to prevent command injection
    if task_type not in TASK_TYPES:
        logger.error(f"Invalid task type: {task_type}")
        return False

    try:
        result = subprocess.run(
            [sys.executable, str(SCRIPT_PATH), task_type],
            capture_output=True,
            text=True,
            check=False,
        )

        # Log the output
        if result.stdout:
            logger.info(f"STDOUT: {result.stdout}")
        if result.stderr:
            logger.info(f"STDERR: {result.stderr}")

        return result.returncode == 0
    except Exception as e:
        logger.error(f"Error running test: {e}")
        return False


def main() -> int:
    """Main entry point for the test script."""
    if not SCRIPT_PATH.exists():
        logger.error(f"Memory verifier script not found at: {SCRIPT_PATH}")
        return 1

    # Make sure the script is executable
    SCRIPT_PATH.chmod(0o755)

    # Run tests for all task types
    results = {}
    for task_type in TASK_TYPES:
        results[task_type] = run_test(task_type)

    # Report results
    logger.info("\n=== Memory Verifier Test Results ===")
    all_passed = True
    for task_type, passed in results.items():
        status = "PASSED" if passed else "FAILED"
        logger.info(f"Task Type: {task_type} - {status}")
        all_passed = all_passed and passed

    if all_passed:
        logger.info("\nAll tests passed!")
        return 0
    else:
        logger.error("\nSome tests failed. See above for details.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
