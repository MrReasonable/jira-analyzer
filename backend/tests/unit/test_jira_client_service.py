"""Unit tests for the JiraClientService.

This module contains tests for the JiraClientService class, which is responsible
for retrieving and creating Jira clients.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException
from jira import JIRA

from app.models import JiraConfiguration
from app.repositories.jira_client_repository import JiraClientRepository
from app.services.jira_client_factory import JiraClientFactory
from app.services.jira_client_service import JiraClientService

# Mark all tests in this module as asyncio tests
pytestmark = pytest.mark.asyncio


@pytest.fixture
def mock_session():
    """Create a mock database session."""
    session = AsyncMock()
    return session


@pytest.fixture
def mock_jira_client_repository(mock_session):
    """Create a mock JiraClientRepository."""
    repository = AsyncMock(spec=JiraClientRepository)

    # Create a mock config that will be returned by get_by_name
    config = MagicMock(spec=JiraConfiguration)

    # Set up the return value for get_by_name
    repository.get_by_name.return_value = config

    return repository, config


@pytest.fixture
def mock_jira_client_factory():
    """Create a mock JiraClientFactory."""
    factory = AsyncMock(spec=JiraClientFactory)
    return factory


@pytest.fixture
def mock_jira_client():
    """Create a mock JIRA client."""
    client = MagicMock(spec=JIRA)
    client.myself = MagicMock()
    return client


class TestJiraClientService:
    """Test cases for the JiraClientService class."""

    async def test_get_client_by_config_name_success(
        self, mock_session, mock_jira_client_repository, mock_jira_client_factory, mock_jira_client
    ):
        """Test getting a client by config name when the config exists."""
        # Arrange
        session = mock_session
        mock_repository, mock_config = mock_jira_client_repository
        mock_config.name = 'test_config'
        mock_config.jira_server = 'https://jira.example.com'
        mock_config.jira_email = 'user@example.com'
        mock_config.jira_api_token = 'api_token'

        # Set up the async mock to return the client when awaited
        mock_jira_client_factory.create_client_from_credentials.return_value = mock_jira_client

        service = JiraClientService(session, mock_jira_client_factory, mock_repository)

        # Act
        client = await service.get_client_by_config_name('test_config')

        # Assert
        assert mock_repository.get_by_name.call_count == 1
        assert mock_jira_client_factory.create_client_from_credentials.call_count == 1
        mock_jira_client_factory.create_client_from_credentials.assert_called_once_with(
            jira_server=mock_config.jira_server,
            jira_email=mock_config.jira_email,
            jira_api_token=mock_config.jira_api_token,
            config_name=mock_config.name,
        )
        assert client == mock_jira_client

    async def test_get_client_by_config_name_not_found(
        self, mock_session, mock_jira_client_repository, mock_jira_client_factory
    ):
        """Test getting a client by config name when the config doesn't exist."""
        # Arrange
        session = mock_session
        mock_repository, _ = mock_jira_client_repository
        # Override the return value to None for this test
        mock_repository.get_by_name.return_value = None

        service = JiraClientService(session, mock_jira_client_factory, mock_repository)

        # Act & Assert
        with pytest.raises(HTTPException) as excinfo:
            await service.get_client_by_config_name('nonexistent_config')

        assert excinfo.value.status_code == 404
        assert 'not found' in str(excinfo.value.detail)
        assert mock_repository.get_by_name.call_count == 1
        assert mock_jira_client_factory.create_client_from_credentials.call_count == 0

    async def test_get_client_by_config_name_connection_error(
        self, mock_session, mock_jira_client_repository, mock_jira_client_factory
    ):
        """Test getting a client by config name when connection fails."""
        # Arrange
        session = mock_session
        mock_repository, mock_config = mock_jira_client_repository
        mock_config.name = 'test_config'
        mock_config.jira_server = 'https://jira.example.com'
        mock_config.jira_email = 'user@example.com'
        mock_config.jira_api_token = 'api_token'

        # Set up the async mock to raise an exception when awaited
        mock_jira_client_factory.create_client_from_credentials.side_effect = Exception(
            'Connection failed'
        )

        service = JiraClientService(session, mock_jira_client_factory, mock_repository)

        # Act & Assert
        with pytest.raises(HTTPException) as excinfo:
            await service.get_client_by_config_name('test_config')

        assert excinfo.value.status_code == 500
        assert 'Failed to connect' in str(excinfo.value.detail)
        assert mock_repository.get_by_name.call_count == 1
        assert mock_jira_client_factory.create_client_from_credentials.call_count == 1

    @patch('app.services.jira_client_service.get_current_config_name')
    async def test_get_client_from_auth_with_token(
        self,
        mock_get_current_config_name,
        mock_session,
        mock_jira_client_repository,
        mock_jira_client_factory,
        mock_jira_client,
    ):
        """Test getting a client from auth with a valid token."""
        # Arrange
        session = mock_session
        mock_repository, mock_config = mock_jira_client_repository
        mock_request = MagicMock()
        mock_credentials = MagicMock()
        mock_settings = MagicMock()

        # Mock the token validation - for async mock, set the return value
        mock_get_current_config_name.return_value = 'token_config'

        # Mock the config retrieval
        mock_config.name = 'token_config'
        mock_config.jira_server = 'https://jira.example.com'
        mock_config.jira_email = 'user@example.com'
        mock_config.jira_api_token = 'api_token'

        # Mock the client creation
        mock_jira_client_factory.create_client_from_credentials.return_value = mock_jira_client

        service = JiraClientService(session, mock_jira_client_factory, mock_repository)

        # Act
        client = await service.get_client_from_auth(
            mock_request, mock_credentials, mock_settings, 'query_config'
        )

        # Assert
        mock_get_current_config_name.assert_called_once_with(
            mock_request, mock_credentials, mock_settings
        )
        assert mock_repository.get_by_name.call_count == 1
        assert mock_jira_client_factory.create_client_from_credentials.call_count == 1
        assert client == mock_jira_client

    @patch('app.services.jira_client_service.get_current_config_name')
    async def test_get_client_from_auth_with_query_param(
        self,
        mock_get_current_config_name,
        mock_session,
        mock_jira_client_repository,
        mock_jira_client_factory,
        mock_jira_client,
    ):
        """Test getting a client from auth with a query parameter."""
        # Arrange
        session = mock_session
        mock_repository, mock_config = mock_jira_client_repository
        mock_request = MagicMock()
        mock_credentials = MagicMock()
        mock_settings = MagicMock()

        # Mock the token validation to return None (no token)
        mock_get_current_config_name.return_value = None

        # Mock the config retrieval
        mock_config.name = 'query_config'
        mock_config.jira_server = 'https://jira.example.com'
        mock_config.jira_email = 'user@example.com'
        mock_config.jira_api_token = 'api_token'

        # Mock the client creation
        mock_jira_client_factory.create_client_from_credentials.return_value = mock_jira_client

        service = JiraClientService(session, mock_jira_client_factory, mock_repository)

        # Act
        client = await service.get_client_from_auth(
            mock_request, mock_credentials, mock_settings, 'query_config'
        )

        # Assert
        mock_get_current_config_name.assert_called_once_with(
            mock_request, mock_credentials, mock_settings
        )
        assert mock_repository.get_by_name.call_count == 1
        assert mock_jira_client_factory.create_client_from_credentials.call_count == 1
        assert client == mock_jira_client

    @patch('app.services.jira_client_service.get_current_config_name')
    async def test_get_client_from_auth_missing_config(
        self,
        mock_get_current_config_name,
        mock_session,
        mock_jira_client_repository,
        mock_jira_client_factory,
    ):
        """Test getting a client from auth with no config name."""
        # Arrange
        session = mock_session
        mock_repository, _ = mock_jira_client_repository
        mock_request = MagicMock()
        mock_credentials = MagicMock()
        mock_settings = MagicMock()

        # Mock the token validation to return None (no token)
        mock_get_current_config_name.return_value = None

        service = JiraClientService(session, mock_jira_client_factory, mock_repository)

        # Act & Assert
        with pytest.raises(HTTPException) as excinfo:
            await service.get_client_from_auth(mock_request, mock_credentials, mock_settings, None)

        assert excinfo.value.status_code == 400
        assert 'Authentication required' in str(excinfo.value.detail)
        mock_get_current_config_name.assert_called_once()
        assert mock_repository.get_by_name.call_count == 0
        assert mock_jira_client_factory.create_client_from_credentials.call_count == 0
