"""Jira client service.

This module provides a service for retrieving and creating Jira clients
based on configurations and authentication.
"""

from typing import Optional, Union

from fastapi import HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials
from jira import JIRA
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import get_current_config_name
from ..config import Settings
from ..logger import get_logger
from ..mock_jira import MockJira
from ..repositories.jira_client_repository import JiraClientRepository
from .jira_client_factory import JiraClientFactory

# Create module-level logger
logger = get_logger(__name__)


class JiraClientService:
    """Service for retrieving and creating Jira clients.

    This class handles authentication, configuration retrieval, and client creation
    for Jira API interactions.
    """

    def __init__(
        self,
        session: AsyncSession,
        jira_client_factory: JiraClientFactory,
        repository: JiraClientRepository,
    ):
        """Initialize the Jira client service.

        Args:
            session: Database session for retrieving configurations.
            jira_client_factory: Factory for creating Jira clients.
            repository: Repository for accessing Jira configurations.
        """
        self.session = session
        self.jira_client_factory = jira_client_factory
        self.repository = repository

    async def get_client_from_auth(
        self,
        request: Request,
        credentials: Optional[HTTPAuthorizationCredentials],
        settings: Settings,
        config_name: Optional[str] = None,
    ) -> Union[JIRA, MockJira]:
        """Get a Jira client using authentication information.

        This method handles authentication via JWT token or query parameter,
        retrieves the configuration from the database, and creates a client.

        Args:
            request: FastAPI request object to access cookies.
            credentials: JWT token credentials containing the configuration name.
            settings: Application settings for JWT configuration.
            config_name: Optional name of a stored Jira configuration to use.

        Returns:
            JIRA: Authenticated JIRA client instance.

        Raises:
            HTTPException: If authentication fails, configuration is not found, or connection fails.
        """
        # First try to get the config_name from the JWT token
        token_config_name = None
        try:
            # Handle the case where credentials might be None
            if credentials:
                token_config_name = await get_current_config_name(request, credentials, settings)
            else:
                # Try to get config name from cookies directly
                token_config_name = await get_current_config_name(request, None, settings)
        except HTTPException:
            # If token validation fails, token_config_name remains None
            pass

        # If we have a token_config_name, use it (prioritize JWT token over query parameter)
        if token_config_name:
            config_name = token_config_name
        # If we don't have a token_config_name and no config_name was provided in the query,
        # this is an error unless we're in a setup/configuration endpoint
        elif not config_name:
            logger.warning('JIRA client request missing configuration name')
            raise HTTPException(
                status_code=400,
                detail='Authentication required. Please provide a valid JWT token.',
            )

        return await self.get_client_by_config_name(config_name)

    async def get_client_by_config_name(self, config_name: str) -> Union[JIRA, MockJira]:
        """Get a Jira client using a configuration name.

        This method retrieves the configuration from the database and creates a client.

        Args:
            config_name: Name of a stored Jira configuration to use.

        Returns:
            JIRA: Authenticated JIRA client instance.

        Raises:
            HTTPException: If configuration is not found or connection fails.
        """
        logger.debug(f'Creating JIRA client using configuration: {config_name}')

        try:
            # Use repository to fetch configuration
            config = await self.repository.get_by_name(config_name)

            if not config:
                logger.warning(f'Configuration not found: {config_name}')
                raise HTTPException(
                    status_code=404, detail=f"Configuration '{config_name}' not found"
                )

            # Use the factory to create the client
            jira_client = await self.jira_client_factory.create_client_from_credentials(
                jira_server=str(config.jira_server),
                jira_email=str(config.jira_email),
                jira_api_token=str(config.jira_api_token),
                config_name=config_name,
            )

            logger.info(f'Successfully connected to JIRA using configuration: {config_name}')
            return jira_client

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f'Failed to connect to JIRA: {str(e)}', exc_info=True)
            raise HTTPException(status_code=500, detail=f'Failed to connect to Jira: {str(e)}')
