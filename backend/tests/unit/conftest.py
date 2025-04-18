"""Pytest configuration for unit tests.

This module provides fixtures for unit tests that are focused on testing
individual functions and classes in isolation, without the overhead of
database setup or HTTP requests.
"""

from datetime import datetime, timedelta
from unittest.mock import Mock

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.models import Base


@pytest_asyncio.fixture
async def db_session():
    """Provide a database session for tests.

    This fixture creates a new database session for each test and rolls back
    any changes made during the test to ensure test isolation.

    Returns:
        AsyncSession: A database session for the test.
    """
    # Create an in-memory SQLite database for testing
    engine = create_async_engine('sqlite+aiosqlite:///:memory:', echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Create a session
    session = async_session()

    # Set up the container with the session provider
    from app.container import container

    container.session_provider.override(session)

    try:
        # Return the session for the test to use
        yield session
    finally:
        # Clean up after the test
        await session.rollback()
        await session.close()

        # Drop all tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)

        # Dispose the engine
        await engine.dispose()


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
        # Create a mock status object with a name attribute
        status_mock = Mock()
        status_mock.name = status

        # Create a mock fields object with created, resolutiondate, and status attributes
        fields_mock = Mock()
        fields_mock.created = created_date.strftime('%Y-%m-%dT%H:%M:%S.000+0000')
        fields_mock.resolutiondate = (
            resolution_date.strftime('%Y-%m-%dT%H:%M:%S.000+0000') if resolution_date else None
        )
        fields_mock.status = status_mock

        # Create a mock issue object with a fields attribute
        issue_mock = Mock()
        issue_mock.fields = fields_mock

        return issue_mock

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
