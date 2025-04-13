"""Utility functions for fixtures management.

This module provides utility functions for validating and loading fixtures.
"""

import json
from pathlib import Path
from typing import Any, Dict

from ..logger import get_logger

logger = get_logger(__name__)

# Define the fixtures directory
FIXTURES_DIR = Path(__file__).parent / 'data'

# Ensure the fixtures directory exists
FIXTURES_DIR.mkdir(exist_ok=True, parents=True)


def validate_fixture_schema(fixture_data: Dict[str, Any], schema_type: str) -> bool:
    """Validate a fixture against its expected schema.

    Args:
        fixture_data: The fixture data to validate.
        schema_type: The type of schema to validate against.

    Returns:
        True if the fixture is valid, False otherwise.

    Raises:
        ValueError: If the fixture is invalid.
    """
    # Basic validation based on schema type
    if schema_type == 'configuration':
        required_fields = ['name', 'jira_url', 'project_key', 'username', 'api_token', 'is_cloud']
        for field in required_fields:
            if field not in fixture_data:
                raise ValueError(f'Missing required field in configuration: {field}')
        return True

    elif schema_type == 'workflow_state':
        required_fields = ['configuration_id', 'name', 'position']
        for field in required_fields:
            if field not in fixture_data:
                raise ValueError(f'Missing required field in workflow state: {field}')
        return True

    elif schema_type == 'metrics_analysis':
        required_fields = ['configuration_id', 'start_date', 'end_date', 'jql', 'metrics_data']
        for field in required_fields:
            if field not in fixture_data:
                raise ValueError(f'Missing required field in metrics analysis: {field}')
        return True

    else:
        raise ValueError(f'Unknown schema type: {schema_type}')


def load_fixture_from_file(fixture_id: str) -> Dict[str, Any]:
    """Load a fixture from a JSON file.

    Args:
        fixture_id: The ID of the fixture to load.

    Returns:
        The fixture data.

    Raises:
        ValueError: If the fixture file is not found or is invalid.
    """
    fixture_path = FIXTURES_DIR / f'{fixture_id}.json'

    if not fixture_path.exists():
        raise ValueError(f'Fixture file not found: {fixture_id}.json')

    try:
        with open(fixture_path, 'r') as f:
            fixture_data = json.load(f)
        return fixture_data
    except json.JSONDecodeError as e:
        raise ValueError(f'Invalid JSON in fixture file {fixture_id}.json: {str(e)}')
    except Exception as e:
        raise ValueError(f'Error loading fixture file {fixture_id}.json: {str(e)}')


def save_fixture_to_file(fixture_id: str, fixture_data: Dict[str, Any]) -> None:
    """Save a fixture to a JSON file.

    Args:
        fixture_id: The ID of the fixture to save.
        fixture_data: The fixture data to save.

    Raises:
        ValueError: If the fixture cannot be saved.
    """
    fixture_path = FIXTURES_DIR / f'{fixture_id}.json'

    try:
        with open(fixture_path, 'w') as f:
            json.dump(fixture_data, f, indent=2)
    except Exception as e:
        raise ValueError(f'Error saving fixture file {fixture_id}.json: {str(e)}')
