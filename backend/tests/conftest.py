"""Pytest configuration file.

This module sets up the test environment for pytest, including path configuration
to ensure proper module imports and any fixtures that are shared across multiple
test modules.
"""

import sys
from pathlib import Path
from unittest.mock import Mock, patch

import pytest
from fastapi.testclient import TestClient

# Add the parent directory to sys.path to allow importing from the app package
# This is necessary because the tests directory is a sibling to the app directory
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))


# Mock the Settings class and get_settings function
class MockSettings:
    """Mock Settings class for testing.

    This class provides mock values for all settings required by the application
    during testing, without requiring actual environment variables.
    """

    host = '0.0.0.0'
    port = 8000
    cors_origins = ['http://localhost:5173']
    jira_server = None
    jira_email = None
    jira_api_token = None
    jql_query = 'project = PROJ AND type = Story'
    workflow_states = ['Backlog', 'In Progress', 'Done']
    lead_time_start_state = 'Backlog'
    lead_time_end_state = 'Done'
    cycle_time_start_state = 'In Progress'
    cycle_time_end_state = 'Done'


# Global variables to store database objects for reuse
_test_engine = None
_test_async_session = None


@pytest.fixture(scope='session', autouse=True)
def setup_test_db():
    """Set up the test database.

    This fixture creates an in-memory SQLite database for testing and
    initializes it with the necessary tables and test data. It's created once
    per test session for efficiency.
    """
    import asyncio

    from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
    from sqlalchemy.orm import sessionmaker

    from app.models import Base, JiraConfiguration

    global _test_engine, _test_async_session

    # Create an in-memory SQLite database for testing
    # Use echo=False to reduce log noise during tests
    _test_engine = create_async_engine('sqlite+aiosqlite:///:memory:', echo=False)
    _test_async_session = sessionmaker(_test_engine, class_=AsyncSession, expire_on_commit=False)

    # Create tables and add test data
    async def init_db():
        async with _test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        # Add a test configuration
        async with _test_async_session() as session:
            test_config = JiraConfiguration(
                name='test_config',
                jira_server='https://test.atlassian.net',
                jira_email='test@example.com',
                jira_api_token='test-token',
                jql_query='project = TEST',
                workflow_states=['Backlog', 'In Progress', 'Done'],
                lead_time_start_state='Backlog',
                lead_time_end_state='Done',
                cycle_time_start_state='In Progress',
                cycle_time_end_state='Done',
            )
            session.add(test_config)
            await session.commit()

    # Run the async initialization
    try:
        # For Python 3.10+
        loop = asyncio.get_running_loop()
    except RuntimeError:
        # If no running loop, create a new one
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    loop.run_until_complete(init_db())

    # Patch the database module
    with patch('app.database.engine', _test_engine), patch(
        'app.database.async_session', _test_async_session
    ):
        yield


@pytest.fixture
async def db_session():
    """Provide a database session for tests.

    This fixture creates a new database session for each test and rolls back
    any changes made during the test to ensure test isolation.

    Yields:
        AsyncSession: A database session for the test.
    """
    global _test_async_session

    async with _test_async_session() as session:
        # Start a nested transaction
        transaction = await session.begin_nested()

        # Yield the session for the test to use
        yield session

        # Roll back the transaction after the test
        await transaction.rollback()

        # Close the session
        await session.close()


@pytest.fixture(scope='session', autouse=True)
def mock_settings():
    """Mock the Settings class and get_settings function.

    This fixture patches the Settings class and get_settings function to return
    mock values for testing. It's applied automatically to all tests in the session.
    """
    with patch('app.config.Settings', MockSettings):
        with patch('app.config.get_settings', return_value=MockSettings()):
            yield


@pytest.fixture
def test_client():
    """Create a test client for the FastAPI application.

    This fixture creates a test client that can be used to make requests to the
    application during testing.

    Returns:
        TestClient: A test client for the FastAPI application.
    """
    # Import here to avoid circular imports
    from app.main import app

    return TestClient(app)


@pytest.fixture
def mock_jira_issue_factory():
    """Factory fixture to create mock Jira issues with customizable fields.

    Returns:
        function: A factory function that creates mock Jira issues.
    """

    def _create_mock_issue(created_date, resolution_date=None, status='In Progress'):
        """Create a mock Jira issue with the specified fields.

        Args:
            created_date (datetime): The date the issue was created.
            resolution_date (datetime, optional): The date the issue was resolved.
            status (str, optional): The current status of the issue.

        Returns:
            Mock: A mock Jira issue with the specified fields.
        """
        return Mock(
            fields=Mock(
                created=created_date.strftime('%Y-%m-%dT%H:%M:%S.000+0000'),
                resolutiondate=(
                    resolution_date.strftime('%Y-%m-%dT%H:%M:%S.000+0000')
                    if resolution_date
                    else None
                ),
                status=Mock(name=status),
            )
        )

    return _create_mock_issue


@pytest.fixture
def mock_jira_changelog_factory():
    """Factory fixture to create mock Jira changelogs with status transitions.

    Returns:
        function: A factory function that creates mock Jira changelogs.
    """

    def _create_mock_changelog(transitions):
        """Create a mock Jira changelog with the specified status transitions.

        Args:
            transitions (list): A list of tuples containing (date, from_status, to_status).

        Returns:
            Mock: A mock Jira changelog with the specified transitions.
        """
        histories = []
        for date, from_status, to_status in transitions:
            histories.append(
                Mock(
                    created=date.strftime('%Y-%m-%dT%H:%M:%S.000+0000'),
                    items=[Mock(field='status', fromString=from_status, toString=to_status)],
                )
            )
        return Mock(histories=histories)

    return _create_mock_changelog


@pytest.fixture
def sample_jira_issues(mock_jira_issue_factory):
    """Fixture providing a standard set of mock Jira issues for testing.

    Returns:
        list: A list of mock Jira issues with various states and dates.
    """
    from datetime import datetime, timedelta

    today = datetime.now()
    return [
        # Completed issues
        mock_jira_issue_factory(today - timedelta(days=5), today, 'Done'),
        mock_jira_issue_factory(today - timedelta(days=10), today - timedelta(days=2), 'Done'),
        # In-progress issues
        mock_jira_issue_factory(today - timedelta(days=3), None, 'In Progress'),
        mock_jira_issue_factory(today - timedelta(days=7), None, 'Review'),
        # Backlog issue
        mock_jira_issue_factory(today - timedelta(days=15), None, 'Backlog'),
    ]


@pytest.fixture
def mock_jira_client(sample_jira_issues):
    """Fixture providing a mock Jira client with pre-configured responses.

    Returns:
        Mock: A mock Jira client that returns sample issues.
    """
    mock_client = Mock()
    mock_client.search_issues.return_value = sample_jira_issues
    return mock_client
