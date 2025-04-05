"""Unit tests for the JiraClientFactory.

This module contains tests for the JiraClientFactory class, which is responsible
for creating Jira clients.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.mock_jira import MockJira
from app.services.jira_client_factory import JiraClientFactory

# Mark all tests in this module as asyncio tests
pytestmark = pytest.mark.asyncio


@pytest.fixture
def mock_session():
    """Create a mock database session."""
    return AsyncMock()


class TestJiraClientFactory:
    """Test cases for the JiraClientFactory class."""

    @pytest.mark.asyncio
    @patch('app.services.jira_client_factory.USE_MOCK_JIRA', False)
    @patch('app.services.jira_client_factory.JIRA')
    async def test_create_client_real(self, mock_jira_class, mock_session):
        """Test creating a real Jira client."""
        # Arrange
        mock_jira_instance = MagicMock()
        mock_jira_class.return_value = mock_jira_instance
        factory = JiraClientFactory(mock_session)
        server = 'https://jira.example.com'
        auth = ('user@example.com', 'api_token')
        config_name = 'test_config'

        # Act
        client = await factory.create_client(server, auth, config_name)

        # Assert
        mock_jira_class.assert_called_once_with(server=server, basic_auth=auth)
        assert client == mock_jira_instance

    @pytest.mark.asyncio
    @patch('app.services.jira_client_factory.USE_MOCK_JIRA', True)
    async def test_create_client_mock(self, mock_session):
        """Test creating a mock Jira client."""
        # Arrange
        factory = JiraClientFactory(mock_session)
        server = 'https://jira.example.com'
        auth = ('user@example.com', 'api_token')
        config_name = 'test_config'

        # Act
        client = await factory.create_client(server, auth, config_name)

        # Assert
        assert isinstance(client, MockJira)
        assert client.server == server
        assert client.auth == auth

    @pytest.mark.asyncio
    @patch('app.services.jira_client_factory.USE_MOCK_JIRA', False)
    async def test_create_client_from_credentials(self, mock_session):
        """Test creating a client from individual credentials."""
        # Arrange
        factory = JiraClientFactory(mock_session)
        factory.create_client = AsyncMock()
        jira_server = 'https://jira.example.com'
        jira_email = 'user@example.com'
        jira_api_token = 'api_token'
        config_name = 'test_config'

        # Act
        await factory.create_client_from_credentials(
            jira_server, jira_email, jira_api_token, config_name
        )

        # Assert
        factory.create_client.assert_called_once_with(
            server=str(jira_server),
            auth=(str(jira_email), str(jira_api_token)),
            config_name=config_name,
        )
