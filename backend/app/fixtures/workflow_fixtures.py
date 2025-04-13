"""Workflow-related fixtures for testing.

This module provides fixtures for workflow configurations, states, and metrics.
"""

from typing import Any, Dict, Optional

from sqlalchemy import text

from ..database import get_session
from ..logger import get_logger
from ..models import JiraConfiguration
from . import register_fixture
from .utils import load_fixture_from_file, validate_fixture_schema

logger = get_logger(__name__)


async def load_basic_workflow_config(options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Load a basic workflow configuration with states.

    Args:
        options: Optional parameters for fixture loading.
            - clear_existing: Whether to clear existing data before loading.

    Returns:
        Dict containing the result of the fixture loading operation.
    """
    if options is None:
        options = {}

    clear_existing = options.get('clear_existing', True)

    try:
        # Load fixture data from file
        fixture_data = load_fixture_from_file('basic_workflow')

        # Validate fixture data
        validate_fixture_schema(fixture_data['configuration'], 'configuration')

        # Use the session as an async context manager
        async for session in get_session():
            try:
                if clear_existing:
                    # Clear existing configurations
                    await session.execute(text('DELETE FROM jira_configurations'))
                    await session.commit()

                # Create a new configuration with a unique name for tests
                # Use a timestamp and a secure random number to ensure uniqueness
                import secrets
                import time

                unique_name = f'{fixture_data["configuration"]["name"]}_{int(time.time())}_{secrets.randbelow(9000) + 1000}'
                config = JiraConfiguration(
                    name=unique_name,
                    jira_server=fixture_data['configuration']['jira_url'],
                    project_key=fixture_data['configuration']['project_key'],
                    jira_email=fixture_data['configuration']['username'],
                    jira_api_token=fixture_data['configuration']['api_token'],
                    jql_query='project = ' + fixture_data['configuration']['project_key'],
                    workflow_states=['Backlog', 'In Progress', 'Review', 'Done'],
                    lead_time_start_state='Backlog',
                    lead_time_end_state='Done',
                    cycle_time_start_state='In Progress',
                    cycle_time_end_state='Done',
                )
                session.add(config)
                await session.commit()
                await session.refresh(config)

                # Store the ID after refreshing to ensure we have the latest data
                config_id = config.id

                # We don't create workflow states separately anymore since they're stored in the configuration
                if not config_id:
                    raise ValueError('Failed to create configuration')

                # Use the stored config_id and a fixed number of states, and also return the actual configuration name
                return {
                    'configuration_id': config_id,
                    'num_states': 4,  # 4 states: Backlog, In Progress, Review, Done
                    'configuration_name': unique_name,  # Return the actual name for tests to use
                }
            except Exception as e:
                await session.rollback()
                logger.exception(f'Error in session: {str(e)}')
                raise
    except Exception as e:
        logger.exception(f'Error loading basic workflow fixture: {str(e)}')
        raise

    # This line is unreachable, but we'll keep it for clarity
    return {}  # Return empty dict if execution reaches this point


async def load_workflow_with_metrics(options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Load a workflow configuration with pre-calculated metrics.

    Args:
        options: Optional parameters for fixture loading.
            - clear_existing: Whether to clear existing data before loading.

    Returns:
        Dict containing the result of the fixture loading operation.
    """
    if options is None:
        options = {}

    try:
        # Load fixture data from file
        fixture_data = load_fixture_from_file('workflow_with_metrics')

        # Validate fixture data
        validate_fixture_schema(fixture_data['configuration'], 'configuration')
        # Skip workflow state validation since we'll use the basic workflow states

        # First load the basic configuration
        basic_result = await load_basic_workflow_config(options)
        config_id = basic_result['configuration_id']

        # Create a real metrics analysis record
        async for session in get_session():
            try:
                # Create a metrics analysis record
                import uuid
                from datetime import datetime

                from ..models import MetricsAnalysis

                # Create a metrics analysis with the fixture data
                metrics_data = fixture_data.get('metrics_analysis', {})

                # Create dates if not provided
                start_date = datetime.fromisoformat(metrics_data.get('start_date', '2025-01-01'))
                end_date = datetime.fromisoformat(metrics_data.get('end_date', '2025-03-31'))

                # Create a unique analysis ID
                analysis_id = str(uuid.uuid4())

                # Extract metrics data from the fixture
                metrics_data_json = {}
                if 'metrics_data' in metrics_data:
                    metrics_data_json = metrics_data['metrics_data']

                # Create the metrics analysis record
                analysis = MetricsAnalysis(
                    id=analysis_id,
                    configuration_id=config_id,
                    start_date=start_date,
                    end_date=end_date,
                    jql_query=metrics_data.get(
                        'jql', f'project = {fixture_data["configuration"]["project_key"]}'
                    ),
                    created_at=datetime.now(),
                    updated_at=datetime.now(),
                    metrics_data=metrics_data_json,
                )

                session.add(analysis)
                await session.commit()
                # Remove the refresh call that's causing the error
                # await session.refresh(analysis)

                # Get the configuration name from the basic_result
                config_name = basic_result.get('configuration_name')

                return {
                    'configuration_id': config_id,
                    'analysis_id': analysis_id,
                    'configuration_name': config_name,  # Return the actual name for tests to use
                }
            except Exception as e:
                await session.rollback()
                logger.exception(f'Error creating metrics analysis: {str(e)}')
                raise
    except Exception as e:
        logger.exception(f'Error loading workflow with metrics fixture: {str(e)}')
        raise

    # This line is unreachable, but we'll keep it for clarity
    return {}  # Return empty dict if execution reaches this point


# Register fixtures
register_fixture('basic_workflow', load_basic_workflow_config)
register_fixture('workflow_with_metrics', load_workflow_with_metrics)

# Log available fixtures
logger.info(f'Registered fixtures: {", ".join(["basic_workflow", "workflow_with_metrics"])}')
