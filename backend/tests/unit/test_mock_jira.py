"""Unit tests for the mock Jira client.

This module contains unit tests for the mock Jira client implementation.
"""

import datetime
from unittest.mock import AsyncMock, MagicMock, Mock, patch

import pytest

from app.mock_jira import MockJira, get_mock_jira_client
from app.models import JiraConfiguration


class TestMockJira:
    """Tests for the MockJira class."""

    @patch('app.mock_jira.MockJira._setup_sample_data')
    def test_init(self, mock_setup_sample_data):
        """Test initialization of the MockJira class."""
        # Create a mock Jira client
        client = MockJira(server='https://jira.example.com', basic_auth=('user', 'token'))

        # Check that the server and auth are set correctly
        assert client.server == 'https://jira.example.com'
        assert client.auth == ('user', 'token')

        # Verify that sample data setup was called
        mock_setup_sample_data.assert_called_once()

    @patch('app.mock_jira.MockJira._setup_sample_data')
    def test_create_mock_issue(self, mock_setup_sample_data):
        """Test creation of mock issues."""
        client = MockJira()
        # Mock the sample_changelogs attribute
        client.sample_changelogs = {}
        today = datetime.datetime.now()

        # Create a mock issue
        issue = client._create_mock_issue(
            key='TEST-123',
            summary='Test issue',
            created_date=today - datetime.timedelta(days=5),
            resolution_date=today,
            status='Done',
        )

        # Check that the issue has the expected fields
        assert issue.key == 'TEST-123'
        assert issue.fields.summary == 'Test issue'
        assert issue.fields.created == (today - datetime.timedelta(days=5)).strftime(
            '%Y-%m-%dT%H:%M:%S.000+0000'
        )
        assert issue.fields.resolutiondate == today.strftime('%Y-%m-%dT%H:%M:%S.000+0000')
        assert issue.fields.status.name == 'Done'

        # Create an issue without a resolution date
        issue = client._create_mock_issue(
            key='TEST-456',
            summary='Another test issue',
            created_date=today - datetime.timedelta(days=3),
            status='In Progress',
        )

        # Check that the issue has the expected fields
        assert issue.key == 'TEST-456'
        assert issue.fields.summary == 'Another test issue'
        assert issue.fields.created == (today - datetime.timedelta(days=3)).strftime(
            '%Y-%m-%dT%H:%M:%S.000+0000'
        )
        assert issue.fields.resolutiondate is None
        assert issue.fields.status.name == 'In Progress'

    @patch('app.mock_jira.MockJira._setup_sample_data')
    def test_create_mock_changelog(self, mock_setup_sample_data):
        """Test creation of mock changelogs."""
        client = MockJira()
        today = datetime.datetime.now()

        # Create transitions for the changelog
        transitions = [
            (today - datetime.timedelta(days=3), 'Backlog', 'In Progress'),
            (today - datetime.timedelta(days=1), 'In Progress', 'Done'),
        ]

        # Create a mock changelog
        changelog = client._create_mock_changelog(transitions)

        # Check that the changelog has the expected structure
        assert len(changelog.histories) == 2

        # Check the first transition
        assert changelog.histories[0].created == (today - datetime.timedelta(days=3)).strftime(
            '%Y-%m-%dT%H:%M:%S.000+0000'
        )
        assert changelog.histories[0].items[0].field == 'status'
        assert changelog.histories[0].items[0].fromString == 'Backlog'
        assert changelog.histories[0].items[0].toString == 'In Progress'

        # Check the second transition
        assert changelog.histories[1].created == (today - datetime.timedelta(days=1)).strftime(
            '%Y-%m-%dT%H:%M:%S.000+0000'
        )
        assert changelog.histories[1].items[0].field == 'status'
        assert changelog.histories[1].items[0].fromString == 'In Progress'
        assert changelog.histories[1].items[0].toString == 'Done'

    @patch('app.mock_jira.MockJira._setup_sample_data')
    def test_search_issues(self, mock_setup_sample_data):
        """Test searching for issues."""
        client = MockJira()
        # Create some sample issues for testing
        client.sample_issues = [
            Mock(key='TEST-1', fields=Mock(summary='Test Issue 1')),
            Mock(key='TEST-2', fields=Mock(summary='Test Issue 2')),
            Mock(key='TEST-3', fields=Mock(summary='Test Issue 3')),
        ]

        # Search for issues
        issues = client.search_issues(jql='project = TEST')

        # Check that issues are returned
        assert len(issues) > 0
        assert all(hasattr(issue, 'key') for issue in issues)
        assert all(hasattr(issue, 'fields') for issue in issues)

        # Test with maxResults parameter
        issues = client.search_issues(jql='project = TEST', maxResults=2)
        assert len(issues) == 2

        # Test with fields parameter (doesn't affect mock implementation)
        issues = client.search_issues(jql='project = TEST', fields=['summary', 'status'])
        assert len(issues) > 0


class TestGetMockJiraClient:
    """Tests for the get_mock_jira_client function."""

    @pytest.mark.asyncio
    @patch('app.mock_jira.MockJira')
    async def test_get_mock_jira_client_default(self, mock_jira_class):
        """Test getting a mock Jira client with default settings."""
        # Create a mock session
        session = MagicMock()
        session.execute.return_value.scalar_one_or_none.return_value = None

        # Setup the mock MockJira class
        mock_client = MagicMock()
        mock_jira_class.return_value = mock_client

        # Get a mock Jira client
        client = await get_mock_jira_client(session)

        # Check that a default client is returned
        assert client is mock_client
        mock_jira_class.assert_called_once_with()

    @pytest.mark.asyncio
    @patch('app.mock_jira.MockJira')
    async def test_get_mock_jira_client_with_config(self, mock_jira_class):
        """Test getting a mock Jira client with a named configuration."""
        # Create a mock configuration
        config = JiraConfiguration(
            name='Test Config',
            jira_server='https://jira.example.com',
            jira_email='user@example.com',
            jira_api_token='token123',
            jql_query='project = TEST',
            workflow_states=['Backlog', 'In Progress', 'Done'],
            lead_time_start_state='Backlog',
            lead_time_end_state='Done',
            cycle_time_start_state='In Progress',
            cycle_time_end_state='Done',
        )

        # Create a mock session that returns our config
        session = MagicMock()
        # Make execute return a mock that has scalar_one_or_none method
        execute_result = MagicMock()
        execute_result.scalar_one_or_none.return_value = config
        session.execute = AsyncMock(return_value=execute_result)

        # Setup the mock MockJira class
        mock_client = MagicMock()
        mock_jira_class.return_value = mock_client

        # Get a mock Jira client with the configuration
        client = await get_mock_jira_client(session, config_name='Test Config')

        # Check that the client is configured correctly
        assert client is mock_client
        mock_jira_class.assert_called_once_with(
            server='https://jira.example.com', basic_auth=('user@example.com', 'token123')
        )

        # Verify that the session was queried correctly
        session.execute.assert_called_once()
