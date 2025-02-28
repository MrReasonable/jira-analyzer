"""Mock Jira server for testing.

This module provides a mock implementation of the Jira API for testing purposes.
It returns predefined sample data instead of making actual API calls to Jira.
"""

import datetime
from typing import Optional
from unittest.mock import Mock

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_session
from .models import JiraConfiguration


class MockJira:
    """Mock implementation of the Jira API client.

    This class mimics the behavior of the actual Jira client but returns
    predefined sample data instead of making API calls.
    """

    def __init__(self, server=None, basic_auth=None):
        """Initialize the mock Jira client.

        Args:
            server: Jira server URL (ignored in mock).
            basic_auth: Authentication credentials (ignored in mock).
        """
        self.server = server
        self.auth = basic_auth
        self._setup_sample_data()

    def _setup_sample_data(self):
        """Set up sample data for the mock Jira client."""
        today = datetime.datetime.now()

        # Create sample issues with different states and dates
        self.sample_issues = [
            # Completed issues
            self._create_mock_issue(
                'PROJ-1', 'Story 1', today - datetime.timedelta(days=5), today, 'Done'
            ),
            self._create_mock_issue(
                'PROJ-2',
                'Story 2',
                today - datetime.timedelta(days=10),
                today - datetime.timedelta(days=2),
                'Done',
            ),
            self._create_mock_issue(
                'PROJ-3',
                'Bug 1',
                today - datetime.timedelta(days=8),
                today - datetime.timedelta(days=3),
                'Done',
            ),
            # In-progress issues
            self._create_mock_issue(
                'PROJ-4', 'Story 3', today - datetime.timedelta(days=3), None, 'In Progress'
            ),
            self._create_mock_issue(
                'PROJ-5', 'Story 4', today - datetime.timedelta(days=7), None, 'Review'
            ),
            # Backlog issues
            self._create_mock_issue(
                'PROJ-6', 'Story 5', today - datetime.timedelta(days=15), None, 'Backlog'
            ),
            self._create_mock_issue(
                'PROJ-7', 'Bug 2', today - datetime.timedelta(days=12), None, 'Backlog'
            ),
        ]

        # Create sample changelogs for cycle time calculation
        self._setup_sample_changelogs()

    def _create_mock_issue(
        self, key, summary, created_date, resolution_date=None, status='In Progress'
    ):
        """Create a mock Jira issue with the specified fields.

        Args:
            key: The issue key (e.g., PROJ-123).
            summary: The issue summary.
            created_date: The date the issue was created.
            resolution_date: The date the issue was resolved (optional).
            status: The current status of the issue.

        Returns:
            Mock: A mock Jira issue with the specified fields.
        """
        issue = Mock()
        issue.key = key
        issue.fields = Mock()
        issue.fields.summary = summary
        issue.fields.created = created_date.strftime('%Y-%m-%dT%H:%M:%S.000+0000')
        issue.fields.resolutiondate = (
            resolution_date.strftime('%Y-%m-%dT%H:%M:%S.000+0000') if resolution_date else None
        )
        issue.fields.status = Mock()
        issue.fields.status.name = status

        # Add changelog for cycle time calculation
        issue.changelog = self.sample_changelogs.get(key, Mock(histories=[]))

        return issue

    def _setup_sample_changelogs(self):
        """Set up sample changelogs for cycle time calculation."""
        today = datetime.datetime.now()

        # Create sample changelogs
        self.sample_changelogs = {
            'PROJ-1': self._create_mock_changelog(
                [
                    (today - datetime.timedelta(days=4), 'Backlog', 'In Progress'),
                    (today - datetime.timedelta(days=1), 'In Progress', 'Done'),
                ]
            ),
            'PROJ-2': self._create_mock_changelog(
                [
                    (today - datetime.timedelta(days=9), 'Backlog', 'In Progress'),
                    (today - datetime.timedelta(days=5), 'In Progress', 'Review'),
                    (today - datetime.timedelta(days=2), 'Review', 'Done'),
                ]
            ),
            'PROJ-3': self._create_mock_changelog(
                [
                    (today - datetime.timedelta(days=7), 'Backlog', 'In Progress'),
                    (today - datetime.timedelta(days=3), 'In Progress', 'Done'),
                ]
            ),
            'PROJ-4': self._create_mock_changelog(
                [
                    (today - datetime.timedelta(days=2), 'Backlog', 'In Progress'),
                ]
            ),
            'PROJ-5': self._create_mock_changelog(
                [
                    (today - datetime.timedelta(days=6), 'Backlog', 'In Progress'),
                    (today - datetime.timedelta(days=1), 'In Progress', 'Review'),
                ]
            ),
        }

    def _create_mock_changelog(self, transitions):
        """Create a mock Jira changelog with the specified status transitions.

        Args:
            transitions: A list of tuples containing (date, from_status, to_status).

        Returns:
            Mock: A mock Jira changelog with the specified transitions.
        """
        histories = []
        for date, from_status, to_status in transitions:
            history = Mock()
            history.created = date.strftime('%Y-%m-%dT%H:%M:%S.000+0000')
            history.items = [Mock(field='status', fromString=from_status, toString=to_status)]
            histories.append(history)

        changelog = Mock()
        changelog.histories = histories
        return changelog

    def search_issues(self, jql, maxResults=1000, fields=None, expand=None):
        """Search for issues matching the JQL query.

        Args:
            jql: JQL query to select issues.
            maxResults: Maximum number of results to return.
            fields: List of fields to include in the response.
            expand: List of fields to expand in the response.

        Returns:
            list: A list of mock Jira issues.
        """
        # In a real implementation, we would filter the issues based on the JQL query
        # For simplicity, we'll just return all sample issues
        return self.sample_issues[:maxResults]


async def get_mock_jira_client(
    session: AsyncSession = Depends(get_session),
    config_name: Optional[str] = None,
):
    """Create a mock JIRA client instance.

    This function mimics the behavior of the actual get_jira_client function
    but returns a mock client instead of connecting to Jira.

    Args:
        session: Database session for retrieving named configurations.
        config_name: Name of a stored Jira configuration to use.

    Returns:
        MockJira: A mock Jira client instance.
    """
    if config_name:
        # Get the configuration from the database
        stmt = select(JiraConfiguration).where(JiraConfiguration.name == config_name)
        result = await session.execute(stmt)
        config = result.scalar_one_or_none()

        if config:
            # Create a mock Jira client with the configuration
            return MockJira(
                server=config.jira_server,
                basic_auth=(config.jira_email, config.jira_api_token),
            )

    # Default mock client
    return MockJira()
