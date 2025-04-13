"""Fixtures management module for testing.

This module provides functionality for loading predefined fixtures into the database
for testing purposes. It is only available in test environments.
"""

from typing import Any, Callable, Dict, List, Optional

from ..logger import get_logger

logger = get_logger(__name__)

# Dictionary to store available fixtures
AVAILABLE_FIXTURES: Dict[str, Callable] = {}


def register_fixture(fixture_id: str, fixture_loader_func: Callable):
    """Register a fixture with its loader function.

    Args:
        fixture_id: Unique identifier for the fixture.
        fixture_loader_func: Async function that loads the fixture into the database.
    """
    AVAILABLE_FIXTURES[fixture_id] = fixture_loader_func
    logger.info(f'Registered fixture: {fixture_id}')


async def load_fixture(fixture_id: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Load a fixture by ID.

    Args:
        fixture_id: ID of the fixture to load.
        options: Optional parameters for fixture loading.

    Returns:
        Dict containing the result of the fixture loading operation.
    """
    if fixture_id not in AVAILABLE_FIXTURES:
        logger.error(f'Fixture not found: {fixture_id}')
        return {'success': False, 'error': f'Fixture not found: {fixture_id}'}

    if options is None:
        options = {}

    try:
        result = await AVAILABLE_FIXTURES[fixture_id](options)
        return {'success': True, 'result': result}
    except Exception as e:
        logger.exception(f'Error loading fixture {fixture_id}: {str(e)}')
        return {'success': False, 'error': str(e)}


def get_available_fixtures() -> List[str]:
    """Get a list of available fixtures.

    Returns:
        List of fixture IDs that can be loaded.
    """
    return list(AVAILABLE_FIXTURES.keys())


def is_test_environment() -> bool:
    """Check if we're running in a test environment.

    Returns:
        True if running in a test environment, False otherwise.
    """
    import os

    return (
        os.environ.get('USE_IN_MEMORY_DB', '').lower() == 'true'
        or os.environ.get('USE_MOCK_JIRA', '').lower() == 'true'
        or os.environ.get('TESTING', '').lower() == 'true'
    )
